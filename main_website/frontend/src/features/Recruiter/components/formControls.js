// Class and aria helpers for recruiter form controls (company profile, post a job).

/** Input/select/textarea classes (design: 44px tall, #D5D9E0 border, 8px radius). */
export function controlClass(error, className = 'h-11 px-3') {
  return `w-full rounded-[8px] border bg-white text-sm text-[#023836] transition-colors placeholder:text-[#6B7280] focus:border-[#0F7A55] focus:outline-none focus:ring-2 focus:ring-[#0F7A55]/20 ${
    error ? 'border-[#DC2626]' : 'border-[#D5D9E0]'
  } ${className}`;
}

export const errorProps = (id, error) => ({
  'aria-invalid': Boolean(error),
  'aria-describedby': error ? `${id}-error` : undefined
});
