
var supabaseUrl = 'https://utssselrilchpgupextj.supabase.co';
var supabaseKey = 'sb_publishable_73uoQGX7Q_STdh_8TFbj-Q_pnpoMrkF';
var supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
let totalMoney = 0, savings = 0, expense = 0, spentToday = 0, dailyBudget = 0, emergencyFund = 0, totalRent = 0; 
let today = new Date(), year = today.getFullYear(), month = today.getMonth();
let expenseChart, trendChartInstance, transactions = []; 
var currentFilter = 'all', currentCategoryFilter = 'all', currentTimeFilter = 'all'; 
let currentUser = null; // 🚀 BUG 1 FIX: User track karne ke liye variable

window.onload = async function() {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
    } else { 
        isLoggedIn = true; 
        currentUser = session.user; // 🚀 BUG 1 FIX: User Data save kar liya
        updateAuthUI(); 
        loadData(); 
    }
};

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    updateChart(); 
    updateTrendChart();
}

/* =========================
   📄 PDF REPORT GENERATOR
========================= */
async function downloadPDFReport() {
    try {
        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            alert("❌ PDF Libraries load nahi hui hain!"); return;
        }
        alert("Generating Data Analyst Report... ⏳ Please wait.");
        window.scrollTo(0, 0);

        const { jsPDF } = window.jspdf;
        const element = document.querySelector('.container'); 
        
        const canvas = await html2canvas(element, { 
            backgroundColor: document.body.classList.contains('light-mode') ? '#f8fafc' : '#050505',
            scale: 2, 
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`MoneyTracker_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        setTimeout(() => alert("✅ Report Successfully Downloaded!"), 500);
    } catch (error) {
        alert("❌ Error aagaya bhai: " + error.message);
    }
}

/* =========================
   👤 PROFILE MODAL LOGIC 
========================= */
let profileImageData = ""; 
async function openProfile() {
    if (currentUser) {
        document.getElementById('profileEmail').innerText = currentUser.email;
        document.getElementById('profileOccupation').value = currentUser.user_metadata?.occupation || "";
        document.getElementById('profileBio').value = currentUser.user_metadata?.bio || "";
        
        // 🚀 BUG 2 FIX: Har user ki photo uski unique ID se save aur load hogi
        const savedImage = localStorage.getItem('userImage_' + currentUser.id);
        if (savedImage) { 
            document.getElementById('profileAvatar').src = savedImage; 
            profileImageData = savedImage; 
        } else {
            document.getElementById('profileAvatar').src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👤</text></svg>";
        }
    } else {
        document.getElementById('profileEmail').innerText = "Not Logged In";
    }
    
    document.getElementById('profileTxCount').innerText = transactions.length;
    document.getElementById('profileModal').classList.add('active');
}

function closeProfile() { document.getElementById('imageUpload').value = ""; document.getElementById('profileModal').classList.remove('active'); }

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
                canvas.width = 200; canvas.height = 200;
                ctx.drawImage(img, 0, 0, 200, 200);
                profileImageData = canvas.toDataURL('image/jpeg', 0.7); 
                document.getElementById('profileAvatar').src = profileImageData;
            }; img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

async function saveProfile() {
    const occupation = document.getElementById('profileOccupation').value;
    const bio = document.getElementById('profileBio').value;
    const saveBtn = document.querySelector('.modal-content.profile-content button[onclick="saveProfile()"]');
    saveBtn.innerText = "Saving Profile... ⏳"; saveBtn.disabled = true;
    try {
        await supabaseClient.auth.updateUser({ data: { occupation: occupation, bio: bio } });
        // 🚀 BUG 2 FIX: Saving with User ID
        if (profileImageData) localStorage.setItem('userImage_' + currentUser.id, profileImageData);
        alert("Profile Saved Successfully! ✅"); closeProfile();
    } catch (err) { alert("Error saving profile: " + err.message); } 
    finally { saveBtn.innerText = "💾 Save Profile"; saveBtn.disabled = false; }
}

function toggleSidebar() { document.getElementById("mySidebar").classList.toggle("active"); }

function exportToCSV() {
    if (transactions.length === 0) { alert("No transactions to export!"); return; }
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Category,Amount,Description\n";
    transactions.forEach(t => { csvContent += `${t.date},${t.type},${t.category || "-"},${t.amount},${t.description}\r\n`; });
    let link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "My_Transactions.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link); toggleSidebar();
}

function updateBudget() {
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let remainingMoney = totalMoney - savings - expense - emergencyFund;
    if (remainingMoney < 0) remainingMoney = 0;
    dailyBudget = remainingMoney / daysInMonth;
}
function refreshBudgetUI() { updateBudget(); updateDailyBudgetUI(dailyBudget, dailyBudget - spentToday); }

function recalculateTotals() {
    totalMoney = 0; savings = 0; expense = 0; spentToday = 0; emergencyFund = 0; totalRent = 0;
    transactions.forEach(item => {
        const amt = Number(item.amount);
        if (item.type === "income") totalMoney += amt; 
        else if (item.type === "saving") savings += amt; 
        else if (item.type === "emergency_add") emergencyFund += amt;
        else if (item.type === "expense") { 
            expense += amt; 
            if (item.category === "Emergency") emergencyFund -= amt; 
            else if (item.category === "Rent") totalRent += amt;
            else if (item.category === "Bills") {} 
            else spentToday += amt; 
        }
    });
}

/* =========================
   ☁️ SUPABASE: FETCH / LOAD DATA
========================= */
async function loadData() {
    if(!currentUser) return;
    try {
        // 🚀 BUG 1 FIX: Sirf usi user ka data laao jo login hai (.eq('user_id', currentUser.id))
        const { data, error } = await supabaseClient.from('transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }); 
        if (error) throw error; transactions = data || [];
        recalculateTotals(); refreshBudgetUI(); updateUI(); updateChart(); updateTrendChart(); toggleCategory();
    } catch (err) { console.error("Error loading data:", err.message); }
}

async function addTransaction() {
    let type = document.getElementById("type").value;
    let category = null;

    if (type === "expense") {
        category = document.getElementById("category").value.trim();
        if (category === "") { alert("Enter category"); return; }
    } else if (type === "rent") {
        type = "expense"; category = "Rent";
    }

    const amount = Number(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();
    if (amount <= 0 || description === "") { alert("Enter valid details"); return; }
    
    const newTransaction = { 
        user_id: currentUser.id, // 🚀 BUG 1 FIX: Har transaction ko user se connect karo
        date: new Date().toISOString().split('T')[0], // 🚀 BUG 3 FIX: Universal Date Format (YYYY-MM-DD)
        type: type, 
        category: category, 
        amount: amount, 
        description: description 
    };

    try {
        const { error } = await supabaseClient.from('transactions').insert([newTransaction]);
        if (error) throw error; await loadData(); 
        document.getElementById("amount").value = ""; document.getElementById("description").value = "";
    } catch (err) { alert("Error saving to cloud: " + err.message); }
}

async function deleteTransaction(id) {
    if (!confirm("Delete this transaction from cloud?")) return;
    try { const { error } = await supabaseClient.from('transactions').delete().eq('id', id); if (error) throw error; await loadData(); } catch (err) { alert("Error deleting from cloud: " + err.message); }
}

function setFilter(type) { currentFilter = type; document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active')); document.getElementById('filter-' + type).classList.add('active'); updateUI(); }
function setCategoryFilter(category) { currentCategoryFilter = category; updateUI(); }
function setTimeFilter(timeSpan) { currentTimeFilter = timeSpan; updateUI(); }

function updateUI() {
    const remaining = totalMoney - savings - expense - emergencyFund;
    document.getElementById("totalMoney").textContent = "₹" + totalMoney; 
    document.getElementById("savings").textContent = "₹" + savings; 
    document.getElementById("expense").textContent = "₹" + expense; 
    document.getElementById("remaining").textContent = "₹" + remaining; 
    document.getElementById("emergencyDisplay").textContent = "₹" + emergencyFund; 
    document.getElementById("rentDisplay").textContent = "₹" + totalRent; 
    
    document.getElementById("monthlyIncome").textContent = "₹" + totalMoney; 
    document.getElementById("monthlyExpense").textContent = "₹" + expense;
    const savingRate = totalMoney > 0 ? ((savings / totalMoney) * 100).toFixed(1) : 0; document.getElementById("savingRate").textContent = savingRate + "%";
    
    updateInsights(); updateGoal(); generateFinancialAdvice(); 
    const list = document.getElementById("transactionList"); list.innerHTML = "";

    let filteredTransactions = transactions.filter(t => {
        let matchesType = currentFilter === 'all' || t.type === currentFilter, matchesCategory = currentCategoryFilter === 'all' || t.category === currentCategoryFilter, matchesTime = true;
        if(currentTimeFilter !== 'all' && t.created_at) {
            let txDate = new Date(t.created_at), today = new Date();
            if (currentTimeFilter === 'day') matchesTime = txDate.toDateString() === today.toDateString(); else if (currentTimeFilter === 'week') matchesTime = Math.ceil(Math.abs(today - txDate) / (1000 * 60 * 60 * 24)) <= 7; else if (currentTimeFilter === 'month') matchesTime = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        } return matchesType && matchesCategory && matchesTime;
    });

    filteredTransactions.forEach((item) => {
        let amountColor = item.type === 'expense' ? '#ef4444' : (item.type === 'income' ? '#22c55e' : '#38bdf8');
        if(item.type === 'emergency_add') amountColor = '#ef4444'; 
        let displayType = item.type === 'emergency_add' ? 'Emergency Fund' : item.type;
        
        // Date ko table mein achhe se dikhane ke liye (DD-MM-YYYY)
        let displayDate = item.date;
        if(displayDate.includes('-')) {
            displayDate = displayDate.split('-').reverse().join('-');
        }

        list.innerHTML += `<tr><td>${displayDate}</td><td style="text-transform: capitalize;">${displayType}</td><td>${item.type === "expense" ? (item.category || "-") : "-"}</td><td style="color: ${amountColor}">₹${item.amount}</td><td>${item.description}</td><td><button onclick="deleteTransaction('${item.id}')" style="padding: 6px 12px; font-size: 12px; margin: 0; background: #ef4444; width: auto;">Del</button></td></tr>`;
    });
}

function updateInsights() {
    let expTx = transactions.filter(t => t.type === 'expense'); document.getElementById('totalTransactions').innerText = transactions.length;
    if (expTx.length === 0) { document.getElementById('highestExpense').innerText = "₹0"; document.getElementById('topCategory').innerText = "-"; return; }
    document.getElementById('highestExpense').innerText = "₹" + Math.max(...expTx.map(t => t.amount));
    let catCount = {}; expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    document.getElementById('topCategory').innerText = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
}

function updateGoal() {
    let target = 150000, current = savings, percent = target > 0 ? (current / target) * 100 : 0; if(percent > 100) percent = 100;
    document.getElementById('goalCurrent').innerText = "₹" + current; 
    let progressDiv = document.getElementById('goalProgress'); progressDiv.style.width = percent + "%";
    document.getElementById('goalPercent').innerText = percent.toFixed(1) + "% Achieved";
    if(percent === 0) progressDiv.style.background = "transparent"; else progressDiv.style.background = "linear-gradient(90deg, #38bdf8, #8b5cf6)";
}

function updateDailyBudgetUI(limit, remaining) {
    document.getElementById("todayLimit").innerText = "Limit: ₹" + limit.toFixed(2); document.getElementById("spentToday").innerText = "Spent: ₹" + spentToday; document.getElementById("remainingToday").innerText = remaining >= 0 ? "Remain: ₹" + remaining.toFixed(2) : "Overspent: ₹" + Math.abs(remaining).toFixed(2);
    let percent = limit > 0 ? (spentToday / limit) * 100 : 0; if (percent > 100) percent = 100; 
    let progressDiv = document.getElementById("progressBar"); progressDiv.style.width = percent + "%";
    if(percent === 0) progressDiv.style.background = "transparent"; else progressDiv.style.background = "linear-gradient(90deg, #22c55e, #ef4444)";
}

/* =========================
   🤖 SMART FINANCIAL ADVISOR (JAR STYLE UPGRADE)
========================= */
function generateFinancialAdvice() {
    let adviceHtml = "";
    let expTx = transactions.filter(t => t.type === 'expense');
    
    if(expTx.length === 0) { 
        document.getElementById('advisorContent').innerHTML = "<p style='color: #94a3b8; font-size: 14px;'>Pehle kuch kharch karo, fir bataunga kahan save karna hai! 😉</p>"; 
        return; 
    }

    // 1. Overspending Alert
    if(spentToday > dailyBudget && dailyBudget > 0) {
        adviceHtml += `<div class="advisor-msg msg-warning">⚠️ <b>Overspending Alert:</b> Aaj tumne apne daily budget (₹${dailyBudget.toFixed(0)}) se zyada kharch kar diya hai (₹${spentToday}). Thoda control karo bhai!</div>`; 
    } else if (spentToday > 0 && spentToday <= dailyBudget) {
        adviceHtml += `<div class="advisor-msg msg-success">✅ <b>Good Going:</b> Aaj ka kharcha (₹${spentToday}) budget ke andar hai. Keep it up!</div>`;
    }

    // 🚀 2. JAR APP STYLE: OPPORTUNITY COST ESTIMATOR (MIND-BLOWING FEATURE)
    // Faltu kharche nikalte hain (Food, Shopping, Other) jo aaj kiye gaye hain
    let todayFrivolous = expTx.filter(t => 
        (t.category === "Food" || t.category === "Shopping" || t.category === "Other") && 
        t.date === new Date().toISOString().split('T')[0]
    );

    let totalFrivolousToday = todayFrivolous.reduce((sum, t) => sum + Number(t.amount), 0);

    if (totalFrivolousToday > 0) {
        // Compound Interest Formula for 10 years at 10% return
        let futureValue = totalFrivolousToday * Math.pow((1 + 0.10), 10);
        
        adviceHtml += `<div class="advisor-msg msg-info" style="border-left-color: #facc15; background: rgba(250, 204, 21, 0.05);">
            🍯 <b> Savings Estimator:</b> Aaj tumne ₹${totalFrivolousToday} faltu (Food/Shopping) mein udaye hain. Agar ye paise Gold ya Index Fund (10% return) mein daale hote, toh 10 saal baad ye <b>₹${futureValue.toFixed(0)}</b> ban jaate! Socho! 🤯
        </div>`;
    }

    // 3. Top Category Tip
    let catCount = {}; 
    expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + Number(t.amount); });
    let topCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
    let topCatAmount = catCount[topCat];
    
    if(topCatAmount > 0 && topCat !== "Rent") {
        adviceHtml += `<div class="advisor-msg msg-info">💡 <b>Savings Tip:</b> Sabse zyada paisa <b>${topCat}</b> (₹${topCatAmount}) par ja raha hai. Agar agle mahine isme 20% cut karo, toh seedha <b>₹${(topCatAmount * 0.2).toFixed(0)}</b> bacha sakte ho!</div>`;
    }

    // 4. Savings Rate Alert
    let savingRate = totalMoney > 0 ? ((savings / totalMoney) * 100) : 0;
    if(savingRate > 0 && savingRate < 20) {
        adviceHtml += `<div class="advisor-msg msg-warning">📉 <b>Low Savings:</b> Tumhari savings sirf ${savingRate.toFixed(1)}% hai. Ideal 50-30-20 rule ke hisaab se minimum 20% target karo.</div>`; 
    } else if (savingRate >= 20) {
        adviceHtml += `<div class="advisor-msg msg-success">🎯 <b>Awesome:</b> Tumhari savings ${savingRate.toFixed(1)}% hai, jo ki ekdum healthy hai!</div>`;
    }

    if(document.getElementById('advisorContent')) {
        document.getElementById('advisorContent').innerHTML = adviceHtml;
    }
}

async function resetAllData() {
    if (!confirm("Warning: This will delete ALL cloud transactions permanently!")) return;
    try { 
        // 🚀 BUG 1 FIX: Sirf logged-in user ka data reset hoga
        const { error } = await supabaseClient.from('transactions').delete().eq('user_id', currentUser.id); 
        if (error) throw error; await loadData(); 
    } catch (err) { alert("Error resetting database: " + err.message); }
}

function toggleCategory() { document.getElementById("categoryContainer").style.display = document.getElementById("type").value === "expense" ? "block" : "none"; }

/* =========================
   📈 15-DAY TREND CHART 
========================= */
function updateTrendChart() {
    const trendSection = document.getElementById("trendSection");
    if (transactions.length === 0) { trendSection.style.display = "none"; return; }
    trendSection.style.display = "flex";

    let dates = [], incomes = [], expenses = [];
    for(let i=14; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i);
        // 🚀 BUG 3 FIX: Matching standard YYYY-MM-DD
        dates.push(d.toISOString().split('T')[0]); 
        incomes.push(0); expenses.push(0);
    }

    transactions.forEach(t => {
        let index = dates.indexOf(t.date);
        if(index !== -1) {
            if(t.type === 'income') incomes[index] += Number(t.amount);
            if(t.type === 'expense') expenses[index] += Number(t.amount);
        }
    });

    let isLight = document.body.classList.contains('light-mode');
    if (trendChartInstance) trendChartInstance.destroy();
    
    trendChartInstance = new Chart(document.getElementById("trendChart"), {
        type: "line",
        data: { 
            // Labels ko sundar dikhane ke liye MM-DD mein convert kar rahe hain
            labels: dates.map(d => d.substring(5)), 
            datasets: [
                { label: "Income", data: incomes, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
                { label: "Expense", data: expenses, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 }
            ] 
        },
        options: { 
            plugins: { legend: { labels: { color: isLight ? '#1e293b' : '#c7cdd6' } } },
            scales: { x: { ticks: { color: isLight ? '#64748b' : '#94a3b8' } }, y: { ticks: { color: isLight ? '#64748b' : '#94a3b8' } } }
        }
    });
}

function updateChart() {
    const chartSection = document.getElementById("chartSection");
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    if (expenseTransactions.length === 0) { chartSection.style.display = "none"; return; }
    chartSection.style.display = "flex";

    const categories = {};
    expenseTransactions.forEach(item => { categories[item.category || "Other"] = (categories[item.category || "Other"] || 0) + item.amount; });

    let isLight = document.body.classList.contains('light-mode');
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(document.getElementById("expenseChart"), {
        type: "pie",
        data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#ec4899', '#ff3333'], borderWidth: 0 }] },
        options: { plugins: { legend: { labels: { color: isLight ? '#1e293b' : '#c7cdd6' } } } }
    });
}

async function handleAuth(action) { if (action === 'logout') { if(confirm("Are you sure you want to logout?")) { await supabaseClient.auth.signOut(); window.location.href = 'login.html'; } } else if (action === 'login') { window.location.href = 'login.html'; } }
function updateAuthUI() { if(isLoggedIn) { document.getElementById('loginBtn').style.display = 'none'; document.getElementById('logoutBtn').style.display = 'block'; } else { document.getElementById('loginBtn').style.display = 'block'; document.getElementById('logoutBtn').style.display = 'none'; } }