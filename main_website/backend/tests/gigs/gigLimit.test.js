// Gig posts follow job credits: one on the free plan, and each credit pack adds 5.
// Runs on the in-memory test DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma } = require('../../src/infrastructure/database');
const gigs = require('../../src/modules/gigs/gig.controller');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeRecruiter(jobPostingQuota) {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `giglimit${seq}@acme.example`, password: 'x', role: 'RECRUITER' } });
  await prisma.company.create({ data: { userId: user.id, name: 'Acme', photos: [], jobPostingQuota } });
  return { id: user.id, role: 'RECRUITER', email: user.email };
}

async function postGig(user) {
  const res = fakeRes();
  await gigs.createGig({ user, body: { title: 'Landing page', description: 'Build it', skills: ['React'], budget: 5000, deliveryTime: '7 days' } }, res);
  return res;
}

test('a free recruiter can post one gig, and the second asks for the credit pack', async () => {
  const user = await makeRecruiter(1);
  assert.strictEqual((await postGig(user)).statusCode, 201);
  const second = await postGig(user);
  assert.strictEqual(second.statusCode, 403);
  assert.strictEqual(second.body.code, 'UPGRADE_REQUIRED');
  assert.match(second.body.error, /free plan includes one gig.*5 more gigs and 5 more jobs/);
});

test('after buying a pack (1 free + 5) the recruiter can post 6 gigs in all', async () => {
  const user = await makeRecruiter(6);
  for (let i = 0; i < 6; i += 1) assert.strictEqual((await postGig(user)).statusCode, 201);
  const seventh = await postGig(user);
  assert.strictEqual(seventh.statusCode, 403);
  assert.match(seventh.body.error, /all 6 of your gig posts/);
});
