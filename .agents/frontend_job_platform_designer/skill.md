---
name: frontend_job_platform_designer
description: Generates premium, high-trust frontend interfaces for professional job platforms, recruitment dashboards, and career development products, avoiding generic AI startup slop.
---

# Frontend Job Platform Designer Skill

## Purpose
This skill helps agents design and generate production-grade, premium frontend interfaces specifically for professional job platforms, recruitment dashboards, applicant tracking systems (ATS), and career development products. 

The goal is to establish **trust, transparency, and clarity** while avoiding the generic visual clichés of modern "AI startup templates" (such as glowing neon meshes, rotating border animations, and unnecessary glassmorphism).

---

## Design Philosophy: "Corporate Trust with Startup Energy"
Interfaces built under this skill should combine the structured reliability of traditional enterprise platforms with the speed, responsiveness, and aesthetic polish of modern developer tools.

### Inspiration & Benchmark Products
* **Linear**: Extreme speed, clean borders, keyboard-first patterns, and sub-pixel typography.
* **Stripe Dashboard**: High-density financial-grade tables, clean data visualization, and absolute layout precision.
* **Ashby / Greenhouse**: Flow-oriented recruitment tables, detailed candidate pipelines, and high utility.
* **Notion / LinkedIn**: Clean spacing, structured information hierarchy, and professional framing.

### Anti-Patterns to Avoid
* **OpenAI / Midjourney**: Floating input pills, giant landing pages with low content density, and abstract glowing spheres.
* **Generic SaaS Landing Pages**: Multi-colored purple/pink neon background meshes, glowing cards, and sparkle icons (✨) used as general decorators.

---

## Design Principles

### 1. Trust First
Recruiters rely on the platform to filter critical hiring pipelines. Students trust the platform with their careers. Visual choices must optimize for:
* **Clarity & Transparency**: Data must never be obscured. States (such as skill match levels, interview status, application feedback) must be explicitly readable.
* **Professional Confidence**: Solid grids, exact borders, and consistent spacing systems.
* **Usability & Access**: Accessibility (a11y) is a priority. Text-contrast ratios must meet WCAG AA standards.

### 2. Distinctiveness Through Product Thinking
Create a memorable brand experience through **innovative layout utility** rather than decorative graphics:
* **Interactive Timelines**: Rich histories of recruiter actions, candidate submissions, and interview feedback.
* **Hiring Pipeline Trackers**: Sleek steppers showing progression (e.g., Screening, Tech Assessment, Onsite, Offer).
* **Skill Threshold Gauges**: Direct visual comparison between a job's requirements and a candidate's self-rated or verified skills.
* **Credential Verification Capsules**: Compact, premium badge systems showing verified tests, dates, and scores.

---

## Design System Tokens & Guidelines

### 1. Typography Rules
* **Avoid Generic Fonts**: Avoid standard system stacks (`system-ui`, `Arial`, `Roboto`) or overused startup staples like `Inter`.
* **Preferred Display/Header Fonts**: *Cabinet Grotesk*, *General Sans*, *Satoshi*, *Geist*. Use these at medium-to-bold weights for structured headings and page titles.
* **Preferred Body Fonts**: *Switzer*, *Manrope*, *Satoshi*, *Geist Mono* (ideal for scores, counts, dates, and technical metrics).
* **Usage Principle**: A crisp sans-serif display font pairs with a clean, high-legibility body typeface. Monospace variations are used to keep candidate statistics and ratings aligned.

### 2. Color Philosophy
We recommend a strict ratio: **70% Neutral, 20% Primary Brand, 10% Accents**.

* **70% Neutral Foundations**: Use rich, deep slates, cool grays, or off-whites.
  * *Dark Mode*: `#09090b` (zinc-950), `#18181b` (zinc-900), `#27272a` (zinc-800).
  * *Light Mode*: `#fafafa` (zinc-50), `#f4f4f5` (zinc-100), `#e4e4e7` (zinc-200).
* **20% Primary Brand**: Pick a single, solid signature tone representing stability and trust (e.g., deep cobalt blue, dark forest green, warm anthracite, or dark cherry).
* **10% Accent/State Colors**: Keep these strictly functional.
  * **Success/Passed**: Solid emerald/mint green (e.g., `#10b981`).
  * **Warning/Review**: Warm amber/gold (e.g., `#f59e0b`).
  * **Danger/Locked**: Muted crimson/red (e.g., `#ef4444`).
  * **Active Selection**: Focused brand blue or slate.
* **Gradients**: Gradients should be used sparingly. Restrict them to the product logo and the main primary action CTA button. **Never** use gradients for card borders, background panels, or ambient glow meshes.

