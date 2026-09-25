var supabaseUrl = 'https://utssselrilchpgupextj.supabase.co';
var supabaseKey = 'sb_publishable_73uoQGX7Q_STdh_8TFbj-Q_pnpoMrkF';
var supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let totalMoney = 0, savings = 0, expense = 0, spentToday = 0, dailyBudget = 0, emergencyFund = 0, totalRent = 0; 
let today = new Date(), year = today.getFullYear(), month = today.getMonth();
let expenseChart, trendChartInstance, transactions = []; 
var currentFilter = 'all', currentCategoryFilter = 'all', currentTimeFilter = 'all'; 
let currentUser = null;
let isLoggedIn = false;

/* ===================================================
   🔧 SAFE DOM UTILITIES & TOAST
=================================================== */
function toggleCategory() { 
    const catContainer = document.getElementById("categoryContainer");
    const typeSelect = document.getElementById("type");
    if (catContainer && typeSelect) {
        catContainer.style.display = (typeSelect.value === "expense") ? "block" : "none";
    }
}
window.toggleCategory = toggleCategory;

let toastTimeout;
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.className = `toast ${type} visible`;
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3000);
}
window.showToast = showToast;

window.onload = async function() {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
    } else { 
        isLoggedIn = true; 
        currentUser = session.user;
        updateAuthUI(); 
        await loadData(); 
    }
};

/* ===================================================
   🎛️ COMPARTMENT / TAB SWITCHING LOGIC
=================================================== */
function switchCompartment(tabName, btnElement) {
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => pane.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const selectedPane = document.getElementById('pane-' + tabName);
    if (selectedPane) {
        selectedPane.classList.add('active');
    }

    if (btnElement) {
        btnElement.classList.add('active');
    }

    if (tabName === 'charts') {
        setTimeout(() => {
            updateChart();
            updateTrendChart();
            if (trendChartInstance) trendChartInstance.resize();
            if (expenseChart) expenseChart.resize();
        }, 120);
    }

    if (tabName === 'advisor') {
        setTimeout(() => {
            update50_30_20();
            updateGoal();
            generateFinancialAdvice();
        }, 80);
    }
}
window.switchCompartment = switchCompartment;

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    updateChart(); 
    updateTrendChart();
}

