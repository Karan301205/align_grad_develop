// The profile rule the server enforces: skill tests need the General tab, applying needs the
// General tab and the intro video. (The rest of the portal unlocks in the frontend at 70%.)
// Runs on the in-memory test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { isMock } = require('../../src/infrastructure/database');
const { _profileCompletionError: check } = require('../../src/modules/students/student.controller');

const general = { name: 'Test', username: 't', bio: 'Bio text', gender: 'Female', email: 't@example.com', dob: '2004-01-01', phone: '+91 9876543210' };

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('a missing General field blocks both skill tests and applying', () => {
  const profile = { ...general, bio: '' };
  assert.match(check(profile, 'taking skill tests'), /General tab/);
  assert.match(check(profile, 'applying to opportunities', { needsVideo: true }), /General tab/);
});

test('skill tests do not need the intro video', () => {
  assert.strictEqual(check({ ...general, introVideoUrl: null }, 'taking skill tests'), null);
});

test('applying needs the intro video', () => {
  assert.match(check({ ...general, introVideoUrl: '  ' }, 'applying to opportunities', { needsVideo: true }), /introduction video/);
  assert.strictEqual(check({ ...general, introVideoUrl: 'https://cdn.example.com/v.mp4' }, 'applying to opportunities', { needsVideo: true }), null);
});
