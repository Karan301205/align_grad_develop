import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  X,
  Filter,
  ChevronDown,
  Check,
  RefreshCw,
  Clock,
  ShieldCheck,
  Star,
  ArrowUpDown,
  SlidersHorizontal,
  Plus
} from 'lucide-react';

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

const POPULAR_SKILLS = [
  "React", "Node.js", "Python", "TypeScript", "AWS", "Figma", "Docker", "AI/ML", "Tailwind CSS", "Next.js"
];

const BUDGET_PRESETS = [
  { label: 'All Budgets', min: '', max: '' },
  { label: '< ₹5k', min: '', max: '5000' },
  { label: '₹5k - ₹20k', min: '5000', max: '20000' },
  { label: '₹20k - ₹50k', min: '20000', max: '50000' },
  { label: '₹50k+', min: '50000', max: '' },
];

const DELIVERY_OPTIONS = [
  { id: 'all', label: 'Any Timeline' },
  { id: '3days', label: '≤ 3 Days (⚡ Fast)' },
  { id: '7days', label: '≤ 1 Week' },
  { id: '14days', label: '≤ 2 Weeks' },
  { id: '30days', label: '2+ Weeks' },
];

const RATING_OPTIONS = [
  { value: '0', label: 'Any Level' },
  { value: '1', label: 'Level 1+ (Entry)' },
  { value: '2', label: 'Level 2+ (Foundational)' },
  { value: '3', label: 'Level 3+ (Proficient)' },
  { value: '4', label: 'Level 4+ (Expert)' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'budget_desc', label: 'Budget: High to Low' },
  { id: 'budget_asc', label: 'Budget: Low to High' },
  { id: 'delivery_asc', label: 'Fastest Delivery' },
];

