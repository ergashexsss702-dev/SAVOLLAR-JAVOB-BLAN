import assert from 'assert';
import { normalizePhone, validateAccessCode, generateSessionToken, verifySessionToken } from '../src/server/services/authService.ts';
import { generateDeterministicQuestions } from '../src/server/services/mathEngine.ts';
import { getTopicsFor } from '../src/shared/topics.ts';
import { db } from '../src/server/db/store.ts';

async function runTestSuite() {
  console.log('--- TEST 1: Phone Normalization ---');
  const validPhone1 = normalizePhone('901234567');
  assert.strictEqual(validPhone1.isValid, true);
  assert.strictEqual(validPhone1.normalized, '+998901234567');

  const validPhone2 = normalizePhone('+998 90 123 45 67');
  assert.strictEqual(validPhone2.isValid, true);
  assert.strictEqual(validPhone2.normalized, '+998901234567');

  const invalidPhone = normalizePhone('12345');
  assert.strictEqual(invalidPhone.isValid, false);
  console.log('✓ Phone normalization passed');

  console.log('--- TEST 2: Access Code Validation ---');
  const demoResult = validateAccessCode('07080717');
  assert.strictEqual(demoResult.success, true);
  assert.strictEqual(demoResult.role, 'student');

  const adminResult = validateAccessCode('admin_savollar_2026');
  assert.strictEqual(adminResult.success, true);
  assert.strictEqual(adminResult.role, 'admin');

  const invalidCode = validateAccessCode('wrong_code_999');
  assert.strictEqual(invalidCode.success, false);
  console.log('✓ Access code verification passed');

  console.log('--- TEST 3: Cryptographic Token Signing & Verification ---');
  const session = {
    userId: 'u1',
    fullName: 'Test Student',
    phone: '+998901234567',
    role: 'student' as const,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
  };
  const token = generateSessionToken(session);
  assert.ok(token.includes('.'));
  const verified = verifySessionToken(token);
  assert.strictEqual(verified?.fullName, 'Test Student');

  const tamperedToken = token.slice(0, -3) + 'xyz';
  assert.strictEqual(verifySessionToken(tamperedToken), null);
  console.log('✓ Token signing and tampering prevention passed');

  console.log('--- TEST 4: Topic Filtering by Grade ---');
  const grade1Topics = getTopicsFor(1, 'matematika');
  assert.ok(grade1Topics.some((t) => t.id === 'mat_add_sub'));
  assert.ok(!grade1Topics.some((t) => t.id === 'mat_percentages')); // percentages for 5+

  const grade8Algebra = getTopicsFor(8, 'algebra');
  assert.ok(grade8Algebra.some((t) => t.id === 'alg_quadratic_equations'));
  console.log('✓ Grade-appropriate topic filtering passed');

  console.log('--- TEST 5: Deterministic Mathematical Question Correctness ---');
  const addQuestions = generateDeterministicQuestions(2, 'matematika', 'mat_add_sub', 5);
  assert.strictEqual(addQuestions.length, 5);
  for (const q of addQuestions) {
    assert.strictEqual(q.options.length, 4);
    assert.ok(q.options.includes(q.correctAnswer), `Options must include correctAnswer ${q.correctAnswer}`);
    assert.ok(q.stepByStepSolution.length >= 2, 'Solution must have step-by-step points');
    assert.ok(q.simpleExplanation.length > 5, 'Must have clear simple explanation');
  }

  const quadQuestions = generateDeterministicQuestions(8, 'algebra', 'alg_quadratic_equations', 5);
  assert.strictEqual(quadQuestions.length, 5);
  for (const q of quadQuestions) {
    assert.ok(q.options.includes(q.correctAnswer));
  }
  console.log('✓ Deterministic mathematical question generation passed');

  console.log('--- TEST 6: Database Store Operations ---');
  const initialCodes = db.getAccessCodes();
  assert.ok(initialCodes.length > 0);
  const newCode = db.addAccessCode({
    code: 'TEST9988',
    description: 'Automated test code',
    maxUses: 10,
    isActive: true,
  });
  assert.strictEqual(newCode.code, 'TEST9988');
  assert.ok(db.findAccessCode('TEST9988'));
  console.log('✓ Database operations passed');

  console.log('\n=======================================');
  console.log('ALL AUTOMATED TEST CHECKS PASSED (6/6)!');
  console.log('=======================================');
}

runTestSuite().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
