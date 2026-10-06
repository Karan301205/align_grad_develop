const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeToken,
  buildAliasIndex,
  resolveSkill,
} = require('../../src/services/questionBank/skills/normalize');

test('normalizeToken lowercases and trims', () => {
  assert.strictEqual(normalizeToken('  Python  '), 'python');
});

test('normalizeToken collapses punctuation variants to the same token', () => {
  assert.strictEqual(normalizeToken('Next.js'), normalizeToken('next js'));
  assert.strictEqual(normalizeToken('Node.js'), 'node js');
  assert.strictEqual(normalizeToken('UI/UX'), 'ui ux');
});

test('normalizeToken preserves + and # so C, C++, C# stay distinct', () => {
  assert.strictEqual(normalizeToken('C'), 'c');
  assert.strictEqual(normalizeToken('C++'), 'c++');
  assert.strictEqual(normalizeToken('C#'), 'c#');
  assert.notStrictEqual(normalizeToken('C++'), normalizeToken('C'));
  assert.notStrictEqual(normalizeToken('C#'), normalizeToken('C'));
});

test('normalizeToken handles leading-punctuation names', () => {
  assert.strictEqual(normalizeToken('.NET'), 'net');
});

test('normalizeToken returns empty string for non-strings', () => {
  assert.strictEqual(normalizeToken(null), '');
  assert.strictEqual(normalizeToken(undefined), '');
  assert.strictEqual(normalizeToken(42), '');
});

test('buildAliasIndex maps canonical name to itself', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python' }]);
  assert.strictEqual(index.get('python'), 'Python');
});

test('buildAliasIndex maps explicit aliases to the canonical name', () => {
  const index = buildAliasIndex([
    { canonicalName: 'Generative AI', aliases: ['GenAI'] },
  ]);
  assert.strictEqual(index.get('genai'), 'Generative AI');
  assert.strictEqual(index.get('generative ai'), 'Generative AI');
});

test('buildAliasIndex throws when two canonicals claim the same token', () => {
  assert.throws(
    () =>
      buildAliasIndex([
        { canonicalName: 'Next.js' },
        { canonicalName: 'Next js' },
      ]),
    /collision/i
  );
});

test('buildAliasIndex does not throw when a canonical repeats its own token', () => {
  assert.doesNotThrow(() =>
    buildAliasIndex([{ canonicalName: 'Python', aliases: ['python', 'Python'] }])
  );
});

test('buildAliasIndex ignores empty alias entries', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python', aliases: ['', null] }]);
  assert.strictEqual(index.size, 1);
});

test('resolveSkill returns the canonical name for any known spelling', () => {
  const index = buildAliasIndex([
    { canonicalName: 'Next.js', aliases: ['Next js'] },
  ]);
  assert.strictEqual(resolveSkill(index, 'NEXT.JS'), 'Next.js');
  assert.strictEqual(resolveSkill(index, 'next js'), 'Next.js');
});

test('resolveSkill returns null for unknown skills', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python' }]);
  assert.strictEqual(resolveSkill(index, 'Cobol'), null);
  assert.strictEqual(resolveSkill(index, ''), null);
});
