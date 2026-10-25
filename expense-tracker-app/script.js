const text = document.getElementById("text");
const amount = document.getElementById("amount");
const list = document.getElementById("list");

const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentFilter = "all";
let chart;
let selectedCategory = "Food";

// DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark);
  document.getElementById("darkBtn").innerText = isDark ? "☀️" : "🌙";
}

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  document.getElementById("darkBtn").innerText = "☀️";
}

// FORMAT
function formatRupiah(number) {
  return number.toLocaleString("id-ID");
}

function formatDate(date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// DROPDOWN
function toggleDropdown() {
  document.getElementById("options").classList.toggle("show");
}

function selectCategory(value) {
  selectedCategory = value;
  document.getElementById("selected").innerText = value;
  document.getElementById("options").classList.remove("show");
}

// INPUT FORMAT
amount.addEventListener("input", function(e) {
  let value = e.target.value.replace(/\D/g, "");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  e.target.value = value;
});

// ADD
function addTransactionType(type) {
  if (text.value === "" || amount.value === "") return;

  const transaction = {
    id: Date.now(),
    text: text.value,
    amount: +amount.value.replace(/\./g, ""),
    type,
    category: selectedCategory,
    date: new Date()
  };

  transactions.push(transaction);
  saveToLocal();
  renderList();
  updateValues();

  text.value = "";
  amount.value = "";
}

// RENDER ITEM
function addTransaction(t) {
  const li = document.createElement("li");

  li.innerHTML = `
    <div>
      <strong>${t.text}</strong><br>
      <small>${t.category} • ${formatDate(t.date)}</small>
    </div>
    <span>
      ${t.type === "expense" ? "-" : "+"}Rp${formatRupiah(t.amount)}
      <button onclick="removeTransaction(${t.id})">x</button>
    </span>
  `;

  list.appendChild(li);
}

// DELETE
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocal();
  renderList();
  updateValues();
}

// FILTER
function setFilter(type) {
  currentFilter = type;
  renderList();
}

// RENDER LIST
function renderList() {
  list.innerHTML = "";
  let filtered = currentFilter === "all"
    ? transactions
    : transactions.filter(t => t.type === currentFilter);

  filtered.forEach(addTransaction);
}

// UPDATE TOTAL
function updateValues() {
  let total = 0, inc = 0, exp = 0;

  transactions.forEach(t => {
    if (t.type === "income") {
      inc += t.amount;
      total += t.amount;
    } else {
      exp += t.amount;
      total -= t.amount;
    }
  });

  balance.innerText = "Rp" + formatRupiah(total);
  income.innerText = "Rp" + formatRupiah(inc);
  expense.innerText = "Rp" + formatRupiah(exp);

  updateChart();
}

// CHART
function updateChart() {
  let inc = 0, exp = 0;

  transactions.forEach(t => {
    if (t.type === "income") inc += t.amount;
    else exp += t.amount;
  });

  const isDark = document.body.classList.contains("dark");

  const colors = isDark
    ? ["#4caf50", "#ef5350"]
    : ["#00c853", "#ff5252"];

  const data = {
    labels: ["Income", "Expense"],
    datasets: [{
      data: [inc, exp],
      backgroundColor: colors
    }]
  };

  if (chart) chart.destroy();

  const ctx = document.getElementById("myChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "doughnut",
    data
  });
}

// EXPORT CSV
function exportCSV() {
  if (transactions.length === 0) return;

  let csv = "Description,Amount,Type,Category,Date\n";

  transactions.forEach(t => {
    csv += `${t.text},${t.amount},${t.type},${t.category},${formatDate(t.date)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// SAVE
function saveToLocal() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// INIT
renderList();
updateValues();