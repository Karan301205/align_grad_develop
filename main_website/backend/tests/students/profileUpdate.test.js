// PUT /student/profile: the validator only takes web links and sane sizes, and a
// save that leaves out `username` keeps the saved one. Runs on the in-memory mock DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/students/student.controller');
const { updateProfileSchema, saveIntroVideoSchema } = require('../../src/modules/students/student.validator');

const parse = (body) => updateProfileSchema.body.safeParse(body);

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('accepts a normal profile save', () => {
  const result = parse({
    name: 'Sneha Reddy',
    username: 'sneha_r',
    bio: 'B.Tech CSE graduate who likes turning messy data into clear reports.',
    email: 'sneha@example.com',
    phone: '+91 9876543210',
    dob: '2003-05-14',
    gender: 'Female',
    socialLinks: { linkedin: 'https://www.linkedin.com/in/sneha', github: '', portfolio: null },
    projects: [{ title: 'Dashboard', role: 'Built it', codeUrl: 'https://github.com/sneha/dash', skills: ['Excel'], videoUrl: '' }],
    certificates: [{ title: 'Python', org: 'NPTEL', attachment: 'data:application/pdf;base64,JVBERi0=' }],
    preferredWorkModes: ['Hybrid'],
    preferredWorkTypes: ['Full-Time', 'Internship'],
    preferredLocations: ['Hyderabad, Telangana']
  });
  assert.strictEqual(result.success, true, JSON.stringify(result.error?.issues));
});

test('refuses links that are not http(s)', () => {
  for (const body of [
    { socialLinks: { linkedin: 'javascript:alert(1)' } },
    { projects: [{ title: 'x', codeUrl: 'data:text/html,hi' }] },
    { cocurricular: [{ activity: 'Club', link: 'ftp://example.com/file' }] },
    { profilePic: 'javascript:alert(1)' },
    { certificates: [{ title: 'x', link: 'mailto:someone@example.com' }] }
  ]) {
    assert.strictEqual(parse(body).success, false, JSON.stringify(body));
  }
  assert.strictEqual(saveIntroVideoSchema.body.safeParse({ introVideoUrl: 'javascript:alert(1)' }).success, false);
  assert.strictEqual(saveIntroVideoSchema.body.safeParse({ introVideoUrl: null }).success, true);
});

test('refuses a resume link outside Google Drive', () => {
  assert.strictEqual(parse({ resumeUrl: 'https://example.com/cv.pdf' }).success, false);
  assert.strictEqual(parse({ resumeUrl: 'https://drive.google.com/file/d/abc/view' }).success, true);
});

test('refuses oversized lists and text', () => {
  assert.strictEqual(parse({ skills: Array.from({ length: 101 }, (_, i) => ({ name: `Skill ${i}`, rating: 1 })) }).success, false);
  assert.strictEqual(parse({ projects: [{ title: 'x'.repeat(201) }] }).success, false);
  assert.strictEqual(parse({ certificates: [{ title: 'x', attachment: 'not a file' }] }).success, false);
  assert.strictEqual(parse({ experience: [{ location: 'Sector 62' }] }).success, false);
});

test('a save without a username keeps the saved username', async () => {
  const userId = 'cafe00000000000000000001';
  await prisma.profile.create({ data: { userId, name: 'Test Candidate', username: 'keep_me' } });

  const res = fakeRes();
  await controller.updateProfile({ user: { id: userId, role: 'STUDENT' }, body: { name: 'Test Candidate', resumeUrl: '' } }, res);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.username, 'keep_me');

  const cleared = fakeRes();
  await controller.updateProfile({ user: { id: userId, role: 'STUDENT' }, body: { username: '' } }, cleared);
  assert.strictEqual(cleared.body.username, null);
});
