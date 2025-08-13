/* Math Quest — Gamified PPT-style module */

const dom = {
  stage: document.getElementById('stage'),
  progressFill: document.getElementById('progressFill'),
  xpFill: document.getElementById('xpFill'),
  xpText: document.getElementById('xpText'),
  level: document.getElementById('level'),
  hearts: document.getElementById('hearts'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  btnCheck: document.getElementById('btnCheck'),
  btnHint: document.getElementById('btnHint'),
  btnMenu: document.getElementById('btnMenu'),
  btnAchievements: document.getElementById('btnAchievements'),
  menuDialog: document.getElementById('menuDialog'),
  achievementsDialog: document.getElementById('achievementsDialog'),
  achievementsList: document.getElementById('achievementsList'),
  btnRestart: document.getElementById('btnRestart'),
  btnExport: document.getElementById('btnExport'),
  btnImport: document.getElementById('btnImport'),
  toggleSound: document.getElementById('toggleSound'),
  toggleAnimations: document.getElementById('toggleAnimations'),
  confetti: document.getElementById('confetti'),
};

/* ---------- Utilities ---------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const h = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};

function playSound(type) {
  if (!state.settings.sound) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain).connect(ctx.destination);
  if (type === 'success') osc.frequency.value = 740; else if (type === 'fail') osc.frequency.value = 220; else osc.frequency.value = 520;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.start();
  osc.stop(ctx.currentTime + 0.22);
}
let audioCtx;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function saveToStorage() {
  const toSave = JSON.stringify(state);
  localStorage.setItem('mathQuestSave', toSave);
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('mathQuestSave');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch { return null; }
}

function animateXP(from, to) {
  const start = performance.now();
  const duration = 400;
  function frame(now) {
    const t = clamp((now - start) / duration, 0, 1);
    const value = Math.round(from + (to - from) * t);
    renderXP(value);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderXP(value) {
  const levelCap = 100;
  const progress = value % levelCap;
  const level = Math.floor(value / levelCap) + 1;
  const pct = (progress / levelCap) * 100;
  dom.xpFill.style.width = `${pct}%`;
  dom.xpText.textContent = `${progress} / ${levelCap}`;
  dom.level.textContent = String(level);
}

function awardXP(amount) {
  const before = state.xp;
  state.xp += amount;
  animateXP(before, state.xp);
}

function setHearts(num) {
  dom.hearts.textContent = '❤️'.repeat(num) + '🖤'.repeat(clamp(3 - num, 0, 3));
}

function showConfetti(durationMs = 1000) {
  dom.confetti.innerHTML = '';
  const count = 80;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const size = randomInt(6, 12);
    piece.style.position = 'absolute';
    piece.style.left = randomInt(0, 100) + '%';
    piece.style.top = '-10px';
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.background = ['#ffd166', '#7c9cff', '#38d9a9', '#ff5c7c'][i % 4];
    piece.style.opacity = '0.9';
    piece.style.transform = `rotate(${randomInt(0, 360)}deg)`;
    piece.animate([
      { transform: `translateY(0px) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(${randomInt(500, 900)}px) rotate(${randomInt(180, 720)}deg)`, opacity: 0.9 }
    ], { duration: randomInt(1200, 2200), easing: 'cubic-bezier(.2,.8,.2,1)', iterations: 1, fill: 'forwards' });
    dom.confetti.appendChild(piece);
  }
  playSound('success');
  setTimeout(() => dom.confetti.innerHTML = '', durationMs + 300);
}

/* ---------- State ---------- */
const defaultState = {
  slideIndex: 0,
  xp: 0,
  lives: 3,
  streak: 0,
  achievements: {},
  settings: { sound: true, animations: true },
  lightning: { active: false, timeLeft: 0, score: 0 }
};
let state = Object.assign({}, defaultState, loadFromStorage() || {});

/* ---------- Slides Data ---------- */
const slides = [
  {
    id: 'intro',
    type: 'content',
    title: 'Welcome to Math Quest',
    subtitle: 'Master arithmetic with XP, streaks, and achievements',
    hero: '🧠',
    bullets: [
      'Navigate like slides. Short challenges on each step.',
      'Earn XP and level up as you solve questions.',
      'Keep streaks to unlock achievements!',
    ],
  },
  {
    id: 'learn-add',
    type: 'content',
    title: 'Addition Refresher',
    subtitle: 'Combine parts to make a whole',
    hero: '➕',
    bullets: [
      'Commutative: a + b = b + a',
      'Associative: (a + b) + c = a + (b + c)',
      'Identity: a + 0 = a',
    ],
  },
  {
    id: 'q1',
    type: 'quiz',
    title: 'Warm-up: Addition',
    prompt: 'What is 17 + 8?',
    answer: '25',
    hint: 'Add 3 to 17 to get 20, then add the remaining 5.',
    xp: 25,
  },
  {
    id: 'learn-mul',
    type: 'content',
    title: 'Multiplication Refresher',
    subtitle: 'Repeated addition shortcut',
    hero: '✖️',
    bullets: [
      'Distributive: a(b + c) = ab + ac',
      'Any number times 0 is 0',
      'Order does not matter: a×b = b×a',
    ],
  },
  {
    id: 'q2',
    type: 'quiz',
    title: 'Apply Distributive',
    prompt: 'Compute 7×(10 + 3)',
    answer: '91',
    hint: '7×10 + 7×3',
    xp: 30,
  },
  {
    id: 'lightning-intro',
    type: 'content',
    title: 'Lightning Round',
    subtitle: 'Answer quickly for bonus XP!',
    hero: '⚡',
    bullets: [
      'You have 30 seconds to answer as many as you can.',
      'Each correct answer gives +10 XP and adds 1s.',
      'Wrong answers reduce lives.',
    ],
  },
  {
    id: 'lightning',
    type: 'lightning',
    title: 'Lightning Round',
    duration: 30,
  },
  {
    id: 'wrap',
    type: 'content',
    title: 'Great Job!',
    subtitle: 'You completed this module',
    hero: '🏁',
    bullets: [
      'Review and retry any question to improve your score.',
      'Try to beat your lightning round best!',
    ],
  },
];

/* ---------- Rendering ---------- */
function render() {
  const idx = clamp(state.slideIndex, 0, slides.length - 1);
  state.slideIndex = idx;
  const slide = slides[idx];
  const pct = ((idx + 1) / slides.length) * 100;
  dom.progressFill.style.width = `${pct}%`;
  setHearts(state.lives);
  renderXP(state.xp);

  if (slide.type === 'content') renderContentSlide(slide);
  else if (slide.type === 'quiz') renderQuizSlide(slide);
  else if (slide.type === 'lightning') renderLightningSlide(slide);

  saveToStorage();
}

function renderShell(slide, contentHtml) {
  const node = h(`
    <section class="slide ${state.settings.animations ? 'slide-in-right' : ''}">
      <div class="slide-header">
        <div class="slide-title">${slide.title}</div>
        <div class="slide-subtitle">${slide.subtitle || ''}</div>
      </div>
      <div class="slide-content">${contentHtml}</div>
    </section>
  `);
  dom.stage.innerHTML = '';
  dom.stage.appendChild(node);
}

function renderContentSlide(slide) {
  const list = slide.bullets.map(b => `<li>${b}</li>`).join('');
  renderShell(slide, `
    <div class="slide-hero" aria-hidden="true">${slide.hero || ''}</div>
    <div class="slide-panel">
      <ul class="slide-list">${list}</ul>
    </div>
  `);
}

function renderQuizSlide(slide) {
  renderShell(slide, `
    <div class="slide-hero" aria-hidden="true">📝</div>
    <div class="slide-panel quiz">
      <div>${slide.prompt}</div>
      <div class="input-row">
        <input id="answer" type="text" placeholder="Type answer" inputmode="numeric" />
        <button id="checkInline" class="nav-btn primary">Check</button>
      </div>
      <div class="feedback" id="feedback"></div>
      <div class="hint muted" id="hint" style="display:none">Hint: ${slide.hint || 'Think carefully.'}</div>
    </div>
  `);
  const input = document.getElementById('answer');
  const checkInline = document.getElementById('checkInline');
  const feedback = document.getElementById('feedback');
  const hint = document.getElementById('hint');

  const doCheck = () => {
    const correct = (input.value || '').trim().toLowerCase() === String(slide.answer).toLowerCase();
    if (correct) {
      feedback.textContent = 'Correct! +XP';
      feedback.style.color = 'var(--success)';
      awardXP(slide.xp || 20);
      state.streak += 1;
      unlockAchievementsIfAny();
      playSound('success');
      showConfetti(700);
      setTimeout(nextSlide, 600);
    } else {
      feedback.textContent = 'Try again! -1 life';
      feedback.style.color = 'var(--danger)';
      state.lives = clamp(state.lives - 1, 0, 3);
      state.streak = 0;
      playSound('fail');
      if (state.lives === 0) {
        gameOver();
      }
    }
    saveToStorage();
  };

  checkInline.addEventListener('click', (e) => { e.preventDefault(); doCheck(); });
  dom.btnCheck.onclick = doCheck;
  dom.btnHint.onclick = () => { hint.style.display = 'block'; };
  input.addEventListener('keyup', (e) => { if (e.key === 'Enter') doCheck(); });
  input.focus();
}

function renderLightningSlide(slide) {
  state.lightning.active = true;
  state.lightning.timeLeft = slide.duration || 30;
  state.lightning.score = 0;
  let current;
  let timerId;

  function newQuestion() {
    const a = randomInt(2, 12);
    const b = randomInt(2, 12);
    const ops = ['+', '-', '×'];
    const op = ops[randomInt(0, ops.length - 1)];
    let ans = 0;
    if (op === '+') ans = a + b; else if (op === '-') ans = a - b; else ans = a * b;
    current = { a, b, op, ans };
    promptEl.textContent = `${a} ${op} ${b} = ?`;
    input.value = '';
    input.focus();
  }

  renderShell(slide, `
    <div class="slide-hero" aria-hidden="true">⚡</div>
    <div class="slide-panel quiz">
      <div id="timer">Time: ${state.lightning.timeLeft}s</div>
      <div id="score">Score: 0</div>
      <div id="prompt" style="font-size:20px;font-weight:700"></div>
      <div class="input-row">
        <input id="answer" type="number" placeholder="Answer" />
        <button id="checkInline" class="nav-btn primary">Submit</button>
      </div>
      <div id="feedback"></div>
    </div>
  `);

  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const promptEl = document.getElementById('prompt');
  const input = document.getElementById('answer');
  const checkInline = document.getElementById('checkInline');
  const feedback = document.getElementById('feedback');

  function endRound() {
    state.lightning.active = false;
    clearInterval(timerId);
    const gained = state.lightning.score * 10;
    awardXP(gained);
    unlockAchievementsIfAny();
    showConfetti(800);
    feedback.textContent = `Round over! +${gained} XP`;
    saveToStorage();
  }

  function tick() {
    if (!state.lightning.active) return;
    state.lightning.timeLeft -= 1;
    if (state.lightning.timeLeft <= 0) {
      timerEl.textContent = `Time: 0s`;
      endRound();
      return;
    }
    timerEl.textContent = `Time: ${state.lightning.timeLeft}s`;
  }

  function check() {
    const v = Number(input.value);
    if (v === current.ans) {
      state.lightning.score += 1;
      scoreEl.textContent = `Score: ${state.lightning.score}`;
      feedback.textContent = 'Correct! +10 XP (+1s)';
      feedback.style.color = 'var(--success)';
      state.lightning.timeLeft += 1;
      timerEl.textContent = `Time: ${state.lightning.timeLeft}s`;
      playSound('success');
      newQuestion();
    } else {
      state.lives = clamp(state.lives - 1, 0, 3);
      setHearts(state.lives);
      feedback.textContent = 'Wrong! -1 life';
      feedback.style.color = 'var(--danger)';
      playSound('fail');
      if (state.lives === 0) {
        endRound();
        gameOver();
        return;
      }
    }
  }

  checkInline.addEventListener('click', (e) => { e.preventDefault(); check(); });
  input.addEventListener('keyup', (e) => { if (e.key === 'Enter') check(); });
  timerId = setInterval(tick, 1000);
  newQuestion();
}

function gameOver() {
  alert('Game Over! Restarting module.');
  state = JSON.parse(JSON.stringify(defaultState));
  render();
}

/* ---------- Achievements ---------- */
const achievementDefs = [
  { id: 'firstBlood', title: 'First Steps', desc: 'Earn your first XP', test: (s) => s.xp >= 10 },
  { id: 'streak3', title: 'On a Roll', desc: '3-correct streak', test: (s) => s.streak >= 3 },
  { id: 'lvl5', title: 'Level 5', desc: 'Reach Level 5', test: (s) => Math.floor(s.xp / 100) + 1 >= 5 },
  { id: 'light5', title: 'Lightning Quick', desc: 'Score 5 in Lightning', test: (s) => s.lightning.score >= 5 },
];

function unlockAchievementsIfAny() {
  let unlockedNow = 0;
  for (const def of achievementDefs) {
    if (!state.achievements[def.id] && def.test(state)) {
      state.achievements[def.id] = true;
      unlockedNow++;
    }
  }
  if (unlockedNow > 0) {
    renderAchievementsDialogContent();
  }
}

function renderAchievementsDialogContent() {
  dom.achievementsList.innerHTML = '';
  for (const def of achievementDefs) {
    const unlocked = !!state.achievements[def.id];
    const card = h(`
      <div class="achievement ${unlocked ? '' : 'locked'}">
        <div class="title">${unlocked ? '🏆 ' : '🔒 '}${def.title}</div>
        <div class="desc">${def.desc}</div>
      </div>
    `);
    dom.achievementsList.appendChild(card);
  }
}

/* ---------- Navigation ---------- */
function nextSlide() {
  state.slideIndex = clamp(state.slideIndex + 1, 0, slides.length - 1);
  render();
}
function prevSlide() {
  state.slideIndex = clamp(state.slideIndex - 1, 0, slides.length - 1);
  render();
}

/* ---------- Keyboard Controls ---------- */
window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (activeTag === 'input') return; // avoid stealing typing
  if (e.key === 'ArrowRight') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === ' ') { e.preventDefault(); dom.btnCheck?.click(); }
  if (e.key.toLowerCase() === 'h') dom.btnHint?.click();
});

