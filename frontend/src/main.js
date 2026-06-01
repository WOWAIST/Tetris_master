import './styles.css';
import {
  createEmptyStats,
  formatKeyLabel,
  gradeBeginnerInput,
  gradeSequenceStep,
  isPracticeKey,
  normalizeKeyValue,
  pickNextIndex,
  recordAttempt,
} from './practiceLogic.js';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 18;
const MOTION_DURATION_MS = 760;

const PIECES = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

const beginnerItems = [
  item('left', '왼쪽 이동', '현재 블록을 왼쪽으로 1칸 이동합니다.', ['ArrowLeft'], '이동', '왼쪽 정렬', [
    variant('left-1', 'T', 4, 3, 3, 3, 'move-left', ['빈 칸 위로 왼쪽 이동'], terrain([[3, 13], [4, 13], [5, 13], [6, 13]])),
    variant('left-2', 'L', 7, 2, 6, 2, 'move-left', ['벽 근처 왼쪽 정렬'], terrain([[0, 14], [1, 14], [2, 14], [6, 14], [7, 14]])),
    variant('left-3', 'J', 5, 4, 4, 4, 'move-left', ['홈 위로 이동'], terrain([[4, 15], [6, 15], [7, 15], [8, 15]])),
  ]),
  item('right', '오른쪽 이동', '현재 블록을 오른쪽으로 1칸 이동합니다.', ['ArrowRight'], '이동', '오른쪽 우물', [
    variant('right-1', 'S', 4, 4, 5, 4, 'move-right', ['오른쪽 우물로 이동'], terrain([[0, 15], [1, 15], [2, 15], [3, 15], [8, 15]])),
    variant('right-2', 'T', 5, 2, 6, 2, 'move-right', ['다음 착지 위치 정렬'], terrain([[5, 14], [6, 14], [7, 14], [8, 14]])),
    variant('right-3', 'Z', 2, 5, 3, 5, 'move-right', ['오른쪽 벽 근처 정렬'], terrain([[1, 16], [2, 16], [3, 16], [7, 16], [8, 16]])),
  ]),
  item('soft-drop', '소프트 드랍', '블록을 빠르게 아래로 내립니다.', ['ArrowDown'], '드랍', '높이 조절', [
    variant('down-1', 'O', 4, 2, 4, 5, 'soft-drop', ['착지 전 높이 낮추기'], terrain([[4, 12], [5, 12], [6, 12]])),
    variant('down-2', 'J', 6, 1, 6, 4, 'soft-drop', ['지형 위에서 천천히 내려가기'], terrain([[5, 13], [6, 13], [7, 13], [8, 13]])),
    variant('down-3', 'T', 2, 3, 2, 6, 'soft-drop', ['회전 전 타이밍 조절'], terrain([[1, 15], [2, 15], [4, 15], [5, 15]])),
  ]),
  item('hard-drop', '하드 드랍', '고스트 위치로 즉시 착지합니다.', ['Space'], '드랍', '즉시 착지', [
    variant('space-1', 'I', 3, 1, 3, 11, 'hard-drop', ['고스트 위치로 즉시 착지'], terrain([[3, 16], [4, 16], [5, 16], [6, 16]])),
    variant('space-2', 'L', 6, 2, 6, 12, 'hard-drop', ['빈 칸 위에 즉시 고정'], terrain([[4, 16], [5, 16], [8, 16], [9, 16]])),
    variant('space-3', 'T', 1, 1, 1, 13, 'hard-drop', ['우물 옆 착지'], terrain([[0, 16], [4, 16], [5, 16], [6, 16]])),
  ]),
  item('rotate-ccw', '반시계 회전', '블록을 반시계 방향으로 90도 회전합니다.', ['z'], '회전', '왼쪽 홈 삽입', [
    variant('z-1', 'L', 4, 4, 4, 4, 'rotate-ccw', ['왼쪽 방향 홈에 회전 삽입'], terrain([[3, 14], [5, 14], [6, 14], [7, 14]])),
    variant('z-2', 'T', 5, 3, 5, 3, 'rotate-ccw', ['T 블록을 슬롯에 맞춤'], terrain([[4, 15], [6, 15], [7, 15], [8, 15]])),
    variant('z-3', 'J', 2, 5, 2, 5, 'rotate-ccw', ['벽 근처 반시계 회전'], terrain([[0, 15], [3, 15], [4, 15], [5, 15]])),
  ]),
  item('rotate-cw', '시계 회전', '블록을 시계 방향으로 90도 회전합니다.', ['x'], '회전', '오른쪽 홈 삽입', [
    variant('x-1', 'T', 4, 4, 4, 4, 'rotate-cw', ['오른쪽 방향 홈에 회전 삽입'], terrain([[3, 14], [4, 14], [6, 14], [7, 14]])),
    variant('x-2', 'S', 5, 3, 5, 3, 'rotate-cw', ['평평한 지형 위 방향 전환'], terrain([[4, 15], [5, 15], [6, 15], [7, 15]])),
    variant('x-3', 'Z', 2, 4, 2, 4, 'rotate-cw', ['홈 모양에 맞춰 회전'], terrain([[1, 15], [3, 15], [4, 15], [5, 15]])),
  ]),
  item('rotate-180', '180도 회전', '블록을 180도 돌려 반대 홈에 맞춥니다.', ['a'], '회전', '반대 구조 대응', [
    variant('a-1', 'S', 4, 3, 4, 3, 'rotate-180', ['S 블록 방향 뒤집기'], terrain([[3, 15], [5, 15], [6, 15], [7, 15]])),
    variant('a-2', 'Z', 5, 5, 5, 5, 'rotate-180', ['막힌 구조에서 빠른 방향 전환'], terrain([[4, 16], [6, 16], [7, 16], [8, 16]])),
    variant('a-3', 'L', 2, 4, 2, 4, 'rotate-180', ['반대 홈에 맞춤'], terrain([[1, 15], [2, 15], [4, 15], [5, 15]])),
  ]),
  item('hold', '홀드', '현재 블록을 보관하거나 홀드 블록과 교체합니다.', ['c'], '홀드', '블록 교체', [
    variant('c-1', 'T', 4, 2, 4, 2, 'hold', ['현재 블록 저장', 'Hold: I'], terrain([[3, 15], [4, 15], [5, 15]])),
    variant('c-2', 'O', 5, 3, 5, 3, 'hold', ['홀드 블록과 교체', 'Hold: T'], terrain([[4, 15], [5, 15], [6, 15]])),
    variant('c-3', 'I', 3, 1, 3, 1, 'hold', ['I 블록을 나중에 쓰기 위해 보관'], terrain([[0, 16], [1, 16], [2, 16], [7, 16], [8, 16]])),
  ]),
];

