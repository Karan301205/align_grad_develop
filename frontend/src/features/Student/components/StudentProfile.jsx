import React from 'react';
import { CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';

export default function StudentProfile({
  profile,
  setProfile,
  skillsList,
  setSkillsList,
  selectedNewSkill,
  setSelectedNewSkill,
  bio,
  setBio,
  nationality,
  setNationality,
  gender,
  setGender,
  profileEmail,
  setProfileEmail,
  dob,
  setDob,
  phone,
  setPhone,
  resumeUrl,
  setResumeUrl,
  socialLinks,
  setSocialLinks,
  educationList,
  setEducationList,
  experienceList,
  setExperienceList,
  certificatesList,
  setCertificatesList,
  projectsList,
  setProjectsList,
  cocurricular,
  setCocurricular,
  newEdu,
  setNewEdu,
  newExp,
  setNewExp,
  newCert,
  setNewCert,
  newProj,
  setNewProj,
  profileTab,
  setProfileTab,
  submittingProfile,
  feedbackMsg,
  handleUpdateProfile,
  handleRatingChange
}) {
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = React.useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Profile & Ratings"
        subtitle="Update your professional details, social portfolios, academic history, and self-rate your proficiencies"
      />

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          feedbackMsg.includes('success')
            ? 'bg-success-container border-success/30 text-on-success-container'
            : 'bg-error-container border-error/30 text-on-error-container'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden grid grid-cols-12 min-h-[650px]">
        
        {/* Left Side: Sub-tabs Sidebar */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low border-r border-outline-variant p-6 flex flex-col gap-1">
          {[
            { id: 'general', label: 'General' },
            { id: 'socials', label: 'Social Links' },
            { id: 'education', label: 'Education' },
            { id: 'experience', label: 'Experience' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'projects', label: 'Projects' },
            { id: 'skills', label: 'Skills' },
            { id: 'cocurricular', label: 'Co-curricular' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProfileTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all text-xs flex items-center justify-between ${
                profileTab === tab.id
                  ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          ))}
        </div>

        {/* Right Side: Tab Form Panel */}
        <form onSubmit={handleUpdateProfile} className="col-span-12 md:col-span-8 p-8 flex flex-col justify-between space-y-6">
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
            
            {/* Panel 1: General */}
            {profileTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">General Information</h3>
                
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={profile?.name || ''}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Bio</label>
                  <textarea
                    rows="3"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Software Engineer specializing in Full-Stack..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Nationality</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                    >
                      <option value="">Select Nationality</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Germany">Germany</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Gender</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="name@domain.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Resume / Portfolio Link</label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/your-resume.pdf"
                  />
                </div>
              </div>
            )}

            {/* Panel 2: Social Links */}
            {profileTab === 'socials' && (
              <div className="space-y-4">
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Social Profiles</h3>
                <p className="text-xs text-on-surface-variant mb-4">Tick the checkbox to show the link on your resume.</p>
                
                {[
                  { key: 'linkedin', label: 'LinkedIn Profile Link', placeholder: 'https://linkedin.com/in/username' },
                  { key: 'github', label: 'GitHub Profile Link', placeholder: 'https://github.com/username' },
                  { key: 'hackerEarth', label: 'HackerEarth Profile Link', placeholder: 'https://hackerearth.com/@username' },
                  { key: 'hackerRank', label: 'HackerRank Profile Link', placeholder: 'https://hackerrank.com/username' },
                  { key: 'codechef', label: 'CodeChef Profile Link', placeholder: 'https://codechef.com/users/username' },
                  { key: 'leetcode', label: 'LeetCode Profile Link', placeholder: 'https://leetcode.com/username' },
                  { key: 'codeforces', label: 'CodeForces Profile Link', placeholder: 'https://codeforces.com/profile/username' },
                  { key: 'kaggle', label: 'Kaggle Profile Link', placeholder: 'https://kaggle.com/username' },
                  { key: 'portfolio', label: 'Personal Portfolio Link', placeholder: 'https://myportfolio.com' }
                ].map(link => {
                  const showKey = `show${link.key.charAt(0).toUpperCase()}${link.key.slice(1)}`;
                  return (
                    <div key={link.key} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-4 h-4"
                          checked={socialLinks[showKey] || false}
                          onChange={e => setSocialLinks({ ...socialLinks, [showKey]: e.target.checked })}
                        />
                      </label>
                      <div className="flex-1">
                        <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">{link.label}</label>
                        <input
                          type="url"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                          value={socialLinks[link.key] || ''}
                          onChange={e => setSocialLinks({ ...socialLinks, [link.key]: e.target.value })}
                          placeholder={link.placeholder}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Panel 3: Education */}
            {profileTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Education History</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{educationList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {educationList.length > 0 && (
                  <div className="space-y-3">
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{edu.degree} - {edu.fieldOfStudy}</p>
                          <p className="text-xs text-on-surface-variant">{edu.institute} ({edu.eduType})</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {edu.startDate} to {edu.endDate} • {edu.gradeType}: {edu.gradeValue || 'N/A'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}
                          className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Education Record</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Education Type</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newEdu.eduType}
                        onChange={e => setNewEdu({ ...newEdu, eduType: e.target.value })}
                      >
                        <option value="">Select level of education</option>
                        <option value="High School">High School</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelors">Bachelors Degree</option>
                        <option value="Masters">Masters Degree</option>
                        <option value="Doctorate">Doctorate / PhD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Institute</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your Institute Name"
                        value={newEdu.institute}
                        onChange={e => setNewEdu({ ...newEdu, institute: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Degree</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="ex. Bachelor of Education"
                        value={newEdu.degree}
                        onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Field of Study</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="ex. Computer Science"
                        value={newEdu.fieldOfStudy}
                        onChange={e => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newEdu.startDate}
                        onChange={e => setNewEdu({ ...newEdu, startDate: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newEdu.endDate}
                        onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Grade Type</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newEdu.gradeType}
                        onChange={e => setNewEdu({ ...newEdu, gradeType: e.target.value })}
                      >
                        <option value="">Select Grade Type</option>
                        <option value="Percentage">Percentage (%)</option>
                        <option value="CGPA">CGPA</option>
                        <option value="GPA">GPA</option>
                        <option value="Grade">Letter Grade</option>
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Grade Value</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="e.g. 9.4 / 92%"
                        value={newEdu.gradeValue}
                        onChange={e => setNewEdu({ ...newEdu, gradeValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newEdu.eduType || !newEdu.institute || !newEdu.degree) {
                        alert('Please fill out Education Type, Institute, and Degree fields.');
                        return;
                      }
                      setEducationList([...educationList, newEdu]);
                      setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to List
                  </button>
                </div>
              </div>
            )}

            {/* Panel 4: Experience */}
            {profileTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Work Experience</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{experienceList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {experienceList.length > 0 && (
                  <div className="space-y-3">
                    {experienceList.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{exp.designation} at {exp.companyName}</p>
                          <p className="text-xs text-on-surface-variant">{exp.domain} ({exp.expType}) {exp.involvesTech && '• Tech Role'}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {exp.startDate} to {exp.currentlyWorking ? 'Present' : exp.endDate} • {exp.location || 'Remote'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}
                          className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Work Experience</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Experience Type</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newExp.expType}
                        onChange={e => setNewExp({ ...newExp, expType: e.target.value })}
                      >
                        <option value="">Select type of experience</option>
                        <option value="Internship">Internship</option>
                        <option value="Full-Time">Full-Time Job</option>
                        <option value="Freelance">Freelance Contract</option>
                        <option value="Part-Time">Part-Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Designation</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your role"
                        value={newExp.designation}
                        onChange={e => setNewExp({ ...newExp, designation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 py-1">
                    <input
                      type="checkbox"
                      id="involves-tech"
                      className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      checked={newExp.involvesTech}
                      onChange={e => setNewExp({ ...newExp, involvesTech: e.target.checked })}
                    />
                    <label htmlFor="involves-tech" className="text-xs text-on-surface-variant cursor-pointer select-none">
                      This position involves tasks of programming languages, APIs, or frameworks
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Company Name</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Company Name"
                        value={newExp.companyName}
                        onChange={e => setNewExp({ ...newExp, companyName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Domain of Experience</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newExp.domain}
                        onChange={e => setNewExp({ ...newExp, domain: e.target.value })}
                      >
                        <option value="">Select domain of experience</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Data Science & ML">Data Science & ML</option>
                        <option value="DevOps & Cloud">DevOps & Cloud</option>
                        <option value="Product Management">Product Management</option>
                        <option value="Design & UX">Design & UX</option>
                        <option value="Business & Marketing">Business & Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newExp.startDate}
                        onChange={e => setNewExp({ ...newExp, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        disabled={newExp.currentlyWorking}
                        value={newExp.currentlyWorking ? '' : newExp.endDate}
                        onChange={e => setNewExp({ ...newExp, endDate: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 w-3.5 h-3.5"
                          checked={newExp.currentlyWorking}
                          onChange={e => setNewExp({ ...newExp, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newExp.endDate })}
                        />
                        <span className="text-[11px] text-on-surface-variant font-medium">Currently Working Here</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Location</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="e.g. San Francisco / Remote"
                        value={newExp.location}
                        onChange={e => setNewExp({ ...newExp, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="3"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="List key responsibilities or accomplishments..."
                      value={newExp.description}
                      onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newExp.expType || !newExp.designation || !newExp.companyName) {
                        alert('Please fill out Experience Type, Designation, and Company Name.');
                        return;
                      }
                      setExperienceList([...experienceList, newExp]);
                      setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to List
                  </button>
                </div>
              </div>
            )}

            {/* Panel 5: Certificates */}
            {profileTab === 'certificates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Certifications</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{certificatesList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {certificatesList.length > 0 && (
                  <div className="space-y-3">
                    {certificatesList.map((cert, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{cert.title}</p>
                          <p className="text-xs text-on-surface-variant">Issued by: {cert.org}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            Issued: {cert.startDate} • {cert.link ? <a href={cert.link} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/70">View Certificate</a> : 'No Link'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCertificatesList(certificatesList.filter((_, i) => i !== idx))}
                          className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Certification</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certificate Title</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter certificate title"
                        value={newCert.title}
                        onChange={e => setNewCert({ ...newCert, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Provider Organisation Name</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Organisation Name"
                        value={newCert.org}
                        onChange={e => setNewCert({ ...newCert, org: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newCert.startDate}
                        onChange={e => setNewCert({ ...newCert, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certification Link</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Certification Link"
                        value={newCert.link}
                        onChange={e => setNewCert({ ...newCert, link: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="2"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Enter description..."
                      value={newCert.description}
                      onChange={e => setNewCert({ ...newCert, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newCert.title || !newCert.org) {
                        alert('Please enter Certificate Title and Provider Organisation.');
                        return;
                      }
                      setCertificatesList([...certificatesList, newCert]);
                      setNewCert({ title: '', org: '', startDate: '', link: '', description: '' });
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to List
                  </button>
                </div>
              </div>
            )}

            {/* Panel 6: Projects */}
            {profileTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Projects</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{projectsList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {projectsList.length > 0 && (
                  <div className="space-y-3">
                    {projectsList.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{proj.title}</p>
                          <p className="text-xs text-on-surface-variant">Role: {proj.role}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}
                          </p>
                          <div className="flex gap-3 mt-1">
                            {proj.codeUrl && (
                              <a href={proj.codeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-secondary hover:underline">
                                Code URL
                              </a>
                            )}
                            {proj.hostedUrl && (
                              <a href={proj.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-secondary hover:underline">
                                Hosted URL
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjectsList(projectsList.filter((_, i) => i !== idx))}
                          className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Project Record</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Title</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Name of your project"
                        value={newProj.title}
                        onChange={e => setNewProj({ ...newProj, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Company / Role</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your role"
                        value={newProj.role}
                        onChange={e => setNewProj({ ...newProj, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Code URL</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter the code URL for the project"
                        value={newProj.codeUrl}
                        onChange={e => setNewProj({ ...newProj, codeUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Hosted URL</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter hosted URL (optional)"
                        value={newProj.hostedUrl}
                        onChange={e => setNewProj({ ...newProj, hostedUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newProj.startDate}
                        onChange={e => setNewProj({ ...newProj, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        disabled={newProj.currentlyWorking}
                        value={newProj.currentlyWorking ? '' : newProj.endDate}
                        onChange={e => setNewProj({ ...newProj, endDate: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low w-3.5 h-3.5 focus:ring-0"
                          checked={newProj.currentlyWorking}
                          onChange={e => setNewProj({ ...newProj, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newProj.endDate })}
                        />
                        <span className="text-[11px] text-on-surface-variant font-medium">Currently Working Here</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="3"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Add key features, stacks, or descriptions... (New line for bullet point)"
                      value={newProj.description}
                      onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newProj.title || !newProj.role) {
                        alert('Please fill out Project Title and Role.');
                        return;
                      }
                      setProjectsList([...projectsList, newProj]);
                      setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                    }}
                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to List
                  </button>
                </div>
              </div>
            )}

            {/* Panel 7: Skills */}
            {profileTab === 'skills' && (
              <div className="space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Your Stacks & Skills</label>
                
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-5">
                  {/* Searchable input & dropdown to add a skill */}
                  <div className="flex gap-3 pb-3 border-b border-outline-variant">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search and select a skill..."
                        value={selectedNewSkill}
                        onChange={e => {
                          setSelectedNewSkill(e.target.value);
                          setIsSkillDropdownOpen(true);
                        }}
                        onFocus={() => setIsSkillDropdownOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setIsSkillDropdownOpen(false), 200);
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                      />
                      
                      {isSkillDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-high/95 backdrop-blur-md border border-outline-variant rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                          {ALL_SKILLS.filter(
                            s => s.skill.toLowerCase().includes(selectedNewSkill.toLowerCase()) &&
                                 !skillsList.some(exist => exist.name.toLowerCase() === s.skill.toLowerCase())
                          ).length === 0 ? (
                            <div className="px-4 py-3 text-xs text-on-surface-variant font-mono">No matching skills found</div>
                          ) : (
                            ALL_SKILLS.filter(
                              s => s.skill.toLowerCase().includes(selectedNewSkill.toLowerCase()) &&
                                   !skillsList.some(exist => exist.name.toLowerCase() === s.skill.toLowerCase())
                            ).map(s => (
                              <button
                                key={s.skill}
                                type="button"
                                onClick={() => {
                                  setSelectedNewSkill(s.skill);
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
                      id="student-add-skill-btn"
                      onClick={() => {
                        const trimmed = selectedNewSkill.trim();
                        if (!trimmed) return;
                        const match = ALL_SKILLS.find(
                          s => s.skill.toLowerCase() === trimmed.toLowerCase()
                        );
                        if (!match) {
                          alert("Please select a valid skill from the matching suggestions list.");
                          return;
                        }
                        if (skillsList.some(exist => exist.name.toLowerCase() === match.skill.toLowerCase())) {
                          alert("This skill has already been added.");
                          return;
                        }
                        setSkillsList(prev => [...prev, { name: match.skill, rating: 1 }]);
                        setSelectedNewSkill('');
                      }}
                      className="px-4 py-3 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Skill
                    </button>
                  </div>

                  {skillsList.length === 0 ? (
                    <p className="text-xs text-on-surface-variant font-mono">No skills added yet. Select a skill above.</p>
                  ) : (
                    skillsList.map(skill => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === skill.name.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={skill.name} className="space-y-2 pb-3 border-b border-outline-variant last:border-b-0">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface">{skill.name}</span>
                              {!isTech && (
                                <span className="text-[9px] opacity-60 font-mono capitalize px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant">
                                  Non-Technical
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {isTech && (
                                <span className="text-secondary font-mono text-xs">Rating: {skill.rating} / 10</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setSkillsList(prev => prev.filter(s => s.name !== skill.name))}
                                className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Panel 8: Co-curricular */}
            {profileTab === 'cocurricular' && (
              <div className="space-y-4">
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Co-curricular & POR</h3>
                
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">
                    Add Co-curricular Certificates Link
                  </label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={cocurricular}
                    onChange={e => setCocurricular(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/your-folder"
                  />
                  <p className="text-[11px] text-on-surface-variant font-mono mt-2 leading-relaxed text-secondary/80">
                    * Please share the drive link of your certificates here. Make sure to have the link open for public view access.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Save Button */}
          <Button type="submit" loading={submittingProfile} fullWidth size="lg" className="mt-6">
            Save Profile & Ratings
          </Button>
        </form>
      </div>
    </div>
  );
}