/* ===================================================
   📄 PDF REPORT GENERATOR (MULTI-PAGE & CLEAN CAPTURE)
=================================================== */
async function downloadPDFReport() {
    try {
        if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            alert("❌ PDF Libraries load nahi hui hain!");
            return;
        }

        showToast("Generating Complete Financial Report... ⏳", "info");
        window.scrollTo(0, 0);

        const { jsPDF } = window.jspdf;
        const container = document.querySelector('.container');

        const navContainer = document.querySelector('.compartment-nav-container');
        const addPane = document.getElementById('pane-add-transaction');
        if (navContainer) navContainer.style.display = 'none';
        if (addPane) addPane.style.display = 'none';

        const reportPanes = document.querySelectorAll('#pane-overview, #pane-charts, #pane-history, #pane-advisor');
        reportPanes.forEach(pane => {
            pane.style.display = 'block';
            pane.style.opacity = '1';
            pane.style.transform = 'none';
        });

        updateChart();
        updateTrendChart();
        update50_30_20();

        await new Promise(res => setTimeout(res, 250));

        const isLight = document.body.classList.contains('light-mode');
        const canvas = await html2canvas(container, {
            backgroundColor: isLight ? '#f1f5f9' : '#030008',
            scale: 2,
            useCORS: true,
            logging: false
        });

        if (navContainer) navContainer.style.display = '';
        if (addPane) addPane.style.display = '';
        const allPanes = document.querySelectorAll('.tab-pane');
        allPanes.forEach(pane => {
            pane.style.display = '';
            pane.style.opacity = '';
            pane.style.transform = '';
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const calculatedHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = calculatedHeight;
        let position = 0;

        if (isLight) {
            pdf.setFillColor(241, 245, 249);
        } else {
            pdf.setFillColor(3, 0, 8);
        }
        
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - calculatedHeight;
            pdf.addPage();
            if (isLight) {
                pdf.setFillColor(241, 245, 249);
            } else {
                pdf.setFillColor(3, 0, 8);
            }
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`MoneyFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast("PDF Report Downloaded Successfully!");

    } catch (error) {
        alert("❌ Error generating PDF: " + error.message);
    }
}

/* ===================================================
   👤 PROFILE MODAL LOGIC & 1080p ULTRA-HD CROP
=================================================== */
let profileImageData = ""; 
async function openProfile() {
    if (currentUser) {
        document.getElementById('profileEmail').innerText = currentUser.email;
        document.getElementById('profileOccupation').value = currentUser.user_metadata?.occupation || "";
        document.getElementById('profileBio').value = currentUser.user_metadata?.bio || "";
        
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

function closeProfile() { 
    document.getElementById('imageUpload').value = ""; 
    document.getElementById('profileModal').classList.remove('active'); 
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); 
            const ctx = canvas.getContext('2d');
            
            const size = 1080;
            canvas.width = size; 
            canvas.height = size;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const scale = Math.max(size / img.width, size / img.height);
            const x = (size / scale - img.width) / 2;
            const y = (size / scale - img.height) / 2;

            ctx.drawImage(img, x, y, img.width, img.height, 0, 0, size, size);
            
            profileImageData = canvas.toDataURL('image/jpeg', 0.95); 
            document.getElementById('profileAvatar').src = profileImageData;
        }; 
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function openZoom() {
    const avatarSrc = document.getElementById('profileAvatar').src;
    if (!avatarSrc.includes('data:image/svg+xml') && avatarSrc !== "") {
        document.getElementById('zoomedImage').src = avatarSrc;
        document.getElementById('imageZoomModal').classList.add('active');
    }
}

function closeZoom() {
    document.getElementById('imageZoomModal').classList.remove('active');
}

async function saveProfile() {
    const occupation = document.getElementById('profileOccupation').value;
    const bio = document.getElementById('profileBio').value;
    const saveBtn = document.querySelector('.modal-content.profile-content button[onclick="saveProfile()"]');
    saveBtn.innerText = "Saving Profile... ⏳"; saveBtn.disabled = true;
    try {
        await supabaseClient.auth.updateUser({ data: { occupation: occupation, bio: bio } });
        if (profileImageData) localStorage.setItem('userImage_' + currentUser.id, profileImageData);
        showToast("Profile saved successfully");
        closeProfile();
    } catch (err) { showToast("Error saving profile: " + err.message, "error"); } 
    finally { saveBtn.innerText = "💾 Save Profile"; saveBtn.disabled = false; }
}

function toggleSidebar() { document.getElementById("mySidebar").classList.toggle("active"); }

/* ===================================================
   📥 EXPORT CSV (EXCEL SAFE FORMATTING - NO #######)
=================================================== */
function exportToCSV() {
    if (transactions.length === 0) { 
        showToast("No transactions to export!", "error"); 
        return; 
    }

    let csvContent = "Date,Type,Category,Amount,Description\r\n";

    transactions.forEach(t => {
        let safeDate = t.date || new Date().toISOString().split('T')[0];
        let safeCategory = t.category || "-";
        let safeDesc = (t.description || "").replace(/"/g, '""');

        // Tab character prefix enforces raw plain text in Excel columns
        csvContent += `"\t${safeDate}","${t.type}","${safeCategory}",${t.amount},"${safeDesc}"\r\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MoneyFlow_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toggleSidebar();
    showToast("CSV Exported Successfully");
}

function updateBudget() {
    let now = new Date();
    let daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let currentDay = now.getDate();
    let remainingDays = daysInMonth - currentDay + 1; 

    let remainingMoney = totalMoney - savings - expense - emergencyFund;
    if (remainingMoney < 0) remainingMoney = 0;

    dailyBudget = remainingDays > 0 ? (remainingMoney / remainingDays) : remainingMoney;
}

function refreshBudgetUI() { 
    updateBudget(); 
    updateDailyBudgetUI(dailyBudget, dailyBudget - spentToday); 
}

function recalculateTotals() {
    totalMoney = 0; savings = 0; expense = 0; spentToday = 0; emergencyFund = 0; totalRent = 0;
    let todayStr = new Date().toISOString().split('T')[0]; 

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
            else {
                if (item.date === todayStr) {
                    spentToday += amt; 
                }
            }
        }
    });
}

