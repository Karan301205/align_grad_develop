import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  X,
  ChevronDown,
  Check,
  Sparkles,
  MapPin,
  DollarSign
} from 'lucide-react';
import { INDIAN_STATES } from '../../../constants/indianStates';
import { ALL_SKILLS } from '../../../constants';

const POPULAR_SKILLS = [
  'React', 'Python', 'Node.js', 'TypeScript', 'Java', 'AWS', 'Docker', 'AI/ML', 'SQL', 'Next.js'
];

const STIPEND_PRESETS = [
  { label: 'All Stipends', min: '', max: '' },
  { label: '< ₹15k', min: '', max: '15000' },
  { label: '₹15k - ₹40k', min: '15000', max: '40000' },
  { label: '₹40k - ₹80k', min: '40000', max: '80000' },
  { label: '₹80k+', min: '80000', max: '' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Sort: Newest First' },
  { id: 'stipend_desc', label: 'Sort: Stipend High → Low' },
  { id: 'stipend_asc', label: 'Sort: Stipend Low → High' },
  { id: 'title_asc', label: 'Sort: Title A → Z' }
];

const ROLE_OPTIONS = [
  { id: 'all', label: 'Role: All Roles' },
  { id: 'internship', label: 'Role: Internship' },
  { id: 'fulltime', label: 'Role: Full-Time' }
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'Status: All' },
  { id: 'not_applied', label: 'Status: Not Applied' },
  { id: 'applied', label: 'Status: Applied' }
];

