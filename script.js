/* ─────────────────────────────────────────
   SCIENCE QUIZ — Pasang Tamang
   script.js — Open Trivia DB API
───────────────────────────────────────── */

// ── API Config ──
// Category 17 = Science & Nature
// We fetch 15 questions with mixed difficulty
const API_URL = 'https://opentdb.com/api.php?amount=15&category=17&type=multiple';

// ── Fallback questions (used if API fails) ──
const FALLBACK = [
  { q:"What is the chemical symbol for Gold?", opts:["Au","Ag","Fe","Cu"], ans:0, diff:"easy", exp:"Gold's symbol Au comes from the Latin word 'Aurum'." },
  { q:"How many bones are in the adult human body?", opts:["206","186","256","196"], ans:0, diff:"medium", exp:"An adult human has 206 bones." },
  { q:"What planet is known as the Red Planet?", opts:["Venus","Jupiter","Mars","Saturn"], ans:2, diff:"easy", exp:"Mars appears red due to iron oxide on its surface." },
  { q:"What is the speed of light?", opts:["299,792 km/s","199,792 km/s","399,792 km/s","499,792 km/s"], ans:0, diff:"medium", exp:"Light travels at 299,792 km/s in a vacuum." },
  { q:"What is the powerhouse of the cell?", opts:["Nucleus","Ribosome","Mitochondria","Golgi body"], ans:2, diff:"easy", exp:"Mitochondria produce ATP — the energy currency of the cell." },
  { q:"Which gas do plants absorb?", opts:["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], ans:2, diff:"easy", exp:"Plants absorb CO₂ and release oxygen during photosynthesis." },
  { q:"What is the hardest natural substance?", opts:["Gold","Iron","Diamond","Quartz"], ans:2, diff:"easy", exp:"Diamond scores 10 on the Mohs hardness scale." },
  { q:"How many chromosomes do humans have?", opts:["23","44","46","48"], ans:2, diff:"medium", exp:"Humans have 46 chromosomes — 23 pairs." },
  { q:"Most abundant gas in Earth's atmosphere?", opts:["Oxygen","Carbon Dioxide","Argon","Nitrogen"], ans:3, diff:"medium", exp:"Nitrogen makes up about 78% of Earth's atmosphere." },
  { q:"Which organ produces insulin?", opts:["Liver","Kidney","Pancreas","Heart"], ans:2, diff:"medium", exp:"The pancreas produces insulin to regulate blood sugar." },
  { q:"What is the atomic number of Carbon?", opts:["4","6","8","12"], ans:1, diff:"hard", exp:"Carbon has 6 protons, giving it atomic number 6." },
  { q:"At what temperature does water boil at sea level?", opts:["90°C","95°C","100°C","105°C"], ans:2, diff:"easy", exp:"Water boils at 100°C at standard atmospheric pressure." },
  { q:"Who proposed the theory of evolution?", opts:["Isaac Newton","Albert Einstein","Charles Darwin","Nikola Tesla"], ans:2, diff:"easy", exp:"Charles Darwin proposed natural selection in 1859." },
  { q:"What does DNA stand for?", opts:["Deoxyribonucleic Acid","Diribonucleic Acid","Deoxyribose Nucleic Acid","Dynamic Nucleic Acid"], ans:0, diff:"medium", exp:"DNA = Deoxyribonucleic Acid — carries genetic information." },
  { q:"Which planet has the most moons?", opts:["Jupiter","Saturn","Uranus","Neptune"], ans:1, diff:"hard", exp:"Saturn has 146 confirmed moons!" },
];

// ── State ──
let questions  = [];
let current    = 0;
let score      = 0;
let correct    = 0;
let wrong      = 0;
let skipped    = 0;
let timerInterval;
let timeLeft;

const LABELS   = ['A', 'B', 'C', 'D'];
const TIME_PER_Q = 20;
const POINTS   = { easy: 10, medium: 15, hard: 20 };

// ── DOM refs ──
const startScreen   = document.getElementById('startScreen');
const loadingScreen = document.getElementById('loadingScreen');
const errorScreen   = document.getElementById('errorScreen');
const quizScreen    = document.getElementById('quizScreen');
const resultScreen  = document.getElementById('resultScreen');

// ── Screen switcher ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Decode HTML entities from API ──
function decode(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

// ── Shuffle array ──
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Fetch questions from Open Trivia DB ──
async function fetchQuestions() {
  showScreen('loadingScreen');
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();

    if (data.response_code !== 0 || !data.results.length) {
      throw new Error('No questions returned');
    }

    // Map API data to our format
    questions = data.results.map(item => {
      const allOpts = shuffle([item.correct_answer, ...item.incorrect_answers]);
      const ansIdx  = allOpts.indexOf(item.correct_answer);
      return {
        q:    decode(item.question),
        opts: allOpts.map(decode),
        ans:  ansIdx,
        diff: item.difficulty,
        exp:  `The correct answer is: ${decode(item.correct_answer)}`,
      };
    });

    startRound();
  } catch (err) {
    // Use fallback if API fails
    questions = FALLBACK;
    startRound();
  }
}

// ── Start round ──
function startRound() {
  current = 0; score = 0; correct = 0; wrong = 0; skipped = 0;
  showScreen('quizScreen');
  loadQuestion();
}

// ── Load question ──
function loadQuestion() {
  clearInterval(timerInterval);

  const q = questions[current];

  // Update top bar
  document.getElementById('qCounter').textContent =
    `Question ${current + 1} / ${questions.length}`;
  document.getElementById('progressFill').style.width =
    `${(current / questions.length) * 100}%`;
  document.getElementById('scoreBadge').textContent = `⭐ ${score}`;

  // Difficulty badge
  const badge = document.getElementById('diffBadge');
  badge.textContent = q.diff.charAt(0).toUpperCase() + q.diff.slice(1);
  badge.className   = `diff-badge ${q.diff}`;

  // Question
  document.getElementById('questionText').textContent = q.q;

  // Reset feedback + next btn
  const feedback = document.getElementById('feedback');
  feedback.className = 'feedback';
  feedback.textContent = '';
  document.getElementById('nextBtn').classList.remove('show');

  // Render options (shuffle them)
  const shuffled = q.opts
    .map((text, i) => ({ text, isCorrect: i === q.ans }))
    .sort(() => Math.random() - 0.5);

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = shuffled.map((opt, i) => `
    <button class="option-btn" data-correct="${opt.isCorrect}" onclick="selectAnswer(this, '${q.exp.replace(/'/g, "\\'")}', '${q.diff}')">
      <span class="option-label">${LABELS[i]}</span>
      ${opt.text}
    </button>
  `).join('');

  // Start timer
  timeLeft = TIME_PER_Q;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      skipped++;
      lockOptions();
      showFeedback('timeout', `⏰ Time\'s up! ${q.exp}`);
    }
  }, 1000);
}

