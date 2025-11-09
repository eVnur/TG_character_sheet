const tg = window.Telegram.WebApp;
const baseURL = "http://localhost:3000";

async function loadCharacters() {
  const telegram_id = tg.initDataUnsafe?.user?.id || "test-user";
  const res = await fetch(`${baseURL}/api/characters/${telegram_id}`);
  const chars = await res.json();

  const list = document.getElementById("char-list");
  list.innerHTML = "";
  chars.forEach(c => {
    const div = document.createElement("div");
    div.className = "character";
    div.innerHTML = `<b>${c.name}</b><br>${c.class} — ${c.level} ур.`;
    div.onclick = () => {
      localStorage.setItem("char_id", c.id);
      window.location = "sheet.html";
    };
    list.appendChild(div);
  });
}

async function addCharacter() {
  const telegram_id = tg.initDataUnsafe?.user?.id || "test-user";
  const name = document.getElementById("name").value;
  const className = document.getElementById("class").value;
  await fetch(`${baseURL}/api/character`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id, name, className }),
  });
  loadCharacters();
}

if (location.pathname.endsWith("index.html") || location.pathname === "/") loadCharacters();

if (location.pathname.endsWith("sheet.html")) {
  const id = localStorage.getItem("char_id");
  fetch(`${baseURL}/api/characters/test-user`).then(r => r.json()).then(chars => {
    const c = chars.find(x => x.id == id);
    const sheet = document.getElementById("sheet");
    sheet.innerHTML = `
      <h2>${c.name}</h2>
      <p>Класс: ${c.class}</p>
      <p>Уровень: ${c.level}</p>
      <p>ХП: ${c.hp}</p>
    `;
    document.getElementById("levelup").onclick = async () => {
      await fetch(`${baseURL}/api/levelup/${id}`, { method: "POST" });
      location.reload();
    };
  });
}

function loadSubraces() {
  const race = document.getElementById("race").value;
  const subrace = document.getElementById("subrace");
  subrace.innerHTML = "";

  const options = {
    "Человек": ["—"],
    "Эльф": ["Высший эльф", "Лесной эльф", "Темный эльф"],
    "Дворф": ["Горный дворф", "Холмовой дворф"],
    "Полуорк": ["—"]
  };

  options[race].forEach(r => {
    const opt = document.createElement("option");
    opt.textContent = r;
    subrace.appendChild(opt);
  });
}

// --- переход на шаг характеристик
function nextStep() {
  const data = {
    name: document.getElementById("name").value,
    race: document.getElementById("race").value,
    subrace: document.getElementById("subrace").value,
    class: document.getElementById("class").value,
    background: document.getElementById("background").value
  };

  localStorage.setItem("new_char_info", JSON.stringify(data));
  window.location = "stats.html";
}

const COST_TABLE = [0, 1, 2, 3, 4, 5, 7, 9];
const STAT_NAMES = ["Сила", "Ловкость", "Телосложение", "Интеллект", "Мудрость", "Харизма"];
let points = 27;
let stats = {};
STAT_NAMES.forEach(n => stats[n] = 8);

if (location.pathname.endsWith("stats.html")) initStatsPage();

function initStatsPage() {
  const container = document.getElementById("stats-container");
  STAT_NAMES.forEach(name => {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `
      <span>${name}</span>
      <div>
        <button onclick="changeStat('${name}', -1)">-</button>
        <span id="${name}">${stats[name]}</span>
        <button onclick="changeStat('${name}', 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });
  updatePoints();
}

function statCost(value) {
  return COST_TABLE[value - 8];
}

function changeStat(stat, delta) {
  const current = stats[stat];
  const next = current + delta;
  if (next < 8 || next > 15) return;

  const diff = statCost(next) - statCost(current);
  if (points - diff < 0) return;

  stats[stat] = next;
  points -= diff;
  document.getElementById(stat).textContent = next;
  updatePoints();
}

function updatePoints() {
  document.getElementById("points").textContent = points;
}

function randomize() {
  points = 27;
  STAT_NAMES.forEach(n => stats[n] = 8);

  while (points > 0) {
    const keys = STAT_NAMES.filter(n => stats[n] < 15);
    const pick = keys[Math.floor(Math.random() * keys.length)];
    const newVal = stats[pick] + 1;
    const diff = statCost(newVal) - statCost(stats[pick]);
    if (points - diff >= 0) {
      stats[pick] = newVal;
      points -= diff;
    } else break;
  }

  STAT_NAMES.forEach(n => document.getElementById(n).textContent = stats[n]);
  updatePoints();
}

async function saveCharacter() {
  const info = JSON.parse(localStorage.getItem("new_char_info"));
  info.stats = stats;
  info.telegram_id = tg?.initDataUnsafe?.user?.id || "test-user";

  await fetch(`${baseURL}/api/character`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id: info.telegram_id,
      name: info.name,
      className: info.class,
      race: info.race,
      subrace: info.subrace,
      background: info.background,
      stats: info.stats
    })
  });

  alert("✅ Персонаж создан!");
  window.location = "index.html";
}