export default function JobFilterBar({
  searchQuery = '',
  setSearchQuery,
  sortBy = 'newest',
  setSortBy,
  roleFilter = 'all',
  setRoleFilter,
  locationFilter = 'all',
  setLocationFilter,
  selectedSkills = '',
  setSelectedSkills,
  minStipend = '',
  setMinStipend,
  maxStipend = '',
  setMaxStipend,
  statusFilter = 'all',
  setStatusFilter,
  totalJobs = 0,
  onReset
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'sort' | 'role' | 'location' | 'status' | 'skills' | null
  const [locationSearch, setLocationSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const containerRef = useRef(null);

  // Skill list parsed from string
  const skillList = selectedSkills
    ? selectedSkills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    sortBy !== 'newest' ||
    roleFilter !== 'all' ||
    locationFilter !== 'all' ||
    selectedSkills.trim() ||
    minStipend ||
    maxStipend ||
    statusFilter !== 'all'
  );

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillSearch).trim();
    if (!trimmed) return;
    if (!skillList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...skillList, trimmed].join(', ');
      setSelectedSkills(updated);
    }
    setSkillSearch('');
  };

  const handleToggleSkill = (skillName) => {
    const exists = skillList.some(s => s.toLowerCase() === skillName.toLowerCase());
    if (exists) {
      const updated = skillList.filter(s => s.toLowerCase() !== skillName.toLowerCase()).join(', ');
      setSelectedSkills(updated);
    } else {
      const updated = [...skillList, skillName].join(', ');
      setSelectedSkills(updated);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillList.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase()).join(', ');
    setSelectedSkills(updated);
  };

  // Filter locations by search query
  const filteredStates = INDIAN_STATES.filter(st =>
    st.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Filter skills by search query from ALL_SKILLS
  const uniqueAllSkills = Array.from(
    new Set((ALL_SKILLS || []).map(s => (typeof s === 'string' ? s : s.skill)).filter(Boolean))
  );

  const filteredSkills = uniqueAllSkills.filter(s =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  ).slice(0, 40);

  // Display label helpers
  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort: Newest First';
  const currentRoleLabel = ROLE_OPTIONS.find(o => o.id === roleFilter)?.label || 'Role: All Roles';
  const currentStatusLabel = STATUS_OPTIONS.find(o => o.id === statusFilter)?.label || 'Status: All';
  const currentLocationLabel = locationFilter === 'all'
    ? 'Location: All'
    : locationFilter === 'wfh'
    ? 'Location: Work from home'
    : `Location: ${locationFilter}`;

  return (
    <div
      ref={containerRef}
      className="w-full bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-xs space-y-4 text-left relative z-20"
    >
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Company, Role, or Skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans font-medium"
          />
        </div>

        {/* Core Dropdowns Row with Custom Styled Menus */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Custom Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 hover:border-blue-600 focus:outline-none cursor-pointer font-medium shadow-2xs min-w-[150px]"
            >
              <span className="truncate">{currentSortLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute left-0 mt-1 w-52 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800">
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center justify-between ${
                      sortBy === opt.id ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Custom Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}
              className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 hover:border-blue-600 focus:outline-none cursor-pointer font-medium shadow-2xs min-w-[140px]"
            >
              <span className="truncate">{currentRoleLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'role' && (
              <div className="absolute left-0 mt-1 w-48 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800">
                {ROLE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setRoleFilter(opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center justify-between ${
                      roleFilter === opt.id ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {roleFilter === opt.id && <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Custom Location Dropdown with Integrated Search Option */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(openDropdown === 'location' ? null : 'location');
                setLocationSearch('');
              }}
              className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 hover:border-blue-600 focus:outline-none cursor-pointer font-medium max-w-[180px] shadow-2xs"
            >
              <span className="truncate">{currentLocationLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 transition-transform ${openDropdown === 'location' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'location' && (
              <div className="absolute left-0 mt-1 w-72 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-xl z-50 p-2 space-y-2 text-left">
                {/* Search input inside Location dropdown */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search city or state..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-surface-container-low border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-sans font-medium"
                    autoFocus
                  />
                </div>

                {/* Location options list */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {/* All Locations */}
                  <div
                    onClick={() => {
                      setLocationFilter('all');
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 cursor-pointer flex items-center justify-between ${
                      locationFilter === 'all' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>All Locations</span>
                    {locationFilter === 'all' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>

                  {/* Work from home */}
                  <div
                    onClick={() => {
                      setLocationFilter('wfh');
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 cursor-pointer flex items-center justify-between ${
                      locationFilter === 'wfh' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>Work from home / Remote</span>
                    {locationFilter === 'wfh' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>

                  {/* Filtered Indian states & hubs */}
                  {filteredStates.map((st) => (
                    <div
                      key={st}
                      onClick={() => {
                        setLocationFilter(st);
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 cursor-pointer flex items-center justify-between ${
                        locationFilter === st ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{st}</span>
                      {locationFilter === st && <Check className="w-3.5 h-3.5 text-blue-700" />}
                    </div>
                  ))}

                  {filteredStates.length === 0 && locationSearch && (
                    <div className="p-3 text-center text-xs text-slate-500 font-sans">
                      No locations matching "{locationSearch}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Custom Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 hover:border-blue-600 focus:outline-none cursor-pointer font-medium shadow-2xs min-w-[130px]"
            >
              <span className="truncate">{currentStatusLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute left-0 mt-1 w-44 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800">
                {STATUS_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setStatusFilter(opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer flex items-center justify-between ${
                      statusFilter === opt.id ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.id && <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggle More Filters (Skills & Stipend) */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-3 py-2 text-xs font-headline font-bold border bg-[#E2E8F0] rounded-none flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAdvancedOpen || selectedSkills || minStipend || maxStipend
                ? 'bg-blue-700 text-white border-blue-700'
                : ' border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More Filters</span>
            {(selectedSkills || minStipend || maxStipend) && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-headline font-bold text-blue-800 dark:text-blue-300 hover:text-blue-950 dark:hover:text-blue-100 transition-colors cursor-pointer"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Advanced Filters: Filter by Required Skills (with Search & Custom Dropdown) & Stipend Range */}
      {isAdvancedOpen && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 5. Filter by Required Skills with Search & Custom Dropdown */}
          <div className="space-y-2 relative">
            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">
            Required Skills
            </label>

            {/* Input that opens the Custom Searchable Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search & select skills (e.g. React, Python)..."
                    value={skillSearch}
                    onChange={(e) => {
                      setSkillSearch(e.target.value);
                      setOpenDropdown('skills');
                    }}
                    onFocus={() => setOpenDropdown('skills')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Custom Searchable Skills Dropdown Popover */}
              {openDropdown === 'skills' && (
                <div className="absolute left-0 mt-1 w-full bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSkills.map((skill) => {
                    const isSelected = skillList.some(s => s.toLowerCase() === skill.toLowerCase());
                    return (
                      <div
                        key={skill}
                        onClick={() => handleToggleSkill(skill)}
                        className={`px-3 py-2 text-xs font-sans font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                          <span>{skill}</span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {filteredSkills.length === 0 && skillSearch && (
                    <div
                      onClick={() => handleAddSkill(skillSearch)}
                      className="p-3 text-xs text-blue-700 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    >
                      <span>Add custom skill "{skillSearch}"</span>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Skill Tags */}
            {skillList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 text-[11px] font-headline font-semibold rounded-none"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Skills suggestions */}
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400 mr-1">
                Popular:
              </span>
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = skillList.some(s => s.toLowerCase() === skill.toLowerCase());
                if (isSelected) return null;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="px-1.5 py-0.5 text-[10px] font-sans font-semibold bg-surface border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 rounded-none transition-all cursor-pointer"
                  >
                    + {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stipend Range (INR) */}
          <div className="space-y-2">
            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">
              Stipend Range (INR)
            </label>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {STIPEND_PRESETS.map((preset, idx) => {
                const isSelected = minStipend === preset.min && maxStipend === preset.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMinStipend(preset.min);
                      setMaxStipend(preset.max);
                    }}
                    className={`px-2.5 py-1 text-xs font-headline font-bold border rounded-none text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-surface border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Min / Max Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-sans font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Min (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minStipend}
                  onChange={(e) => setMinStipend(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-sans font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Max (₹)
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={maxStipend}
                  onChange={(e) => setMaxStipend(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