const intermediateItems = [
  item('t-spin-single', 'T-Spin Single', 'T 블록을 슬롯에 회전 삽입해 1줄 제거합니다.', ['ArrowLeft', 'z', 'Space'], 'T-Spin', '난이도 1', [
    variant('tss-1', 'T', 5, 4, 4, 8, 'sequence', ['←', 'Z', 'Space', '1 Line Clear'], terrain([[3, 13], [5, 13], [6, 13], [3, 14], [4, 14], [5, 14], [6, 14]])),
    variant('tss-2', 'T', 6, 3, 5, 8, 'sequence', ['왼쪽 이동 후 반시계 회전'], terrain([[4, 13], [6, 13], [7, 13], [4, 14], [5, 14], [6, 14], [7, 14]])),
  ], 2, ['t-spin', 'single']),
  item('t-spin-double', 'T-Spin Double', 'T 슬롯에 회전 삽입해 2줄 제거합니다.', ['ArrowRight', 'x', 'Space'], 'T-Spin', '난이도 2', [
    variant('tsd-1', 'T', 3, 3, 4, 9, 'sequence', ['→', 'X', 'Space', '2 Lines Clear'], terrain([[3, 12], [5, 12], [2, 13], [3, 13], [5, 13], [6, 13], [2, 14], [3, 14], [5, 14], [6, 14]])),
    variant('tsd-2', 'T', 4, 4, 5, 9, 'sequence', ['오른쪽 이동 후 시계 회전'], terrain([[4, 12], [6, 12], [3, 13], [4, 13], [6, 13], [7, 13], [3, 14], [4, 14], [6, 14], [7, 14]])),
  ], 2, ['t-spin', 'double']),
  item('mini-t-spin', 'Mini T-Spin', '작은 슬롯에서 T 회전 판정을 익힙니다.', ['ArrowLeft', 'z', 'ArrowDown'], 'T-Spin', '난이도 1', [
    variant('mini-1', 'T', 5, 4, 4, 7, 'sequence', ['←', 'Z', '↓'], terrain([[3, 12], [5, 12], [3, 13], [4, 13], [5, 13]])),
    variant('mini-2', 'T', 6, 3, 5, 7, 'sequence', ['왼쪽으로 좁은 홈 진입'], terrain([[4, 12], [6, 12], [4, 13], [5, 13], [6, 13]])),
  ], 1, ['t-spin', 'mini']),
];

