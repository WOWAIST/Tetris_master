import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyStats,
  gradeBeginnerInput,
  gradeSequenceStep,
  isPracticeKey,
  normalizeKeyValue,
  pickNextIndex,
  recordAttempt,
} from './practiceLogic.js';

test('normalizes keyboard input for practice keys', () => {
  assert.equal(normalizeKeyValue(' '), 'Space');
  assert.equal(normalizeKeyValue('Z'), 'z');
  assert.equal(normalizeKeyValue('ArrowLeft'), 'ArrowLeft');
  assert.equal(isPracticeKey('Escape'), false);
  assert.equal(isPracticeKey('Spacebar'), true);
});

test('records attempts and streak stats without mutating original stats', () => {
  const empty = createEmptyStats();
  const first = recordAttempt(empty, 'left', true);
  const second = recordAttempt(first, 'left', false);

  assert.equal(empty.attempts, 0);
  assert.equal(first.attempts, 1);
  assert.equal(first.correct, 1);
  assert.equal(first.streak, 1);
  assert.equal(second.attempts, 2);
  assert.equal(second.correct, 1);
  assert.equal(second.streak, 0);
  assert.deepEqual(second.perItemAttempts, { left: 2 });
});

test('grades beginner and intermediate inputs', () => {
  const beginner = { expectedKeys: ['z'] };
  const sequence = { expectedKeys: ['ArrowLeft', 'z', 'Space'] };

  assert.equal(gradeBeginnerInput(beginner, 'Z'), true);
  assert.equal(gradeSequenceStep(sequence, 0, 'ArrowLeft').correct, true);
  assert.equal(gradeSequenceStep(sequence, 1, 'x').correct, false);
  assert.equal(gradeSequenceStep(sequence, 2, ' ').complete, true);
});

test('random picker avoids creating three identical ids in a row', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  const stats = createEmptyStats();

  for (let index = 0; index < 20; index += 1) {
    assert.equal(pickNextIndex({ items, currentIndex: 0, mode: 'random', stats, recentIds: ['a', 'a'] }), 1);
  }
});
