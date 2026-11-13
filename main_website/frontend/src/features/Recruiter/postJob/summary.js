import { opportunityMeta } from './constants';
import { formatAmount } from './validation';

// Plain-language lines shared by the summary cards, the review step and the preview.

const plural = (count, word) => `${count} ${word}${Number(count) === 1 ? '' : 's'}`;

/** "Full-time job" / "Part-time internship". */
export const typeLine = (v) => `${v.hours} ${opportunityMeta(v.opportunityType).noun}`;

export const openingsLine = (v) => plural(v.openings || 0, 'opening');

/** "₹25,000/month", "Salary not added" or "Salary hidden". */
export function payLine(v) {
  const { pay } = opportunityMeta(v.opportunityType);
  if (!v.showSalary) return `${pay} hidden`;
  return v.salary ? `₹${formatAmount(v.salary)}/month` : `${pay} not added`;
}

/** "joins immediately", "joins within 15 days", "joins in March". */
export function joiningLine(v) {
  const value = v.joiningMonth || '';
  if (value === 'Immediate') return 'joins immediately';
  if (/^(within|next)/i.test(value)) return `joins ${value.toLowerCase()}`;
  return `joins in ${value}`;
}

export const durationLine = (v) => (v.opportunityType === 'INTERNSHIP' && v.duration ? plural(v.duration, 'month') : '');

export const barsLine = (requirement) => `${requirement.skillName} ≥ ${requirement.minRating}`;

/** "Round 1 · HR → Round 2 · Technical · 2 screening questions (1 must answer)". */
export function processLine(v) {
  const parts = [];
  parts.push(v.rounds.length ? v.rounds.map((round) => round.name).join(' → ') : 'No selection rounds');
  const questions = v.screeningQuestions.length;
  if (questions === 0) parts.push('no screening questions');
  else {
    const required = v.screeningQuestions.filter((question) => question.required !== false).length;
    parts.push(`${plural(questions, 'screening question')} (${required} must answer)`);
  }
  return parts.join(' · ');
}
