import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  X,
  Award,
  Sliders
} from 'lucide-react';
import { ALL_SKILLS, hasSkillMcq } from '../../../constants';

/**
 * SkillFilterDropdown:
 * - Multi-select skill filter with live search bar.
 * - Comprehensive list of all skills (technical + non-technical).
 * - Per-skill level rating is controlled directly from the Active Filters toolbar chips.
 */
export default function SkillFilterDropdown({
  selectedSkills = [], // Array of { name: string, minRating: number, verifiedOnly?: boolean }
  onChange,            // (newSkills: Array<{ name: string, minRating: number, verifiedOnly?: boolean }>) => void
  candidateSkillCounts = {}, // { [skillName]: number }
  className = ''
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

  // Reset search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Build unified skills master list
  const masterSkillsList = useMemo(() => {
    const skillMap = new Map();

    // 1. Add skills from ALL_SKILLS constant
    (ALL_SKILLS || []).forEach(item => {
      const name = (typeof item === 'string' ? item : item.skill || '').trim();
      if (name) {
        const type = typeof item === 'object' && item.type ? item.type : 'technical';
        skillMap.set(name.toLowerCase(), {
          name,
          type,
          hasMcq: hasSkillMcq(name)
        });
      }
    });

    // 2. Supplement with any candidate skills present in current database pool
    Object.keys(candidateSkillCounts || {}).forEach(name => {
      const trimmed = name.trim();
      if (trimmed && !skillMap.has(trimmed.toLowerCase())) {
        skillMap.set(trimmed.toLowerCase(), {
          name: trimmed,
          type: 'technical',
          hasMcq: hasSkillMcq(trimmed)
        });
      }
    });

    // Sort alphabetically
    return Array.from(skillMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [candidateSkillCounts]);

  // Filter skills based on search
  const filteredSkills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return masterSkillsList;
    return masterSkillsList.filter(item => item.name.toLowerCase().includes(q));
  }, [masterSkillsList, searchQuery]);

  // Check if a skill is currently selected
  const getSelectedSkill = (skillName) => {
    return selectedSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  };

  const handleToggleSkill = (skillItem) => {
    const existing = getSelectedSkill(skillItem.name);
    if (existing) {
      // Remove
      onChange(selectedSkills.filter(s => s.name.toLowerCase() !== skillItem.name.toLowerCase()));
    } else {
      // Add
      onChange([
        ...selectedSkills,
        {
          name: skillItem.name,
          minRating: 0,
          verifiedOnly: false,
          hasMcq: skillItem.hasMcq
        }
      ]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Trigger label formatting
  const triggerLabel = useMemo(() => {
    if (!selectedSkills || selectedSkills.length === 0) {
      return 'Skills';
    }
    if (selectedSkills.length === 1) {
      const s = selectedSkills[0];
      const ratingPart = s.verifiedOnly
        ? ' (🛡️ Verified)'
        : s.minRating > 0
        ? ` (Lvl ${s.minRating}+)`
        : '';
      return `Skill: ${s.name}${ratingPart}`;
    }
    return `Skills (${selectedSkills.length})`;
  }, [selectedSkills]);

  const hasActiveSkills = selectedSkills && selectedSkills.length > 0;

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`h-9 bg-white border text-[13px] font-(family-name:--font-headline) font-normal rounded-[8px] px-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer hover:border-[#9CA3AF] focus:outline-none focus-visible:border-[#0F7A55] focus-visible:ring-2 focus-visible:ring-[#0F7A55]/20 select-none max-w-[220px] ${
          hasActiveSkills
            ? 'border-[#0F7A55] text-[#0F7A55] font-semibold bg-[#E3F1EE]'
            : 'border-[#D5D9E0] text-[#023836]'
        }`}
        title="Filter by Skills"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Award className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
          <span className="truncate">{triggerLabel}</span>
          {selectedSkills.length > 1 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-[#023836] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {selectedSkills.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasActiveSkills && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
              title="Clear skill filters"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#4B5563] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-80 sm:w-96 max-h-[500px] overflow-hidden bg-white border border-[#E4E6EA] rounded-[8px] shadow-lg shadow-slate-300/50 z-50 flex flex-col text-left font-(family-name:--font-headline) custom-scrollbar animate-scale-up">
          {/* Header & Search Bar */}
          <div className="p-3 border-b border-[#EEF0F3] space-y-2.5 bg-white shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-[#023836] dark:text-slate-100 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#0F7A55] dark:text-[#7FD8C4]" />
                <span>Filter by Skills</span>
              </span>
              {hasActiveSkills && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-headline font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear all ({selectedSkills.length})
                </button>
              )}
            </div>

            {/* Embedded Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search skills (e.g. React, Python, Communication)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-7 bg-white border border-[#D5D9E0] rounded-[8px] text-[13px] text-[#023836] placeholder:text-[#6B7280] focus:outline-none focus:border-[#0F7A55] focus:ring-2 focus:ring-[#0F7A55]/20"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Available Skills List */}
          <div className="flex-1 overflow-y-auto p-1 custom-scrollbar max-h-72">
            {filteredSkills.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
                No skills matching "{searchQuery}"
              </div>
            ) : (
              filteredSkills.map(item => {
                const isSelected = Boolean(getSelectedSkill(item.name));
                const count = candidateSkillCounts[item.name] || 0;

                return (
                  <div
                    key={item.name}
                    onClick={() => handleToggleSkill(item)}
                    className={`px-2.5 py-2 rounded-[6px] text-[13px] hover:bg-[#F4F8F6] cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#E3F1EE] font-semibold text-[#0F7A55] hover:bg-[#E3F1EE]'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox Box */}
                      <div
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#023836] border-[#0F7A55] text-white'
                            : 'border-[#9CA3AF] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <span className="truncate">{item.name}</span>
                    </div>

                    {count > 0 && (
                      <span className="text-[10px] font-headline font-bold text-slate-400 dark:text-slate-500 shrink-0">
                        ({count})
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 border-t border-[#EEF0F3] bg-white flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
              {selectedSkills.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 px-3.5 bg-[#023836] hover:bg-[#03443F] text-white font-semibold text-[13px] rounded-[8px] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
