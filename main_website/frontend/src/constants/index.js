// Barrel that preserves the original `../constants` import surface.
// `API_BASE` now lives in `src/config` (configuration, incl. VITE_API_BASE_URL)
// and `ALL_SKILLS` in `./skills` (domain data); both are re-exported here so
// existing imports such as `import { API_BASE, ALL_SKILLS } from '../../constants'`
// keep working.
export { API_BASE } from '../config';
export { ALL_SKILLS, SKILLS_WITH_MCQ, hasSkillMcq } from './skills';