/* ===================================================
   ☁️ SUPABASE: LOAD DATA
=================================================== */
async function loadData() {
    if(!currentUser) return;
    try {
        const { data, error } = await supabaseClient.from('transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }); 
        if (error) throw error; 
        transactions = data || [];
        recalculateTotals(); 
        refreshBudgetUI(); 
        updateUI(); 
        
        if (typeof toggleCategory === 'function') {
            toggleCategory();
        }
    } catch (err) { 
        console.error("Error loading data:", err.message); 
    }
}

/* ===================================================
   ➕ ADD TRANSACTION (SINGLE-CLICK LOCK)
=================================================== */
async function addTransaction() {
    const addBtn = document.querySelector('#pane-add-transaction button');
    
    let type = document.getElementById("type").value;
    let category = null;

    if (type === "expense") {
        category = document.getElementById("category").value.trim();
        if (category === "") { 
            showToast("Please select a category", "error");
            return; 
        }
    } else if (type === "rent") {
        type = "expense"; 
        category = "Rent";
    }

    const amountInput = document.getElementById("amount");
    const descInput = document.getElementById("description");
    const amount = Number(amountInput.value);
    const description = descInput.value.trim();

    if (amount <= 0 || isNaN(amount) || description === "") { 
        showToast("Please enter a valid amount and description", "error");
        return; 
    }
    
    if (addBtn) {
        addBtn.disabled = true;
        addBtn.innerText = "Adding Entry... ⏳";
        addBtn.style.opacity = "0.6";
        addBtn.style.cursor = "not-allowed";
    }

    const newTransaction = { 
        user_id: currentUser.id,
        date: new Date().toISOString().split('T')[0],
        type: type, 
        category: category, 
        amount: amount, 
        description: description 
    };

    try {
        const { error } = await supabaseClient.from('transactions').insert([newTransaction]);
        if (error) throw error; 

        amountInput.value = ""; 
        descInput.value = "";

        await loadData(); 

        const historyBtn = document.querySelector('.tab-btn[onclick*="history"]');
        switchCompartment('history', historyBtn);
        showToast("Transaction added successfully");

    } catch (err) { 
        showToast("Error saving transaction: " + err.message, "error");
    } finally {
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.innerText = "Add Transaction";
            addBtn.style.opacity = "1";
            addBtn.style.cursor = "pointer";
        }
    }
}

async function deleteTransaction(id) {
    if (!confirm("Delete this transaction from cloud?")) return;
    try { 
        const { error } = await supabaseClient.from('transactions').delete().eq('id', id); 
        if (error) throw error; 
        await loadData(); 
        showToast("Transaction deleted successfully");
    } catch (err) { showToast("Error deleting from cloud: " + err.message, "error"); }
}

function setFilter(type) { 
    currentFilter = type; 
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active')); 
    document.getElementById('filter-' + type).classList.add('active'); 
    updateUI(); 
}
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
    const savingRate = totalMoney > 0 ? ((savings / totalMoney) * 100).toFixed(1) : 0; 
    document.getElementById("savingRate").textContent = savingRate + "%";
    
    updateInsights(); 
    updateGoal(); 
    update50_30_20(); 
    generateFinancialAdvice(); 
    
    const list = document.getElementById("transactionList"); 
    list.innerHTML = "";

    let filteredTransactions = transactions.filter(t => {
        let matchesType = currentFilter === 'all' || t.type === currentFilter, 
            matchesCategory = currentCategoryFilter === 'all' || t.category === currentCategoryFilter, 
            matchesTime = true;
        if(currentTimeFilter !== 'all' && t.created_at) {
            let txDate = new Date(t.created_at), today = new Date();
            if (currentTimeFilter === 'day') matchesTime = txDate.toDateString() === today.toDateString(); 
            else if (currentTimeFilter === 'week') matchesTime = Math.ceil(Math.abs(today - txDate) / (1000 * 60 * 60 * 24)) <= 7; 
            else if (currentTimeFilter === 'month') matchesTime = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        } 
        return matchesType && matchesCategory && matchesTime;
    });

    filteredTransactions.forEach((item) => {
        let amountColor = item.type === 'expense' ? '#ef4444' : (item.type === 'income' ? '#22c55e' : '#38bdf8');
        if(item.type === 'emergency_add') amountColor = '#ef4444'; 
        let displayType = item.type === 'emergency_add' ? 'Emergency Fund' : item.type;
        
        let displayDate = item.date;
        if(displayDate.includes('-')) {
            displayDate = displayDate.split('-').reverse().join('-');
        }

        list.innerHTML += `<tr>
            <td>${displayDate}</td>
            <td style="text-transform: capitalize;">${displayType}</td>
            <td>${item.type === "expense" ? (item.category || "-") : "-"}</td>
            <td style="color: ${amountColor}">₹${item.amount}</td>
            <td>${item.description}</td>
            <td><button onclick="deleteTransaction('${item.id}')">Del</button></td>
        </tr>`;
    });
}

