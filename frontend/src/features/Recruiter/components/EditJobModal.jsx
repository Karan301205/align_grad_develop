import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, DollarSign, Calendar, MapPin, ListChecks, X, Globe, Users, Clock, Lock, Eye, EyeOff } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import Button from '../../../components/ui/Button';

export default function EditJobModal({ job, onClose, onUpdate }) {
  if (!job) return null;

  // Form states initialized with job values
  const [designation] = useState(job.designation || job.title || '');
  const [companyName] = useState(job.companyName || job.company?.name || '');
  const [officialWebsite] = useState(job.officialWebsite || '');
  const [preferredEducation, setPreferredEducation] = useState(job.preferredEducation || '');
  const [desiredExperience, setDesiredExperience] = useState(job.desiredExperience || 'Fresher');
  const [stipendPartTime, setStipendPartTime] = useState(job.stipendPartTime || '');
  const [stipendFullTime, setStipendFullTime] = useState(job.stipendFullTime || '');
  const [showSalary, setShowSalary] = useState(job.showSalary !== false);
  const [duration, setDuration] = useState(job.duration || '');
  const [location] = useState(job.location || '');
  const [locationUrl] = useState(job.locationUrl || '');
  const [openings] = useState(job.openings ? String(job.openings) : '');
  const [activeDays, setActiveDays] = useState(job.activeDays || 30);
  const [joiningMonth, setJoiningMonth] = useState(job.joiningMonth || 'Immediate');
  const [jobDesc, setJobDesc] = useState(job.description || '');
  const [roleResponsibilities, setRoleResponsibilities] = useState(job.roleResponsibilities || '');
  const [workMode, setWorkMode] = useState(job.workMode || 'Work from office');

  // Required skills thresholds
  const [reqs, setReqs] = useState(job.requirements || []);
  const [selectedReqSkill, setSelectedReqSkill] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  // Selection process rounds
  const [rounds, setRounds] = useState(job.selectionProcess || []);
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDesc, setNewRoundDesc] = useState('');

  const [saving, setSaving] = useState(false);

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

  const updateReqRating = (skillName, newRating) => {
    setReqs(prev => prev.map(r => {
      if (r.skillName.toLowerCase() === skillName.toLowerCase()) {
        return { ...r, minRating: Number(newRating) };
      }
      return r;
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    const updatedPayload = {
      title: job.title || job.designation || designation,
      designation: job.designation || job.title || designation,
      companyName: job.companyName || companyName,
      officialWebsite: job.officialWebsite || officialWebsite,
      workMode,
      preferredEducation,
      desiredExperience,
      stipendPartTime,
      stipendFullTime,
      duration,
      location: job.location || location,
      locationUrl: job.locationUrl || locationUrl,
      openings: job.openings !== undefined ? job.openings : (openings ? parseInt(openings, 10) : null),
      activeDays: parseInt(activeDays, 10) || 30,
      joiningMonth,
      showSalary,
      description: jobDesc,
      roleResponsibilities,
      requirements: reqs,
      selectionProcess: rounds,
    };

    const success = await onUpdate(job.id, updatedPayload);
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-surface border border-slate-300 dark:border-slate-700 w-full max-w-3xl rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80">
          <div>
            <span className="inline-block px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-1.5">
              Role Configuration
            </span>
            <h3 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100">
              Edit Opportunity Specifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-surface text-left">
          
          {/* SECTION 1: Role & Company Details (Locked & Read-Only) */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-headline font-bold tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Role & Company Details
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-headline font-bold rounded-none bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Locked (Read-Only)</span>
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
              Core role designation, company identity, and location are locked to maintain applicant clarity. Prerequisites, duration, compensation, skills, and rounds can be modified below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Designation (Job Title)</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={designation}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Company Name</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={companyName}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Official Website</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={officialWebsite}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Headquarters Location</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={location}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Location URL</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={locationUrl}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">No of Openings</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed select-none shadow-2xs"
                  value={openings}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Prerequisites */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4">
            <h4 className="text-xs font-headline font-bold tracking-wider text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Candidate Prerequisites
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Type of Job *</label>
                <select
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  value={workMode}
                  onChange={e => setWorkMode(e.target.value)}
                  required
                >
                  <option value="Work from office">Work from office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Preferred Education</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  value={preferredEducation}
                  onChange={e => setPreferredEducation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Desired Experience *</label>
                <select
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  value={desiredExperience}
                  onChange={e => setDesiredExperience(e.target.value)}
                  required
                >
                  <option value="Fresher">Fresher</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3+ Years">3+ Years</option>
                  <option value="Any years of experience">Any years of experience</option>
                </select>
              </div>
            </div>

            {/* Stacks rating */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300">Required Stacks & Rating Thresholds *</label>
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 space-y-3">
                <div className="flex gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search skill..."
                      value={selectedReqSkill}
                      onChange={e => {
                        setSelectedReqSkill(e.target.value);
                        setIsSkillDropdownOpen(true);
                      }}
                      onFocus={() => setIsSkillDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setIsSkillDropdownOpen(false), 200);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                    />
                    {isSkillDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl z-50 max-h-40 overflow-y-auto custom-scrollbar">
                        {ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase()) &&
                               !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        ).length === 0 ? (
                          <div className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 font-sans font-medium">No matching skills</div>
                        ) : (
                          ALL_SKILLS.filter(
                            s => s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase()) &&
                                 !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                          ).map(s => (
                            <button
                              key={s.skill}
                              type="button"
                              onClick={() => {
                                setSelectedReqSkill(s.skill);
                                setIsSkillDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 transition-all flex items-center justify-between"
                            >
                              <span className="font-semibold">{s.skill}</span>
                              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-sans capitalize px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
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
                      const match = ALL_SKILLS.find(s => s.skill.toLowerCase() === trimmed.toLowerCase());
                      if (!match) {
                        alert("Please select a valid skill from recommendations.");
                        return;
                      }
                      if (reqs.some(exist => exist.skillName.toLowerCase() === match.skill.toLowerCase())) {
                        alert("Skill already added.");
                        return;
                      }
                      const isTech = match.type === 'technical';
                      setReqs(prev => [...prev, { skillName: match.skill, minRating: isTech ? 4 : 0 }]);
                      setSelectedReqSkill('');
                    }}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white border border-blue-800 font-headline font-bold rounded-none text-xs shadow-2xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {reqs.length === 0 ? (
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans font-medium">No skills specified.</p>
                ) : (
                  <div className="space-y-2">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-headline font-bold text-slate-900 dark:text-slate-100">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              {isTech ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-headline font-bold text-[10px]">Min: Lvl {r.minRating}/10</span>
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300 font-headline font-bold text-[9px] tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded-none">Non-Technical</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-rose-700 dark:text-rose-400 hover:underline text-[10px] font-bold cursor-pointer"
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
                                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-none appearance-none cursor-pointer accent-blue-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-700 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-xs [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-700 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:shadow-xs [&::-moz-range-thumb]:cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${((r.minRating - 1) / 9) * 100}%, #cbd5e1 ${((r.minRating - 1) / 9) * 100}%, #cbd5e1 100%)`
                                }}
                                value={r.minRating}
                                onChange={e => updateReqRating(r.skillName, e.target.value)}
                              />
                              <div className="flex justify-between items-center text-[9px] font-headline font-bold text-slate-700 dark:text-slate-300 tracking-wider">
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
          </div>

          {/* SECTION 3: Compensation & Schedule */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4">
            <h4 className="text-xs font-headline font-bold tracking-wider text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Compensation & Schedule
            </h4>

            {/* Candidate Salary Visibility Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {showSalary ? (
                    <Eye className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                  <span className="text-[11px] font-headline font-bold text-slate-900 dark:text-slate-100">
                    Candidate Salary Visibility
                  </span>
                  <span className={`text-[9px] font-headline font-bold px-1.5 py-0.5 rounded-none tracking-wider uppercase border ${
                    showSalary 
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-400 dark:border-slate-600'
                  }`}>
                    {showSalary ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <p className="text-[10px] font-sans text-slate-600 dark:text-slate-400">
                  {showSalary
                    ? `Candidates will see the posted ${job.opportunityType === 'INTERNSHIP' ? 'stipend' : 'salary'} on the job post.`
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
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    showSalary ? 'bg-blue-700' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showSalary ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-[11px] font-headline font-bold text-slate-700 dark:text-slate-300 min-w-[65px]">
                  {showSalary ? 'Show Salary' : 'Hide Salary'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {job.opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Part-Time)' : 'Salary/Month (Part-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  value={stipendPartTime}
                  onChange={e => setStipendPartTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {job.opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Full-Time)' : 'Salary/Month (Full-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  value={stipendFullTime}
                  onChange={e => setStipendFullTime(e.target.value)}
                />
              </div>

              {job.opportunityType === 'INTERNSHIP' && (
                <div>
                  <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Duration (Internship)</label>
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Joining Month</label>
                <input
                  type="text"
                  list="edit-joining-month-options"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                  placeholder="e.g. Immediate, May 2026, Next Month"
                  value={joiningMonth}
                  onChange={e => setJoiningMonth(e.target.value)}
                />
                <datalist id="edit-joining-month-options">
                  <option value="Immediate" />
                  <option value="Within 15 Days" />
                  <option value="Within 1 Month" />
                  <option value="Next Month" />
                  <option value="January" />
                  <option value="February" />
                  <option value="March" />
                  <option value="April" />
                  <option value="May" />
                  <option value="June" />
                  <option value="July" />
                  <option value="August" />
                  <option value="September" />
                  <option value="October" />
                  <option value="November" />
                  <option value="December" />
                </datalist>
              </div>
            </div>
          </div>

          {/* SECTION 4: Description & Selection Process */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4">
            <h4 className="text-xs font-headline font-bold tracking-wider text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Description & Recruitment Process
            </h4>

            <div>
              <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Opportunity Summary *</label>
              <textarea
                rows="3"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Role & Responsibilities *</label>
              <textarea
                rows="3"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
                value={roleResponsibilities}
                onChange={e => setRoleResponsibilities(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Selection Rounds */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300">Selection Process Rounds</label>
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none font-sans font-medium"
                      placeholder="Round Title"
                      value={newRoundName}
                      onChange={e => setNewRoundName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="md:col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none font-sans font-medium"
                      placeholder="Round description details"
                      value={newRoundDesc}
                      onChange={e => setNewRoundDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs shadow-2xs cursor-pointer"
                  >
                    Add Round
                  </button>
                </div>

                {rounds.length === 0 ? (
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans font-medium">No rounds added.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {rounds.map((round, idx) => (
                      <div key={idx} className="flex items-start justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-headline font-bold text-blue-700 dark:text-blue-400">Round #{round.roundNumber}</span>
                          <h5 className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">{round.name}</h5>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans font-medium">{round.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none text-rose-700 dark:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: Listing Duration */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 space-y-4">
            <h4 className="text-xs font-headline font-bold tracking-wider text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Listing Duration Settings
            </h4>
            <div>
              <label className="block text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Active Time (Days) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none shadow-2xs"
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
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-none">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-headline font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-headline font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-800 rounded-none shadow-2xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving updates...' : 'Save Updates'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
