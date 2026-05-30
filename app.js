const factors = {
  exam: 3,
  assignment: 3,
  presentation: 2,
  relationships: 4,
  career: 4,
  finance: 3,
  sleep: 5,
};

const appraisalLabels = {
  threat: "위험감이 높고 걱정이 커집니다.",
  challenge: "적극적 대응이 가능합니다.",
  avoidance: "회피 경향이 높아집니다.",
};

const adviceMap = {
  threat: ["명상", "사회적 지지", "이완훈련"],
  challenge: ["운동", "재구성", "사회적 지지"],
  avoidance: ["명상", "이완훈련", "사회적 지지"],
};

const scoreElem = document.getElementById("stress-score");
const levelElem = document.getElementById("stress-level");
const diaryText = document.getElementById("diary-text");
const diaryMessage = document.getElementById("diary-message");
const calculateBtn = document.getElementById("calculate-btn");
const saveDiaryBtn = document.getElementById("save-diary");
const clearDiaryBtn = document.getElementById("clear-diary");
const stressForm = document.getElementById("stress-form");
let chart;

function getSelectedFactors() {
  return Array.from(document.querySelectorAll("input[name='factor']:checked")).map(
    (input) => input.value
  );
}

function getSelectedAppraisal() {
  const selected = document.querySelector("input[name='appraisal']:checked");
  return selected ? selected.value : "threat";
}

function calculateStressScore() {
  const selected = getSelectedFactors();
  const baseScore = selected.reduce((sum, factor) => sum + (factors[factor] || 0), 0);
  const appraisal = getSelectedAppraisal();
  const modifier = appraisal === "challenge" ? -1 : appraisal === "avoidance" ? 1 : 2;
  return Math.max(0, baseScore + modifier);
}

function getStressLevel(score) {
  if (score <= 7) return "낮음 - 여유를 유지하며 관리하세요.";
  if (score <= 12) return "중간 - 오늘은 주의 깊게 휴식을 챙기세요.";
  return "높음 - 즉시 대처와 휴식이 필요합니다.";
}

function renderResults() {
  const score = calculateStressScore();
  const appraisal = getSelectedAppraisal();
  scoreElem.textContent = score;
  levelElem.textContent = `${getStressLevel(score)} (${appraisalLabels[appraisal]})`;
  updateHistory(score);
  renderChart();
}

function loadDiary() {
  const diary = localStorage.getItem("stressGPS-diary") || "";
  diaryText.value = diary;
  diaryMessage.textContent = diary || "아직 저장된 일기가 없습니다.";
}

function saveDiary() {
  const text = diaryText.value.trim();
  localStorage.setItem("stressGPS-diary", text);
  localStorage.setItem("stressGPS-diary-date", new Date().toISOString());
  diaryMessage.textContent = text || "아직 저장된 일기가 없습니다.";
  alert("스트레스 일기가 저장되었습니다.");
}

function clearDiary() {
  diaryText.value = "";
  localStorage.removeItem("stressGPS-diary");
  localStorage.removeItem("stressGPS-diary-date");
  diaryMessage.textContent = "아직 저장된 일기가 없습니다.";
}

function updateHistory(score) {
  const today = new Date().toISOString().slice(0, 10);
  const historyJson = localStorage.getItem("stressGPS-history");
  const history = historyJson ? JSON.parse(historyJson) : [];
  const existing = history.find((entry) => entry.date === today);
  if (existing) {
    existing.score = score;
  } else {
    history.push({ date: today, score });
  }
  const recent = history
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
  localStorage.setItem("stressGPS-history", JSON.stringify(recent));
}

function getHistoryData() {
  const historyJson = localStorage.getItem("stressGPS-history");
  const history = historyJson ? JSON.parse(historyJson) : [];
  const ordered = history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const labels = ordered.map((entry) => entry.date.slice(5).replace("-", "/"));
  const values = ordered.map((entry) => entry.score);
  while (labels.length < 7) {
    labels.unshift("");
    values.unshift(0);
  }
  return { labels, values };
}

function renderChart() {
  const ctx = document.getElementById("stress-chart").getContext("2d");
  const { labels, values } = getHistoryData();
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "스트레스 점수",
          data: values,
          borderColor: "#4f5dff",
          backgroundColor: "rgba(79, 93, 255, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "#4f5dff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          suggestedMin: 0,
          suggestedMax: 18,
          grid: { color: "rgba(79, 93, 255, 0.08)" },
        },
        x: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} 점`,
          },
        },
      },
    },
  });
}

calculateBtn.addEventListener("click", () => {
  renderResults();
});

saveDiaryBtn.addEventListener("click", saveDiary);
clearDiaryBtn.addEventListener("click", clearDiary);

window.addEventListener("load", () => {
  loadDiary();
  renderChart();
});