intermediateItems.forEach((practiceItem) => {
  practiceItem.course = 'intermediate';
});

const state = {
  course: 'beginner',
  mode: 'random',
  currentIndex: 0,
  variantIndex: 0,
  stats: createEmptyStats(),
  feedback: { type: 'idle', message: '연습 키를 눌러 시작하세요.', detail: '정답이면 모션이 결과 위치까지 재생됩니다.' },
  recentIds: [],
  sequenceStep: 0,
  lastPressed: '',
  animationTick: 0,
  motionPhase: 'idle',
  previewMotion: null,
  inputLocked: false,
};

const app = document.querySelector('#app');
let motionTimerId = null;

function item(id, title, description, expectedKeys, tag, subtitle, motionVariants, difficulty = 1, tags = []) {
  return { id, course: 'beginner', title, description, expectedKeys, tag, subtitle, motionVariants, difficulty, tags };
}

function terrain(cells) {
  return cells.map(([x, y]) => ({ x, y }));
}

function variant(id, piece, beforeX, beforeY, afterX, afterY, animationType, highlights, blocks, rotationAfter = getDefaultRotation(animationType)) {
  return {
    id,
    piece,
    boardBefore: blocks,
    pieceBefore: { x: beforeX, y: beforeY },
    pieceAfter: { x: afterX, y: afterY },
    rotationAfter,
    highlights,
    animationType,
  };
}

function getItems() {
  return state.course === 'beginner' ? beginnerItems : intermediateItems;
}

function getCurrentItem() {
  return getItems()[state.currentIndex];
}

function getCurrentVariant() {
  const item = getCurrentItem();
  return item.motionVariants[state.variantIndex % item.motionVariants.length];
}

function getDisplayMotion() {
  return state.previewMotion ?? getCurrentVariant();
}

function getDefaultRotation(animationType) {
  if (animationType === 'rotate-cw') {
    return 1;
  }
  if (animationType === 'rotate-ccw') {
    return 3;
  }
  if (animationType === 'rotate-180') {
    return 2;
  }
  return 0;
}

function getInputMotion(key) {
  const matchingItem = beginnerItems.find((practiceItem) => practiceItem.expectedKeys.includes(normalizeKeyValue(key)));
  if (!matchingItem) {
    return null;
  }

  const nextVariantIndex = Math.floor(Math.random() * matchingItem.motionVariants.length);
  return matchingItem.motionVariants[nextVariantIndex];
}

function clearMotionTimer() {
  if (motionTimerId !== null) {
    clearTimeout(motionTimerId);
    motionTimerId = null;
  }
}

function startMotion(previewMotion = null) {
  clearMotionTimer();
  state.motionPhase = 'result';
  state.previewMotion = previewMotion;
  state.inputLocked = true;
  state.animationTick += 1;
}

function resetMotionState() {
  state.motionPhase = 'idle';
  state.previewMotion = null;
  state.inputLocked = false;
}

function scheduleRetry() {
  motionTimerId = window.setTimeout(() => {
    resetMotionState();
    render();
  }, MOTION_DURATION_MS);
}

function scheduleAdvance() {
  motionTimerId = window.setTimeout(() => {
    advanceItem();
    resetMotionState();
    state.feedback = state.course === 'beginner'
      ? { type: 'idle', message: '다음 키를 눌러보세요.', detail: '블록이 시작 위치에서 대기 중입니다.' }
      : { type: 'idle', message: '다음 기술을 입력하세요.', detail: '표시된 키 시퀀스를 순서대로 입력하세요.' };
    render();
  }, MOTION_DURATION_MS);
}

function advanceItem() {
  const items = getItems();
  const currentItem = getCurrentItem();
  state.recentIds = [...state.recentIds.slice(-3), currentItem.id];
  state.currentIndex = pickNextIndex({
    items,
    currentIndex: state.currentIndex,
    mode: state.mode,
    stats: state.stats,
    recentIds: state.recentIds,
  });
  const nextItem = items[state.currentIndex];
  const attempts = state.stats.perItemAttempts[nextItem.id] ?? 0;
  state.variantIndex = state.mode === 'random'
    ? Math.floor(Math.random() * nextItem.motionVariants.length)
    : attempts % nextItem.motionVariants.length;
  state.sequenceStep = 0;
}

function handleKeydown(event) {
  const normalized = normalizeKeyValue(event.key);
  if (!isPracticeKey(normalized)) {
    return;
  }

  event.preventDefault();
  handlePracticeInput(normalized);
}

