import React, { useState } from 'react';
import { 
  FileText, 
  User, 
  Video, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Award, 
  Briefcase, 
  GraduationCap, 
  FolderGit2,
  X,
  UserCheck
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';

export default function RecruiterCandidates({ candidates }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Explore Stacks & Candidates"
        subtitle="Browse candidate profiles and filter skill requirements"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.length === 0 ? (
          <div className="col-span-1 md:col-span-2">
            <EmptyState icon={User} title="No candidates found" description="Candidates will appear here once students sign up and complete their profiles." />
          </div>
        ) : (
          candidates.map(cand => (
            <div key={cand.id} className="p-6 bg-surface-container border border-outline-variant rounded-2xl flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{cand.name}</h4>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="text-xs text-on-surface-variant font-mono">Candidate</span>
                      {cand.introVideoUrl && (
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-mono font-bold text-primary rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                          🎥 Showcase Video
                        </span>
                      )}
                    </div>
                  </div>
                  {cand.resumeUrl && (
                    <a href={cand.resumeUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs text-secondary rounded flex items-center gap-1 transition-all">
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </a>
                  )}
                </div>

                {/* Stacks display */}
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Proficiency Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills && cand.skills.length > 0 ? (
                      cand.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface">
                          {s.name} <span className="text-primary font-bold">Lvl {s.rating}/10</span>
                          {s.verifiedRating && (
                            <span className="ml-1 text-[9px] bg-secondary/20 text-secondary px-1 py-0.2 rounded font-bold">✓ Verified</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-on-surface-variant font-mono">No skills rated yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(cand)}
                className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs font-bold text-on-surface rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                View Full Profile
              </button>
            </div>
          ))
        )}
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface-container border border-outline-variant w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedCandidate.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{selectedCandidate.name}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">Detailed Candidate Dossier</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar bg-background">
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                
                {/* Left Column: Personal info, contact & video showcase */}
                <div className="md:col-span-2 space-y-6">
                  {/* Video Intro Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-primary tracking-wider flex items-center gap-1.5">
                      <Video className="w-4 h-4" /> Video Introduction
                    </h4>
                    {selectedCandidate.introVideoUrl ? (
                      <div className="aspect-video rounded-xl bg-black overflow-hidden border border-outline-variant shadow-lg">
                        <video 
                          src={selectedCandidate.introVideoUrl} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-surface-container/40 border border-outline-variant text-center space-y-2">
                        <p className="text-xs text-on-surface-variant">No video showcase uploaded yet by this candidate.</p>
                      </div>
                    )}
                  </div>

                  {/* Bio & Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider">Bio & Summary</h4>
                    <p className="text-xs text-on-surface leading-relaxed bg-surface-container-low/60 border border-outline-variant p-4 rounded-xl italic">
                      {selectedCandidate.bio || "No summary provided."}
                    </p>
                  </div>

                  {/* Contact / Metadata */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider">Contact & Info</h4>
                    <div className="space-y-2 bg-surface-container-low/60 border border-outline-variant p-4 rounded-xl text-xs space-y-3">
                      {selectedCandidate.email && (
                        <div className="flex items-center gap-2.5 text-on-surface-variant">
                          <Mail className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-on-surface truncate">{selectedCandidate.email}</span>
                        </div>
                      )}
                      {selectedCandidate.phone && (
                        <div className="flex items-center gap-2.5 text-on-surface-variant">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-on-surface">{selectedCandidate.phone}</span>
                        </div>
                      )}
                      {selectedCandidate.nationality && (
                        <div className="flex items-center gap-2.5 text-on-surface-variant">
                          <Globe className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-on-surface">{selectedCandidate.nationality}</span>
                        </div>
                      )}
                      {selectedCandidate.dob && (
                        <div className="flex items-center gap-2.5 text-on-surface-variant">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-on-surface">{selectedCandidate.dob}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Skills, Education, Experience, Projects, Certificates */}
                <div className="md:col-span-3 space-y-6">
                  
                  {/* Skills Grid */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider">Skills & Verified Ratings</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                        selectedCandidate.skills.map((s, i) => (
                          <div key={i} className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-primary font-bold">Lvl {s.rating}/10</span>
                            {s.verifiedRating && (
                              <span className="px-1.5 py-0.5 bg-secondary/20 text-secondary text-[9px] rounded font-bold font-sans">
                                Verified Lvl {s.verifiedRating}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-on-surface-variant">No skills listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-secondary" /> Work Experience
                    </h4>
                    {selectedCandidate.experience && selectedCandidate.experience.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCandidate.experience.map((exp, idx) => (
                          <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-on-surface">
                              <span>{exp.designation}</span>
                              <span className="text-on-surface-variant font-mono text-[10px]">{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                            </div>
                            <p className="text-secondary font-medium">{exp.companyName} <span className="text-[10px] text-on-surface-variant">({exp.location})</span></p>
                            <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">No experience listed.</p>
                    )}
                  </div>

                  {/* Projects */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                      <FolderGit2 className="w-4 h-4 text-secondary" /> Projects
                    </h4>
                    {selectedCandidate.projects && selectedCandidate.projects.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCandidate.projects.map((proj, idx) => (
                          <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-on-surface">
                              <span>{proj.title}</span>
                              <span className="text-on-surface-variant font-mono text-[10px]">{proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}</span>
                            </div>
                            <p className="text-primary font-medium text-[10px]">{proj.role}</p>
                            <p className="text-on-surface-variant text-[11px] leading-relaxed">{proj.description}</p>
                            <div className="flex gap-3 pt-1">
                              {proj.codeUrl && (
                                <a href={proj.codeUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline text-[10px]">Code Repo</a>
                              )}
                              {proj.hostedUrl && (
                                <a href={proj.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">Live Demo</a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">No projects listed.</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-secondary" /> Education
                    </h4>
                    {selectedCandidate.education && selectedCandidate.education.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCandidate.education.map((edu, idx) => (
                          <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-on-surface">
                              <span>{edu.degree} in {edu.fieldOfStudy}</span>
                              <span className="text-on-surface-variant font-mono text-[10px]">{edu.startDate} - {edu.endDate}</span>
                            </div>
                            <p className="text-on-surface-variant">{edu.institute}</p>
                            {edu.gradeValue && (
                              <p className="text-[10px] text-secondary font-mono">Grade: {edu.gradeValue} ({edu.gradeType})</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">No education listed.</p>
                    )}
                  </div>

                  {/* Certificates */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-secondary" /> Licenses & Certifications
                    </h4>
                    {selectedCandidate.certificates && selectedCandidate.certificates.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCandidate.certificates.map((cert, idx) => (
                          <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-on-surface">
                              <span>{cert.title}</span>
                              <span className="text-on-surface-variant font-mono text-[10px]">{cert.startDate}</span>
                            </div>
                            <p className="text-on-surface-variant">{cert.org}</p>
                            {cert.link && (
                              <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] block pt-1">Credential Link</a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">No certifications listed.</p>
                    )}
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-high border-t border-outline-variant flex justify-end gap-3">
              {selectedCandidate.resumeUrl && (
                <a
                  href={selectedCandidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:brightness-105 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Resume PDF
                </a>
              )}
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
