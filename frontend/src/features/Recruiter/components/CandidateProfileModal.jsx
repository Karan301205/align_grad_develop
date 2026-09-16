import { X, Video, Mail, Phone, Globe, Calendar, Briefcase, FolderGit2, GraduationCap, Award, FileText, Star, Link, ExternalLink, ShieldCheck, Check } from 'lucide-react';

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', showKey: 'showLinkedin', label: 'LinkedIn', icon: Link, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'github', showKey: 'showGithub', label: 'GitHub', icon: FolderGit2, color: 'text-purple-600 dark:text-purple-400' },
  { key: 'portfolio', showKey: 'showPortfolio', label: 'Personal Portfolio', icon: Globe, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'hackerEarth', showKey: 'showHackerEarth', label: 'HackerEarth', icon: Globe, color: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'hackerRank', showKey: 'showHackerRank', label: 'HackerRank', icon: Globe, color: 'text-green-600 dark:text-green-400' },
  { key: 'codechef', showKey: 'showCodechef', label: 'CodeChef', icon: Globe, color: 'text-amber-600 dark:text-amber-400' },
  { key: 'leetcode', showKey: 'showLeetcode', label: 'LeetCode', icon: Globe, color: 'text-orange-600 dark:text-orange-400' },
  { key: 'codeforces', showKey: 'showCodeforces', label: 'CodeForces', icon: Globe, color: 'text-rose-600 dark:text-rose-400' },
  { key: 'kaggle', showKey: 'showKaggle', label: 'Kaggle', icon: Globe, color: 'text-sky-600 dark:text-sky-400' },
];