### 3. Motion & Animation
* **Actionable & Crisp**: Use short, snappy durations (`150ms` to `200ms`) with clean timing functions (`cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`).
* **Subtle Reveals**: Stagger list item entries using a light opacity and small vertical translation (`translateY(4px) -> translateY(0)`).
* **Hover Micro-interactions**: Smooth borders, subtle bg shifts, or scaling interactive icons.
* **Strictly Prohibited**: Background particle systems, glowing ambient light circles, orbiting icons, and decorative background gradient shifts.

### 4. Layout & Grid Structures
* **Editorial Layouts**: Asymmetrical grid templates (e.g., a wide 2-column main details section paired with a slim, sticky 1-column activity sidebar).
* **Explicit Borders**: Use clean, low-opacity borders to separate areas. This gives the application a native-desktop-app feel.
  * *Dark Mode*: `border-white/[0.08]` or `border-zinc-800`.
  * *Light Mode*: `border-black/[0.06]` or `border-zinc-200`.
* **Avoid**: Floating glassmorphic cards over multi-colored blur blobs.

---

## Forbidden Aesthetics Checklist
Ensure the generated code is completely free of:
- [ ] Neon pink-to-purple background meshes.
- [ ] Giant radial gradient ambient glows placed behind content cards.
- [ ] Rotating glowing outlines on cards or buttons.
- [ ] Particle background canvas configurations.
- [ ] Magic wand (✨) or sparkle emojis used to represent standard AI utility. Use clear, custom labels (e.g., "AI Summary", "Match Strength") instead.
- [ ] Glassmorphic overlays with heavy `backdrop-blur` when contrast is compromised.

---

## Special Handling for AlignGrad (Student Hiring & Skill Verification)
When generating pages, features, or components for the AlignGrad workspace, apply these specific rules:

* **Theme**: "LinkedIn for Gen Z with the polish of Linear".
* **Dashboard Logic**: Focus heavily on transparency and verification. Since candidates are locked out if they fail to meet self-rated thresholds, the dashboard must clearly present:
  1. The **required skill rating** for the target role.
  2. The candidate's **current verified/self-rated score**.
  3. Clear directions to the **remedial assessment** to unlock the role.
* **Badges & Trust Verification**: Use crisp, vector-like badges showing "AlignGrad Verified Tier" instead of complex, glowing certifications. Keep it sleek, professional, and authentic.

---

## Reference Components & Tailwind Patterns

### 1. High-Trust Candidate Match & Timeline
A clean, editorial component for displaying candidate matching states, skill thresholds, and progress.

```jsx
import React from 'react';

export function SkillMatchCard({ candidate, jobRequirements }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Skill Analysis
          </span>
          <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            Requirement Match Matrix
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          AlignGrad Verified
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {jobRequirements.map((req) => {
          const candidateScore = candidate.skills[req.skillName] || 0;
          const isPassed = candidateScore >= req.minRating;

          return (
            <div key={req.skillName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                    {req.skillName}
                  </span>
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    Candidate: <strong className="text-zinc-900 dark:text-zinc-100">{candidateScore}/5</strong> (Req: {req.minRating}/5)
                  </span>
                </div>
                
                {/* Score Track */}
                <div className="relative h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {/* Required Target Marker */}
                  <div 
                    className="absolute top-0 bottom-0 border-l border-zinc-400 dark:border-zinc-600 z-10" 
                    style={{ left: `${(req.minRating / 5) * 100}%` }}
                  />
                  {/* Candidate Score Fill */}
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isPassed ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(candidateScore / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end sm:w-28">
                {isPassed ? (
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                    ✓ Matches
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    ⚠ Needs Test
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 2. Sleek Interview Workflow Timeline
Use a vertical timeline format showing recruitment status log.

```jsx
import React from 'react';

export function ApplicationTimeline({ timelineEvents }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timelineEvents.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== timelineEvents.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-zinc-900 border ${
                    event.type === 'passed' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
                      : event.type === 'action'
                      ? 'bg-zinc-900 border-zinc-800 text-white dark:bg-zinc-100 dark:border-zinc-200 dark:text-zinc-900'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                  }`}>
                    {event.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                      {event.content}
                    </p>
                    {event.meta && (
                      <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
                        {event.meta}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-500 font-mono">
                    {event.date}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Checklist for Reviewing PRs / Edits
When modifying code components, double check:
1. Is the visual theme aligned with **"Corporate trust with startup energy"**?
2. Are gradients isolated solely to logo accents and specific CTAs?
3. Did you verify that no generic placeholder meshes, blur circles, or sparkle decorations were added?
4. Are you using characterful display fonts paired with highly readable neutral body fonts?
5. Does the application feel as polished, fast, and structured as Ashby, Stripe Dashboard, or Linear?