function handlePracticeInput(normalized) {
  if (state.inputLocked) {
    return;
  }

  state.lastPressed = normalized;

  const item = getCurrentItem();
  if (state.course === 'beginner') {
    const wasCorrect = gradeBeginnerInput(item, normalized);
    state.stats = recordAttempt(state.stats, item.id, wasCorrect);
    startMotion(wasCorrect ? null : getInputMotion(normalized));

    if (wasCorrect) {
      state.feedback = {
        type: 'success',
        message: `${item.title} 성공`,
        detail: `${formatKeyLabel(normalized)} 입력으로 목표 위치에 도달했습니다.`,
      };
      render();
      scheduleAdvance();
    } else {
      state.feedback = {
        type: 'error',
        message: '다시 시도하세요',
        detail: `입력: ${formatKeyLabel(normalized)} / 정답: ${item.expectedKeys.map(formatKeyLabel).join(' 또는 ')}`,
      };
      render();
      scheduleRetry();
    }
  } else {
    const result = gradeSequenceStep(item, state.sequenceStep, normalized);

    if (!result.correct) {
      state.stats = recordAttempt(state.stats, item.id, false);
      startMotion(getInputMotion(normalized));
      state.feedback = {
        type: 'error',
        message: `${state.sequenceStep + 1}단계에서 멈췄습니다`,
        detail: `입력: ${formatKeyLabel(result.normalized)} / 기대 입력: ${formatKeyLabel(result.expected)}`,
      };
      state.sequenceStep = 0;
      render();
      scheduleRetry();
    } else if (result.complete) {
      state.stats = recordAttempt(state.stats, item.id, true);
      startMotion();
      state.feedback = {
        type: 'success',
        message: `${item.title} 완성`,
        detail: `${item.expectedKeys.map(formatKeyLabel).join(' → ')} 시퀀스를 성공했습니다.`,
      };
      render();
      scheduleAdvance();
    } else {
      state.sequenceStep += 1;
      startMotion();
      state.feedback = {
        type: 'progress',
        message: `${state.sequenceStep}단계 성공`,
        detail: `다음 입력: ${formatKeyLabel(item.expectedKeys[state.sequenceStep])}`,
      };
      render();
      scheduleRetry();
    }
  }
}

function switchCourse(course) {
  clearMotionTimer();
  resetMotionState();
  state.course = course;
  state.currentIndex = 0;
  state.variantIndex = 0;
  state.sequenceStep = 0;
  state.recentIds = [];
  state.feedback = course === 'beginner'
    ? { type: 'idle', message: '초급 키 연습', detail: '정답 키를 누르면 다음 문항으로 이동합니다.' }
    : { type: 'idle', message: '중급 기술 연습', detail: '표시된 키 시퀀스를 순서대로 입력하세요.' };
  render();
}

function render() {
  const item = getCurrentItem();
  const variantData = getDisplayMotion();
  const accuracy = state.stats.attempts === 0 ? 0 : Math.round((state.stats.correct / state.stats.attempts) * 100);
  const expected = item.expectedKeys.map(formatKeyLabel).join(' → ');

  app.innerHTML = `
    <main class="shell">
      <section class="practice-card">
        <header class="topbar">
          <div>
            <p class="eyebrow">Tetris Master</p>
            <h1>키 입력을 블록 모션으로 익히는 연습실</h1>
          </div>
          <div class="course-tabs" aria-label="코스 선택">
            <button class="${state.course === 'beginner' ? 'active' : ''}" type="button" data-course="beginner">초급</button>
            <button class="${state.course === 'intermediate' ? 'active' : ''}" type="button" data-course="intermediate">중급</button>
          </div>
        </header>

        <div class="controls">
          <div>
            <span class="label">출제 모드</span>
            <div class="mode-toggle" aria-label="출제 모드">
              <button class="${state.mode === 'random' ? 'active' : ''}" type="button" data-mode="random">랜덤</button>
              <button class="${state.mode === 'sequential' ? 'active' : ''}" type="button" data-mode="sequential">순차</button>
            </div>
          </div>
          <p>${state.mode === 'random' ? '반복을 줄이고 부족한 항목을 우선 출제합니다.' : '목록 순서대로 차근차근 진행합니다.'}</p>
        </div>

        <section class="trainer" tabindex="0" aria-live="polite">
          <div class="question">
            <span>${item.tag}</span>
            <h2>${item.title}</h2>
            <p>${item.description}</p>
            <div class="key-sequence">${item.expectedKeys.map((key, index) => `<button class="key-button ${state.course === 'intermediate' && index === state.sequenceStep ? 'next-key' : ''}" type="button" data-practice-key="${key}">${formatKeyLabel(key)}</button>`).join('<i>→</i>')}</div>
          </div>

          ${renderBoard(variantData)}

          <div class="feedback ${state.feedback.type}">
            <strong>${state.feedback.message}</strong>
            <span>${state.feedback.detail}</span>
          </div>
        </section>

        <section class="stats" aria-label="연습 통계">
          ${stat('연속 성공', state.stats.streak)}
          ${stat('정확도', `${accuracy}%`)}
          ${stat('시도', state.stats.attempts)}
          ${stat('성공', state.stats.successes)}
        </section>
      </section>

      <aside class="side-panel" aria-label="연습 목록">
        <div class="panel-heading">
          <span>${state.course === 'beginner' ? '기본 키 8종' : '중급 기술'}</span>
          <strong>${expected}</strong>
        </div>
        <div class="item-list">
          ${getItems().map((practiceItem, index) => renderListItem(practiceItem, index)).join('')}
        </div>
      </aside>
    </main>
  `;

  document.querySelectorAll('[data-course]').forEach((button) => {
    button.addEventListener('click', () => switchCourse(button.dataset.course));
  });
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      clearMotionTimer();
      resetMotionState();
      state.mode = button.dataset.mode;
      render();
    });
  });
  document.querySelectorAll('[data-practice-key]').forEach((button) => {
    button.addEventListener('click', () => handlePracticeInput(button.dataset.practiceKey));
  });
  document.querySelector('.trainer').focus();
}

