export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD (AU$)' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED)' },
  { code: 'SGD', symbol: 'SG$', label: 'SGD (SG$)' },
];

export const getCurrencySymbol = (currencyCode = 'INR') => {
  if (!currencyCode) return '₹';
  const code = currencyCode.toString().trim().toUpperCase();
  const match = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return match ? match.symbol : (code === 'INR' ? '₹' : code);
};

// Gig fields a recruiter can pick from (Post a gig) and candidates can filter by.
const RAW_GIG_CATEGORIES = [
  "Artificial Intelligence (AI)", "Machine Learning", "Generative AI", "Natural Language Processing (NLP)",
  "Computer Vision", "Data Science", "Data Analytics", "Business Analytics", "Data Engineering",
  "Business Intelligence (BI)", "Full Stack Development", "Frontend Development", "Backend Development",
  "Web Development", "Mobile App Development", "Android Development", "iOS Development", "Game Development",
  "DevOps", "Cloud Computing", "Site Reliability Engineering (SRE)", "Platform Engineering", "Cyber Security",
  "Ethical Hacking", "Network Engineering", "Cloud Security", "Software Testing (QA)", "Automation Testing",
  "SDET", "Database Development", "SQL Development", "Python Development", "Java Development",
  "JavaScript Development", "C++ Development", ".NET Development", "PHP Development", "Go Development",
  "Embedded Systems", "IoT Development", "Robotics & Drones", "Blockchain & Web3", "AR/VR Development",
  "UI/UX Design", "Graphic Design", "Product Management", "Product Analytics", "Technical Support",
  "Research & Development (R&D)", "Open Source Contributions", "API Development", "Microservices",
  "SaaS Development", "E-commerce Development", "Automation & Scripting", "Low-Code / No-Code",
  "Prompt Engineering", "AI Agent Development", "MLOps", "FinTech", "HealthTech", "EdTech",
  "Digital Marketing", "Content Writing", "Technical Writing", "Video Editing", "Motion Graphics"
];

export const GIG_CATEGORIES = [...RAW_GIG_CATEGORIES].sort((a, b) => a.localeCompare(b));

export function money(amount, currency = 'INR') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${getCurrencySymbol(currency)}${value.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: 2 })}`;
}

/** Days from a stored delivery time ("7 days", "2 weeks", "1 month"); null when it can't be read. */
export function deliveryDays(value) {
  const text = String(value || '').toLowerCase();
  const n = Number((text.match(/\d+/) || [])[0]);
  if (!n) return null;
  if (text.includes('month')) return n * 30;
  if (text.includes('week')) return n * 7;
  return n;
}

/** Only http(s) links are rendered as links (gig, chat and pitch files come from users). */
export const safeLink = (url) => (/^https?:\/\//i.test(String(url || '')) ? url : null);
export const fileNameOf = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'File').replace(/^\d+[-_]/, '');
  } catch {
    return 'File';
  }
};
