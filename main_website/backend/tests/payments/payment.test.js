// Payment verification hardening (ISSUES P1–P3): ownership, replay, role checks,
// and the read-only status/history endpoints. Runs against the in-memory mock DB
// with a fake Razorpay secret; no gateway call is made.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_for_unit_tests';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/payments/payment.controller');
const { PLANS } = require('../../src/modules/payments/plans');
const { createOrderSchema, verifyPaymentSchema } = require('../../src/modules/payments/payment.validator');

const sign = (orderId, paymentId) => crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeRecruiter({ quota = 1 } = {}) {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `pay${seq}@acme.example`, password: 'x', role: 'RECRUITER', plan: 'FREE' } });
  const company = await prisma.company.create({ data: { userId: user.id, name: 'Acme', jobPostingQuota: quota, photos: [] } });
  return { user: { id: user.id, role: 'RECRUITER', email: user.email }, company };
}

async function makeOrder(userId, planType = 'RECRUITER_5_PACK') {
  seq += 1;
  const orderId = `order_test_${seq}`;
  await prisma.paymentTransaction.create({
    data: { userId, orderId, amount: PLANS[planType].amount, currency: 'INR', planType, status: 'CREATED' }
  });
  return orderId;
}

async function verify(user, body) {
  const res = fakeRes();
  await controller.verifyPayment({ user, body }, res);
  return res;
}

const quotaOf = async (userId) => (await prisma.company.findUnique({ where: { userId } })).jobPostingQuota;

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('validators are plain { body } objects so validate() actually runs them', () => {
  assert.ok(createOrderSchema.body && verifyPaymentSchema.body);
  assert.strictEqual(createOrderSchema.body.safeParse({ planType: 'FREE_MONEY' }).success, false);
  assert.strictEqual(verifyPaymentSchema.body.safeParse({ razorpay_order_id: 'o' }).success, false);
});

test('a valid payment adds the pack credits exactly once; replays never add more', async () => {
  const { user } = await makeRecruiter({ quota: 1 });
  const orderId = await makeOrder(user.id);
  const body = { razorpay_order_id: orderId, razorpay_payment_id: 'pay_1', razorpay_signature: sign(orderId, 'pay_1') };

  const first = await verify(user, body);
  assert.strictEqual(first.statusCode, 200);
  assert.strictEqual(first.body.alreadyProcessed, false);
  assert.strictEqual(await quotaOf(user.id), 1 + PLANS.RECRUITER_5_PACK.jobCredits);
  assert.strictEqual(first.body.quotaInfo.jobPostingQuota, 1 + PLANS.RECRUITER_5_PACK.jobCredits);

  for (let i = 0; i < 3; i += 1) {
    const again = await verify(user, body);
    assert.strictEqual(again.statusCode, 200);
    assert.strictEqual(again.body.alreadyProcessed, true);
  }
  assert.strictEqual(await quotaOf(user.id), 1 + PLANS.RECRUITER_5_PACK.jobCredits);
});

test('a paid order cannot be reused with a different payment id', async () => {
  const { user } = await makeRecruiter();
  const orderId = await makeOrder(user.id);
  await verify(user, { razorpay_order_id: orderId, razorpay_payment_id: 'pay_a', razorpay_signature: sign(orderId, 'pay_a') });
  const before = await quotaOf(user.id);
  const reuse = await verify(user, { razorpay_order_id: orderId, razorpay_payment_id: 'pay_b', razorpay_signature: sign(orderId, 'pay_b') });
  assert.strictEqual(reuse.statusCode, 409);
  assert.strictEqual(await quotaOf(user.id), before);
});

test("one user's payment cannot credit another user", async () => {
  const owner = await makeRecruiter();
  const other = await makeRecruiter();
  const orderId = await makeOrder(owner.user.id);
  const res = await verify(other.user, { razorpay_order_id: orderId, razorpay_payment_id: 'pay_x', razorpay_signature: sign(orderId, 'pay_x') });
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(await quotaOf(other.user.id), 1);
  const txn = await prisma.paymentTransaction.findUnique({ where: { orderId } });
  assert.strictEqual(txn.status, 'CREATED');
});

test('a wrong signature is rejected and nothing is credited', async () => {
  const { user } = await makeRecruiter();
  const orderId = await makeOrder(user.id);
  const res = await verify(user, { razorpay_order_id: orderId, razorpay_payment_id: 'pay_1', razorpay_signature: sign(orderId, 'pay_other') });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(await quotaOf(user.id), 1);
});

test('the plan comes from the stored order, not the request body', async () => {
  const { user } = await makeRecruiter();
  const orderId = await makeOrder(user.id);
  const res = await verify(user, {
    razorpay_order_id: orderId,
    razorpay_payment_id: 'pay_1',
    razorpay_signature: sign(orderId, 'pay_1'),
    planType: 'STUDENT_LIFETIME'
  });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(await quotaOf(user.id), 1 + PLANS.RECRUITER_5_PACK.jobCredits);
});

test('createOrder refuses a plan meant for the other role before calling the gateway', async () => {
  const res = fakeRes();
  await controller.createOrder({ user: { id: 'a'.repeat(24), role: 'STUDENT' }, body: { planType: 'RECRUITER_5_PACK' } }, res);
  assert.strictEqual(res.statusCode, 403);
});

test('status returns the server-side offer and quota; history lists only paid rows without gateway secrets', async () => {
  const { user } = await makeRecruiter({ quota: 1 });
  const paidOrder = await makeOrder(user.id);
  await makeOrder(user.id); // abandoned checkout stays CREATED
  await verify(user, { razorpay_order_id: paidOrder, razorpay_payment_id: 'pay_h', razorpay_signature: sign(paidOrder, 'pay_h') });

  const status = fakeRes();
  await controller.getPlanStatus({ user }, status);
  assert.strictEqual(status.statusCode, 200);
  assert.deepStrictEqual(status.body.offer, {
    planType: 'RECRUITER_5_PACK',
    amount: PLANS.RECRUITER_5_PACK.amount,
    currency: 'INR',
    jobCredits: PLANS.RECRUITER_5_PACK.jobCredits,
    label: PLANS.RECRUITER_5_PACK.label
  });
  assert.strictEqual(status.body.quotaInfo.jobPostingQuota, 1 + PLANS.RECRUITER_5_PACK.jobCredits);

  const history = fakeRes();
  await controller.getPaymentHistory({ user }, history);
  assert.strictEqual(history.statusCode, 200);
  assert.strictEqual(history.body.payments.length, 1);
  const [row] = history.body.payments;
  assert.strictEqual(row.status, 'PAID');
  assert.strictEqual(row.amount, PLANS.RECRUITER_5_PACK.amount);
  assert.strictEqual(row.label, PLANS.RECRUITER_5_PACK.label);
  assert.ok(!('signature' in row) && !('paymentId' in row) && !('orderId' in row));
});
