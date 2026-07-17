import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Briefcase, DollarSign, Calendar, MapPin, ListChecks, Clock } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';

export default function RecruiterPostJob({ submittingJob, handlePostJob }) {
  // Hiring Option Type
  const [opportunityType, setOpportunityType] = useState('JOB'); // 'JOB', 'INTERNSHIP', 'GIG'

  // Form states
  const [designation, setDesignation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [preferredEducation, setPreferredEducation] = useState('');
  const [desiredExperience, setDesiredExperience] = useState('Fresher');
  const [stipendPartTime, setStipendPartTime] = useState('');
  const [stipendFullTime, setStipendFullTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [activeDays, setActiveDays] = useState(30);
  const [joiningMonth, setJoiningMonth] = useState('');
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
      // Re-map round numbers sequentially
      return filtered.map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
    });
  };

  const updateReqRating = (skillName, val) => {
    setReqs(prev => prev.map(r => r.skillName === skillName ? { ...r, minRating: parseInt(val) } : r));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (reqs.length === 0) {
      alert(opportunityType === 'GIG' ? 'Please add at least one required skill.' : 'Please add at least one required skill threshold.');
      return;
    }

    let payload;
    if (opportunityType === 'GIG') {
      payload = {
        opportunityType: 'GIG',
        title: designation,
        description: jobDesc,
        skills: reqs.map(r => r.skillName),
        budget: parseFloat(budget),
        deliveryTime,
        attachmentFile
      };
    } else {
      payload = {
        opportunityType,
        title: designation, // Maps to schema's title
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
        joiningMonth,
        openings: openings ? parseInt(openings, 10) : null,
        selectionProcess: rounds,
        requirements: reqs
      };
    }

    const success = await handlePostJob(payload);
    if (success) {
      // Reset form
      setDesignation('');
      setCompanyName('');
      setOfficialWebsite('');
      setPreferredEducation('');
      setDesiredExperience('Fresher');
      setStipendPartTime('');
      setStipendFullTime('');
      setDuration('');
      setLocation('');
      setLocationUrl('');
      setActiveDays(30);
      setJoiningMonth('');
      setOpenings('');
      setJobDesc('');
      setRoleResponsibilities('');
      setReqs([]);
      setRounds([]);
      setBudget('');
      setDeliveryTime('');
      setAttachmentFile(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <PageHeader
        title="Post New Opportunity"
        subtitle="Provide details, skill requirements, and settings for your new opportunity."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Opportunity Type Selection */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4">
          <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Select Opportunity Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'JOB', label: 'Full-Time / Part-Time Job', desc: 'Permanent positions' },
              { id: 'INTERNSHIP', label: 'Internship', desc: 'Fixed duration positions with stipends' },
              { id: 'GIG', label: 'Gig (Short-Term Task)', desc: 'Task-based contract projects' }
            ].map(opt => {
              const isSelected = opportunityType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setOpportunityType(opt.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow border-l-4 border-l-primary'
                      : 'bg-surface-container-low border-outline-variant hover:border-on-surface-variant/30 shadow-sm'
                  }`}
                >
                  <span className="text-xs font-bold text-on-surface">{opt.label}</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">{opt.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 1: Role & Company Details */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> {opportunityType === 'GIG' ? 'Gig Details' : 'Role & Company Details'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                {opportunityType === 'GIG' ? 'Gig Title *' : 'Designation (Job Title) *'}
              </label>
              <input
                type="text"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                placeholder={opportunityType === 'GIG' ? "e.g. Design a logo for my website" : "e.g. Senior React Developer"}
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                required
              />
            </div>

            {opportunityType !== 'GIG' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Company Name *</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}

            {opportunityType !== 'GIG' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Official Website</label>
                <input
                  type="url"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder="e.g. https://acme.com"
                  value={officialWebsite}
                  onChange={e => setOfficialWebsite(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Location *</label>
              <input
                type="text"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                placeholder="e.g. San Francisco, CA / Remote"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>

            {opportunityType !== 'GIG' && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Location URL</label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                    placeholder="e.g. https://maps.google.com/..."
                    value={locationUrl}
                    onChange={e => setLocationUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">No of Openings</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                    placeholder="e.g. 3"
                    value={openings}
                    onChange={e => setOpenings(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 2: Candidate Prerequisites & Skills */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> {opportunityType === 'GIG' ? 'Required Skills' : 'Candidate Prerequisites'}
          </h3>
          
          {opportunityType !== 'GIG' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Preferred Education</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder="e.g. B.Tech / BCA / Any Graduate"
                  value={preferredEducation}
                  onChange={e => setPreferredEducation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Desired Experience *</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
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
          )}

          {/* Required Skills list */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              {opportunityType === 'GIG' ? 'Add Required Skills *' : 'Required Stacks & Rating Thresholds *'}
            </label>
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
              {/* Searchable input & dropdown to add a requirement skill */}
              <div className="flex gap-3 pb-3 border-b border-outline-variant">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search and select a skill..."
                    value={selectedReqSkill}
                    onChange={e => {
                      setSelectedReqSkill(e.target.value);
                      setIsSkillDropdownOpen(true);
                    }}
                    onFocus={() => setIsSkillDropdownOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setIsSkillDropdownOpen(false), 200);
                    }}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                  />
                  
                  {isSkillDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-high/95 backdrop-blur-md border border-outline-variant rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                      {ALL_SKILLS.filter(
                        s => s.skill.toLowerCase().includes(selectedReqSkill.toLowerCase()) &&
                             !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                      ).length === 0 ? (
                        <div className="px-4 py-3 text-xs text-on-surface-variant font-mono">No matching skills found</div>
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
                            className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group"
                          >
                            <span>{s.skill}</span>
                            <span className="text-[10px] opacity-60 group-hover:opacity-100 font-mono capitalize px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant text-on-surface-variant group-hover:border-primary/20 group-hover:text-primary transition-all">
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
                      alert("Please select a valid skill from the matching suggestions list.");
                      return;
                    }
                    if (reqs.some(exist => exist.skillName.toLowerCase() === match.skill.toLowerCase())) {
                      alert("This skill requirement has already been added.");
                      return;
                    }
                    const isTech = match.type === 'technical';
                    setReqs(prev => [...prev, { skillName: match.skill, minRating: isTech ? 4 : 0 }]);
                    setSelectedReqSkill('');
                  }}
                  className="px-4 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {reqs.length === 0 ? (
                <p className="text-xs text-on-surface-variant font-mono">No skill requirements specified yet. Choose a skill above.</p>
              ) : (
                <div className="space-y-3">
                  {reqs.map(r => {
                    const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                    const isTech = skillObj ? skillObj.type === 'technical' : true;
                    return (
                      <div key={r.skillName} className="space-y-2 pb-3 border-b border-outline-variant last:border-b-0">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-on-surface">{r.skillName}</span>
                          <div className="flex items-center gap-3">
                            {isTech && opportunityType !== 'GIG' ? (
                              <span className="text-secondary font-mono">Min Rating: Lvl {r.minRating}/10</span>
                            ) : (
                              <span className="text-on-surface-variant/70 font-mono text-[10px] uppercase tracking-wider bg-surface-container-high border border-outline-variant px-1.5 py-0.5 rounded">Required Skill</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                              className="text-error hover:underline text-[10px]"
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
                            className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
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

        {/* SECTION 3: Compensation & Schedule / Gig Budget */}
        {opportunityType === 'GIG' ? (
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Gig Budget & Timeline
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Project Budget ($ USD) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder="e.g. 500"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Delivery Time / Duration *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder="e.g. 5 Days / 2 Weeks"
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Upload Specs Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  className="w-full text-xs text-on-surface bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Compensation & Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                  {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Part-Time)' : 'Salary/Month (Part-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder={opportunityType === 'INTERNSHIP' ? "e.g. $500 / Unpaid" : "e.g. $2000 / Competetive"}
                  value={stipendPartTime}
                  onChange={e => setStipendPartTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                  {opportunityType === 'INTERNSHIP' ? 'Stipend/Month (Full-Time)' : 'Salary/Month (Full-Time)'}
                </label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                  placeholder={opportunityType === 'INTERNSHIP' ? "e.g. $1200 / Competitive" : "e.g. $4500 / Competitive"}
                  value={stipendFullTime}
                  onChange={e => setStipendFullTime(e.target.value)}
                />
              </div>

              {opportunityType === 'INTERNSHIP' && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Duration *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                    placeholder="e.g. 3 Months / 6 Months"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Joining Date *</label>
                <input
                  type="date"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface [color-scheme:light] dark:[color-scheme:dark]"
                  value={joiningMonth}
                  onChange={e => setJoiningMonth(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Description & Process */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {opportunityType === 'GIG' ? 'Gig Tasks & Brief' : 'Description & Recruitment Process'}
          </h3>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              {opportunityType === 'GIG' ? 'Gig Tasks & Description *' : 'Job / Internship Summary *'}
            </label>
            <textarea
              rows="4"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface custom-scrollbar"
              placeholder={opportunityType === 'GIG' ? "Describe the tasks, deliverable specifications, and overall requirements..." : "Short, engaging summary introducing the role..."}
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              required
            ></textarea>
          </div>

          {opportunityType !== 'GIG' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Role and Responsibilities *</label>
              <textarea
                rows="4"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface custom-scrollbar"
                placeholder="Describe tasks, workflows, key targets, and responsibilities..."
                value={roleResponsibilities}
                onChange={e => setRoleResponsibilities(e.target.value)}
                required
              ></textarea>
            </div>
          )}

          {/* Dynamic Selection Process */}
          {opportunityType !== 'GIG' && (
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Selection Process Rounds</label>
              
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      className="md:col-span-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                      placeholder="e.g. Round 1: Online Coding"
                      value={newRoundName}
                      onChange={e => setNewRoundName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="md:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                      placeholder="e.g. 45 min test on DSA concepts and JavaScript logic"
                      value={newRoundDesc}
                      onChange={e => setNewRoundDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="px-4 py-2 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-105 transition-all flex items-center gap-1 w-max"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Process Round
                  </button>
                </div>

                {rounds.length === 0 ? (
                  <p className="text-xs text-on-surface-variant font-mono">No recruitment process rounds added. Design your selection flow above.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {rounds.map((round, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-surface-container border border-outline-variant rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-primary font-bold">Round #{round.roundNumber}</span>
                          <h4 className="text-xs font-bold text-on-surface">{round.name}</h4>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed">{round.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 hover:bg-surface-container-high rounded text-error transition-all"
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
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Listing Duration Settings
            </h3>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Active Time (Days) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
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
              <p className="text-[10px] text-on-surface-variant/70 font-mono mt-1">Specify how many days this job listing will remain active before automatic deletion.</p>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <Button type="submit" loading={submittingJob} fullWidth size="lg">
          {submittingJob ? 'Publishing Opportunity...' : 'Publish Opportunity'}
        </Button>

      </form>
    </div>
  );
}
