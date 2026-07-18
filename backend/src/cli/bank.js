#!/usr/bin/env node
// Question bank operator CLI.
//   npm run bank -- <command> [flags]
//
// Every command that writes defaults to dry-run; use --commit to persist.

require('dotenv').config();

const COMMANDS = {
  'seed-skills': () => require('./commands/seedSkills'),
  'normalize-skills': () => require('./commands/normalizeSkillNames'),
};

function usage() {
  console.log('Usage: npm run bank -- <command> [--commit]');
  console.log('');
  console.log('Commands:');
  console.log('  seed-skills        Seed SkillDefinition rows from seedData.json');
  console.log('  normalize-skills   Rewrite existing skill names to canonical form');
  console.log('');
  console.log('Flags:');
  console.log('  --commit           Persist changes (default is dry-run)');
}

async function main() {
  const [, , commandName, ...args] = process.argv;

  if (!commandName || commandName === '--help' || commandName === '-h') {
    usage();
    process.exit(0);
  }

  const loader = COMMANDS[commandName];
  if (!loader) {
    console.error(`Unknown command: ${commandName}`);
    usage();
    process.exit(1);
  }

  const command = loader();
  const commit = args.includes('--commit');

  try {
    await command.run({ commit });
    process.exit(0);
  } catch (err) {
    console.error(`\n${commandName} failed:`, err.message);
    process.exit(1);
  }
}

main();
