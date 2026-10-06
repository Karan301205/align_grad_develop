// Static MCQ question bank used by the legacy TestView remedial-quiz flow.
// Extracted verbatim from TestView.jsx (data separated from the view/logic).
export const TEST_QUESTIONS = {
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
