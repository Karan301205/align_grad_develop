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