/* ---------- Menu and persistence ---------- */
function setupMenu() {
  dom.btnMenu.addEventListener('click', () => {
    dom.menuDialog.showModal();
  });
  dom.btnAchievements.addEventListener('click', () => {
    renderAchievementsDialogContent();
    dom.achievementsDialog.showModal();
  });
  dom.toggleSound.checked = state.settings.sound;
  dom.toggleAnimations.checked = state.settings.animations;
  dom.toggleSound.addEventListener('change', () => { state.settings.sound = dom.toggleSound.checked; saveToStorage(); });
  dom.toggleAnimations.addEventListener('change', () => { state.settings.animations = dom.toggleAnimations.checked; saveToStorage(); });
  dom.btnRestart.addEventListener('click', () => {
    if (confirm('Restart the module? Progress will reset.')) {
      state = JSON.parse(JSON.stringify(defaultState));
      saveToStorage();
      render();
      dom.menuDialog.close();
    }
  });
  dom.btnExport.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'math-quest-progress.json'; a.click();
    URL.revokeObjectURL(url);
  });
  dom.btnImport.addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        state = Object.assign({}, defaultState, data);
        saveToStorage();
        render();
      } catch {
        alert('Invalid file');
      }
    };
    input.click();
  });
}

/* ---------- Wire up nav buttons ---------- */
function setupNav() {
  dom.btnNext.addEventListener('click', nextSlide);
  dom.btnPrev.addEventListener('click', prevSlide);
  dom.btnCheck.addEventListener('click', () => {
    // Delegated: quiz/lightning attach their own handlers
  });
  dom.btnHint.addEventListener('click', () => {
    // Delegated
  });
}

setupMenu();
setupNav();
render();