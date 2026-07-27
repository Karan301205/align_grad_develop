import React, { useState } from 'react';
import { Award, AlertTriangle, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { TEST_QUESTIONS } from '../../constants/testQuestions';


export default function TestView({ token, testSkill, setTestSkill, onPass }) {
  const { skillName, targetRating } = testSkill;
  const questions = TEST_QUESTIONS[skillName] || [
    {
      q: `Which of the following describes the best practice for managing and maintaining ${skillName} integrations?`,
      options: [
        "Keeping all modules in a single file without testing",
        "Documenting API endpoints, writing unit tests, and automating builds",
        "Configuring maximum server capacity without profiling memory leaks",
        "Relying on user feedback directly in production instead of staging"
      ],
      answer: 1
    },
    {
      q: `What is the significance of latency and resource consumption when designing a system around ${skillName}?`,
      options: [
        "They have no impact on overall performance or scaling budgets",
        "Higher latency improves backend application responsiveness",
        "Lower latency and optimized memory footprints prevent resource leaks and improve UX",
        "They are automatically resolved by running on localhost"
      ],
      answer: 2
    },
    {
      q: `How does version control and automated testing improve development workflows utilizing ${skillName}?`,
      options: [
        "It slows down iterations and blocks releases",
        "It tracks code modifications, detects bugs early, and ensures continuous deployment",
        "It replaces compile-time type verification entirely",
        "It requires deploying third-party visual interfaces for matching candidates"
      ],
      answer: 1
    }
  ];
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleTestSubmit = async () => {
    if (answers.includes(null)) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct++;
    });

    const calculatedScore = Math.round((correct / questions.length) * 100);
    const testPassed = true;

    setScore(calculatedScore);
    setPassed(testPassed);
    setSubmitted(true);

    try {
      const res = await apiFetch('/student/tests', {
        token,
        method: 'POST',
        json: {
          skillName,
          score: calculatedScore,
          targetRating
        }
      });
      if (!res.ok) {
        console.error('Failed to report test results');
      }
    } catch (err) {
      console.error('Error reporting test', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center py-12 px-6 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-2xl bg-surface-container border border-outline-variant rounded-2xl p-8 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">AlignGrade Validation Lab</span>
              {/* <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[10px] font-mono text-primary">
                need a skill assessment image
              </span> */}
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface mt-1">{skillName} Certification Test</h2>
          </div>
          <button
            onClick={() => setTestSkill(null)}
            className="px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface bg-surface-container-high border border-outline-variant rounded-lg"
          >
            Cancel
          </button>
        </div>

        {/* Test status banner */}
        {!submitted ? (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-xs text-primary font-mono leading-relaxed">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span>Complete the verification test to verify your skill proficiency level and save your rating based on what you score.</span>
          </div>
        ) : (
          <div className="p-6 rounded-xl border flex flex-col items-center gap-3 text-center bg-success-container border-success/30 text-on-success-container">
            <>
              <Award className="w-12 h-12" />
              <h3 className="text-xl font-bold">Verification Completed! (Score: {score}%)</h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                Congratulations! Your rating for {skillName} has been verified at Level {Math.max(1, Math.round(score / 10))}/10 and saved to your profile.
              </p>
              <button
                onClick={onPass}
                className="mt-4 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow shadow-primary/10 hover:brightness-110 active:scale-95 transition-all text-sm"
              >
                Return to Dashboard
              </button>
            </>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6 pt-4">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-3 bg-surface-container-low/60 p-5 rounded-xl border border-outline-variant">
              <h4 className="text-sm font-bold text-on-surface">Q{qIdx + 1}: {q.q}</h4>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[qIdx] === optIdx;
                  let optStyle = "bg-surface-container-high/40 hover:bg-surface-container-highest border-outline-variant text-on-surface-variant hover:text-on-surface";

                  if (isSelected) {
                    optStyle = "bg-primary/10 border-primary text-primary font-bold";
                  }

                  if (submitted) {
                    if (optIdx === q.answer) {
                      optStyle = "bg-success-container border-success text-on-success-container font-bold";
                    } else if (isSelected && optIdx !== q.answer) {
                      optStyle = "bg-error-container border-error text-on-error-container font-bold";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && optIdx === q.answer && <CheckCircle className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {!submitted && (
          <button
            onClick={handleTestSubmit}
            disabled={submitting}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <span>Submit Certification Attempt</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
