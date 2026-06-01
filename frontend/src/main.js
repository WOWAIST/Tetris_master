import './styles.css';

const shortcuts = [
  { key: 'ArrowLeft', label: '←', action: '왼쪽 이동', english: 'Move Left' },
  { key: 'ArrowRight', label: '→', action: '오른쪽 이동', english: 'Move Right' },
  { key: 'ArrowDown', label: '↓', action: '소프트 드랍', english: 'Soft Drop' },
  { key: ' ', label: 'Space', action: '하드 드랍', english: 'Hard Drop' },
  { key: 'z', label: 'Z', action: '반시계 회전', english: 'CCW' },
  { key: 'x', label: 'X', action: '시계 회전', english: 'CW' },
  { key: 'a', label: 'A', action: '180도 회전', english: '180 Rotate' },
  { key: 'c', label: 'C', action: '홀드', english: 'Hold' },
];

let currentIndex = 0;
let streak = 0;
let attempts = 0;
let correct = 0;

const app = document.querySelector('#app');

function normalizeKey(event) {
  if (event.key === ' ') {
    return ' ';
  }
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

function render() {
  const current = shortcuts[currentIndex];
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  app.innerHTML = `
    <main class="shell">
      <section class="practice">
        <div class="topbar">
          <div>
            <p class="eyebrow">Tetris Master</p>
            <h1>단축키 연습</h1>
          </div>
          <div class="mode" aria-label="course mode">
            <button class="active" type="button">초급</button>
            <button type="button" disabled>중급</button>
          </div>
        </div>

        <div class="trainer" tabindex="0" aria-live="polite">
          <p class="prompt">다음 동작의 키를 입력하세요</p>
          <strong>${current.action}</strong>
          <span>${current.english}</span>
          <kbd>${current.label}</kbd>
        </div>

        <div class="stats" aria-label="practice stats">
          <div><span>${streak}</span><p>연속 성공</p></div>
          <div><span>${accuracy}%</span><p>정확도</p></div>
          <div><span>${attempts}</span><p>시도</p></div>
        </div>
      </section>

      <aside class="map" aria-label="shortcut list">
        ${shortcuts.map((shortcut, index) => `
          <article class="${index === currentIndex ? 'selected' : ''}">
            <kbd>${shortcut.label}</kbd>
            <div>
              <strong>${shortcut.action}</strong>
              <span>${shortcut.english}</span>
            </div>
          </article>
        `).join('')}
      </aside>
    </main>
  `;

  document.querySelector('.trainer').focus();
}

function nextShortcut() {
  currentIndex = (currentIndex + 1) % shortcuts.length;
}

window.addEventListener('keydown', (event) => {
  const current = shortcuts[currentIndex];

  if (shortcuts.some((shortcut) => shortcut.key === normalizeKey(event))) {
    event.preventDefault();
  }

  attempts += 1;
  if (normalizeKey(event) === current.key) {
    correct += 1;
    streak += 1;
    nextShortcut();
  } else {
    streak = 0;
  }

  render();
});

render();
