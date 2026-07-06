import React, { useState } from 'react';
import { Award, AlertTriangle, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../../constants';

const TEST_QUESTIONS = {
  React: [
    {
      q: "What is the Virtual DOM in React?",
      options: [
        "A direct copy of the HTML DOM that updates periodically",
        "A lightweight, in-memory representation of the real DOM",
        "A special web browser extension for debugging components",
        "The CSS layout parser that renders styling parameters"
      ],
      answer: 1
    },
    {
      q: "What is the primary function of the useEffect hook?",
      options: [
        "To manage component state variables asynchronously",
        "To perform side effects in functional components",
        "To enforce rendering speeds and layout alignment",
        "To compile JSX code into valid HTML elements"
      ],
      answer: 1
    },
    {
      q: "Which hook is designed to memoize computed values and prevent recalculation on every render?",
      options: [
        "useCallback",
        "useMemo",
        "useRef",
        "useReducer"
      ],
      answer: 1
    }
  ],
  Rust: [
    {
      q: "What is ownership in Rust?",
      options: [
        "A commercial license model for the compiler binary",
        "A strict memory management model governed by borrowing rules",
        "A package manager mechanism for downloading crates",
        "An inheritance scheme for Rust structures and traits"
      ],
      answer: 1
    },
    {
      q: "What does the Option<T> enum represent in Rust?",
      options: [
        "An array of items with optional length parameters",
        "A type that encapsulates either a value (Some) or nothing (None)",
        "A config flag set inside the Cargo.toml project schema",
        "A thread-safe channel wrapper for async streams"
      ],
      answer: 1
    },
    {
      q: "How does Rust achieve thread-safe concurrency without data races?",
      options: [
        "Using a global interpreter lock (GIL)",
        "Via Send and Sync traits checked at compile time",
        "By running all async tasks inside a single-threaded runtime loop",
        "Through database row level locks implemented in drivers"
      ],
      answer: 1
    }
  ],
  Kubernetes: [
    {
      q: "What is a Pod in Kubernetes?",
      options: [
        "A virtual network interface connecting clusters",
        "The smallest deployable unit containing one or more containers",
        "A configuration schema for setting node storage quotas",
        "A container registry hosting system images"
      ],
      answer: 1
    },
    {
      q: "What is the purpose of a Kubernetes Service?",
      options: [
        "To run system maintenance checks on nodes",
        "An abstract way to expose an application running on a set of Pods",
        "To define cron jobs for database backup routines",
        "To configure environment secrets and API keys"
      ],
      answer: 1
    },
    {
      q: "Which resource object is primarily responsible for scaling and updating Pod groups?",
      options: [
        "ConfigMap",
        "Deployment",
        "DaemonSet",
        "Ingress"
      ],
      answer: 1
    }
  ],
  Python: [
    {
      q: "What is list comprehension in Python?",
      options: [
        "A diagnostic tool to inspect list structures in memory",
        "A concise, readable syntax for generating new lists from iterables",
        "A validation routine to ensure lists contain uniform types",
        "A method to sort nested lists in ascending order"
      ],
      answer: 1
    },
    {
      q: "What is a decorator in Python?",
      options: [
        "A structural parameter defining class inheritance trees",
        "A function that modifies the behavior of another function",
        "A layout module to customize logs output formatting",
        "A testing module to mock network payload interfaces"
      ],
      answer: 1
    },
    {
      q: "How is memory managed inside the Python runtime environment?",
      options: [
        "Manual allocations using pointer offsets",
        "Through garbage collection and reference counting",
        "Using stack pointers exclusively with no heap layout",
        "Delegated directly to database connections"
      ],
      answer: 1
    }
  ],
  SQL: [
    {
      q: "What is a JOIN operation in SQL?",
      options: [
        "An instruction to index multiple database tables together",
        "Combining rows from two or more tables based on a related column",
        "An API routine to connect to remote server clusters",
        "A syntax wrapper to combine duplicate record fields"
      ],
      answer: 1
    },
    {
      q: "What is the primary benefit of creating an index on a table column?",
      options: [
        "To enforce database integrity checks",
        "To accelerate queries retrieving rows matching column parameters",
        "To compress data size on the disk device",
        "To automatically generate unique ID sequences"
      ],
      answer: 1
    },
    {
      q: "Which SQL clause is used to filter results generated by a GROUP BY instruction?",
      options: [
        "WHERE",
        "HAVING",
        "ORDER BY",
        "LIMIT"
      ],
      answer: 1
    }
  ]
};

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
      const res = await fetch(`${API_BASE}/student/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          skillName,
          score: calculatedScore,
          targetRating
        })
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">AlignGrade Validation Lab</span>
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