function updateInsights() {
    let expTx = transactions.filter(t => t.type === 'expense'); 
    document.getElementById('totalTransactions').innerText = transactions.length;
    if (expTx.length === 0) { 
        document.getElementById('highestExpense').innerText = "₹0"; 
        document.getElementById('topCategory').innerText = "-"; 
        return; 
    }
    document.getElementById('highestExpense').innerText = "₹" + Math.max(...expTx.map(t => t.amount));
    let catCount = {}; 
    expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    document.getElementById('topCategory').innerText = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
}

function updateGoal() {
    let target = 150000, current = savings, percent = target > 0 ? (current / target) * 100 : 0; 
    if(percent > 100) percent = 100;
    
    const goalCurrent = document.getElementById('goalCurrent');
    const goalProgress = document.getElementById('goalProgress');
    const goalPercent = document.getElementById('goalPercent');

    if (goalCurrent) goalCurrent.innerText = "₹" + current; 
    if (goalProgress) {
        goalProgress.style.width = percent + "%";
        if(percent === 0) goalProgress.style.background = "transparent"; 
        else goalProgress.style.background = "linear-gradient(90deg, #38bdf8, #8b5cf6)";
    }
    if (goalPercent) goalPercent.innerText = percent.toFixed(1) + "% Achieved";
}

/* =========================================================
   ⚖️ 50-30-20 DYNAMIC BENCHMARK RATIO ENGINE
========================================================= */
function update50_30_20() {
    const needsBar = document.getElementById('needsProgressBar');
    const wantsBar = document.getElementById('wantsProgressBar');
    const savingsBar = document.getElementById('savingsProgressBar');

    if (!needsBar || !wantsBar || !savingsBar) return;

    if (totalMoney <= 0) {
        needsBar.style.width = '0%';
        document.getElementById('needsRatioText').innerText = '0% / 50% (₹0)';
        wantsBar.style.width = '0%';
        document.getElementById('wantsRatioText').innerText = '0% / 30% (₹0)';
        savingsBar.style.width = '0%';
        document.getElementById('savingsRatioText').innerText = '0% / 20% (₹0)';
        return;
    }

    let needs = 0, wants = 0;
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const amt = Number(t.amount);
        const cat = (t.category || '').toLowerCase();
        if (cat === 'rent' || cat === 'bills' || cat === 'food' || cat === 'education') {
            needs += amt;
        } else {
            wants += amt;
        }
    });

    const totalSavingsTracked = savings + emergencyFund;

    const needsPct = Math.round((needs / totalMoney) * 100);
    const wantsPct = Math.round((wants / totalMoney) * 100);
    const savingsPct = Math.round((totalSavingsTracked / totalMoney) * 100);

    const needsBarWidth = Math.min(100, Math.round((needsPct / 50) * 100));
    const wantsBarWidth = Math.min(100, Math.round((wantsPct / 30) * 100));
    const savingsBarWidth = Math.min(100, Math.round((savingsPct / 20) * 100));

    needsBar.style.width = needsBarWidth + '%';
    needsBar.style.background = needsPct > 50 ? '#ef4444' : '#38bdf8';
    document.getElementById('needsRatioText').innerHTML = 
        `<strong style="color: ${needsPct > 50 ? '#ef4444' : '#38bdf8'}">${needsPct}%</strong> / 50% <span style="color: #94a3b8;">(₹${needs.toLocaleString()})</span>`;
    
    wantsBar.style.width = wantsBarWidth + '%';
    wantsBar.style.background = wantsPct > 30 ? '#ef4444' : '#f59e0b';
    document.getElementById('wantsRatioText').innerHTML = 
        `<strong style="color: ${wantsPct > 30 ? '#ef4444' : '#f59e0b'}">${wantsPct}%</strong> / 30% <span style="color: #94a3b8;">(₹${wants.toLocaleString()})</span>`;
    
    savingsBar.style.width = savingsBarWidth + '%';
    savingsBar.style.background = '#22c55e';
    document.getElementById('savingsRatioText').innerHTML = 
        `<strong style="color: #22c55e">${savingsPct}%</strong> / 20% <span style="color: #94a3b8;">(₹${totalSavingsTracked.toLocaleString()})</span>`;
}

