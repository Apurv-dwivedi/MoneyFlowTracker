let totalMoney = 0;
let savings = 0;
let expense = 0;
let spentToday = 0;
let dailyBudget = 0;
let emergencyFund = 0; // The New Emergency Fund State

let today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

let expenseChart;
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// FILTERS STATE
let currentFilter = 'all'; 
let currentCategoryFilter = 'all'; 

window.onload = loadData;

/* =========================
   SIDEBAR & EXPORT
========================= */
function toggleSidebar() {
    document.getElementById("mySidebar").classList.toggle("active");
}

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
   BUDGET CALCULATION
========================= */
function updateBudget() {
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    dailyBudget = totalMoney / daysInMonth;
}

function refreshBudgetUI() {
    updateBudget();
    updateDailyBudgetUI(dailyBudget, dailyBudget - spentToday);
}

/* =========================
   ADD TRANSACTION LOGIC
========================= */
function addTransaction() {
    const type = document.getElementById("type").value;
    let category = type === "expense" ? document.getElementById("category").value.trim() : null;

    if (type === "expense" && category === "") { alert("Enter category"); return; }
    const amount = Number(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();

    if (amount <= 0 || description === "") { alert("Enter valid details"); return; }

    transactions.push({ date: new Date().toLocaleDateString(), type, category, amount, description });

    if (type === "income") {
        totalMoney += amount;
    } 
    else if (type === "saving") {
        savings += amount;
    } 
    else if (type === "emergency_add") {
        emergencyFund += amount; // Reserves money into Emergency Fund
    } 
    else if (type === "expense") {
        expense += amount;
        spentToday += amount;
        if (category === "Emergency") {
            emergencyFund -= amount; // Deducts from lock fund if it's an emergency expense
        }
    }

    saveData();
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

/* =========================
   FILTERS
========================= */
function setFilter(type) {
    currentFilter = type;
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
    document.getElementById('filter-' + type).classList.add('active');
    updateUI(); 
}

function setCategoryFilter(category) {
    currentCategoryFilter = category;
    updateUI(); 
}

/* =========================
   UI UPDATE
========================= */
function updateUI() {
    // Remaining balance logically subtracts everything you've spent or locked away
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

    updateInsights();
    updateGoal();

    const list = document.getElementById("transactionList");
    list.innerHTML = "";

    let filteredTransactions = transactions.filter(t => {
        let matchesType = currentFilter === 'all' || t.type === currentFilter;
        let matchesCategory = currentCategoryFilter === 'all' || t.category === currentCategoryFilter;
        return matchesType && matchesCategory;
    });

    filteredTransactions.forEach((item) => {
        let originalIndex = transactions.indexOf(item); 
        let amountColor = item.type === 'expense' ? '#ef4444' : (item.type === 'income' ? '#22c55e' : '#38bdf8');
        if(item.type === 'emergency_add') amountColor = '#ef4444'; // Red tag for adding to lock fund

        let displayType = item.type === 'emergency_add' ? 'Emergency Fund' : item.type;

        list.innerHTML += `
        <tr>
            <td>${item.date}</td>
            <td style="text-transform: capitalize;">${displayType}</td>
            <td>${item.type === "expense" ? (item.category || "-") : "-"}</td>
            <td style="color: ${amountColor}">₹${item.amount}</td>
            <td>${item.description}</td>
            <td><button onclick="deleteTransaction(${originalIndex})" style="padding: 6px 12px; font-size: 12px; margin: 0; background: #ef4444; width: auto;">Del</button></td>
        </tr>`;
    });
}

/* =========================
   SMART INSIGHTS & GOALS
========================= */
function updateInsights() {
    let expTx = transactions.filter(t => t.type === 'expense');
    document.getElementById('totalTransactions').innerText = transactions.length;

    if (expTx.length === 0) {
        document.getElementById('highestExpense').innerText = "₹0";
        document.getElementById('topCategory').innerText = "-";
        return;
    }

    let maxExp = Math.max(...expTx.map(t => t.amount));
    document.getElementById('highestExpense').innerText = "₹" + maxExp;

    let catCount = {};
    expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    let topCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
    document.getElementById('topCategory').innerText = topCat;
}

function updateGoal() {
    let target = 150000; 
    let current = savings; 
    let percent = (current / target) * 100;
    if(percent > 100) percent = 100;

    document.getElementById('goalCurrent').innerText = "₹" + current;
    document.getElementById('goalProgress').style.width = percent + "%";
    document.getElementById('goalPercent').innerText = percent.toFixed(1) + "% Achieved";
}

/* =========================
   DATA MANAGEMENT
========================= */
function deleteTransaction(index) {
    const item = transactions[index];
    if (!confirm("Delete this transaction?")) return;

    if (item.type === "income") {
        totalMoney -= item.amount;
    } else if (item.type === "saving") {
        savings -= item.amount;
    } else if (item.type === "emergency_add") {
        emergencyFund -= item.amount; // Remove from locked fund
    } else if (item.type === "expense") {
        expense -= item.amount;
        spentToday -= item.amount;
        if (item.category === "Emergency") {
            emergencyFund += item.amount; // Refund to locked fund
        }
    }

    transactions.splice(index, 1);
    saveData();
}

function updateDailyBudgetUI(limit, remaining) {
    document.getElementById("todayLimit").innerText = "Limit: ₹" + limit.toFixed(2);
    document.getElementById("spentToday").innerText = "Spent: ₹" + spentToday;
    document.getElementById("remainingToday").innerText = remaining >= 0 ? "Remain: ₹" + remaining.toFixed(2) : "Overspent: ₹" + Math.abs(remaining).toFixed(2);
    let percent = (spentToday / limit) * 100;
    if (percent > 100) percent = 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("totalMoney", String(totalMoney));
    localStorage.setItem("savings", String(savings));
    localStorage.setItem("expense", String(expense));
    localStorage.setItem("spentToday", String(spentToday));
    localStorage.setItem("emergencyFund", String(emergencyFund)); // Save emergency state
    
    updateBudget(); refreshBudgetUI(); updateUI(); updateChart();
}

function loadData() {
    totalMoney = Number(localStorage.getItem("totalMoney")) || 0;
    savings = Number(localStorage.getItem("savings")) || 0;
    expense = Number(localStorage.getItem("expense")) || 0;
    spentToday = Number(localStorage.getItem("spentToday")) || 0;
    emergencyFund = Number(localStorage.getItem("emergencyFund")) || 0; // Load emergency state
    
    updateBudget(); refreshBudgetUI(); updateUI(); updateChart(); toggleCategory();
}

function resetAllData() {
    if (!confirm("Warning: Delete all data?")) return;
    localStorage.clear();
    totalMoney = 0; savings = 0; expense = 0; spentToday = 0; emergencyFund = 0; transactions = [];
    refreshBudgetUI(); updateUI(); updateChart();
}

function toggleCategory() {
    const type = document.getElementById("type").value;
    // Category dropdown sirf tab dikhega jab 'expense' ho
    document.getElementById("categoryContainer").style.display = type === "expense" ? "block" : "none";
}

function updateChart() {
    const chartSection = document.getElementById("chartSection");
    const expenseTransactions = transactions.filter(t => t.type === "expense");

    if (expenseTransactions.length === 0) { chartSection.style.display = "none"; return; }
    chartSection.style.display = "flex";

    const categories = {};
    expenseTransactions.forEach(item => { categories[item.category || "Other"] = (categories[item.category || "Other"] || 0) + item.amount; });

    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "pie",
        data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#ec4899', '#ff3333'], borderWidth: 0 }] },
        options: { plugins: { legend: { labels: { color: '#c7cdd6' } } } }
    });
}
// Temporary hai abhee ye
/* =========================================
   🔐 AUTHENTICATION LOGIC (DUMMY)
========================================= */
// Ye variable backend connect hone par true/false hoga
let isLoggedIn = false; 

function handleAuth(action) {
    if(action === 'login') {
        // Yahan future mein login page ka redirection aayega
        alert("Redirecting to Login/Signup page... (Backend integration pending)");
        isLoggedIn = true; 
    } 
    else if (action === 'logout') {
        if(confirm("Are you sure you want to logout?")) {
            isLoggedIn = false;
            alert("Logged out successfully!");
        }
    }
    
    updateAuthUI();
    toggleSidebar(); // Button click ke baad sidebar close kar do
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

// ⚠️ IMPORTANT: Apne existing window.onload function ko isse update kar do
window.onload = function() {
    loadData();
    updateAuthUI(); // App load hote hi auth button ka state check karega
};