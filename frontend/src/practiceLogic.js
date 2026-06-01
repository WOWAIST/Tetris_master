export const PRACTICE_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space', 'z', 'x', 'a', 'c'];

export function normalizeKeyValue(key) {
  if (key === ' ' || key === 'Spacebar') {
    return 'Space';
  }

  return key.length === 1 ? key.toLowerCase() : key;
}

export function formatKeyLabel(key) {
  const labels = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowDown: '↓',
    Space: 'Space',
    z: 'Z',
    x: 'X',
    a: 'A',
    c: 'C',
  };

  return labels[key] ?? key;
}

export function isPracticeKey(key) {
  return PRACTICE_KEYS.includes(normalizeKeyValue(key));
}

export function createEmptyStats() {
  return {
    attempts: 0,
    correct: 0,
    successes: 0,
    streak: 0,
    perItemAttempts: {},
    perItemCorrect: {},
  };
}

export function recordAttempt(stats, itemId, wasCorrect) {
  const nextStats = {
    ...stats,
    attempts: stats.attempts + 1,
    correct: stats.correct + (wasCorrect ? 1 : 0),
    successes: stats.successes + (wasCorrect ? 1 : 0),
    streak: wasCorrect ? stats.streak + 1 : 0,
    perItemAttempts: {
      ...stats.perItemAttempts,
      [itemId]: (stats.perItemAttempts[itemId] ?? 0) + 1,
    },
    perItemCorrect: { ...stats.perItemCorrect },
  };

  if (wasCorrect) {
    nextStats.perItemCorrect[itemId] = (stats.perItemCorrect[itemId] ?? 0) + 1;
  }

  return nextStats;
}

export function pickNextIndex({ items, currentIndex, mode, stats, recentIds = [] }) {
  if (items.length === 0) {
    return 0;
  }

  if (mode === 'sequential') {
    return (currentIndex + 1) % items.length;
  }

  const lastTwo = recentIds.slice(-2);
  const candidates = items
    .map((item, index) => ({
      id: item.id,
      index,
      attempts: stats.perItemAttempts[item.id] ?? 0,
    }))
    .filter((candidate) => !(lastTwo.length === 2 && lastTwo.every((id) => id === candidate.id)));

  const pool = candidates.length > 0 ? candidates : items.map((item, index) => ({
    id: item.id,
    index,
    attempts: stats.perItemAttempts[item.id] ?? 0,
  }));
  const fewestAttempts = Math.min(...pool.map((candidate) => candidate.attempts));
  const balancedPool = pool.filter((candidate) => candidate.attempts === fewestAttempts);
  const randomIndex = Math.floor(Math.random() * balancedPool.length);

  return balancedPool[randomIndex].index;
}

export function gradeBeginnerInput(item, pressedKey) {
  return item.expectedKeys.includes(normalizeKeyValue(pressedKey));
}

export function gradeSequenceStep(item, stepIndex, pressedKey) {
  const normalized = normalizeKeyValue(pressedKey);
  const expected = item.expectedKeys[stepIndex];

  return {
    normalized,
    expected,
    correct: normalized === expected,
    complete: normalized === expected && stepIndex === item.expectedKeys.length - 1,
  };
}