function renderBoard(motion) {
  const cells = new Map();
  motion.boardBefore.forEach(({ x, y }) => cells.set(`${x}:${y}`, 'stack'));
  addPieceCells(cells, motion, 'ghost', motion.pieceAfter, motion.rotationAfter);
  const shouldShowResult = state.motionPhase === 'result';
  const activeState = shouldShowResult ? motion.pieceAfter : motion.pieceBefore;
  const activeRotation = shouldShowResult ? motion.rotationAfter : 0;
  addPieceCells(cells, motion, `piece ${motion.piece} ${motion.animationType}`, activeState, activeRotation);

  const boardCells = [];
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      boardCells.push(`<span class="cell ${cells.get(`${x}:${y}`) ?? ''}"></span>`);
    }
  }
  const deltaX = motion.pieceBefore.x - motion.pieceAfter.x;
  const deltaY = motion.pieceBefore.y - motion.pieceAfter.y;
  const boardClass = shouldShowResult ? `board is-moving motion-${motion.animationType}` : 'board';
  const boardStyle = `--from-x: ${deltaX * 100}%; --from-y: ${deltaY * 100}%;`;

  return `
    <div class="motion-zone">
      <div class="${boardClass}" style="${boardStyle}" data-animation="${state.animationTick}">${boardCells.join('')}</div>
      <div class="motion-notes">
        <strong>${motion.piece} Piece · ${motion.animationType}</strong>
        ${motion.highlights.map((highlight) => `<span>${highlight}</span>`).join('')}
      </div>
    </div>
  `;
}

function addPieceCells(cells, motion, className, position, rotation = 0) {
  getPieceCells(motion.piece, rotation).forEach(([dx, dy]) => {
    const x = position.x + dx;
    const y = position.y + dy;
    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      cells.set(`${x}:${y}`, className);
    }
  });
}

function getPieceCells(piece, rotation) {
  const normalizedRotation = ((rotation % 4) + 4) % 4;
  let cells = PIECES[piece];

  for (let index = 0; index < normalizedRotation; index += 1) {
    cells = cells.map(([x, y]) => [3 - y, x]);
  }

  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY]);
}

function renderListItem(practiceItem, index) {
  const attempts = state.stats.perItemAttempts[practiceItem.id] ?? 0;
  const correct = state.stats.perItemCorrect[practiceItem.id] ?? 0;
  return `
    <article class="${index === state.currentIndex ? 'selected' : ''}">
      <kbd>${practiceItem.expectedKeys.map(formatKeyLabel).join(' ')}</kbd>
      <div>
        <strong>${practiceItem.title}</strong>
        <span>${practiceItem.subtitle} · ${correct}/${attempts}</span>
      </div>
    </article>
  `;
}

function stat(label, value) {
  return `<div><span>${value}</span><p>${label}</p></div>`;
}

window.addEventListener('keydown', handleKeydown);
render();
