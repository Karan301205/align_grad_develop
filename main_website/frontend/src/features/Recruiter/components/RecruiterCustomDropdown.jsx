import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Themed custom dropdown component for Recruiter portal filters.
 * Replaces native OS <select> tags with website design system tokens.
 */
export default function RecruiterCustomDropdown({
  value,
  onChange,
  options = [],
  defaultLabel = 'Select option',
  icon: Icon = null,
  searchable = false,
  searchPlaceholder = 'Search...',
  align = 'left',
  className = '',
  buttonClassName = '',
  menuClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find currently selected option
  // Nothing picked ('' value): show the field name (defaultLabel), e.g. "Work mode".
  const selectedOption = value === '' || value == null ? null : options.find(opt => String(opt.value) === String(value));
  const isActive = Boolean(value && value !== '' && value !== 'all');
  const displayLabel = selectedOption ? selectedOption.label : defaultLabel;

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter(opt => {
        if (!opt.value && opt.value !== 0) return true; // keep the "All" default
        return opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
      })
    : options;

  // Grouping support
  const groupedOptions = [];
  let currentGroup = null;

  filteredOptions.forEach(opt => {
    if (opt.group && opt.group !== currentGroup) {
      currentGroup = opt.group;
      groupedOptions.push({ isGroupHeader: true, label: currentGroup });
    }
    groupedOptions.push(opt);
  });

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`h-9 bg-white border text-[13px] font-(family-name:--font-headline) font-normal rounded-[8px] px-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer hover:border-[#9CA3AF] focus:outline-none focus-visible:border-[#0F7A55] focus-visible:ring-2 focus-visible:ring-[#0F7A55]/20 select-none ${
          isActive
            ? 'border-[#0F7A55] text-[#0F7A55] font-semibold bg-[#E3F1EE]'
            : 'border-[#D5D9E0] text-[#023836]'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#4B5563] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1 min-w-[170px] w-max max-w-[280px] max-h-64 overflow-y-auto bg-white border border-[#E4E6EA] rounded-[8px] shadow-lg shadow-slate-300/50 z-50 p-1 text-left font-(family-name:--font-headline) custom-scrollbar animate-scale-up ${menuClassName}`}
        >
          {searchable && (
            <div className="p-1.5 border-b border-[#EEF0F3] sticky -top-1 bg-white z-10">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-8 pl-7 pr-6 bg-white border border-[#D5D9E0] text-[13px] text-[#023836] placeholder:text-[#6B7280] focus:outline-none focus:border-[#0F7A55] focus:ring-2 focus:ring-[#0F7A55]/20 rounded-[6px]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="py-0.5">
            {groupedOptions.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-[#4B5563]">
                No matching options
              </div>
            ) : (
              groupedOptions.map((opt, idx) => {
                if (opt.isGroupHeader) {
                  return (
                    <div
                      key={`group-${idx}`}
                      className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] select-none"
                    >
                      {opt.label}
                    </div>
                  );
                }

                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded-[6px] text-[13px] hover:bg-[#F4F8F6] cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#E3F1EE] text-[#0F7A55] font-semibold hover:bg-[#E3F1EE]'
                        : 'text-[#334155]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0F7A55] shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
