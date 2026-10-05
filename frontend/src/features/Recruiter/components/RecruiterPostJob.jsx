import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  MapPin, 
  ListChecks, 
  Clock, 
  ChevronDown, 
  Check, 
  AlertCircle,
  History,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Lock
} from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import { ToastNotification } from '../../../utils/errorFormatter';

const WORK_MODE_OPTIONS = [
  'Work from office',
  'Remote',
  'Hybrid'
];

const EDUCATION_OPTIONS = [
  'Any Graduate / Postgraduate',
  'B.Tech / B.E. (Engineering / Tech)',
  'BCA / MCA (Computer Applications)',
  'B.Sc / M.Sc (Computer Science / IT)',
  'BBA / MBA (Business & Management)',
  'B.Com / M.Com (Finance & Commerce)',
  'Diploma / Polytechnic',
  'Doctorate / PhD',
  'Other Non-Technical Degree'
];

const JOINING_MONTH_OPTIONS = [
  'Immediate',
  'Within 15 Days',
  'Within 1 Month',
  'Next Month',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  const pattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
  return pattern.test(s);
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'recently';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
}

function getRemainingDays(createdAt, activeDays) {
  if (!createdAt) return 30;
  const expiryTime = new Date(createdAt).getTime() + (activeDays || 30) * 24 * 60 * 60 * 1000;
  const remainingMs = expiryTime - Date.now();
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

function mapErrorMessageToField(errMsg) {
  if (!errMsg) return { field: 'general', msg: 'An error occurred' };
  const lower = errMsg.toLowerCase();

  if (lower.includes('description') || lower.includes('summary')) {
    return { field: 'jobDesc', msg: errMsg };
  }
  if (lower.includes('title') || lower.includes('designation')) {
    return { field: 'designation', msg: errMsg };
  }
  if (lower.includes('company')) {
    return { field: 'companyName', msg: errMsg };
  }
  if (lower.includes('location')) {
    return { field: 'location', msg: errMsg };
  }
  if (lower.includes('responsibilit')) {
    return { field: 'roleResponsibilities', msg: errMsg };
  }
  if (lower.includes('skill') || lower.includes('stack')) {
    return { field: 'reqs', msg: errMsg };
  }
  if (lower.includes('duration')) {
    return { field: 'duration', msg: errMsg };
  }
  if (lower.includes('workmode') || lower.includes('work mode') || lower.includes('type of job')) {
    return { field: 'workMode', msg: errMsg };
  }

  return { field: 'jobDesc', msg: errMsg };
}

function scrollToField(fieldKey) {
  setTimeout(() => {
    const el = document.getElementById(`field-container-${fieldKey}`) || document.getElementById(`input-${fieldKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const input = el.querySelector('input, textarea, select, button');
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }
  }, 80);
}

export default function RecruiterPostJob({ 
  company, 
  user, 
  submittingJob, 
  handlePostJob, 
  recentJobs = [], 
  goToTab,
  setAlertConfig 
}) {
  // Hiring Option Type: 'JOB' or 'INTERNSHIP'
  const [opportunityType, setOpportunityType] = useState('JOB');

  // Form states
  const [designation, setDesignation] = useState('');
  
  // Type of Job (Work Mode) Dropdown: 'Work from office', 'Remote', 'Hybrid'
  const [workMode, setWorkMode] = useState('Work from office');
  const [isWorkModeDropdownOpen, setIsWorkModeDropdownOpen] = useState(false);
  
  // Company details auto-populated from company profile (read-only)
  const [companyName, setCompanyName] = useState(company?.name || user?.name || '');
  const [officialWebsite, setOfficialWebsite] = useState(company?.website || '');
  const [location, setLocation] = useState(company?.location || '');

  useEffect(() => {
    if (company) {
      if (company.name) setCompanyName(company.name);
      if (company.location) setLocation(company.location);
      if (company.website) setOfficialWebsite(company.website);
    } else if (user?.name && !companyName) {
      setCompanyName(user.name);
    }
  }, [company, user]);

  // Preferred Education Dropdown
  const [preferredEducation, setPreferredEducation] = useState('Any Graduate / Postgraduate');
  const [isEduDropdownOpen, setIsEduDropdownOpen] = useState(false);

  // Desired Experience Dropdown
  const [desiredExperience, setDesiredExperience] = useState('0-1 Years');
  const [isExpDropdownOpen, setIsExpDropdownOpen] = useState(false);

  const EXPERIENCE_OPTIONS = [
    '0-1 Years',
    '1-2 Years',
    '2-3 Years',
    '3-4 Years',
    '4-5 Years',
    'More than 5 Years'
  ];

  const [stipendPartTime, setStipendPartTime] = useState('');
  const [stipendFullTime, setStipendFullTime] = useState('');
  const [showSalary, setShowSalary] = useState(true);
  const [duration, setDuration] = useState('');

  // Location URL (Links only)
  const [locationUrl, setLocationUrl] = useState('');
  const [activeDays, setActiveDays] = useState(30);

  // Joining Month Dropdown
  const [joiningMonth, setJoiningMonth] = useState('Immediate');
  const [isJoiningMonthDropdownOpen, setIsJoiningMonthDropdownOpen] = useState(false);

  const [openings, setOpenings] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [roleResponsibilities, setRoleResponsibilities] = useState('');

  // Required skills thresholds
  const [reqs, setReqs] = useState([]);
  const [selectedReqSkill, setSelectedReqSkill] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  // Selection process rounds
  const [rounds, setRounds] = useState([]);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDesc, setNewRoundDesc] = useState('');

  // Field validation errors state & local toast fallback
  const [errors, setErrors] = useState({});
  const [localAlert, setLocalAlert] = useState(null);

  const showAlert = (message, type = 'warning') => {
    if (typeof setAlertConfig === 'function') {
      setAlertConfig({ message, type });
    } else {
      setLocalAlert({ message, type });
    }
  };

  const handleAddRound = (e) => {
    e.preventDefault();
    if (!newRoundName.trim() || !newRoundDesc.trim()) return;

    setRounds(prev => [
      ...prev,
      {
        roundNumber: prev.length + 1,
        name: newRoundName.trim(),
        description: newRoundDesc.trim()
      }
    ]);
    setNewRoundName('');
    setNewRoundDesc('');
  };

  const handleRemoveRound = (idxToRemove) => {
    setRounds(prev => {
      const filtered = prev.filter((_, idx) => idx !== idxToRemove);
      return filtered.map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!designation.trim()) {
      newErrors.designation = 'Designation (Job Title) is required.';
    }
    if (!workMode || !workMode.trim()) {
      newErrors.workMode = 'Type of Job is required.';
    }
    if (!companyName.trim()) {
      newErrors.companyName = 'Company Name is required (from company profile).';
    }
    if (!location.trim()) {
      newErrors.location = 'Headquarters Location is required (from company profile).';
    }
    if (opportunityType === 'INTERNSHIP' && !duration.trim()) {
      newErrors.duration = 'Duration is required for internships.';
    }
    if (!jobDesc.trim()) {
      newErrors.jobDesc = 'Opportunity Summary is required.';
    } else if (jobDesc.trim().length < 10) {
      newErrors.jobDesc = 'Description must be at least 10 characters long.';
    }
    if (!roleResponsibilities.trim()) {
      newErrors.roleResponsibilities = 'Role Responsibilities are required.';
    } else if (roleResponsibilities.trim().length < 10) {
      newErrors.roleResponsibilities = 'Role responsibilities must be at least 10 characters long.';
    }
    if (reqs.length === 0) {
      newErrors.reqs = 'Please add at least one required skill threshold.';
    }
    if (officialWebsite?.trim() && !isValidUrl(officialWebsite)) {
      newErrors.officialWebsite = 'Official Website must be a valid link (e.g. https://company.com).';
    }
    if (locationUrl?.trim() && !isValidUrl(locationUrl)) {
      newErrors.locationUrl = 'Location URL must be a valid link (e.g. https://maps.google.com/...).';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      showAlert(formErrors[firstErrorKey] || 'Please fill out all mandatory fields marked with an asterisk (*).', 'warning');
      scrollToField(firstErrorKey);
      return;
    }

    const payload = {
      opportunityType,
      title: designation,
      designation,
      workMode,
      description: jobDesc,
      companyName,
      officialWebsite,
      preferredEducation,
      desiredExperience,
      stipendPartTime,
      stipendFullTime,
      duration: opportunityType === 'INTERNSHIP' ? (duration ? `${duration} Months` : null) : null,
      roleResponsibilities,
      location,
      locationUrl,
      activeDays: activeDays ? parseInt(activeDays, 10) : 30,
      joiningMonth: joiningMonth.trim() || 'Immediate',
      openings: openings ? parseInt(openings, 10) : null,
      showSalary,
      selectionProcess: rounds,
      requirements: reqs
    };

    const res = await handlePostJob(payload);
    if (res && res.success) {
      setErrors({});
      setDesignation('');
      setWorkMode('Work from office');
      setPreferredEducation('Any Graduate / Postgraduate');
      setDesiredExperience('0-1 Years');
      setStipendPartTime('');
      setStipendFullTime('');
      setShowSalary(true);
      setDuration('');
      setLocationUrl('');
      setActiveDays(30);
      setJoiningMonth('Immediate');
      setOpenings('');
      setJobDesc('');
      setRoleResponsibilities('');
      setReqs([]);
      setRounds([]);
    } else if (res && res.error) {
      const { field, msg } = mapErrorMessageToField(res.error);
      setErrors(prev => ({ ...prev, [field]: msg }));
      showAlert(res.error, 'error');
      scrollToField(field);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 pb-16 text-left">
      
      {/* Left Column: Form & Executive Header */}
      <div className="w-full space-y-6 min-w-0 animate-fade-in">
        
        {/* Recruiter Executive Top Header Banner */}
        <header className="bg-surface border border-slate-300 dark:border-slate-700 p-5 sm:p-6 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-2">
              <span>Job Publishing</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Post New Opportunity
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-sans font-medium mt-1">
              Specify position criteria, minimum skill rating thresholds, and selection rounds for candidate matching.
            </p>
          </div>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          
          {/* Unified Opportunity Creation Container */}
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs divide-y divide-slate-300 dark:divide-slate-700">
            
            {/* STEP 1: Opportunity Type Selection */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <label className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-blue-700"></span>
                  Select Opportunity Type <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  STEP 1 OF 5
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {[
                  { 
                    id: 'JOB', 
                    label: 'Full-Time / Part-Time Job', 
                    desc: 'Permanent career roles with competitive compensation packages' 
                  },
                  { 
                    id: 'INTERNSHIP', 
                    label: 'Internship', 
                    desc: 'Fixed-duration positions with structured monthly stipends' 
                  },
                ].map((opt) => {
                  const isSelected = opportunityType === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setOpportunityType(opt.id);
                        setErrors({});
                      }}
                      className={`p-4 sm:p-5 rounded-none border transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-700 dark:border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-600 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-headline ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {opt.label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-none bg-blue-700 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                        {opt.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Role & Company Details */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span>Role & Company Details</span>
                  </h3>
                  <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    STEP 2 OF 5
                  </span>
                </div>
                <p className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Note: Company details are auto-populated from your verified profile and locked as read-only.</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Designation Field (Alphabetical only) */}
                <div id="field-container-designation" className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Designation (Job Title) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-designation"
                      type="text"
                      className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-2xs ${
                        errors.designation
                          ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                      }`}
                      placeholder="e.g. Senior Full-Stack Developer"
                      value={designation}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setDesignation(cleaned);
                        if (errors.designation) setErrors(prev => ({ ...prev, designation: null }));
                      }}
                      onKeyDown={e => {
                        if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.designation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-600 pointer-events-none">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  {errors.designation && (
                    <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                      <span>{errors.designation}</span>
                    </p>
                  )}
                </div>

                {/* Type of Job (Work Mode) Dropdown */}
                <div id="field-container-workMode" className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Type of Job <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <button
                      id="input-workMode"
                      type="button"
                      onClick={() => setIsWorkModeDropdownOpen(!isWorkModeDropdownOpen)}
                      className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 text-left flex items-center justify-between focus:outline-none transition-all cursor-pointer font-sans shadow-2xs ${
                        errors.workMode
                          ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                      }`}
                    >
                      <span className="truncate">{workMode || 'Select Type of Job'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${isWorkModeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isWorkModeDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsWorkModeDropdownOpen(false)}
                        />
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-56 overflow-y-auto custom-scrollbar">
                          {WORK_MODE_OPTIONS.map((mode) => {
                            const isSelected = workMode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                  setWorkMode(mode);
                                  setIsWorkModeDropdownOpen(false);
                                  if (errors.workMode) setErrors(prev => ({ ...prev, workMode: null }));
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold' 
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <span>{mode}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  {errors.workMode && (
                    <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                      <span>{errors.workMode}</span>
                    </p>
                  )}
                </div>

                {/* Company Name Field (Auto-populated from Company Profile, Read-Only) */}
                <div id="field-container-companyName" className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      Company Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> From Profile (Read-Only)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-companyName"
                      type="text"
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-2xs focus:outline-none"
                      placeholder="Company Name"
                      value={companyName}
                    />
                  </div>
                </div>

                {/* Official Website (Auto-populated from Company Profile, Read-Only) */}
                <div id="field-container-officialWebsite" className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      Official Website
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> From Profile (Read-Only)
                    </span>
                  </div>
                  <input
                    id="input-officialWebsite"
                    type="url"
                    readOnly={Boolean(company?.website)}
                    className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans shadow-2xs focus:outline-none transition-all ${
                      company?.website
                        ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                        : errors.officialWebsite
                          ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                    }`}
                    placeholder="https://company.com"
                    value={officialWebsite}
                    onChange={e => {
                      if (company?.website) return;
                      const cleaned = e.target.value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g, '');
                      setOfficialWebsite(cleaned);
                      if (errors.officialWebsite) setErrors(prev => ({ ...prev, officialWebsite: null }));
                    }}
                    onKeyDown={e => {
                      if (company?.website) return;
                      if (e.key === ' ' || (!/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.officialWebsite && (
                    <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                      <span>{errors.officialWebsite}</span>
                    </p>
                  )}
                </div>

                {/* Headquarters Location (Auto-populated from Company Profile, Read-Only) */}
                <div id="field-container-location" className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      Headquarters Location <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> From Profile (Read-Only)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="input-location"
                      type="text"
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-2xs focus:outline-none"
                      placeholder="Headquarters Location"
                      value={location}
                    />
                  </div>
                </div>

                {/* Location URL (Only takes links) */}
                <div id="field-container-locationUrl" className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Location URL (Maps / Office Link)
                  </label>
                  <input
                    id="input-locationUrl"
                    type="url"
                    className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-2xs ${
                      errors.locationUrl
                        ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                    }`}
                    placeholder="https://maps.google.com/..."
                    value={locationUrl}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g, '');
                      setLocationUrl(cleaned);
                      if (errors.locationUrl) setErrors(prev => ({ ...prev, locationUrl: null }));
                    }}
                    onKeyDown={e => {
                      if (e.key === ' ' || (!/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.locationUrl && (
                    <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                      <span>{errors.locationUrl}</span>
                    </p>
                  )}
                </div>

                {/* Openings Count (Numeric input only) */}
                <div id="field-container-openings" className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    No of Openings
                  </label>
                  <input
                    id="input-openings"
                    type="text"
                    inputMode="numeric"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    placeholder="e.g. 3"
                    value={openings}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setOpenings(cleaned);
                    }}
                    onKeyDown={e => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Prerequisites & Skill Matrix */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Candidate Prerequisites & Skill Matrix</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  STEP 3 OF 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Preferred Education (Themed Dropdown) */}
                <div id="field-container-preferredEducation" className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Preferred Education
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEduDropdownOpen(!isEduDropdownOpen)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 text-left flex items-center justify-between focus:border-blue-700 focus:outline-none transition-all cursor-pointer font-sans shadow-2xs"
                    >
                      <span className="truncate">{preferredEducation || 'Select Preferred Education'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${isEduDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isEduDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsEduDropdownOpen(false)} 
                      />
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1 text-left divide-y divide-slate-100 dark:divide-slate-800">
                        {EDUCATION_OPTIONS.map((eduVal) => (
                          <button
                            key={eduVal}
                            type="button"
                            onClick={() => {
                              setPreferredEducation(eduVal);
                              setIsEduDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-none transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              preferredEducation === eduVal
                                ? 'bg-blue-700 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <span>{eduVal}</span>
                            {preferredEducation === eduVal && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Desired Experience (Themed Dropdown) */}
                <div id="field-container-desiredExperience" className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Desired Experience <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsExpDropdownOpen(!isExpDropdownOpen)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 text-left flex items-center justify-between focus:border-blue-700 focus:outline-none transition-all cursor-pointer font-sans shadow-2xs"
                    >
                      <span>{desiredExperience || 'Select Experience Range'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${isExpDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isExpDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsExpDropdownOpen(false)} 
                      />
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1 text-left">
                        {EXPERIENCE_OPTIONS.map((expVal) => (
                          <button
                            key={expVal}
                            type="button"
                            onClick={() => {
                              setDesiredExperience(expVal);
                              setIsExpDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-none transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              desiredExperience === expVal
                                ? 'bg-blue-700 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <span>{expVal}</span>
                            {desiredExperience === expVal && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Required Skills list */}
              <div id="field-container-reqs" className="space-y-3 pt-2">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Required Stacks & Rating Thresholds <span className="text-rose-500 font-bold">*</span>
                </label>

                <div className="flex gap-2.5 relative">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-2xs ${
                        errors.reqs
                          ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                      }`}
                      placeholder="Search and select a skill (e.g. React.js, Python, AWS)..."
                      value={selectedReqSkill}
                      onChange={e => {
                        setSelectedReqSkill(e.target.value);
                        setIsSkillDropdownOpen(true);
                        if (errors.reqs) setErrors(prev => ({ ...prev, reqs: null }));
                      }}
                      onFocus={() => setIsSkillDropdownOpen(true)}
                    />

                    {/* Skills Dropdown */}
                    {isSkillDropdownOpen && selectedReqSkill.trim() !== '' && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {ALL_SKILLS.filter(s =>
                          s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 font-sans font-medium text-center">No matching skills found</div>
                        ) : (
                          ALL_SKILLS.filter(s =>
                            s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase())
                          ).slice(0, 10).map((s) => (
                            <button
                              key={s.skill}
                              type="button"
                              onClick={() => {
                                setSelectedReqSkill(s.skill);
                                setIsSkillDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-400 transition-all flex items-center justify-between group cursor-pointer rounded-none font-sans"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[10px] font-sans font-normal capitalize px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                {s.type}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = selectedReqSkill.trim();
                      if (!trimmed) return;
                      const match = ALL_SKILLS.find(
                        s => s.skill.toLowerCase() === trimmed.toLowerCase()
                      );
                      if (!match) {
                        setErrors(prev => ({ ...prev, reqs: 'Please select a valid skill from the suggestions list.' }));
                        return;
                      }
                      if (reqs.some(exist => exist.skillName.toLowerCase() === match.skill.toLowerCase())) {
                        setErrors(prev => ({ ...prev, reqs: 'This skill requirement has already been added.' }));
                        return;
                      }
                      const isTech = match.type === 'technical';
                      setReqs(prev => [...prev, { skillName: match.skill, minRating: isTech ? 4 : 0 }]);
                      setSelectedReqSkill('');
                      if (errors.reqs) setErrors(prev => ({ ...prev, reqs: null }));
                    }}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add Skill
                  </button>
                </div>

                {errors.reqs && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                    <span>{errors.reqs}</span>
                  </p>
                )}

                {reqs.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-none text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium">No skill requirements added yet. Search and add skills above.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="p-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none space-y-3 shadow-2xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-headline text-sm">{r.skillName}</span>
                            <div className="flex items-center gap-3">
                              {isTech ? (
                                <span className="text-white font-headline font-bold text-xs bg-blue-700 px-2.5 py-1 rounded-none shadow-2xs border border-blue-800">
                                  Required Level: Lvl {r.minRating}/10
                                </span>
                              ) : (
                                <span className="text-slate-800 dark:text-slate-200 font-headline font-bold text-xs tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-none">
                                  Required Skill
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-headline font-bold text-xs cursor-pointer transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {isTech && (
                            <div className="space-y-1.5 pt-1">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={r.minRating}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10);
                                  setReqs(prev => prev.map(item => item.skillName === r.skillName ? { ...item, minRating: val } : item));
                                }}
                                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-none appearance-none cursor-pointer accent-blue-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-700 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-xs [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-700 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:shadow-xs [&::-moz-range-thumb]:cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${((r.minRating - 1) / 9) * 100}%, #cbd5e1 ${((r.minRating - 1) / 9) * 100}%, #cbd5e1 100%)`
                                }}
                              />
                              <div className="flex justify-between items-center text-[10px] font-headline font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                                <span>Lvl 1 (Novice)</span>
                                <span>Lvl 5 (Proficient)</span>
                                <span>Lvl 10 (Master)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: Compensation & Schedule */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Compensation & Schedule</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  STEP 4 OF 5
                </span>
              </div>

              {/* Candidate Salary Visibility Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {showSalary ? (
                      <Eye className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    )}
                    <span className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">
                      Candidate Salary Visibility
                    </span>
                    <span className={`text-[10px] font-headline font-bold px-2 py-0.5 rounded-none tracking-wider uppercase border ${
                      showSalary 
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-400 dark:border-slate-600'
                    }`}>
                      {showSalary ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                    {showSalary
                      ? `Candidates will see the posted ${opportunityType === 'INTERNSHIP' ? 'stipend' : 'salary'} on the job post.`
                      : `Candidates will NOT see numerical compensation on the job post (displayed as Undisclosed).`}
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showSalary}
                    onClick={() => setShowSalary(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                      showSalary ? 'bg-blue-700' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        showSalary ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-headline font-bold text-slate-700 dark:text-slate-300 min-w-[70px]">
                    {showSalary ? 'Show Salary' : 'Hide Salary'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Part-Time Compensation (Numeric only) */}
                <div id="field-container-stipendPartTime" className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Part-Time)' : 'Salary/Month (Part-Time)'}
                  </label>
                  <input
                    id="input-stipendPartTime"
                    type="text"
                    inputMode="numeric"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    placeholder={opportunityType === 'INTERNSHIP' ? "e.g. 5000" : "e.g. 20000"}
                    value={stipendPartTime}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setStipendPartTime(cleaned);
                    }}
                    onKeyDown={e => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Full-Time Compensation (Numeric only) */}
                <div id="field-container-stipendFullTime" className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Full-Time)' : 'Salary/Month (Full-Time)'}
                  </label>
                  <input
                    id="input-stipendFullTime"
                    type="text"
                    inputMode="numeric"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    placeholder={opportunityType === 'INTERNSHIP' ? "e.g. 12000" : "e.g. 45000"}
                    value={stipendFullTime}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setStipendFullTime(cleaned);
                    }}
                    onKeyDown={e => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Duration Field (for Internships, Numeric only) */}
                {opportunityType === 'INTERNSHIP' && (
                  <div id="field-container-duration" className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      Duration (Months) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="input-duration"
                        type="text"
                        inputMode="numeric"
                        className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-2xs ${
                          errors.duration
                            ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                        }`}
                        placeholder="e.g. 3 (Months)"
                        value={duration}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          setDuration(cleaned);
                          if (errors.duration) setErrors(prev => ({ ...prev, duration: null }));
                        }}
                        onKeyDown={e => {
                          if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {errors.duration && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-600 pointer-events-none">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {errors.duration && (
                      <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                        <span>{errors.duration}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Joining Month (Themed Dropdown) */}
                <div id="field-container-joiningMonth" className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Joining Month
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsJoiningMonthDropdownOpen(!isJoiningMonthDropdownOpen)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 text-left flex items-center justify-between focus:border-blue-700 focus:outline-none transition-all cursor-pointer font-sans shadow-2xs"
                    >
                      <span>{joiningMonth || 'Immediate'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${isJoiningMonthDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isJoiningMonthDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsJoiningMonthDropdownOpen(false)} 
                      />
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1 text-left divide-y divide-slate-100 dark:divide-slate-800">
                        {JOINING_MONTH_OPTIONS.map((monthVal) => (
                          <button
                            key={monthVal}
                            type="button"
                            onClick={() => {
                              setJoiningMonth(monthVal);
                              setIsJoiningMonthDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-none transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              joiningMonth === monthVal
                                ? 'bg-blue-700 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <span>{monthVal}</span>
                            {joiningMonth === monthVal && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* STEP 5: Description & Recruitment Process */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Description & Recruitment Process</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  STEP 5 OF 5
                </span>
              </div>

              {/* Job Description Field */}
              <div id="field-container-jobDesc" className="space-y-1.5">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Opportunity Summary <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="input-jobDesc"
                    rows="4"
                    className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-3 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all custom-scrollbar shadow-2xs ${
                      errors.jobDesc
                        ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                    }`}
                    placeholder="Engaging high-level summary of the opportunity..."
                    value={jobDesc}
                    onChange={e => {
                      setJobDesc(e.target.value);
                      if (errors.jobDesc) setErrors(prev => ({ ...prev, jobDesc: null }));
                    }}
                  ></textarea>
                  {errors.jobDesc && (
                    <div className="absolute right-3 top-3 text-rose-600 pointer-events-none">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {errors.jobDesc && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                    <span>{errors.jobDesc}</span>
                  </p>
                )}
              </div>

              {/* Role Responsibilities Field */}
              <div id="field-container-roleResponsibilities" className="space-y-1.5">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Role and Responsibilities <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="input-roleResponsibilities"
                    rows="4"
                    className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-3 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:outline-none transition-all custom-scrollbar shadow-2xs ${
                      errors.roleResponsibilities
                        ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                    }`}
                    placeholder="Describe tasks, day-to-day workflows, key objectives, and deliverables..."
                    value={roleResponsibilities}
                    onChange={e => {
                      setRoleResponsibilities(e.target.value);
                      if (errors.roleResponsibilities) setErrors(prev => ({ ...prev, roleResponsibilities: null }));
                    }}
                  ></textarea>
                  {errors.roleResponsibilities && (
                    <div className="absolute right-3 top-3 text-rose-600 pointer-events-none">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {errors.roleResponsibilities && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1.5 mt-1">
                    <span>{errors.roleResponsibilities}</span>
                  </p>
                )}
              </div>

              {/* Dynamic Selection Process Rounds */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Selection Process Rounds
                </label>
                
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 space-y-4 shadow-2xs">
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="md:col-span-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                        placeholder="e.g. Round 1: Technical Assessment"
                        value={newRoundName}
                        onChange={e => setNewRoundName(e.target.value)}
                      />
                      <input
                        type="text"
                        className="md:col-span-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                        placeholder="e.g. 45 min test on System Architecture and DSA"
                        value={newRoundDesc}
                        onChange={e => setNewRoundDesc(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRound}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs transition-all flex items-center gap-1.5 w-max cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Process Round
                    </button>
                  </div>

                  {rounds.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
                      No selection rounds added. Add evaluation stages above.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {rounds.map((round, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-headline font-bold text-blue-700 dark:text-blue-400 tracking-wider">
                              Round #{round.roundNumber}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-headline">{round.name}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{round.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRound(idx)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-rose-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Listing Duration (Numeric only) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Listing Active Duration (Days) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                  placeholder="e.g. 30"
                  value={activeDays}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setActiveDays(cleaned ? parseInt(cleaned, 10) : '');
                  }}
                  onKeyDown={e => {
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                  Specify how many days this opportunity listing will remain active before automatic archive.
                </p>
              </div>

            </div>

          </div>

          {/* Submit Action Button */}
          <div>
            <button
              type="submit"
              disabled={submittingJob}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-headline font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{submittingJob ? 'Publishing Opportunity...' : 'Publish Opportunity'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Right Column: Sticky Sidebar for Your Recent Postings */}
      <aside className="w-full sticky top-6 self-start space-y-6 z-10">
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-headline text-slate-900 dark:text-slate-100 tracking-wider">
              Your Recent Postings
            </h3>
            <button
              type="button"
              onClick={() => goToTab && goToTab('jobs')}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer p-1"
              title="View All Postings"
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          {/* List of recent postings */}
          {recentJobs && recentJobs.length > 0 ? (
            <div className="space-y-3">
              {[...recentJobs]
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 4)
                .map((job) => {
                  const remainingDays = getRemainingDays(job.createdAt, job.activeDays);
                  const isActive = remainingDays > 0;
                  const formattedTime = formatTimeAgo(job.createdAt);

                  return (
                    <div
                      key={job.id || job._id}
                      onClick={() => goToTab && goToTab('jobs')}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-3.5 space-y-1.5 hover:border-blue-700 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors font-headline line-clamp-1">
                          {job.title}
                        </h4>
                        <span className={`text-[9px] font-headline font-bold px-2 py-0.5 rounded-none tracking-wider shrink-0 border ${
                          isActive 
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          {isActive ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400">
                        Posted {formattedTime}
                      </p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-none text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">No recent postings yet.</p>
            </div>
          )}

          {/* Footer View All button */}
          <button
            type="button"
            onClick={() => goToTab && goToTab('jobs')}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-700 rounded-none text-xs font-headline font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <span>View All Postings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Local Slide-in Toast Notification fallback */}
      {localAlert && (
        <ToastNotification 
          msg={localAlert.message} 
          type={localAlert.type} 
          onClose={() => setLocalAlert(null)} 
        />
      )}
    </div>
  );
}