// ── Update timer display ──
function updateTimerDisplay() {
  const el = document.getElementById('timer');
  el.textContent = `⏱ ${timeLeft}`;
  el.classList.toggle('warning', timeLeft <= 5);
}

// ── Select answer ──
function selectAnswer(btn, explanation, diff) {
  clearInterval(timerInterval);
  lockOptions();

  const isCorrect = btn.dataset.correct === 'true';

  if (isCorrect) {
    btn.classList.add('correct');
    const pts = POINTS[diff] || 10;
    score   += pts;
    correct++;
    showFeedback('correct', `✅ Correct! +${pts} pts. ${explanation}`);
  } else {
    btn.classList.add('wrong');
    wrong++;
    // Highlight correct answer
    document.querySelectorAll('.option-btn').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    showFeedback('wrong', `❌ Wrong! ${explanation}`);
  }

  document.getElementById('scoreBadge').textContent = `⭐ ${score}`;
}

// ── Show feedback ──
function showFeedback(type, text) {
  const fb = document.getElementById('feedback');
  fb.textContent = text;
  fb.className   = `feedback show ${type}`;
  document.getElementById('nextBtn').classList.add('show');
}

// ── Lock all options ──
function lockOptions() {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
}

// ── Next question ──
document.getElementById('nextBtn').addEventListener('click', () => {
  current++;
  if (current >= questions.length) {
    showResults();
  } else {
    loadQuestion();
  }
});

// ── Show results ──
function showResults() {
  clearInterval(timerInterval);
  showScreen('resultScreen');

  const pct = Math.round((correct / questions.length) * 100);
  const maxScore = questions.reduce((sum, q) => sum + (POINTS[q.diff] || 10), 0);

  const icons  = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '😊' : '💪';
  const titles = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Great job!' : pct >= 40 ? 'Not bad!' : 'Keep learning!';
  const subs   = pct >= 80 ? 'You really know your science!' : pct >= 60 ? 'Solid science knowledge!' : pct >= 40 ? 'Keep studying!' : 'Science is fun — try again!';

  document.getElementById('resultIcon').textContent  = icons;
  document.getElementById('resultTitle').textContent = titles;
  document.getElementById('resultSub').textContent   = subs;
  document.getElementById('resultNum').textContent   = score;
  document.getElementById('resultPct').textContent   = `${pct}% correct (${correct}/${questions.length})`;
  document.getElementById('rsCorrect').textContent   = correct;
  document.getElementById('rsWrong').textContent     = wrong;
  document.getElementById('rsSkipped').textContent   = skipped;

  // Progress bar to 100%
  document.getElementById('progressFill').style.width = '100%';
}

// ── Buttons ──
document.getElementById('startBtn').addEventListener('click', fetchQuestions);
document.getElementById('retryBtn').addEventListener('click', fetchQuestions);
document.getElementById('playAgainBtn').addEventListener('click', fetchQuestions);
document.getElementById('homeBtn').addEventListener('click', () => showScreen('startScreen'));
