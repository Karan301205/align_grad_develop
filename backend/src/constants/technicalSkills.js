// Canonical set of technical skills recognized by the job-matching engine.
// Kept as a lower-cased Set for O(1), case-insensitive membership checks.
// NOTE: keep this list in sync with the frontend `ALL_SKILLS` reference data.
const TECHNICAL_SKILLS = new Set([
  "a2a", "agile methodologies", "agile principles & scrum", "amazon redshift", "analytics", "angularjs", "ansible", "apache airflow", "apache spark",
  "api", "api testing", "aws", "azure", "bash scripting", "bigquery", "bootstrap", "c", "c#", "c++",
  "celery", "chart.js", "claude code", "concurrency", "crew ai", "css", "cypress", "databricks",
  "data structure", "data structures & algorithms", "data warehousing", "dax", "deep learning (dl)", "distributed systems",
  "django", "docker", "docker compose", "elasticsearch", "elk stack", "eslint", "etl",
  "event-driven architecture", "excel", "express js", "fastapi", "figma", "firebase", "framer motion",
  "gemini api", "genai", "generative ai", "git and github", "github actions", "go",
  "google analytics", "google cloud platform", "hadoop hdfs", "haskell", "helm", "html",
  "hugging face", "j2ee", "jaeger", "java", "javascript", "jest", "jira", "jquery", "kafka", "keras",
  "kubernetes", "langchain", "langgraph", "langsmith", "lightgbm", "linux", "llm",
  "machine learning", "makefiles", "seaborn", "matplotlib", "matplotlib & seaborn", "mcp", "mlflow",
  "mongodb", "mysql", "n8n", "n8n introduction", "natural language processing",
  "natural language toolkit (nltk)", ".net", "next.js", "next js", "nginx", "node.js",
  "nosql", "numpy", "oauth 2.0", "openai api", "opencv", "pandas", "perl", "php", "pinecone",
  "playwright", "postgresql", "postman", "power bi", "prisma orm", "prometheus", "pyspark",
  "python", "pytorch", "rabbitmq", "rag", "react", "react native", "react testing library",
  "redhat linux 7.5", "redux", "ruby", "rust", "scikit-learn", "scipy", "sentry", "servicenow",
  "snowflake", "spreadsheet", "sql", "storybook", "supabase", "swagger", "swift", "tableau", "tailwind",
  "tailwind css", "tensorflow", "terraform", "three.js", "transformers", "turborepo",
  "typescript", "ui/ux", "unit testing", "unix", "vector embeddings", "virtualization", "vue.js",
  "windows", "yum", "zustand"
]);

module.exports = { TECHNICAL_SKILLS };
