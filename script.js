let lottoData = [];
let history = [];

Promise.all([
  fetch('LOTTOMAX.json').then(response => response.json()),
  fetch('LOTTOMAX-2.json').then(response => response.json())
])
  .then(([data1, data2]) => {
    // Combine and normalize data from both files
    const normalizedData1 = data1.map(draw => ({
      numbers: [
        draw["NUMBER DRAWN 1"],
        draw["NUMBER DRAWN 2"],
        draw["NUMBER DRAWN 3"],
        draw["NUMBER DRAWN 4"],
        draw["NUMBER DRAWN 5"],
        draw["NUMBER DRAWN 6"],
        draw["NUMBER DRAWN 7"]
      ]
    }));
    const normalizedData2 = data2.map(draw => ({
      numbers: [
        draw["NUMBER DRAWN 1"],
        draw["NUMBER DRAWN 2"],
        draw["NUMBER DRAWN 3"],
        draw["NUMBER DRAWN 4"],
        draw["NUMBER DRAWN 5"],
        draw["NUMBER DRAWN 6"],
        draw["NUMBER DRAWN 7"]
      ]
    }));
    lottoData = [...normalizedData1, ...normalizedData2];
    setupEventListeners();
  })
  .catch(err => console.error('Failed to load JSON files:', err));

function setupEventListeners() {
  const button = document.getElementById("generate-btn");
  button.addEventListener("click", generateNumbers);
  const shareButton = document.getElementById("share-btn");
  shareButton.addEventListener("click", shareNumbers);
}

function generateNumbers() {
  const strategy = document.getElementById("strategy").value;
  let numbers, bonus;

  if (strategy === "random") {
    ({ numbers, bonus } = generateRandomNumbers());
    displayNumbers(numbers, bonus);
    showLegend("Random numbers are generated fresh for maximum luck!");
    addToHistory(numbers, bonus, "Random");
  } else if (strategy === "hot") {
    ({ numbers, bonus } = generateHotNumbers(lottoData));
    displayNumbers(numbers, bonus);
    showLegend("Hot numbers are the most frequently drawn in history!");
    addToHistory(numbers, bonus, "Hot");
  } else if (strategy === "cold") {
    ({ numbers, bonus } = generateColdNumbers(lottoData));
    displayNumbers(numbers, bonus);
    showLegend("Cold numbers are the least drawn—maybe they're due!");
    addToHistory(numbers, bonus, "Cold");
  }

  document.getElementById("share-btn").disabled = false;
}

function generateRandomNumbers() {
  const nums = new Set();
  while (nums.size < 7) {
    nums.add(Math.floor(Math.random() * 49) + 1);
  }
  const numbers = Array.from(nums).sort((a, b) => a - b);
  const bonus = Math.floor(Math.random() * 50) + 1;
  return { numbers, bonus };
}

function generateHotNumbers(data) {
  const frequency = getNumberFrequency(data);
  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  const numbers = sorted.slice(0, 7).map(entry => parseInt(entry[0])).sort((a, b) => a - b);
  const bonus = Math.floor(Math.random() * 50) + 1;
  return { numbers, bonus };
}

function generateColdNumbers(data) {
  const frequency = getNumberFrequency(data);
  const sorted = Object.entries(frequency).sort((a, b) => a[1] - b[1]);
  const numbers = sorted.slice(0, 7).map(entry => parseInt(entry[0])).sort((a, b) => a - b);
  const bonus = Math.floor(Math.random() * 50) + 1;
  return { numbers, bonus };
}

function getNumberFrequency(data) {
  const freq = {};
  data.forEach(draw => {
    draw.numbers.forEach(num => {
      freq[num] = (freq[num] || 0) + 1;
    });
  });
  return freq;
}

function displayNumbers(numbers, bonus) {
  const container = document.getElementById("numbers");
  container.innerHTML = "";
  numbers.forEach(num => {
    const span = document.createElement("span");
    span.className = "number-ball fade-in";
    span.textContent = num.toString().padStart(2, '0');
    container.appendChild(span);
  });
  const bonusSpan = document.createElement("span");
  bonusSpan.className = "number-ball bonus fade-in";
  bonusSpan.textContent = bonus.toString().padStart(2, '0');
  bonusSpan.title = "Bonus Number";
  container.appendChild(bonusSpan);
}

function showLegend(message) {
  document.getElementById("legend").textContent = message;
}

function addToHistory(numbers, bonus, strategy) {
  history.unshift({ numbers, bonus, strategy, date: new Date().toLocaleString() });
  if (history.length > 5) history.pop();
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.className = "text-sm text-gray-600";
    li.textContent = `${entry.date} - ${entry.strategy}: ${entry.numbers.join(", ")} (Bonus: ${entry.bonus})`;
    list.appendChild(li);
  });
}

function shareNumbers() {
  const latest = history[0];
  if (!latest) return;
  const text = `My LottoMax Numbers (${latest.strategy}): ${latest.numbers.join(", ")} (Bonus: ${latest.bonus}) - Generated at ${latest.date}`;
  if (navigator.share) {
    navigator.share({ title: "LottoMax Numbers", text });
  } else {
    prompt("Copy this to share:", text);
  }
}