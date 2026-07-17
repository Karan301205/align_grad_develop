import { X, Video, Mail, Phone, Globe, Calendar, Briefcase, FolderGit2, GraduationCap, Award, FileText, Star } from 'lucide-react';

export default function CandidateProfileModal({ candidate, onClose }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg overflow-hidden shrink-0">
              {candidate.profilePic ? (
                <img src={candidate.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                candidate.name?.charAt(0) || 'C'
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">{candidate.name}</h3>
              {candidate.username && (
                <p className="text-xs text-primary font-mono">@{candidate.username}</p>
              )}
              <p className="text-xs text-on-surface-variant font-mono">Detailed Candidate Dossier</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar bg-background text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            
            {/* Left Column: Personal info, contact & video showcase */}
            <div className="md:col-span-2 space-y-6">
              {/* Video Intro Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-mono uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4" /> Video Introduction
                </h4>
                {candidate.introVideoUrl ? (
                  <div className="aspect-video rounded-xl bg-black overflow-hidden border border-outline-variant shadow-lg">
                    <video 
                      src={candidate.introVideoUrl} 
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
                  {candidate.bio || "No summary provided."}
                </p>
              </div>

              {/* Contact / Metadata */}
              <div className="space-y-3">
                <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider">Contact & Info</h4>
                <div className="space-y-2 bg-surface-container-low/60 border border-outline-variant p-4 rounded-xl text-xs space-y-3">
                  {candidate.email && (
                    <div className="flex items-center gap-2.5 text-on-surface-variant">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-on-surface truncate">{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2.5 text-on-surface-variant">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-on-surface">{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.nationality && (
                    <div className="flex items-center gap-2.5 text-on-surface-variant">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-on-surface">{candidate.nationality}</span>
                    </div>
                  )}
                  {candidate.dob && (
                    <div className="flex items-center gap-2.5 text-on-surface-variant">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-on-surface">{candidate.dob}</span>
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
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((s, i) => (
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
                {(() => {
                  const gigExperienceItems = (candidate.experience || []).filter(exp => exp.expType === 'Gig');
                  const completedGigsCount = gigExperienceItems.length;
                  let totalRating = 0;
                  let ratedGigsCount = 0;
                  gigExperienceItems.forEach(exp => {
                    const match = exp.description?.match(/Rating:\s*(\d+)\/5/);
                    if (match) {
                      totalRating += parseInt(match[1]);
                      ratedGigsCount++;
                    }
                  });
                  const averageRating = ratedGigsCount > 0 ? (totalRating / ratedGigsCount).toFixed(1) : 'N/A';

                  return (
                    <>
                      {/* Gigs Stats Summary */}
                      {gigExperienceItems.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 bg-surface-container-high/40 p-3.5 rounded-xl border border-outline-variant/50">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <p className="text-[9px] font-mono uppercase text-on-surface-variant">Completed Gigs</p>
                              <p className="text-xs font-bold text-on-surface">{completedGigsCount} Verified Task{completedGigsCount > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-warning fill-warning/20 shrink-0" />
                            <div>
                              <p className="text-[9px] font-mono uppercase text-on-surface-variant">Average Rating</p>
                              <p className="text-xs font-bold text-on-surface">{averageRating} / 5.0 Rating</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {candidate.experience && candidate.experience.length > 0 ? (
                        <div className="space-y-3">
                          {candidate.experience.map((exp, idx) => (
                            <div key={idx} className={`p-3 border rounded-xl text-xs space-y-1 ${exp.expType === 'Gig' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-container-low border-outline-variant'}`}>
                              <div className="flex justify-between font-bold text-on-surface flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{exp.designation}</span>
                                  {exp.expType === 'Gig' && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-mono font-bold border border-emerald-500/10">
                                      ✓ Verified Gig
                                    </span>
                                  )}
                                </div>
                                <span className="text-on-surface-variant font-mono text-[10px]">{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                              </div>
                              <p className="text-secondary font-medium">{exp.companyName} <span className="text-[10px] text-on-surface-variant">({exp.location})</span></p>
                              <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant">No experience listed.</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <h4 className="text-sm font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-secondary" /> Projects
                </h4>
                {candidate.projects && candidate.projects.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.projects.map((proj, idx) => (
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
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.education.map((edu, idx) => (
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
                {candidate.certificates && candidate.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.certificates.map((cert, idx) => (
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
          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Download Resume PDF
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