export default function CandidateProfileModal({ candidate, onClose }) {
  if (!candidate) return null;

  const socialLinks = candidate.socialLinks || {};
  const activeSocialLinks = SOCIAL_PLATFORMS.filter(platform => {
    const url = socialLinks[platform.key];
    const isChecked = Boolean(socialLinks[platform.showKey]);
    return url && typeof url === 'string' && url.trim() !== '' && isChecked;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-slate-300 dark:border-slate-700 w-full max-w-4xl rounded-none shadow-2xl shadow-black/60 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up text-left"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300 font-headline font-bold text-lg overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
              {candidate.profilePic ? (
                <img src={candidate.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{candidate.name?.charAt(0) || 'C'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100">{candidate.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200">
                  Candidate Dossier
                </span>
              </div>
              {candidate.username && (
                <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-bold mt-0.5">@{candidate.username}</p>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar bg-slate-100/70 dark:bg-slate-950 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
            
            {/* Left Column: Personal info, contact & video showcase */}
            <div className="md:col-span-2 space-y-5">
              {/* Video Intro Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Video className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Video Introduction
                </h4>
                {candidate.introVideoUrl ? (
                  <div className="aspect-video rounded-none bg-black overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                    <video 
                      src={candidate.introVideoUrl} 
                      controls 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-5 rounded-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">No video showcase uploaded yet by this candidate.</p>
                  </div>
                )}
              </div>

              {/* Bio & Details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase pb-2 border-b border-slate-200 dark:border-slate-800">
                  Bio & Summary
                </h4>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-none font-sans italic">
                  {candidate.bio || "No summary provided."}
                </p>
              </div>

              {/* Contact / Metadata */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase pb-2 border-b border-slate-200 dark:border-slate-800">
                  Contact & Info
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-none text-xs space-y-2.5 font-sans">
                  {candidate.email && (
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-900 dark:text-slate-100 font-medium">{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.nationality && (
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-900 dark:text-slate-100 font-medium">{candidate.nationality}</span>
                    </div>
                  )}
                  {candidate.dob && (
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-900 dark:text-slate-100 font-medium">{candidate.dob}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Profiles Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Link className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Social Profiles
                </h4>
                {activeSocialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {activeSocialLinks.map(platform => {
                      let url = String(socialLinks[platform.key]).trim();
                      if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = `https://${url}`;
                      }
                      const PlatformIcon = platform.icon;
                      return (
                        <a
                          key={platform.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-all group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PlatformIcon className={`w-4 h-4 ${platform.color} shrink-0`} />
                            <span className="truncate">{platform.label}</span>
                          </div>
                          <span className="text-[11px] font-headline font-bold text-blue-700 dark:text-blue-400 group-hover:underline flex items-center gap-1 shrink-0">
                            View <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No social links shared by this candidate.</p>
                  </div>
                )}
              </div>

              {/* Work Preferences Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Work Preferences
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-none space-y-3.5 text-xs">
                  <div>
                    <span className="text-[11px] font-headline font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Work Mode:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.preferredWorkModes && candidate.preferredWorkModes.length > 0 ? (
                        candidate.preferredWorkModes.map(m => (
                          <span key={m} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-none font-headline font-bold text-[10px]">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">Not specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-headline font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Target Position Type:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.preferredWorkTypes && candidate.preferredWorkTypes.length > 0 ? (
                        candidate.preferredWorkTypes.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-none font-headline font-bold text-[10px]">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">Not specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-headline font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Preferred Locations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.openToAnyLocation && (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 rounded-none font-headline font-bold text-[10px]">
                          ✓ Open to Any Location / Relocate
                        </span>
                      )}
                      {candidate.preferredLocations && candidate.preferredLocations.length > 0 ? (
                        candidate.preferredLocations.map(l => (
                          <span key={l} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none font-sans font-medium text-[10px] text-slate-800 dark:text-slate-200">
                            📍 {l}
                          </span>
                        ))
                      ) : (
                        !candidate.openToAnyLocation && <span className="text-slate-500 dark:text-slate-400 italic">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Skills, Experience, Projects, Education, Certificates */}
            <div className="md:col-span-3 space-y-5">
              
              {/* Skills Grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase pb-2 border-b border-slate-200 dark:border-slate-800">
                  Skills & Verified Ratings
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((s, i) => (
                      <div key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 shadow-2xs">
                        <span>{s.name}</span>
                        <span className="text-blue-700 dark:text-blue-400 font-bold font-headline">Lvl {s.rating}/10</span>
                        {s.verifiedRating && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 text-[9px] font-headline font-bold rounded-none">
                            Verified Lvl {s.verifiedRating}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No skills listed.</p>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Work Experience
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
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-none border border-slate-200 dark:border-slate-700 mb-3">
                          <div className="flex items-center gap-2.5">
                            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-[10px] font-headline font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">Completed Gigs</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{completedGigsCount} Verified Task{completedGigsCount > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                            <div>
                              <p className="text-[10px] font-headline font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">Average Rating</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{averageRating} / 5.0 Rating</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {candidate.experience && candidate.experience.length > 0 ? (
                        <div className="space-y-3">
                          {candidate.experience.map((exp, idx) => (
                            <div key={idx} className={`p-3.5 border rounded-none text-xs space-y-1.5 shadow-2xs ${exp.expType === 'Gig' ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-700/80' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                              <div className="flex justify-between font-headline font-bold text-slate-900 dark:text-slate-100 flex-wrap gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm">{exp.designation}</span>
                                  {exp.expType === 'Gig' && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-none bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[9px] font-headline font-bold border border-emerald-400 dark:border-emerald-600">
                                      ✓ Verified Gig
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 font-sans font-normal text-[11px]">{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                              </div>
                              <p className="text-blue-700 dark:text-blue-400 font-semibold text-xs">{exp.companyName} {exp.location && <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-normal">({exp.location})</span>}</p>
                              {exp.description && (
                                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1.5 leading-relaxed whitespace-pre-line font-sans">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No experience listed.</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Projects */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <FolderGit2 className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Projects
                </h4>
                {candidate.projects && candidate.projects.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.projects.map((proj, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-none text-xs space-y-1.5 shadow-2xs">
                        <div className="flex justify-between font-headline font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-sm">{proj.title}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-sans font-normal text-[11px]">{proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}</span>
                        </div>
                        {proj.role && <p className="text-blue-700 dark:text-blue-400 font-semibold text-xs">{proj.role}</p>}
                        {proj.description && <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-sans">{proj.description}</p>}
                        <div className="flex gap-4 pt-1 font-headline font-bold text-xs">
                          {proj.codeUrl && (
                            <a href={proj.codeUrl.startsWith('http') ? proj.codeUrl : `https://${proj.codeUrl}`} target="_blank" rel="noopener noreferrer" className="text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1">
                              Code Repo <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {proj.hostedUrl && (
                            <a href={proj.hostedUrl.startsWith('http') ? proj.hostedUrl : `https://${proj.hostedUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1">
                              Live Demo <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No projects listed.</p>
                )}
              </div>

              {/* Education */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Education
                </h4>
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-none text-xs space-y-1 shadow-2xs">
                        <div className="flex justify-between font-headline font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-sm">{edu.degree} in {edu.fieldOfStudy}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-sans font-normal text-[11px]">{edu.startDate} - {edu.endDate}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{edu.institute}</p>
                        {edu.gradeValue && (
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-semibold">Grade: {edu.gradeValue} ({edu.gradeType})</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No education listed.</p>
                )}
              </div>

              {/* Certificates */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Award className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Licenses & Certifications
                </h4>
                {candidate.certificates && candidate.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.certificates.map((cert, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-none text-xs space-y-1 shadow-2xs">
                        <div className="flex justify-between font-headline font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-sm">{cert.title}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-sans font-normal text-[11px]">{cert.startDate}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{cert.org}</p>
                        {cert.link && (
                          <a href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline text-xs font-semibold block pt-1">
                            Credential Link &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No certifications listed.</p>
                )}
              </div>

              {/* Extra-Curricular & Co-Curricular Activities */}
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Award className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Extra-Curricular & Co-Curricular
                </h4>
                {(() => {
                  let cocurList = [];
                  if (Array.isArray(candidate.cocurricular)) {
                    cocurList = candidate.cocurricular;
                  } else if (candidate.cocurricular && typeof candidate.cocurricular === 'string') {
                    cocurList = [{ activity: candidate.cocurricular, link: '', description: '' }];
                  }

                  if (cocurList && cocurList.length > 0) {
                    return (
                      <div className="space-y-3">
                        {cocurList.map((item, idx) => {
                          const title = typeof item === 'string' ? item : (item.activity || 'Activity');
                          const desc = typeof item === 'object' ? item.description : '';
                          const link = typeof item === 'object' ? item.link : '';

                          return (
                            <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-none text-xs space-y-1 shadow-2xs">
                              <div className="flex justify-between font-headline font-bold text-slate-900 dark:text-slate-100">
                                <span className="text-sm">{title}</span>
                              </div>
                              {desc && (
                                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line font-sans">{desc}</p>
                              )}
                              {link && (
                                <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline text-xs font-semibold block pt-1">
                                  Proof / Certificate Link &rarr;
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return <p className="text-xs text-slate-500 dark:text-slate-400">No extra-curricular activities listed.</p>;
                })()}
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-300 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" /> Download Resume PDF
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}