export default function GigFilterSidebar({
  q = '',
  setQ,
  selectedCategoryFilter = '',
  setSelectedCategoryFilter,
  selectedSkills = '',
  setSelectedSkills,
  minBudget = '',
  setMinBudget,
  maxBudget = '',
  setMaxBudget,
  deliveryTimeline = 'all',
  setDeliveryTimeline,
  verifiedOnly = false,
  setVerifiedOnly,
  minRating = '0',
  setMinRating,
  sortBy = 'newest',
  setSortBy,
  onSearch,
  onReset,
  loading = false,
  totalGigs = 0
}) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const dropdownRef = useRef(null);

  // Parse skill string into array
  const skillList = selectedSkills
    ? selectedSkills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = GIG_CATEGORIES.filter(c =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const hasActiveFilters = Boolean(
    q?.trim() ||
    selectedCategoryFilter ||
    selectedSkills?.trim() ||
    minBudget ||
    maxBudget ||
    (deliveryTimeline && deliveryTimeline !== 'all') ||
    verifiedOnly ||
    (minRating && minRating !== '0') ||
    (sortBy && sortBy !== 'newest')
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
  };

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

  const handlePresetBudget = (preset) => {
    setMinBudget(preset.min);
    setMaxBudget(preset.max);
  };

  const isPresetActive = (preset) => {
    return (minBudget || '') === preset.min && (maxBudget || '') === preset.max;
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <h3 className="font-headline font-bold text-xs tracking-wider text-slate-900 dark:text-slate-100">
            Filters & Refine
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-headline font-bold text-blue-800 dark:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset All
          </button>
        )}
      </div>

      {/* Filter 1: Sort By */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Sort Order
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-blue-600 focus:outline-none font-sans cursor-pointer shadow-2xs"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id} className="bg-surface text-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter 2: Keyword / Title Search */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Keyword / Title
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Python, API..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans shadow-2xs"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter 3: Category / Field */}
      <div className="space-y-2" ref={dropdownRef}>
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Category / Field
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryOpen(prev => !prev)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-left text-slate-900 dark:text-slate-100 font-medium flex items-center justify-between font-sans hover:border-blue-600 transition-colors cursor-pointer shadow-2xs"
          >
            <span className="truncate">
              {selectedCategoryFilter || 'All Categories'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-500 transition-transform ${isCategoryOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {isCategoryOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border-2 border-slate-300 dark:border-slate-700 rounded-none shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-1">
              <div className="p-1 border-b border-slate-200 dark:border-slate-800 mb-1">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Type to filter fields..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter('');
                  setCategorySearch('');
                  setIsCategoryOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-none transition-all flex items-center justify-between cursor-pointer font-sans ${
                  !selectedCategoryFilter ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Categories</span>
                {!selectedCategoryFilter && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              {filteredCategories.map(cat => {
                const isSelected = selectedCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setCategorySearch('');
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-none transition-all flex items-center justify-between cursor-pointer font-sans ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter 4: Skills Multi-Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Required Skills
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Type skill & press Add..."
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans shadow-2xs"
          />
          <button
            type="button"
            onClick={() => handleAddSkill()}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {/* Selected Skill Badges */}
        {skillList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skillList.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 text-[10px] font-sans font-semibold rounded-none"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Skills Quick-Add */}
        <div className="pt-1">
          <span className="text-[10px] font-headline font-bold text-slate-700 dark:text-slate-300 tracking-wider block mb-1">
            Popular:
          </span>
          <div className="flex flex-wrap gap-1">
            {POPULAR_SKILLS.map(skill => {
              const active = skillList.some(s => s.toLowerCase() === skill.toLowerCase());
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (active) handleRemoveSkill(skill);
                    else handleAddSkill(skill);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-none border transition-colors cursor-pointer font-sans shadow-2xs ${
                    active
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-400 dark:border-blue-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-500 font-medium'
                  }`}
                >
                  {active ? `✓ ${skill}` : `+ ${skill}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter 5: Budget Range */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span className="font-bold text-blue-700 dark:text-blue-400">₹</span>
          Budget Range (INR)
        </label>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {BUDGET_PRESETS.map((p, idx) => {
            const active = isPresetActive(p);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetBudget(p)}
                className={`py-1 px-2 text-[10px] rounded-none border text-center transition-colors cursor-pointer font-headline tracking-wider shadow-2xs ${
                  active
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 font-medium'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-sans font-semibold block mb-1">Min (₹)</span>
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="0"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans shadow-2xs"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-sans font-semibold block mb-1">Max (₹)</span>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="No limit"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Filter 6: Delivery Timeline */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Delivery Timeline
        </label>
        <div className="space-y-1">
          {DELIVERY_OPTIONS.map(opt => (
            <label
              key={opt.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-none border text-xs cursor-pointer transition-colors font-sans shadow-2xs ${
                deliveryTimeline === opt.id
                  ? 'bg-blue-100 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="deliveryTimeline"
                value={opt.id}
                checked={deliveryTimeline === opt.id}
                onChange={() => setDeliveryTimeline(opt.id)}
                className="accent-primary"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter 7: Skill Level Requirement (Min Rating) */}
      <div className="space-y-2">
        <label className="block text-[11px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          Required Skill Level
        </label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-blue-600 focus:outline-none font-sans cursor-pointer shadow-2xs"
        >
          {RATING_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-surface text-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter 8: Client Verification Checkbox */}
      <div className="pt-1">
        <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none cursor-pointer hover:border-blue-500 transition-colors shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">Verified Clients Only</p>
              <p className="text-[10px] font-sans text-slate-500 dark:text-slate-400">Trusted employers & verified companies</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 accent-primary rounded-none cursor-pointer"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:brightness-110 text-on-primary rounded-none font-headline font-bold text-xs tracking-wider transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Apply Filters
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-slate-800 dark:text-slate-200 hover:text-slate-900 text-xs font-headline font-bold tracking-wider transition-all cursor-pointer text-center shadow-2xs"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Telemetry info */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-sans text-slate-600 dark:text-slate-400 flex items-center justify-between">
        <span>Matching Gigs:</span>
        <span className="font-bold text-slate-900 dark:text-slate-100 font-headline">{totalGigs}</span>
      </div>
    </aside>
  );
}
