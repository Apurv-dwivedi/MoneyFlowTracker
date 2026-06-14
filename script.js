let totalMoney = 0;
let savings = 0;
let expense = 0;

let spentToday = 0;
let dailyBudget = 0;

let today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

let expenseChart;

let transactions =
JSON.parse(localStorage.getItem("transactions")) || [];

/* =========================
   BUDGET CALCULATION
========================= */
function updateBudget() {
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    dailyBudget = totalMoney / daysInMonth;
}

/* =========================
   REFRESH BUDGET UI
========================= */
function refreshBudgetUI() {
    updateBudget();

    let remaining = dailyBudget - spentToday;

    updateDailyBudgetUI(dailyBudget, remaining);
}

/* =========================
   ADD TRANSACTION
========================= */
function addTransaction() {

    const type = document.getElementById("type").value;

    let category = null;

    if (type === "expense") {
        category = document.getElementById("category").value.trim();

        if (category === "") {
            alert("Enter category for expense");
            return;
        }
    }

    const amount = Number(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();

    if (amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    if (description === "") {
        alert("Enter description");
        return;
    }

    const transaction = {
        date: new Date().toLocaleDateString(),
        type,
        category,
        amount,
        description
    };

    transactions.push(transaction);

    /* INCOME */
    if (type === "income") {
        totalMoney += amount;

        updateBudget();
        updateUI();
        refreshBudgetUI();
    }

    /* EXPENSE */
    else if (type === "expense") {
        expense += amount;
        spentToday += amount;
    }

    /* SAVING */
    else if (type === "saving") {
        savings += amount;
    }

    saveData();

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
    document.getElementById("category").value = "";
}

/* =========================
   UI UPDATE
========================= */
function updateUI() {

    const remaining = totalMoney - savings - expense;

    document.getElementById("totalMoney").textContent = "₹" + totalMoney;
    document.getElementById("savings").textContent = "₹" + savings;
    document.getElementById("expense").textContent = "₹" + expense;
    document.getElementById("remaining").textContent = "₹" + remaining;

    document.getElementById("monthlyIncome").textContent = "₹" + totalMoney;
    document.getElementById("monthlyExpense").textContent = "₹" + expense;

    const savingRate = totalMoney > 0
        ? ((savings / totalMoney) * 100).toFixed(1)
        : 0;

    document.getElementById("savingRate").textContent = savingRate + "%";

    const list = document.getElementById("transactionList");
    list.innerHTML = "";

    transactions.forEach((item, index) => {
        list.innerHTML += `
        <tr>
            <td>${item.date}</td>
            <td>${item.type}</td>
            <td>${item.type === "expense" ? (item.category || "-") : "-"}</td>
            <td>₹${item.amount}</td>
            <td>${item.description}</td>
            <td>
                <button onclick="deleteTransaction(${index})">Delete</button>
            </td>
        </tr>
        `;
    });
}

/* =========================
   DELETE
========================= */
function deleteTransaction(index) {

    const item = transactions[index];

    if (!confirm("Are you sure?")) return;

    if (item.type === "income") {
        totalMoney -= item.amount;
    }
    else if (item.type === "expense") {
        expense -= item.amount;
        spentToday -= item.amount;
    }
    else if (item.type === "saving") {
        savings -= item.amount;
    }

    transactions.splice(index, 1);

    saveData();
}

/* =========================
   DAILY BUDGET UI
========================= */
function updateDailyBudgetUI(limit, remaining) {

    document.getElementById("todayLimit").innerText =
        "Limit: ₹" + limit.toFixed(2);

    document.getElementById("spentToday").innerText =
        "Spent: ₹" + spentToday;

    document.getElementById("remainingToday").innerText =
        remaining >= 0
            ? "Remain: ₹" + remaining.toFixed(2)
            : "Overspent: ₹" + Math.abs(remaining).toFixed(2);

    let percent = (spentToday / limit) * 100;
    if (percent > 100) percent = 100;

    document.getElementById("progressBar").style.width = percent + "%";
}

/* =========================
   SAVE DATA
========================= */
function saveData() {

    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("totalMoney", String(totalMoney));
    localStorage.setItem("savings", String(savings));
    localStorage.setItem("expense", String(expense));
    localStorage.setItem("spentToday", String(spentToday));

    updateBudget();
    refreshBudgetUI();
    updateUI();
    updateChart();
}

/* =========================
   LOAD DATA
========================= */
function loadData() {

    totalMoney = Number(localStorage.getItem("totalMoney")) || 0;
    savings = Number(localStorage.getItem("savings")) || 0;
    expense = Number(localStorage.getItem("expense")) || 0;
    spentToday = Number(localStorage.getItem("spentToday")) || 0;

    updateBudget();
    refreshBudgetUI();
    updateUI();
    updateChart();
}

/* =========================
   RESET
========================= */
function resetAllData() {

    if (!confirm("Delete all data?")) return;

    localStorage.clear();

    totalMoney = 0;
    savings = 0;
    expense = 0;
    spentToday = 0;
    transactions = [];

    refreshBudgetUI();
    updateUI();
    updateChart();
}

/* =========================
   CATEGORY TOGGLE
========================= */
function toggleCategory() {

    const type = document.getElementById("type").value;
    const categoryContainer = document.getElementById("categoryContainer");
    const categoryInput = document.getElementById("category");

    if (type === "expense") {
        categoryContainer.style.display = "block";
    } else {
        categoryContainer.style.display = "none";
        categoryInput.value = "";
    }
}

/* =========================
   CHART
========================= */
function updateChart() {

    const chartSection = document.getElementById("chartSection");

    const expenseTransactions = transactions.filter(t => t.type === "expense");

    if (expenseTransactions.length === 0) {
        chartSection.style.display = "none";
        return;
    }

    chartSection.style.display = "block";

    const categories = {};

    expenseTransactions.forEach(item => {
        const key = item.category || "Other";
        categories[key] = (categories[key] || 0) + item.amount;
    });

    const labels = Object.keys(categories);
    const values = Object.values(categories);

    const ctx = document.getElementById("expenseChart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: values
            }]
        }
    });
}