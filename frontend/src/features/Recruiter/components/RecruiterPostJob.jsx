import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  HelpCircle, 
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
  ArrowRight
} from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import { INDIAN_STATES } from '../../../constants/indianStates';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';

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
  if (lower.includes('budget')) {
    return { field: 'budget', msg: errMsg };
  }
  if (lower.includes('delivery')) {
    return { field: 'deliveryTime', msg: errMsg };
  }

  return { field: 'jobDesc', msg: errMsg };
}

function scrollToField(fieldKey) {
  setTimeout(() => {
    const el = document.getElementById(`field-container-${fieldKey}`) || document.getElementById(`input-${fieldKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea, select, button');
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }
  }, 80);
}

export default function RecruiterPostJob({ company, user, submittingJob, handlePostJob, recentJobs = [], goToTab }) {
  const todayString = new Date().toISOString().split('T')[0];

  // Hiring Option Type
  const [opportunityType, setOpportunityType] = useState('JOB'); // 'JOB', 'INTERNSHIP', 'GIG'

  // Form states
  const [designation, setDesignation] = useState('');
  const [companyName, setCompanyName] = useState(company?.name || user?.name || '');

  useEffect(() => {
    if (!companyName && (company?.name || user?.name)) {
      setCompanyName(company?.name || user?.name || '');
    }
  }, [company, user]);
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [preferredEducation, setPreferredEducation] = useState('');
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
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');

  const LOCATION_OPTIONS = ['Work from home / Remote', ...INDIAN_STATES];

  const filteredLocations = LOCATION_OPTIONS.filter(loc =>
    loc.toLowerCase().includes(locationSearchTerm.toLowerCase())
  );

  const [locationUrl, setLocationUrl] = useState('');
  const [activeDays, setActiveDays] = useState(30);
  const [openings, setOpenings] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [roleResponsibilities, setRoleResponsibilities] = useState('');

  // Gig specific states
  const [budget, setBudget] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  // Required skills thresholds
  const [reqs, setReqs] = useState([]);
  const [selectedReqSkill, setSelectedReqSkill] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  // Selection process rounds
  const [rounds, setRounds] = useState([]);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDesc, setNewRoundDesc] = useState('');

  // Field validation errors state
  const [errors, setErrors] = useState({});

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

    if (opportunityType === 'GIG') {
      if (!designation.trim()) {
        newErrors.designation = 'Gig Title is required.';
      }
      if (!location.trim()) {
        newErrors.location = 'Location is required.';
      }
      if (!budget || isNaN(budget) || parseFloat(budget) <= 0) {
        newErrors.budget = 'Valid project budget is required.';
      }
      if (!deliveryTime.trim()) {
        newErrors.deliveryTime = 'Delivery time is required.';
      }
      if (!jobDesc.trim()) {
        newErrors.jobDesc = 'Gig description is required.';
      } else if (jobDesc.trim().length < 10) {
        newErrors.jobDesc = 'Description must be at least 10 characters long.';
      }
      if (reqs.length === 0) {
        newErrors.reqs = 'Please add at least one required skill.';
      }
    } else {
      if (!designation.trim()) {
        newErrors.designation = 'Designation (Job Title) is required.';
      }
      if (!companyName.trim()) {
        newErrors.companyName = 'Company Name is required.';
      }
      if (!location.trim()) {
        newErrors.location = 'Location is required.';
      }
      if (opportunityType === 'INTERNSHIP' && !duration.trim()) {
        newErrors.duration = 'Duration is required.';
      }
      if (!jobDesc.trim()) {
        newErrors.jobDesc = 'Job / Internship Summary is required.';
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
    }

    setErrors(newErrors);
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      scrollToField(firstErrorKey);
      return;
    }

    let payload;
    if (opportunityType === 'GIG') {
      payload = {
        opportunityType: 'GIG',
        title: designation,
        description: jobDesc,
        skills: reqs.map(r => r.skillName),
        requirements: reqs,
        budget: parseFloat(budget),
        deliveryTime,
        minRating: reqs.length > 0 ? Math.max(...reqs.map(r => r.minRating || 1)) : 4,
        attachmentFile
      };
    } else {
      payload = {
        opportunityType,
        title: designation,
        designation,
        description: jobDesc,
        companyName,
        officialWebsite,
        preferredEducation,
        desiredExperience,
        stipendPartTime,
        stipendFullTime,
        duration: opportunityType === 'INTERNSHIP' ? duration : null,
        roleResponsibilities,
        location,
        locationUrl,
        activeDays: activeDays ? parseInt(activeDays, 10) : 30,
        openings: openings ? parseInt(openings, 10) : null,
        selectionProcess: rounds,
        requirements: reqs
      };
    }

    const res = await handlePostJob(payload);
    if (res && res.success) {
      setErrors({});
      setDesignation('');
      setCompanyName('');
      setOfficialWebsite('');
      setPreferredEducation('');
      setDesiredExperience('0-1 Years');
      setStipendPartTime('');
      setStipendFullTime('');
      setDuration('');
      setLocation('');
      setLocationUrl('');
      setActiveDays(30);
      setOpenings('');
      setJobDesc('');
      setRoleResponsibilities('');
      setReqs([]);
      setRounds([]);
      setBudget('');
      setDeliveryTime('');
      setAttachmentFile(null);
    } else if (res && res.error) {
      const { field, msg } = mapErrorMessageToField(res.error);
      setErrors(prev => ({ ...prev, [field]: msg }));
      scrollToField(field);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 pb-16 text-left selection:bg-primary/20">
      {/* Left Column: Form & Header */}
      <div className="w-full space-y-8 min-w-0 animate-fade-in">
        <PageHeader 
          title="Post New Opportunity" 
          subtitle="Specify position criteria, minimum skill rating thresholds, and selection rounds for candidate matching."
        />

        <form onSubmit={onSubmit} noValidate className="space-y-8">
          
          {/* HIRING OPTION TYPE SELECTION */}
          <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Select Opportunity Type *
              </label>
              <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 1 OF 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {[
                { id: 'JOB', label: 'Full-Time / Part-Time Job', desc: 'Permanent career roles with competitive packages' },
                { id: 'INTERNSHIP', label: 'Internship', desc: 'Fixed-duration positions with monthly stipends' },
                { id: 'GIG', label: 'Gig (Short-Term Task)', desc: 'Contract task-based milestone deliverables' },
              ].map((opt) => {
                const isSelected = opportunityType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setOpportunityType(opt.id);
                      setErrors({});
                    }}
                    className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-surface-container-high border-primary shadow-md ring-1 ring-primary/30 border-l-4 border-l-primary'
                        : 'bg-surface-container-low border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary font-headline' : 'text-on-surface group-hover:text-primary transition-colors'}`}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-sans text-on-surface-variant leading-relaxed">{opt.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: Role & Company Details */}
          <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> {opportunityType === 'GIG' ? 'Gig Details' : 'Role & Company Details'}
              </h3>
              <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 2 OF 5</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Designation Field */}
              <div id="field-container-designation" className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                  {opportunityType === 'GIG' ? 'Gig Title *' : 'Designation (Job Title) *'}
                </label>
                <div className="relative">
                  <input
                    id="input-designation"
                    type="text"
                    className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                      errors.designation
                        ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                        : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                    placeholder={opportunityType === 'GIG' ? "e.g. Design a responsive landing page" : "e.g. Senior Full-Stack Developer"}
                    value={designation}
                    onChange={e => {
                      setDesignation(e.target.value);
                      if (errors.designation) setErrors(prev => ({ ...prev, designation: null }));
                    }}
                  />
                  {errors.designation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
                      <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                    </div>
                  )}
                </div>
                {errors.designation && (
                  <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                    <span>{errors.designation}</span>
                  </p>
                )}
              </div>

              {/* Company Name Field */}
              {opportunityType !== 'GIG' && (
                <div id="field-container-companyName" className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Company Name *</label>
                  <div className="relative">
                    <input
                      id="input-companyName"
                      type="text"
                      className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                        errors.companyName
                          ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                          : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                      placeholder="e.g. Acme Innovations"
                      value={companyName}
                      onChange={e => {
                        setCompanyName(e.target.value);
                        if (errors.companyName) setErrors(prev => ({ ...prev, companyName: null }));
                      }}
                    />
                    {errors.companyName && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
                        <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                      </div>
                    )}
                  </div>
                  {errors.companyName && (
                    <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                      <span>{errors.companyName}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Official Website */}
              {opportunityType !== 'GIG' && (
                <div id="field-container-officialWebsite" className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Official Website</label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="e.g. https://acme.com"
                    value={officialWebsite}
                    onChange={e => setOfficialWebsite(e.target.value)}
                  />
                </div>
              )}

              {/* Location Field */}
              <div id="field-container-location" className="relative space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">headquarters location</label>
                <div className="relative">
                  <input
                    id="input-location"
                    type="text"
                    className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface pr-10 ${
                      errors.location
                        ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                        : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                    placeholder="Search state/UT or select (e.g. Delhi, Karnataka, Work from home)..."
                    value={location}
                    onChange={e => {
                      setLocation(e.target.value);
                      setLocationSearchTerm(e.target.value);
                      setIsLocationDropdownOpen(true);
                      if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                    }}
                    onFocus={() => setIsLocationDropdownOpen(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer p-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {errors.location && (
                  <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                    <span>{errors.location}</span>
                  </p>
                )}

                {/* Location Popover Dropdown */}
                {isLocationDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsLocationDropdownOpen(false)}
                    ></div>
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1.5 text-left">
                      {filteredLocations.length === 0 ? (
                        <div className="p-3 text-xs text-on-surface-variant text-center font-mono">
                          No matching locations found
                        </div>
                      ) : (
                        filteredLocations.map((locName) => (
                          <button
                            key={locName}
                            type="button"
                            onClick={() => {
                              setLocation(locName);
                              setIsLocationDropdownOpen(false);
                              if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              location === locName
                                ? 'bg-primary text-on-primary font-bold'
                                : 'hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            <span>{locName}</span>
                            {location === locName && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Location URL */}
              {opportunityType !== 'GIG' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Location URL</label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="e.g. https://maps.google.com/..."
                    value={locationUrl}
                    onChange={e => setLocationUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Openings Count */}
              {opportunityType !== 'GIG' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">No of Openings</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="e.g. 3"
                    value={openings}
                    onChange={e => setOpenings(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Prerequisites */}
          {opportunityType !== 'GIG' && (
            <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" /> Candidate Prerequisites & Skill Matrix
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 3 OF 5</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Preferred Education</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="e.g. B.Tech / BCA / Any Graduate"
                    value={preferredEducation}
                    onChange={e => setPreferredEducation(e.target.value)}
                  />
                </div>

                {/* Desired Experience */}
                <div id="field-container-desiredExperience" className="relative space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Desired Experience *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsExpDropdownOpen(!isExpDropdownOpen)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface text-left flex items-center justify-between focus:border-primary focus:outline-none transition-all cursor-pointer font-sans"
                    >
                      <span>{desiredExperience || 'Select Experience Range'}</span>
                      <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
                    </button>
                  </div>

                  {isExpDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsExpDropdownOpen(false)}
                      ></div>
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1.5 text-left">
                        {EXPERIENCE_OPTIONS.map((expVal) => (
                          <button
                            key={expVal}
                            type="button"
                            onClick={() => {
                              setDesiredExperience(expVal);
                              setIsExpDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              desiredExperience === expVal
                                ? 'bg-primary text-on-primary font-bold'
                                : 'hover:bg-surface-container-high text-on-surface'
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
              <div id="field-container-reqs" className="space-y-4 pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                  {opportunityType === 'GIG' ? 'Add Required Skills *' : 'Required Stacks & Rating Thresholds *'}
                </label>

                <div className="flex gap-2.5 relative">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                        errors.reqs
                          ? 'border-error ring-2 ring-error/20 bg-error/5 text-error'
                          : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
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
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {ALL_SKILLS.filter(s =>
                          s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-on-surface-variant font-mono text-center">No matching skills found</div>
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
                              className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group cursor-pointer rounded-lg font-sans"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[10px] font-mono capitalize px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/60 text-on-surface-variant">
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
                    className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm font-headline"
                  >
                    <Plus className="w-4 h-4" /> Add Skill
                  </button>
                </div>

                {errors.reqs && (
                  <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                    <span>{errors.reqs}</span>
                  </p>
                )}

                {reqs.length === 0 ? (
                  <div className="p-4 bg-surface-container-low border border-dashed border-outline-variant/80 rounded-xl text-center">
                    <p className="text-xs text-on-surface-variant font-mono">No skill requirements added yet. Search and add skills above.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-on-surface font-headline">{r.skillName}</span>
                            <div className="flex items-center gap-3">
                              {isTech && opportunityType !== 'GIG' ? (
                                <span className="text-primary font-mono font-bold text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                  Required Level: Lvl {r.minRating}/10
                                </span>
                              ) : (
                                <span className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded">Required Skill</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-error hover:underline text-[11px] font-mono cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {isTech && opportunityType !== 'GIG' && (
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={r.minRating}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                setReqs(prev => prev.map(item => item.skillName === r.skillName ? { ...item, minRating: val } : item));
                              }}
                              className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: Compensation & Schedule / Gig Budget */}
          {opportunityType === 'GIG' ? (
            <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Gig Budget & Timeline
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 3 OF 5</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Budget Field */}
                <div id="field-container-budget" className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Project Budget ($ USD) *</label>
                  <div className="relative">
                    <input
                      id="input-budget"
                      type="number"
                      min="1"
                      className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                        errors.budget
                          ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                          : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                      placeholder="e.g. 500"
                      value={budget}
                      onChange={e => {
                        setBudget(e.target.value);
                        if (errors.budget) setErrors(prev => ({ ...prev, budget: null }));
                      }}
                    />
                    {errors.budget && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
                        <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                      </div>
                    )}
                  </div>
                  {errors.budget && (
                    <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                      <span>{errors.budget}</span>
                    </p>
                  )}
                </div>

                {/* Delivery Time Field */}
                <div id="field-container-deliveryTime" className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Delivery Time / Duration *</label>
                  <div className="relative">
                    <input
                      id="input-deliveryTime"
                      type="text"
                      className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                        errors.deliveryTime
                          ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                          : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                      placeholder="e.g. 5 Days / 2 Weeks"
                      value={deliveryTime}
                      onChange={e => {
                        setDeliveryTime(e.target.value);
                        if (errors.deliveryTime) setErrors(prev => ({ ...prev, deliveryTime: null }));
                      }}
                    />
                    {errors.deliveryTime && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
                        <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                      </div>
                    )}
                  </div>
                  {errors.deliveryTime && (
                    <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                      <span>{errors.deliveryTime}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Upload Specs Attachment (Optional)</label>
                  <input
                    type="file"
                    onChange={e => setAttachmentFile(e.target.files[0])}
                    className="w-full text-xs font-mono text-on-surface bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Compensation & Schedule
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 4 OF 5</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Part-Time)' : 'Salary/Month (Part-Time)'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder={opportunityType === 'INTERNSHIP' ? "e.g. 5000 / Unpaid" : "e.g. 20000 / Competitive"}
                    value={stipendPartTime}
                    onChange={e => setStipendPartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Full-Time)' : 'Salary/Month (Full-Time)'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder={opportunityType === 'INTERNSHIP' ? "e.g. 12000 / Competitive" : "e.g. 45000 / Competitive"}
                    value={stipendFullTime}
                    onChange={e => setStipendFullTime(e.target.value)}
                  />
                </div>

                {/* Duration Field */}
                {opportunityType === 'INTERNSHIP' && (
                  <div id="field-container-duration" className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Duration *</label>
                    <div className="relative">
                      <input
                        id="input-duration"
                        type="text"
                        className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none transition-all text-on-surface ${
                          errors.duration
                            ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                            : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                        }`}
                        placeholder="e.g. 3 Months / 6 Months"
                        value={duration}
                        onChange={e => {
                          setDuration(e.target.value);
                          if (errors.duration) setErrors(prev => ({ ...prev, duration: null }));
                        }}
                      />
                      {errors.duration && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
                          <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                        </div>
                      )}
                    </div>
                    {errors.duration && (
                      <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                        <span>{errors.duration}</span>
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SECTION 4: Description & Process */}
          <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> {opportunityType === 'GIG' ? 'Gig Tasks & Brief' : 'Description & Recruitment Process'}
              </h3>
              <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">STEP 5 OF 5</span>
            </div>

            {/* Job Description Field */}
            <div id="field-container-jobDesc" className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                {opportunityType === 'GIG' ? 'Gig Tasks & Description *' : 'Job / Internship Summary *'}
              </label>
              <div className="relative">
                <textarea
                  id="input-jobDesc"
                  rows="4"
                  className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm font-sans focus:outline-none transition-all text-on-surface custom-scrollbar ${
                    errors.jobDesc
                      ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                      : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                  }`}
                  placeholder={opportunityType === 'GIG' ? "Describe deliverables, specs, and requirements..." : "Engaging high-level summary of the opportunity..."}
                  value={jobDesc}
                  onChange={e => {
                    setJobDesc(e.target.value);
                    if (errors.jobDesc) setErrors(prev => ({ ...prev, jobDesc: null }));
                  }}
                ></textarea>
                {errors.jobDesc && (
                  <div className="absolute right-3 top-3 text-error pointer-events-none">
                    <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                  </div>
                )}
              </div>
              {errors.jobDesc && (
                <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                  <span>{errors.jobDesc}</span>
                </p>
              )}
            </div>

            {/* Role Responsibilities Field */}
            {opportunityType !== 'GIG' && (
              <div id="field-container-roleResponsibilities" className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Role and Responsibilities *</label>
                <div className="relative">
                  <textarea
                    id="input-roleResponsibilities"
                    rows="4"
                    className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm font-sans focus:outline-none transition-all text-on-surface custom-scrollbar ${
                      errors.roleResponsibilities
                        ? 'border-error ring-2 ring-error/20 bg-error/5 text-error font-medium'
                        : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                    placeholder="Describe tasks, day-to-day workflows, key objectives, and deliverables..."
                    value={roleResponsibilities}
                    onChange={e => {
                      setRoleResponsibilities(e.target.value);
                      if (errors.roleResponsibilities) setErrors(prev => ({ ...prev, roleResponsibilities: null }));
                    }}
                  ></textarea>
                  {errors.roleResponsibilities && (
                    <div className="absolute right-3 top-3 text-error pointer-events-none">
                      <AlertCircle className="w-5 h-5 fill-error/20 text-error" />
                    </div>
                  )}
                </div>
                {errors.roleResponsibilities && (
                  <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-1 animate-fade-in font-sans">
                    <span>{errors.roleResponsibilities}</span>
                  </p>
                )}
              </div>
            )}

            {/* Dynamic Selection Process */}
            {opportunityType !== 'GIG' && (
              <div className="space-y-4 pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">Selection Process Rounds</label>
                
                <div className="bg-surface-container-low border border-outline-variant/70 rounded-xl p-4 sm:p-5 space-y-4">
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="md:col-span-1 bg-surface-container border border-outline-variant/80 rounded-xl px-4 py-2.5 text-xs font-sans text-on-surface focus:border-primary focus:outline-none"
                        placeholder="e.g. Round 1: Technical Assessment"
                        value={newRoundName}
                        onChange={e => setNewRoundName(e.target.value)}
                      />
                      <input
                        type="text"
                        className="md:col-span-2 bg-surface-container border border-outline-variant/80 rounded-xl px-4 py-2.5 text-xs font-sans text-on-surface focus:border-primary focus:outline-none"
                        placeholder="e.g. 45 min test on System Architecture and DSA"
                        value={newRoundDesc}
                        onChange={e => setNewRoundDesc(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRound}
                      className="px-4 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-105 transition-all flex items-center gap-1.5 w-max cursor-pointer shadow-xs font-headline"
                    >
                      <Plus className="w-4 h-4" /> Add Process Round
                    </button>
                  </div>

                  {rounds.length === 0 ? (
                    <p className="text-xs text-on-surface-variant font-mono">No selection rounds added. Add evaluation stages above.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {rounds.map((round, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3.5 bg-surface-container border border-outline-variant/60 rounded-xl">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">Round #{round.roundNumber}</span>
                            <h4 className="text-xs font-bold text-on-surface font-headline">{round.name}</h4>
                            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">{round.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRound(idx)}
                            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Listing Duration */}
          {opportunityType !== 'GIG' && (
            <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                <Clock className="w-4 h-4 text-primary" /> Listing Duration Settings
              </h3>
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Active Time (Days) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-sans focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-on-surface"
                  placeholder="e.g. 30"
                  value={activeDays}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 1) {
                      setActiveDays('');
                    } else {
                      setActiveDays(val);
                    }
                  }}
                />
                <p className="text-[10px] text-on-surface-variant/80 font-mono">Specify how many days this opportunity listing will remain active before automatic archive.</p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <Button type="submit" loading={submittingJob} fullWidth size="lg" className="py-4 shadow-md font-headline font-bold">
              {submittingJob ? 'Publishing Opportunity...' : 'Publish Opportunity'}
            </Button>
          </div>

        </form>
      </div>

      {/* Right Column: Sticky Sidebar for Your Recent Postings */}
      <aside className="w-full sticky top-6 self-start space-y-6 z-10">
        <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
            <h3 className="text-base font-bold font-headline text-primary">
              Your Recent Postings
            </h3>
            <button
              type="button"
              onClick={() => goToTab && goToTab('jobs')}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
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
                      className="bg-surface-container-low border border-outline-variant/70 rounded-xl p-3.5 space-y-1.5 hover:border-primary/50 hover:bg-surface-container-high transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors font-headline line-clamp-1">
                          {job.title}
                        </h4>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                          isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                        }`}>
                          {isActive ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-on-surface-variant/80">
                        Posted {formattedTime}
                      </p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low border border-dashed border-outline-variant/80 rounded-xl text-center">
              <p className="text-xs text-on-surface-variant font-mono">No recent postings yet.</p>
            </div>
          )}

          {/* Footer View All button */}
          <button
            type="button"
            onClick={() => goToTab && goToTab('jobs')}
            className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container-high border border-primary/40 hover:border-primary rounded-xl text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer font-headline shadow-2xs"
          >
            <span>View All Postings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </div>
  );
}
