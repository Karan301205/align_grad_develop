import React, { useState, useRef, useEffect } from 'react';
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
  const selectedOption = options.find(opt => String(opt.value) === String(value));
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
        className={`bg-white dark:bg-slate-900 border text-xs font-sans font-medium rounded-none px-3 py-2 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs hover:border-blue-700 focus:outline-none select-none ${
          isActive
            ? 'border-blue-600 text-blue-700 dark:text-blue-300 font-bold bg-blue-50/40 dark:bg-blue-950/40'
            : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1 min-w-[170px] w-max max-w-[280px] max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl z-50 py-1 text-left custom-scrollbar animate-scale-up ${menuClassName}`}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full pl-7 pr-6 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 font-sans rounded-none"
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
              <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
                No matching options
              </div>
            ) : (
              groupedOptions.map((opt, idx) => {
                if (opt.isGroupHeader) {
                  return (
                    <div
                      key={`group-${idx}`}
                      className="px-3 py-1.5 text-[10px] font-headline font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-800 select-none"
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
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
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