function updateDailyBudgetUI(limit, remaining) {
    document.getElementById("todayLimit").innerText = "Limit: ₹" + limit.toFixed(2); 
    document.getElementById("spentToday").innerText = "Spent: ₹" + spentToday; 
    document.getElementById("remainingToday").innerText = remaining >= 0 ? "Remain: ₹" + remaining.toFixed(2) : "Overspent: ₹" + Math.abs(remaining).toFixed(2);
    let percent = limit > 0 ? (spentToday / limit) * 100 : 0; 
    if (percent > 100) percent = 100; 
    let progressDiv = document.getElementById("progressBar"); 
    progressDiv.style.width = percent + "%";
    if(percent === 0) progressDiv.style.background = "transparent"; 
    else progressDiv.style.background = "linear-gradient(90deg, #22c55e, #ef4444)";
}

/* ===================================================
   💼 EXECUTIVE WEALTH & RISK ADVISORY ENGINE
=================================================== */
function generateFinancialAdvice() {
    let adviceHtml = "";
    let expTx = transactions.filter(t => t.type === 'expense');
    
    if(expTx.length === 0) { 
        document.getElementById('advisorContent').innerHTML = 
            "<p style='color: #94a3b8; font-size: 13.5px; padding: 6px 0;'>No transactions detected. Advisory telemetry will initialize post transaction logging.</p>"; 
        return; 
    }

    if(spentToday > dailyBudget && dailyBudget > 0) {
        const variance = spentToday - dailyBudget;
        adviceHtml += `
            <div class="advisor-msg msg-warning">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #f87171;">⚠️ Budget Variance Alert</span>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(239, 68, 68, 0.2); color: #f87171;">Overrun</span>
                </div>
                Daily burn exceeds allocation by <b>₹${variance.toLocaleString()}</b> (Spent: ₹${spentToday.toLocaleString()} / Cap: ₹${dailyBudget.toFixed(0)}). Recommend discretionary spending freeze for remaining hours.
            </div>`; 
    } else if (spentToday > 0 && spentToday <= dailyBudget) {
        const utilPct = Math.round((spentToday / dailyBudget) * 100);
        adviceHtml += `
            <div class="advisor-msg msg-success">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #4ade80;">🛡️ Controlled Capital Outflow</span>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">${utilPct}% Allocated</span>
                </div>
                Daily burn of <b>₹${spentToday.toLocaleString()}</b> is running inside safe operational limits (Budget: ₹${dailyBudget.toFixed(0)}).
            </div>`; 
    }

    let todayFrivolous = expTx.filter(t => 
        (t.category === "Food" || t.category === "Shopping" || t.category === "Travel" || t.category === "Other") && 
        t.date === new Date().toISOString().split('T')[0]
    );

    let totalDiscretionary = todayFrivolous.reduce((sum, t) => sum + Number(t.amount), 0);

    if (totalDiscretionary > 0) {
        const cagr = 0.12; 
        const horizon = 10;
        const futureValue = Math.round(totalDiscretionary * Math.pow((1 + cagr), horizon));
        const netWealthGain = futureValue - totalDiscretionary;

        adviceHtml += `
            <div class="advisor-metric-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: #38bdf8; font-weight: 600;">📈 Capital Compounding Forecast</span>
                    <span style="font-size: 11px; color: #94a3b8;">10Y @ 12% CAGR</span>
                </div>
                <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5;">
                    Today's non-core capital outflow of <b>₹${totalDiscretionary.toLocaleString()}</b> has an opportunity valuation:
                </p>
                <div class="metric-projection-grid">
                    <div class="proj-box">
                        <small>Current Outflow</small>
                        <span>₹${totalDiscretionary.toLocaleString()}</span>
                    </div>
                    <div class="proj-arrow">➔</div>
                    <div class="proj-box highlight">
                        <small>Projected Valuation</small>
                        <span>₹${futureValue.toLocaleString()}</span>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 11.5px; color: #94a3b8; display: flex; justify-content: space-between;">
                    <span>Foregone Compounded Alpha:</span>
                    <strong style="color: #22c55e;">+₹${netWealthGain.toLocaleString()}</strong>
                </div>
            </div>`; 
    }

    let catCount = {}; 
    expTx.forEach(t => { catCount[t.category] = (catCount[t.category] || 0) + Number(t.amount); });
    let topCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b);
    let topCatAmount = catCount[topCat];
    
    if(topCatAmount > 0 && topCat !== "Rent" && totalMoney > 0) {
        const catWeight = Math.round((topCatAmount / totalMoney) * 100);
        adviceHtml += `
            <div class="advisor-msg msg-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #38bdf8;">📊 Allocation Concentration</span>
                    <span style="font-size: 11px; color: #38bdf8;">${catWeight}% of Revenue</span>
                </div>
                Primary expense load detected in <b>${topCat}</b> (₹${topCatAmount.toLocaleString()}). Optimizing this stream by 15% recovers <b>₹${Math.round(topCatAmount * 0.15).toLocaleString()}</b> directly into liquid reserve.
            </div>`; 
    }

    if(document.getElementById('advisorContent')) {
        document.getElementById('advisorContent').innerHTML = adviceHtml;
    }
}

