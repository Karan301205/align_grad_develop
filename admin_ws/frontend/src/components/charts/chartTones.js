// Class names for each chart series colour. Written out in full so Tailwind can see them.
export const TONES = {
  jobs: { bg: 'bg-series-jobs', fill: 'fill-series-jobs', stroke: 'stroke-series-jobs', area: 'fill-series-jobs/10' },
  internships: { bg: 'bg-series-internships', fill: 'fill-series-internships', stroke: 'stroke-series-internships', area: 'fill-series-internships/10' },
  gigs: { bg: 'bg-series-gigs', fill: 'fill-series-gigs', stroke: 'stroke-series-gigs', area: 'fill-series-gigs/10' },
  applications: { bg: 'bg-series-applications', fill: 'fill-series-applications', stroke: 'stroke-series-applications', area: 'fill-series-applications/10' },
  pitches: { bg: 'bg-series-pitches', fill: 'fill-series-pitches', stroke: 'stroke-series-pitches', area: 'fill-series-pitches/10' },
  other: { bg: 'bg-series-other', fill: 'fill-series-other', stroke: 'stroke-series-other', area: 'fill-series-other/10' }
};

export const toneOf = (tone) => TONES[tone] || TONES.other;
