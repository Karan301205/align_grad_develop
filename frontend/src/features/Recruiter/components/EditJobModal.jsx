import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, DollarSign, Calendar, MapPin, ListChecks, X, Globe, Users, Clock } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import Button from '../../../components/ui/Button';

export default function EditJobModal({ job, onClose, onUpdate }) {
  if (!job) return null;

  // Form states initialized with job values
  const [designation, setDesignation] = useState(job.designation || job.title || '');
  const [companyName, setCompanyName] = useState(job.companyName || job.company?.name || '');
  const [officialWebsite, setOfficialWebsite] = useState(job.officialWebsite || '');
  const [preferredEducation, setPreferredEducation] = useState(job.preferredEducation || '');
  const [desiredExperience, setDesiredExperience] = useState(job.desiredExperience || 'Fresher');
  const [stipendPartTime, setStipendPartTime] = useState(job.stipendPartTime || '');
  const [stipendFullTime, setStipendFullTime] = useState(job.stipendFullTime || '');
  const [duration, setDuration] = useState(job.duration || '');
  const [location, setLocation] = useState(job.location || '');
  const [locationUrl, setLocationUrl] = useState(job.locationUrl || '');
  const [openings, setOpenings] = useState(job.openings ? String(job.openings) : '');
  const [activeDays, setActiveDays] = useState(job.activeDays || 30);
  const [jobDesc, setJobDesc] = useState(job.description || '');
  const [roleResponsibilities, setRoleResponsibilities] = useState(job.roleResponsibilities || '');

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

  const updateReqRating = (skillName, val) => {
    setReqs(prev => prev.map(r => r.skillName === skillName ? { ...r, minRating: parseInt(val) } : r));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (reqs.length === 0) {
      alert('Please add at least one required skill threshold.');
      return;
    }

    const payload = {
      title: designation,
      designation,
      description: jobDesc,
      companyName,
      officialWebsite,
      preferredEducation,
      desiredExperience,
      stipendPartTime,
      stipendFullTime,
      duration,
      roleResponsibilities,
      location,
      locationUrl,
      activeDays: activeDays ? parseInt(activeDays, 10) : 30,
      openings: openings ? parseInt(openings, 10) : null,
      selectionProcess: rounds,
      requirements: reqs
    };

    setSaving(true);
    const success = await onUpdate(job.id, payload);
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <h3 className="text-xl font-bold text-on-surface">Edit Opportunity Specifications</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-all shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar bg-background text-left">
          
          {/* SECTION 1: Role & Company Details */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Role & Company Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Designation (Job Title) *</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Company Name *</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Official Website</label>
                <input
                  type="url"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={officialWebsite}
                  onChange={e => setOfficialWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">headquarters location</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Location URL</label>
                <input
                  type="url"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={locationUrl}
                  onChange={e => setLocationUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">No of Openings</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={openings}
                  onChange={e => setOpenings(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Prerequisites */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Candidate Prerequisites
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Preferred Education</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={preferredEducation}
                  onChange={e => setPreferredEducation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Desired Experience *</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={desiredExperience}
                  onChange={e => setDesiredExperience(e.target.value)}
                  required
                >
                  <option value="Fresher" className="bg-surface-container text-on-surface">Fresher</option>
                  <option value="1 Year" className="bg-surface-container text-on-surface">1 Year</option>
                  <option value="2 Years" className="bg-surface-container text-on-surface">2 Years</option>
                  <option value="3+ Years" className="bg-surface-container text-on-surface">3+ Years</option>
                  <option value="Any years of experience" className="bg-surface-container text-on-surface">Any years of experience</option>
                </select>
              </div>
            </div>

            {/* Stacks rating */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">Required Stacks & Rating Thresholds *</label>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
                <div className="flex gap-2 pb-2 border-b border-outline-variant">
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
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                    {isSkillDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto custom-scrollbar">
                        {ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase()) &&
                               !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        ).length === 0 ? (
                          <div className="px-4 py-2 text-xs text-on-surface-variant font-mono">No matching skills</div>
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
                              className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[9px] opacity-60 font-mono capitalize px-1 py-0.5 rounded bg-surface-container-low border border-outline-variant">
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
                    className="px-3 py-2 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-105"
                  >
                    Add
                  </button>
                </div>

                {reqs.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant font-mono">No skills specified.</p>
                ) : (
                  <div className="space-y-2">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="space-y-1.5 pb-2 border-b border-outline-variant last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-on-surface">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              {isTech ? (
                                <span className="text-secondary font-mono text-[10px]">Min: Lvl {r.minRating}/10</span>
                              ) : (
                                <span className="text-on-surface-variant/70 font-mono text-[9px] uppercase tracking-wider bg-surface-container-high border border-outline-variant px-1.5 py-0.5 rounded">Non-Technical</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-error hover:underline text-[9px]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {isTech && (
                            <input
                              type="range"
                              min="1"
                              max="10"
                              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                              value={r.minRating}
                              onChange={e => updateReqRating(r.skillName, e.target.value)}
                            />
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
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Compensation & Schedule
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  {job.opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Part-Time)' : 'Salary/Month (Part-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={stipendPartTime}
                  onChange={e => setStipendPartTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  {job.opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Full-Time)' : 'Salary/Month (Full-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                  value={stipendFullTime}
                  onChange={e => setStipendFullTime(e.target.value)}
                />
              </div>

              {job.opportunityType === 'INTERNSHIP' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Duration (Internship)</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Description & Selection Process */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Description & Recruitment Process
            </h4>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Opportunity Summary *</label>
              <textarea
                rows="3"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Role & Responsibilities *</label>
              <textarea
                rows="3"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
                value={roleResponsibilities}
                onChange={e => setRoleResponsibilities(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Selection Rounds */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">Selection Process Rounds</label>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-[11px] text-on-surface focus:border-primary focus:outline-none"
                      placeholder="Round Title"
                      value={newRoundName}
                      onChange={e => setNewRoundName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="md:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-[11px] text-on-surface focus:border-primary focus:outline-none"
                      placeholder="Round description details"
                      value={newRoundDesc}
                      onChange={e => setNewRoundDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="px-3 py-1.5 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-105"
                  >
                    Add Round
                  </button>
                </div>

                {rounds.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant font-mono">No rounds added.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {rounds.map((round, idx) => (
                      <div key={idx} className="flex items-start justify-between p-2.5 bg-surface-container border border-outline-variant rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono text-primary font-bold">Round #{round.roundNumber}</span>
                          <h5 className="text-[11px] font-bold text-on-surface">{round.name}</h5>
                          <p className="text-[10px] text-on-surface-variant">{round.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 hover:bg-surface-container-high rounded text-error"
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
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Listing Duration Settings
            </h4>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Active Time (Days) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none text-on-surface"
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
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant bg-surface-container-high p-4 rounded-xl">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving updates...' : 'Save Updates'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
