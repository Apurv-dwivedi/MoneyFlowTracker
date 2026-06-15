

var supabaseUrl = 'https://utssselrilchpgupextj.supabase.co';
var supabaseKey = 'sb_publishable_73uoQGX7Q_STdh_8TFbj-Q_pnpoMrkF';
var supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


let totalMoney = 0, savings = 0, expense = 0, spentToday = 0, dailyBudget = 0, emergencyFund = 0; 
let today = new Date(), year = today.getFullYear(), month = today.getMonth();
let expenseChart, transactions = []; 
var currentFilter = 'all', currentCategoryFilter = 'all', currentTimeFilter = 'all'; 

// 🚀 APP START & SECURITY LOCK
window.onload = async function() {
    // 🌗 Theme Load Logic (Pehle se saved theme load karega)
    if(localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        isLoggedIn = true;
        updateAuthUI();
        loadData(); 
    }
};

/* =========================
   🌗 THEME TOGGLE LOGIC
========================= */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    if(document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
    updateChart(); // Theme change hone par chart labels ka color bhi refresh ho jayega
}

/* =========================
   👤 PROFILE MODAL LOGIC
========================= */
async function openProfile() {
    // Get user from Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (user) {
        document.getElementById('profileEmail').innerText = user.email;
    } else {
        document.getElementById('profileEmail').innerText = "Not Logged In";
    }
    
    document.getElementById('profileTxCount').innerText = transactions.length;
    document.getElementById('profileModal').classList.add('active');
}

function closeProfile() {
    document.getElementById('profileModal').classList.remove('active');
}

/* =========================
   📲 SIDEBAR & EXPORT
========================= */
function toggleSidebar() { document.getElementById("mySidebar").classList.toggle("active"); }

function exportToCSV() {
    if (transactions.length === 0) { alert("No transactions to export!"); return; }
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Category,Amount,Description\n";
    transactions.forEach(t => {
        let categoryLabel = t.category || "-";
        csvContent += `${t.date},${t.type},${categoryLabel},${t.amount},${t.description}\r\n`;
    });
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "My_Transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toggleSidebar();
}

/* =========================
   📈 BUDGET & TOTALS CALCULATION
========================= */
function updateBudget() {
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    dailyBudget = totalMoney / daysInMonth;
}

function refreshBudgetUI() {
    updateBudget();
    updateDailyBudgetUI(dailyBudget, dailyBudget - spentToday);
}

function recalculateTotals() {
    totalMoney = 0; savings = 0; expense = 0; spentToday = 0; emergencyFund = 0;
    transactions.forEach(item => {
        const amt = Number(item.amount);
        if (item.type === "income") totalMoney += amt;
        else if (item.type === "saving") savings += amt;
        else if (item.type === "emergency_add") emergencyFund += amt;
        else if (item.type === "expense") {
            expense += amt;
            if (item.category === "Emergency") emergencyFund -= amt; 
            else spentToday += amt; 
        }
    });
}

/* =========================
   ☁️ SUPABASE: FETCH / LOAD DATA
========================= */
async function loadData() {
    try {
        const { data, error } = await supabaseClient.from('transactions').select('*').order('created_at', { ascending: false }); 
        if (error) throw error;
        transactions = data || [];
        recalculateTotals(); updateBudget(); refreshBudgetUI(); updateUI(); updateChart(); toggleCategory();
    } catch (err) { console.error("Error loading data:", err.message); }
}

