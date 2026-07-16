import { useState } from 'react';
import { X, Check, Plus, Trash2, User, BookOpen, Briefcase, Code, Award, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

export default function ParsedResumeReviewModal({ isOpen, parsedData, onConfirm, onClose }) {
  const [activeTab, setActiveTab] = useState('basicInfo');
  const [formData, setFormData] = useState(() => {
    return parsedData ? JSON.parse(JSON.stringify(parsedData)) : null;
  });

  if (!isOpen || !formData) return null;

  const handleBasicInfoChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: val
      }
    }));
  };

  // Education Helpers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { eduType: 'Bachelors', institute: '', degree: '', fieldOfStudy: '', startDate: '2018', endDate: '2022', gradeType: 'CGPA', gradeValue: '' }
      ]
    }));
  };

  const removeEducation = (idx) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const handleEducationChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, education: updated };
    });
  };

  // Experience Helpers
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { expType: 'Full-Time', designation: '', involvesTech: true, companyName: '', domain: 'Engineering', startDate: '2020', endDate: 'Present', currentlyWorking: true, location: '', description: '' }
      ]
    }));
  };

  const removeExperience = (idx) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const handleExperienceChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, experience: updated };
    });
  };

  // Projects Helpers
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: '', role: 'Developer', codeUrl: '', hostedUrl: '', startDate: '2021', endDate: '2021', currentlyWorking: false, description: '' }
      ]
    }));
  };

  const removeProject = (idx) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  const handleProjectChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, projects: updated };
    });
  };

  // Certifications Helpers
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { title: '', org: '', startDate: '2021', link: '', certNumber: '', description: '', attachment: '' }
      ]
    }));
  };

  const removeCertification = (idx) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx)
    }));
  };

  const handleCertificationChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.certifications];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, certifications: updated };
    });
  };

  // Skills Helpers
  const addSkill = () => {
    const skillName = prompt('Enter skill name:');
    if (!skillName) return;
    const exists = formData.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase());
    if (exists) {
      alert('Skill already added.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: skillName, rating: 1 }]
    }));
  };

  const removeSkill = (name) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== name)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container border border-outline-variant w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">Review Resume Import Details</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Edit or remove the extracted info before applying them to your profile.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Tabs Sidebar */}
          <div className="w-48 bg-surface-container-low border-r border-outline-variant p-3 flex flex-col gap-1.5 shrink-0">
            {[
              { id: 'basicInfo', label: 'Basic Info', icon: User },
              { id: 'education', label: 'Education', icon: BookOpen },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'skills', label: 'Skills', icon: Code },
              { id: 'projects', label: 'Projects', icon: FileText },
              { id: 'certifications', label: 'Certifications', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold transition-all text-xs flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* Panel 1: Basic Info */}
            {activeTab === 'basicInfo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.name}
                    onChange={e => handleBasicInfoChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.email}
                    onChange={e => handleBasicInfoChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Phone</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.phone}
                    onChange={e => handleBasicInfoChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Location</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.location}
                    onChange={e => handleBasicInfoChange('location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">DOB (Date of Birth)</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.dob}
                    onChange={e => handleBasicInfoChange('dob', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Portfolio Link</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.portfolio}
                    onChange={e => handleBasicInfoChange('portfolio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">LinkedIn Profile</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.linkedin}
                    onChange={e => handleBasicInfoChange('linkedin', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">GitHub Profile</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.github}
                    onChange={e => handleBasicInfoChange('github', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Bio / Summary</label>
                  <textarea
                    rows="3"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                    value={formData.basicInfo.bio}
                    onChange={e => handleBasicInfoChange('bio', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Panel 2: Education */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface">Education Entries</h3>
                  <Button type="button" size="sm" onClick={addEducation} icon={Plus}>Add Education</Button>
                </div>
                {formData.education.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No education entries extracted.</p>
                ) : (
                  formData.education.map((edu, idx) => (
                    <Card key={idx} className="relative p-4 border border-outline-variant space-y-3 bg-surface-container-low">
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="absolute top-4 right-4 p-1 hover:bg-surface-container-high rounded text-error hover:text-error/85 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Level</label>
                          <select
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={edu.eduType || ''}
                            onChange={e => handleEducationChange(idx, 'eduType', e.target.value)}
                          >
                            <option value="High School">High School</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Bachelors">Bachelors Degree</option>
                            <option value="Masters">Masters Degree</option>
                            <option value="Doctorate">Doctorate / PhD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Institute</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={edu.institute || ''}
                            onChange={e => handleEducationChange(idx, 'institute', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Degree / Title</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={edu.degree || ''}
                            onChange={e => handleEducationChange(idx, 'degree', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Field of Study</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={edu.fieldOfStudy || ''}
                            onChange={e => handleEducationChange(idx, 'fieldOfStudy', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Start / End Year</label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={edu.startDate || ''}
                              onChange={e => handleEducationChange(idx, 'startDate', e.target.value)}
                            />
                            <input
                              type="text"
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={edu.endDate || ''}
                              onChange={e => handleEducationChange(idx, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Grade Type & Value</label>
                          <div className="flex gap-2 mt-1">
                            <select
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={edu.gradeType || ''}
                              onChange={e => handleEducationChange(idx, 'gradeType', e.target.value)}
                            >
                              <option value="CGPA">CGPA</option>
                              <option value="Percentage">Percentage</option>
                            </select>
                            <input
                              type="text"
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={edu.gradeValue || ''}
                              onChange={e => handleEducationChange(idx, 'gradeValue', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Panel 3: Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface">Experience History</h3>
                  <Button type="button" size="sm" onClick={addExperience} icon={Plus}>Add Experience</Button>
                </div>
                {formData.experience.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No experience entries extracted.</p>
                ) : (
                  formData.experience.map((exp, idx) => (
                    <Card key={idx} className="relative p-4 border border-outline-variant space-y-3 bg-surface-container-low">
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="absolute top-4 right-4 p-1 hover:bg-surface-container-high rounded text-error hover:text-error/85 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Company Name</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={exp.companyName || ''}
                            onChange={e => handleExperienceChange(idx, 'companyName', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Designation</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={exp.designation || ''}
                            onChange={e => handleExperienceChange(idx, 'designation', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Location</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={exp.location || ''}
                            onChange={e => handleExperienceChange(idx, 'location', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Dates (Start - End)</label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={exp.startDate || ''}
                              onChange={e => handleExperienceChange(idx, 'startDate', e.target.value)}
                            />
                            <input
                              type="text"
                              className="w-1/2 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                              value={exp.endDate || ''}
                              onChange={e => handleExperienceChange(idx, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Responsibilities</label>
                          <textarea
                            rows="3"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={exp.description || ''}
                            onChange={e => handleExperienceChange(idx, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Panel 4: Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface">Extracted Skills</h3>
                  <Button type="button" size="sm" onClick={addSkill} icon={Plus}>Add Skill</Button>
                </div>
                {formData.skills.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No skills extracted.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-xl text-xs font-mono text-on-surface flex items-center gap-2"
                      >
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.name)}
                          className="hover:text-error transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Panel 5: Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface">Project Details</h3>
                  <Button type="button" size="sm" onClick={addProject} icon={Plus}>Add Project</Button>
                </div>
                {formData.projects.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No projects extracted.</p>
                ) : (
                  formData.projects.map((proj, idx) => (
                    <Card key={idx} className="relative p-4 border border-outline-variant space-y-3 bg-surface-container-low">
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="absolute top-4 right-4 p-1 hover:bg-surface-container-high rounded text-error hover:text-error/85 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Project Title</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={proj.title || ''}
                            onChange={e => handleProjectChange(idx, 'title', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Role</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={proj.role || ''}
                            onChange={e => handleProjectChange(idx, 'role', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Code Link</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={proj.codeUrl || ''}
                            onChange={e => handleProjectChange(idx, 'codeUrl', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Live Link</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={proj.hostedUrl || ''}
                            onChange={e => handleProjectChange(idx, 'hostedUrl', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Description</label>
                          <textarea
                            rows="2"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={proj.description || ''}
                            onChange={e => handleProjectChange(idx, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Panel 6: Certifications */}
            {activeTab === 'certifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-on-surface">Certifications</h3>
                  <Button type="button" size="sm" onClick={addCertification} icon={Plus}>Add Credential</Button>
                </div>
                {formData.certifications.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No certifications extracted.</p>
                ) : (
                  formData.certifications.map((cert, idx) => (
                    <Card key={idx} className="relative p-4 border border-outline-variant space-y-3 bg-surface-container-low">
                      <button
                        type="button"
                        onClick={() => removeCertification(idx)}
                        className="absolute top-4 right-4 p-1 hover:bg-surface-container-high rounded text-error hover:text-error/85 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Certification Title</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={cert.title || ''}
                            onChange={e => handleCertificationChange(idx, 'title', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Provider Organization</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={cert.org || ''}
                            onChange={e => handleCertificationChange(idx, 'org', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-on-surface-variant">Completion Year</label>
                          <input
                            type="text"
                            className="w-full mt-1 bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                            value={cert.startDate || ''}
                            onChange={e => handleCertificationChange(idx, 'startDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Discard</Button>
          <Button icon={Check} onClick={() => onConfirm(formData)}>Confirm & Import Profile</Button>
        </div>

      </div>
    </div>
  );
}
