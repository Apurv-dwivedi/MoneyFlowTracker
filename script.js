let totalMoney = 0;
let savings = 0;
let expense = 0;

let transactions =
JSON.parse(localStorage.getItem("transactions")) || [];

loadData();

function addTransaction(){

    const type =
    document.getElementById("type").value;

    const amount =
    Number(document.getElementById("amount").value);

    const description =
    document.getElementById("description").value.trim();

    if(amount <= 0){
        alert("Enter valid amount");
        return;
    }

    if(description === ""){
        alert("Enter description");
        return;
    }

    const availableBalance =
    totalMoney - expense - savings;

    if(type === "expense" && amount > availableBalance){
        alert("Not enough balance available");
        return;
    }

    if(type === "saving" && amount > availableBalance){
        alert("Not enough balance available");
        return;
    }

    const transaction = {
        date: new Date().toLocaleDateString(),
        type,
        amount,
        description
    };

    transactions.push(transaction);

    if(type === "income"){
        totalMoney += amount;
    }

    else if(type === "expense"){
        expense += amount;
    }

    else if(type === "saving"){
        savings += amount;
    }

    saveData();

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

function updateUI(){

    const remaining =
    totalMoney - savings - expense;

    document.getElementById("totalMoney").textContent =
    "₹" + totalMoney;

    document.getElementById("savings").textContent =
    "₹" + savings;

    document.getElementById("expense").textContent =
    "₹" + expense;

    document.getElementById("remaining").textContent =
    "₹" + remaining;

    const list =
    document.getElementById("transactionList");

    list.innerHTML = "";

    transactions.forEach((item,index)=>{

        list.innerHTML += `
        <tr>
            <td>${item.date}</td>
            <td>${item.type}</td>
            <td>₹${item.amount}</td>
            <td>${item.description}</td>
            <td>
   <td>
    <button
    class="delete-btn"
    onclick="deleteTransaction(${index})">
    Delete
    </button>
</td>
        </tr>
        `;
    });
}

function deleteTransaction(index){

    const confirmDelete =
    confirm("Are you sure you want to delete this transaction?");

    if(!confirmDelete){
        return;
    }

    const item = transactions[index];

    if(item.type === "income"){
        totalMoney -= item.amount;
    }

    else if(item.type === "expense"){
        expense -= item.amount;
    }

    else if(item.type === "saving"){
        savings -= item.amount;
    }

    transactions.splice(index,1);

    saveData();
}

function saveData(){

    console.log("saveData running...");

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "totalMoney",
        totalMoney
    );

    localStorage.setItem(
        "savings",
        savings
    );

    localStorage.setItem(
        "expense",
        expense
    );

    updateUI();
}

function loadData(){

    const currentMonth =
    new Date().getMonth();

    const currentYear =
    new Date().getFullYear();

    const savedMonth =
    localStorage.getItem("savedMonth");

    const savedYear =
    localStorage.getItem("savedYear");

    if(
        savedMonth != currentMonth ||
        savedYear != currentYear
    ){

        totalMoney = 0;
        expense = 0;

        localStorage.setItem(
            "totalMoney",
            0
        );

        localStorage.setItem(
            "expense",
            0
        );

        localStorage.setItem(
            "savedMonth",
            currentMonth
        );

        localStorage.setItem(
            "savedYear",
            currentYear
        );
    }

    totalMoney =
    Number(localStorage.getItem("totalMoney")) || 0;

    savings =
    Number(localStorage.getItem("savings")) || 0;

    expense =
    Number(localStorage.getItem("expense")) || 0;

    updateUI();
}

function resetAllData(){

    const confirmReset =
    confirm("Delete all data?");

    if(!confirmReset){
        return;
    }

    localStorage.clear();

    totalMoney = 0;
    savings = 0;
    expense = 0;
    transactions = [];

    updateUI();
}