/* =========================
   📥 SUPABASE: ADD TRANSACTION
========================= */
async function addTransaction() {
    const type = document.getElementById("type").value;
    let category = type === "expense" ? document.getElementById("category").value.trim() : null;
    if (type === "expense" && category === "") { alert("Enter category"); return; }
    const amount = Number(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();
    if (amount <= 0 || description === "") { alert("Enter valid details"); return; }

    const newTransaction = { date: new Date().toLocaleDateString(), type: type, category: category, amount: amount, description: description };

    try {
        const { error } = await supabaseClient.from('transactions').insert([newTransaction]);
        if (error) throw error;
        await loadData(); 
        document.getElementById("amount").value = ""; document.getElementById("description").value = "";
    } catch (err) { alert("Error saving to cloud: " + err.message); }
}

/* =========================
   🗑️ SUPABASE: DELETE TRANSACTION
========================= */
async function deleteTransaction(id) {
    if (!confirm("Delete this transaction from cloud?")) return;
    try {
        const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
        if (error) throw error;
        await loadData();
    } catch (err) { alert("Error deleting from cloud: " + err.message); }
}

/* =========================
   🎛️ FILTERS LOGIC
========================= */
function setFilter(type) { currentFilter = type; document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active')); document.getElementById('filter-' + type).classList.add('active'); updateUI(); }
function setCategoryFilter(category) { currentCategoryFilter = category; updateUI(); }
function setTimeFilter(timeSpan) { currentTimeFilter = timeSpan; updateUI(); }

/* =========================
   💻 UI RENDER MODULE
========================= */
function updateUI() {
    const remaining = totalMoney - savings - expense - emergencyFund;
    document.getElementById("totalMoney").textContent = "₹" + totalMoney;
    document.getElementById("savings").textContent = "₹" + savings;
    document.getElementById("expense").textContent = "₹" + expense;
    document.getElementById("remaining").textContent = "₹" + remaining;
    document.getElementById("emergencyDisplay").textContent = "₹" + emergencyFund; 
    document.getElementById("monthlyIncome").textContent = "₹" + totalMoney;
    document.getElementById("monthlyExpense").textContent = "₹" + expense;

    const savingRate = totalMoney > 0 ? ((savings / totalMoney) * 100).toFixed(1) : 0;
    document.getElementById("savingRate").textContent = savingRate + "%";
    updateInsights(); updateGoal();

    const list = document.getElementById("transactionList"); list.innerHTML = "";

    let filteredTransactions = transactions.filter(t => {
        let matchesType = currentFilter === 'all' || t.type === currentFilter;
        let matchesCategory = currentCategoryFilter === 'all' || t.category === currentCategoryFilter;
        let matchesTime = true;
        if(currentTimeFilter !== 'all' && t.created_at) {
            let txDate = new Date(t.created_at), today = new Date();
            if (currentTimeFilter === 'day') matchesTime = txDate.toDateString() === today.toDateString();
            else if (currentTimeFilter === 'week') { let diffDays = Math.ceil(Math.abs(today - txDate) / (1000 * 60 * 60 * 24)); matchesTime = diffDays <= 7; } 
            else if (currentTimeFilter === 'month') matchesTime = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        }
        return matchesType && matchesCategory && matchesTime;
    });

    filteredTransactions.forEach((item) => {
        let amountColor = item.type === 'expense' ? '#ef4444' : (item.type === 'income' ? '#22c55e' : '#38bdf8');
        if(item.type === 'emergency_add') amountColor = '#ef4444'; 
        let displayType = item.type === 'emergency_add' ? 'Emergency Fund' : item.type;
        list.innerHTML += `<tr><td>${item.date}</td><td style="text-transform: capitalize;">${displayType}</td><td>${item.type === "expense" ? (item.category || "-") : "-"}</td><td style="color: ${amountColor}">₹${item.amount}</td><td>${item.description}</td><td><button onclick="deleteTransaction('${item.id}')" style="padding: 6px 12px; font-size: 12px; margin: 0; background: #ef4444; width: auto;">Del</button></td></tr>`;
    });
}

/* =========================
   💡 SMART INSIGHTS & GOALS
========================= */
function updateInsights() {
    let expTx = transactions.filter(t => t.type === 'expense');
    document.getElementById('totalTransactions').innerText = transactions.length;
    if (expTx.length === 0) { document.getElementById('highestExpense').innerText = "₹0"; document.getElementById('topCategory').innerText = "-"; return; }
    let maxExp = Math.max(...expTx.map(t => t.amount));
    document.getElementById('highestExpense').innerText = "₹" + maxExp;
    let catCount = {}; expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    let topCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
    document.getElementById('topCategory').innerText = topCat;
}

function updateGoal() {
    let target = 150000, current = savings; 
    let percent = target > 0 ? (current / target) * 100 : 0; if(percent > 100) percent = 100;
    document.getElementById('goalCurrent').innerText = "₹" + current;
    document.getElementById('goalProgress').style.width = percent + "%";
    document.getElementById('goalPercent').innerText = percent.toFixed(1) + "% Achieved";
}

function updateDailyBudgetUI(limit, remaining) {
    document.getElementById("todayLimit").innerText = "Limit: ₹" + limit.toFixed(2);
    document.getElementById("spentToday").innerText = "Spent: ₹" + spentToday;
    document.getElementById("remainingToday").innerText = remaining >= 0 ? "Remain: ₹" + remaining.toFixed(2) : "Overspent: ₹" + Math.abs(remaining).toFixed(2);
    let percent = limit > 0 ? (spentToday / limit) * 100 : 0; if (percent > 100) percent = 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

/* =========================
   🚨 SUPABASE: RESET ALL DATA
========================= */
async function resetAllData() {
    if (!confirm("Warning: This will delete ALL cloud transactions permanently!")) return;
    try {
        const { error } = await supabaseClient.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
        if (error) throw error;
        await loadData();
    } catch (err) { alert("Error resetting database: " + err.message); }
}

function toggleCategory() {
    const type = document.getElementById("type").value;
    document.getElementById("categoryContainer").style.display = type === "expense" ? "block" : "none";
}

/* =========================
   📊 CHART MODULE
========================= */
function updateChart() {
    const chartSection = document.getElementById("chartSection");
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    if (expenseTransactions.length === 0) { chartSection.style.display = "none"; return; }
    chartSection.style.display = "flex";

    const categories = {};
    expenseTransactions.forEach(item => { categories[item.category || "Other"] = (categories[item.category || "Other"] || 0) + item.amount; });

    // Light mode text color fix for chart
    let isLight = document.body.classList.contains('light-mode');

    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "pie",
        data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#ec4899', '#ff3333'], borderWidth: 0 }] },
        options: { plugins: { legend: { labels: { color: isLight ? '#1e293b' : '#c7cdd6' } } } }
    });
}

/* =========================
   🔐 REAL AUTH UI TOGGLE & LOGOUT
========================= */
let isLoggedIn = false; 
async function handleAuth(action) {
    if (action === 'logout') { 
        if(confirm("Are you sure you want to logout?")) {
            await supabaseClient.auth.signOut(); 
            window.location.href = 'login.html'; 
        }
    } else if (action === 'login') { window.location.href = 'login.html'; }
}
function updateAuthUI() {
    if(isLoggedIn) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
    }
}