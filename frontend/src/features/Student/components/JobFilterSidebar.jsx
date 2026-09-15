import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  X,
  ChevronDown,
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { INDIAN_STATES } from '../../../constants/indianStates';

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

export default function JobFilterSidebar({
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
  const [skillInput, setSkillInput] = useState('');

  const skillList = selectedSkills
    ? selectedSkills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

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
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (!skillList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...skillList, trimmed].join(', ');
      setSelectedSkills(updated);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillList.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase()).join(', ');
    setSelectedSkills(updated);
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-6 text-left shadow-xs">
      {/* Header: Title & Reset Button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
            Filters & Refine
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-headline font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Sort Order */}
      <div className="space-y-1.5">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Sort Order
        </label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 pr-8 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="stipend_desc">Stipend: High to Low</option>
            <option value="stipend_asc">Stipend: Low to High</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Keyword / Title Search */}
      <div className="space-y-1.5">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Keyword / Title
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. React, Python, Dev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans font-medium"
          />
        </div>
      </div>

      {/* 3. Role / Category */}
      <div className="space-y-1.5">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Opportunity / Role
        </label>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full appearance-none bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 pr-8 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="all">All Roles & Opportunities</option>
            <option value="internship">Internship Only</option>
            <option value="fulltime">Full-Time / Developer</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 4. Place for Work / Location */}
      <div className="space-y-1.5">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Place For Work / Location
        </label>
        <div className="relative">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full appearance-none bg-surface border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 pr-8 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="all">All Locations</option>
            <option value="wfh">Work from home / Remote</option>
            <optgroup label="States & Major Hubs">
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 5. Required Skills */}
      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Required Skills
        </label>
        
        {/* Input to add skills */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Type skill & press Add..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            className="flex-1 min-w-0 px-3 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 font-sans"
          />
          <button
            type="button"
            onClick={() => handleAddSkill()}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
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
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400">
            Popular:
          </span>
          <div className="flex flex-wrap gap-1">
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
      </div>

      {/* 6. Stipend Range (INR) */}
      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Stipend Range (INR)
        </label>
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
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
                className={`px-2 py-1.5 text-xs font-headline font-bold border rounded-none text-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-surface border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600'
                } ${idx === 0 ? 'col-span-2' : ''}`}
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

      {/* 7. Status Filter */}
      <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-4">
        <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200  tracking-wider">
          Application Status
        </label>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'not_applied', label: 'Not Applied' },
            { id: 'applied', label: 'Applied' }
          ].map(status => (
            <button
              key={status.id}
              type="button"
              onClick={() => setStatusFilter(status.id)}
              className={`flex-1 py-1.5 text-xs font-headline font-bold border rounded-none transition-colors cursor-pointer ${
                statusFilter === status.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-surface border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