async function resetAllData() {
    if (!confirm("Warning: This will delete ALL cloud transactions permanently!")) return;
    try { 
        const { error } = await supabaseClient.from('transactions').delete().eq('user_id', currentUser.id); 
        if (error) throw error; 
        await loadData(); 
    } catch (err) { alert("Error resetting database: " + err.message); } 
}

/* ===================================================
   📈 15-DAY TREND CHART (LIGHT/DARK ADAPTIVE)
=================================================== */
function updateTrendChart() {
    const trendCanvas = document.getElementById("trendChart");
    if (!trendCanvas) return;

    let dates = [], incomes = [], expenses = [];
    for(let i=14; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); 
        incomes.push(0); 
        expenses.push(0);
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
    
    trendChartInstance = new Chart(trendCanvas, {
        type: "line",
        data: { 
            labels: dates.map(d => d.substring(5)), 
            datasets: [
                { label: "Income", data: incomes, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.12)', fill: true, tension: 0.4 },
                { label: "Expense", data: expenses, borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.12)', fill: true, tension: 0.4 }
            ] 
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: isLight ? '#0f172a' : '#c7cdd6' } } },
            scales: { 
                x: { ticks: { color: isLight ? '#475569' : '#94a3b8' }, grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' } }, 
                y: { ticks: { color: isLight ? '#475569' : '#94a3b8' }, grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' } } 
            }
        }
    });
}

/* ===================================================
   📊 EXPENSE PIE CHART (SAFE EMPTY-STATE)
=================================================== */
function updateChart() {
    const expenseCanvas = document.getElementById("expenseChart");
    if (!expenseCanvas) return;

    const expenseTransactions = transactions.filter(t => t.type === "expense");
    const categories = {};
    
    if (expenseTransactions.length === 0) {
        categories["No Expense Yet"] = 1;
    } else {
        expenseTransactions.forEach(item => { 
            categories[item.category || "Other"] = (categories[item.category || "Other"] || 0) + item.amount; 
        });
    }

    let isLight = document.body.classList.contains('light-mode');
    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(expenseCanvas, {
        type: "pie",
        data: { 
            labels: Object.keys(categories), 
            datasets: [{ 
                data: Object.values(categories), 
                backgroundColor: expenseTransactions.length === 0 ? [isLight ? '#cbd5e1' : '#334155'] : ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#ec4899', '#f97316'], 
                borderWidth: 0 
            }] 
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: isLight ? '#0f172a' : '#c7cdd6' } } } 
        }
    });
}

async function handleAuth(action) { 
    if (action === 'logout') { 
        if(confirm("Are you sure you want to logout?")) { 
            await supabaseClient.auth.signOut(); 
            window.location.href = 'login.html'; 
        } 
    } else if (action === 'login') { 
        window.location.href = 'login.html'; 
    } 
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