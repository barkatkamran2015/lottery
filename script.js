let lottoMaxData = [];
let lotto649Data = [];
let history = [];

const zodiacNumbers = {
  aries: [5, 13, 22, 28, 34, 41, 47],
  taurus: [2, 11, 19, 25, 33, 40, 46],
  gemini: [7, 15, 23, 29, 36, 42, 48],
  cancer: [4, 12, 20, 27, 35, 43, 49],
  leo: [1, 10, 18, 26, 32, 39, 45],
  virgo: [3, 14, 21, 30, 37, 44, 49],
  libra: [6, 16, 24, 31, 38, 43, 48],
  scorpio: [8, 17, 25, 33, 40, 46, 49],
  sagittarius: [9, 18, 27, 34, 41, 47, 49],
  capricorn: [2, 11, 20, 28, 35, 42, 48],
  aquarius: [4, 13, 22, 29, 36, 44, 49],
  pisces: [7, 15, 24, 31, 39, 45, 49]
};

Promise.all([
  fetch('LOTTOMAX.json').then(response => response.json()),
  fetch('LOTTOMAX-2.json').then(response => response.json()),
  fetch('LOTTO649.json').then(response => response.json())
])
  .then(([maxData1, maxData2, lotto649DataRaw]) => {
    // Normalize LottoMax data
    const normalizedMax1 = maxData1.map(draw => ({
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
    const normalizedMax2 = maxData2.map(draw => ({
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
    lottoMaxData = [...normalizedMax1, ...normalizedMax2];

    // Normalize Lotto 6/49 data
    lotto649Data = lotto649DataRaw.map(draw => ({
      numbers: [
        draw["NUMBER DRAWN 1"],
        draw["NUMBER DRAWN 2"],
        draw["NUMBER DRAWN 3"],
        draw["NUMBER DRAWN 4"],
        draw["NUMBER DRAWN 5"],
        draw["NUMBER DRAWN 6"]
      ],
      bonus: draw["BONUS"]
    }));

    setupEventListeners();
  })
  .catch(err => console.error('Failed to load JSON files:', err));

function setupEventListeners() {
  const gameSelect = document.getElementById("game");
  const strategySelect = document.getElementById("strategy");
  const useAstrologyCheckbox = document.getElementById("use-astrology");
  const astrologyInputs = document.getElementById("astrology-inputs");
  const includeBonusCheckbox = document.getElementById("include-bonus");
  const generateButton = document.getElementById("generate-btn");
  const shareButton = document.getElementById("share-btn");

  gameSelect.addEventListener("change", updateGameUI);
  useAstrologyCheckbox.addEventListener("change", () => {
    astrologyInputs.classList.toggle("hidden", !useAstrologyCheckbox.checked);
    strategySelect.disabled = useAstrologyCheckbox.checked;
  });
  generateButton.addEventListener("click", generateNumbers);
  shareButton.addEventListener("click", shareNumbers);

  updateGameUI();
}

function updateGameUI() {
  const game = document.getElementById("game").value;
  const title = document.querySelector(".section-title");
  title.textContent = `Generate Your Lucky ${game === "lottoMax" ? "LottoMax" : "Lotto 6/49"} Numbers`;
  title.setAttribute("data-game", game === "lottoMax" ? "LottoMax" : "Lotto 6/49");
}

function generateNumbers() {
  const game = document.getElementById("game").value;
  const useAstrology = document.getElementById("use-astrology").checked;
  const includeBonus = document.getElementById("include-bonus").checked;
  const strategy = useAstrology ? "astrology" : document.getElementById("strategy").value;
  const numCount = game === "lottoMax" ? 7 : 6;
  let numbers, bonus;

  if (strategy === "random") {
    const result = generateRandomNumbers(numCount, includeBonus);
    numbers = result.numbers;
    bonus = result.bonus;
    displayNumbers(numbers, bonus, includeBonus);
    showLegend(`Random numbers are generated fresh for maximum luck!`);
    addToHistory(numbers, bonus, strategy, game, includeBonus);
  } else if (strategy === "hot") {
    const result = generateHotNumbers(game === "lottoMax" ? lottoMaxData : lotto649Data, numCount, includeBonus, game);
    numbers = result.numbers;
    bonus = result.bonus;
    displayNumbers(numbers, bonus, includeBonus);
    showLegend(`Hot numbers are the most frequently drawn in ${game === "lottoMax" ? "LottoMax" : "Lotto 6/49"} history!`);
    addToHistory(numbers, bonus, strategy, game, includeBonus);
  } else if (strategy === "cold") {
    const result = generateColdNumbers(game === "lottoMax" ? lottoMaxData : lotto649Data, numCount, includeBonus, game);
    numbers = result.numbers;
    bonus = result.bonus;
    displayNumbers(numbers, bonus, includeBonus);
    showLegend(`Cold numbers are the least drawn in ${game === "lottoMax" ? "LottoMax" : "Lotto 6/49"}—maybe they're due!`);
    addToHistory(numbers, bonus, strategy, game, includeBonus);
  } else if (strategy === "astrology") {
    const zodiac = getZodiac();
    if (!zodiac) {
      alert("Please enter a valid birthdate or select a zodiac sign.");
      return;
    }
    const result = generateAstrologyNumbers(zodiac, numCount, includeBonus);
    numbers = result.numbers;
    bonus = result.bonus;
    displayNumbers(numbers, bonus, includeBonus);
    showLegend(`Numbers inspired by your zodiac sign (${zodiac.charAt(0).toUpperCase() + zodiac.slice(1)}) for fun!`);
    addToHistory(numbers, bonus, `Astrology (${zodiac})`, game, includeBonus);
  }

  document.getElementById("share-btn").disabled = false;
}

function generateRandomNumbers(numCount, includeBonus) {
  const nums = new Set();
  while (nums.size < numCount) {
    nums.add(Math.floor(Math.random() * 49) + 1);
  }
  const numbers = Array.from(nums).sort((a, b) => a - b);
  const bonus = includeBonus ? Math.floor(Math.random() * 49) + 1 : null;
  return { numbers, bonus };
}

function generateHotNumbers(data, numCount, includeBonus, game) {
  const frequency = getNumberFrequency(data);
  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  const numbers = sorted.slice(0, numCount).map(entry => parseInt(entry[0])).sort((a, b) => a - b);
  let bonus = null;
  if (includeBonus) {
    if (game === "lotto649") {
      const bonusFreq = getBonusFrequency(data);
      const sortedBonus = Object.entries(bonusFreq).sort((a, b) => b[1] - a[1]);
      bonus = parseInt(sortedBonus[0][0]);
    } else {
      bonus = Math.floor(Math.random() * 49) + 1;
    }
  }
  return { numbers, bonus };
}

function generateColdNumbers(data, numCount, includeBonus, game) {
  const frequency = getNumberFrequency(data);
  const sorted = Object.entries(frequency).sort((a, b) => a[1] - b[1]);
  const numbers = sorted.slice(0, numCount).map(entry => parseInt(entry[0])).sort((a, b) => a - b);
  let bonus = null;
  if (includeBonus) {
    if (game === "lotto649") {
      const bonusFreq = getBonusFrequency(data);
      const sortedBonus = Object.entries(bonusFreq).sort((a, b) => a[1] - b[1]);
      bonus = parseInt(sortedBonus[0][0]);
    } else {
      bonus = Math.floor(Math.random() * 49) + 1;
    }
  }
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

function getBonusFrequency(data) {
  const freq = {};
  data.forEach(draw => {
    if (draw.bonus) {
      freq[draw.bonus] = (freq[draw.bonus] || 0) + 1;
    }
  });
  return freq;
}

function getZodiac() {
  const birthdateInput = document.getElementById("birthdate").value;
  const zodiacSelect = document.getElementById("zodiac").value;

  if (birthdateInput) {
    const date = new Date(birthdateInput);
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    if (month === 3 && day >= 21 || month === 4 && day <= 19) return "aries";
    if (month === 4 && day >= 20 || month === 5 && day <= 20) return "taurus";
    if (month === 5 && day >= 21 || month === 6 && day <= 20) return "gemini";
    if (month === 6 && day >= 21 || month === 7 && day <= 22) return "cancer";
    if (month === 7 && day >= 23 || month === 8 && day <= 22) return "leo";
    if (month === 8 && day >= 23 || month === 9 && day <= 22) return "virgo";
    if (month === 9 && day >= 23 || month === 10 && day <= 22) return "libra";
    if (month === 10 && day >= 23 || month === 11 && day <= 21) return "scorpio";
    if (month === 11 && day >= 22 || month === 12 && day <= 21) return "sagittarius";
    if (month === 12 && day >= 22 || month === 1 && day <= 19) return "capricorn";
    if (month === 1 && day >= 20 || month === 2 && day <= 18) return "aquarius";
    if (month === 2 && day >= 19 || month === 3 && day <= 20) return "pisces";
  }

  return zodiacSelect || null;
}

function generateAstrologyNumbers(zodiac, numCount, includeBonus) {
  const numbers = zodiacNumbers[zodiac];
  const shuffled = numbers.sort(() => Math.random() - 0.5);
  const mainNumbers = shuffled.slice(0, numCount).sort((a, b) => a - b);
  const bonus = includeBonus ? shuffled[numCount] || Math.floor(Math.random() * 49) + 1 : null;
  return { numbers: mainNumbers, bonus };
}

function displayNumbers(numbers, bonus, includeBonus) {
  const container = document.getElementById("numbers");
  container.innerHTML = "";
  numbers.forEach(num => {
    const span = document.createElement("span");
    span.className = "number-ball fade-in";
    span.textContent = num.toString().padStart(2, '0');
    container.appendChild(span);
  });
  if (includeBonus && bonus) {
    const bonusSpan = document.createElement("span");
    bonusSpan.className = "number-ball bonus fade-in";
    bonusSpan.textContent = bonus.toString().padStart(2, '0');
    bonusSpan.title = "Bonus Number";
    container.appendChild(bonusSpan);
  }
}

function showLegend(message) {
  document.getElementById("legend").textContent = message;
}

function addToHistory(numbers, bonus, strategy, game, includeBonus) {
  history.unshift({ numbers, bonus, strategy, game, includeBonus, date: new Date().toLocaleString() });
  if (history.length > 5) history.pop();
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.className = "text-sm text-gray-600";
    let text = `${entry.date} - ${entry.game === "lottoMax" ? "LottoMax" : "Lotto 6/49"} (${entry.strategy}): ${entry.numbers.join(", ")}`;
    if (entry.includeBonus && entry.bonus) {
      text += ` (Bonus: ${entry.bonus})`;
    }
    li.textContent = text;
    list.appendChild(li);
  });
}

function shareNumbers() {
  const latest = history[0];
  if (!latest) return;
  let text = `My ${latest.game === "lottoMax" ? "LottoMax" : "Lotto 6/49"} Numbers (${latest.strategy}): ${latest.numbers.join(", ")}`;
  if (latest.includeBonus && latest.bonus) {
    text += ` (Bonus: ${latest.bonus})`;
  }
  text += ` - Generated at ${latest.date}`;
  if (navigator.share) {
    navigator.share({ title: `${latest.game === "lottoMax" ? "LottoMax" : "Lotto 6/49"} Numbers`, text });
  } else {
    prompt("Copy this to share:", text);
  }
}
