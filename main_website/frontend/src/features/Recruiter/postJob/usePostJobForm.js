import { useState } from 'react';
import { EDUCATION_OPTIONS, EXPERIENCE_OPTIONS, HOURS, JOINING_OPTIONS, STEPS, WORK_MODE_OPTIONS } from './constants';
import { buildPayload, stepForServerError, validateStep } from './validation';

function initialValues(company) {
  return {
    opportunityType: 'JOB',
    hours: HOURS[0],
    title: '',
    workMode: WORK_MODE_OPTIONS[0],
    location: company?.location || '',
    locationUrl: '',
    openings: '1',
    preferredEducation: EDUCATION_OPTIONS[0],
    desiredExperience: EXPERIENCE_OPTIONS[0],
    requirements: [],
    showSalary: true,
    salary: '',
    duration: '',
    joiningMonth: JOINING_OPTIONS[0],
    activeDays: '30', // the Job.activeDays database default
    description: '',
    responsibilities: '',
    rounds: [],
    screeningQuestions: [],
    confirmed: false
  };
}

function focusField(key) {
  // After the step has rendered: scroll to the field and focus its first control.
  setTimeout(() => {
    const container = document.getElementById(`field-${key}`);
    if (!container) return;
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    container.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
  }, 50);
}

const scrollToTop = () => setTimeout(() => document.getElementById('post-job-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);

/**
 * State and navigation for the 5-step post-a-job wizard. Each step is validated
 * before moving past it; publishing re-checks every step, then calls the layout's
 * handlePostJob (POST /recruiter/jobs), which navigates away on success.
 */
export default function usePostJobForm({ company, handlePostJob, onNeedCredits }) {
  const [values, setValues] = useState(() => initialValues(company));
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const show = (index, stepErrors = {}) => {
    setStep(index);
    setFurthest((prev) => Math.max(prev, index));
    setErrors(stepErrors);
    const firstKey = Object.keys(stepErrors)[0];
    if (firstKey) focusField(firstKey);
    else scrollToTop();
  };

  /** Moves to `index`, stopping at the first earlier step that still has problems. */
  const goTo = (index) => {
    for (let i = Math.min(step, index); i < index; i += 1) {
      const stepErrors = validateStep(STEPS[i].id, values);
      if (Object.keys(stepErrors).length > 0) return show(i, stepErrors);
    }
    return show(index);
  };

  const next = () => goTo(step + 1);
  const back = () => show(Math.max(0, step - 1));

  const publish = async () => {
    for (let i = 0; i < STEPS.length; i += 1) {
      const stepErrors = validateStep(STEPS[i].id, values);
      if (Object.keys(stepErrors).length > 0) return show(i, stepErrors);
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await handlePostJob(buildPayload(values, company));
      if (result?.success) return undefined; // the layout shows the confirmation and leaves this page
      const message = result?.error || 'The job could not be published. Please try again.';
      setSubmitError({ message, stepIndex: stepForServerError(message) });
      if (result?.code === 'UPGRADE_REQUIRED') onNeedCredits();
    } finally {
      setSubmitting(false);
    }
    return undefined;
  };

  return {
    values,
    setField,
    errors,
    step,
    furthest,
    goTo,
    next,
    back,
    publish,
    submitting,
    submitError
  };
}
