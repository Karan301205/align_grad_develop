import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Video, Play, Mail, Phone, Globe, Calendar, Briefcase, FolderGit2, GraduationCap, Award, FileText, Star, Link, ExternalLink, Check, Sparkles, ArrowUpDown } from 'lucide-react';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';
import SideDrawer from './SideDrawer';
import { openResumePdfInNewTab } from '../../../services/resumePdf';
import { PRIMARY_BUTTON, SECONDARY_BUTTON, avatarTint } from './accountStyles';
import { recordViewedCandidate } from '../../../utils/recentCandidateViews';
import { rankProjectsForJob } from '../../../utils/projectRelevance';

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', showKey: 'showLinkedin', label: 'LinkedIn', icon: Link, color: 'text-[#0F7A55] ' },
  { key: 'github', showKey: 'showGithub', label: 'GitHub', icon: FolderGit2, color: 'text-purple-600 ' },
  { key: 'portfolio', showKey: 'showPortfolio', label: 'Personal Portfolio', icon: Globe, color: 'text-emerald-600 ' },
  { key: 'hackerEarth', showKey: 'showHackerEarth', label: 'HackerEarth', icon: Globe, color: 'text-cyan-600 ' },
  { key: 'hackerRank', showKey: 'showHackerRank', label: 'HackerRank', icon: Globe, color: 'text-green-600 ' },
  { key: 'codechef', showKey: 'showCodechef', label: 'CodeChef', icon: Globe, color: 'text-amber-600 ' },
  { key: 'leetcode', showKey: 'showLeetcode', label: 'LeetCode', icon: Globe, color: 'text-orange-600 ' },
  { key: 'codeforces', showKey: 'showCodeforces', label: 'CodeForces', icon: Globe, color: 'text-rose-600 ' },
  { key: 'kaggle', showKey: 'showKaggle', label: 'Kaggle', icon: Globe, color: 'text-sky-600 ' },
];

export default function CandidateProfileDrawer({ candidate, onClose, job }) {
  const recordedCandIdRef = useRef(null);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [sortByRelevance, setSortByRelevance] = useState(true);
  const [selectedProjVideo, setSelectedProjVideo] = useState(null);
  const templateId = `candidate-resume-template-${candidate?.id || candidate?._id || 'view'}`;

  const targetRequirements = useMemo(() => job?.requirements || [], [job?.requirements]);
  const hasJobContext = Boolean(targetRequirements.length > 0);

  const { rankedProjects, matchedProjectsCount } = useMemo(() => {
    if (!candidate?.projects || candidate.projects.length === 0) {
      return { rankedProjects: [], matchedProjectsCount: 0, maxMatches: 0 };
    }
    return rankProjectsForJob(candidate.projects, targetRequirements);
  }, [candidate?.projects, targetRequirements]);

  const displayedProjects = useMemo(() => {
    if (!candidate?.projects) return [];
    if (hasJobContext && sortByRelevance) {
      return rankedProjects;
    }
    return candidate.projects;
  }, [candidate?.projects, hasJobContext, sortByRelevance, rankedProjects]);

  const handleOpenGeneratedResume = async () => {
    setGeneratingResume(true);
    try {
      const element = document.getElementById(templateId);
      if (!element) {
        alert('Resume template element not found.');
        setGeneratingResume(false);
        return;
      }
      await openResumePdfInNewTab(element, `${candidate?.name || 'Candidate'}_Resume`);
    } catch (err) {
      console.error('Error generating candidate resume PDF:', err);
      alert('Failed to generate resume PDF. Please check browser console.');
    } finally {
      setGeneratingResume(false);
    }
  };

  // Record view once per candidate
  const candId = candidate?.id || candidate?._id || candidate?.userId;
  useEffect(() => {
    if (candId && recordedCandIdRef.current !== candId) {
      recordedCandIdRef.current = candId;
      recordViewedCandidate(candidate);
    }
  }, [candId, candidate]);

  if (!candidate) return null;

  const socialLinks = candidate.socialLinks || {};
  const activeSocialLinks = SOCIAL_PLATFORMS.filter(platform => {
    const url = socialLinks[platform.key];
    const isChecked = Boolean(socialLinks[platform.showKey]);
    return url && typeof url === 'string' && url.trim() !== '' && isChecked;
  });

  return (
    <SideDrawer
      label={`${candidate.name || 'Candidate'} profile`}
      onClose={onClose}
      header={
        <div className="flex min-w-0 items-center gap-3.5">
          <div className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ${avatarTint(candidate.name)}`}>
            {candidate.profilePic ? (
              <img src={candidate.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{candidate.name?.charAt(0) || 'C'}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-xl leading-tight text-[#023836]">
                <span className="font-bold">{candidate.name}</span>
              </h3>
              <span className="rounded-[6px] bg-[#E3F1EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F7A55]">Candidate Dossier</span>
            </div>
            {candidate.username && <p className="m-0 mt-0.5 text-[13px] font-semibold text-[#0F7A55]">@{candidate.username}</p>}
          </div>
        </div>
      }
      footer={
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={handleOpenGeneratedResume} disabled={generatingResume} className={`${PRIMARY_BUTTON} h-10 px-4`}>
            <FileText className="size-4" aria-hidden="true" />
            {generatingResume ? 'Generating PDF...' : 'Download Resume PDF'}
          </button>
          <button type="button" onClick={onClose} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            Close Profile
          </button>
        </div>
      }
      outside={
        <>
          {/* The two blocks below sit outside the sliding panel so their fixed positioning is not affected by it. */}
          {/* Off-screen Resume Template for PDF generation */}
          <ResumePdfTemplate id={templateId} candidate={candidate} />

          {/* Project Video Demo Player Modal */}
          {selectedProjVideo && (
            <div
              className="fixed inset-0 z-[120] backdrop-blur-md bg-black/75 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedProjVideo(null)}
            >
              <div
                className="bg-white border border-[#E4E6EA] rounded-[12px] max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-3 relative animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EA]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[8px] bg-purple-50 border border-purple-400 flex items-center justify-center text-purple-700">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="m-0 text-base text-[#023836]">
                        <span className="font-semibold">{selectedProjVideo.title || 'Project Walkthrough'}</span>
                      </h3>
                      <span className="text-[11px] text-slate-500">Candidate Project Demo Video</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProjVideo(null)}
                    className="p-1.5 text-slate-500 hover:text-[#023836] hover:bg-[#F4F8F6] rounded-[8px] transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-full bg-black rounded-[8px] overflow-hidden aspect-video flex items-center justify-center">
                  <video
                    src={selectedProjVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">

        {/* Left Column: Personal info, contact & video showcase */}
        <div className="md:col-span-2 space-y-5">
          {/* Video Intro Section */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Video className="w-4 h-4 text-[#0F7A55]" /> Video Introduction</span></h4>
            {candidate.introVideoUrl ? (
              <div className="mx-auto aspect-video w-full max-w-[220px] overflow-hidden rounded-[8px] border border-[#E4E6EA] bg-black">
                <video
                  src={candidate.introVideoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-5 rounded-[8px] bg-[#F8FBFA] border border-[#EEF0F3] text-center space-y-1">
                <p className="text-[13px] text-slate-600">No video showcase uploaded yet by this candidate.</p>
              </div>
            )}
          </div>

          {/* Bio & Details */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold">Bio & Summary</span></h4>
            <p className="text-[13px] text-slate-800 leading-relaxed bg-[#F8FBFA] border border-[#EEF0F3] p-3.5 rounded-[8px] italic">
              {candidate.bio || "No summary provided."}
            </p>
          </div>

          {/* Contact / Metadata */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold">Contact & Info</span></h4>
            <div className="bg-[#F8FBFA] border border-[#EEF0F3] p-3.5 rounded-[8px] text-[13px] space-y-2.5">
              {candidate.email && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="w-4 h-4 text-[#0F7A55] shrink-0" />
                  <span className="text-[#023836] font-medium truncate">{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-4 h-4 text-[#0F7A55] shrink-0" />
                  <span className="text-[#023836] font-medium">{candidate.phone}</span>
                </div>
              )}
              {candidate.nationality && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Globe className="w-4 h-4 text-[#0F7A55] shrink-0" />
                  <span className="text-[#023836] font-medium">{candidate.nationality}</span>
                </div>
              )}
              {candidate.dob && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-[#0F7A55] shrink-0" />
                  <span className="text-[#023836] font-medium">{candidate.dob}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles Section */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Link className="w-4 h-4 text-[#0F7A55]" /> Social Profiles</span></h4>
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
                      className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#F8FBFA] hover:bg-[#F4F8F6] border border-[#EEF0F3] text-[13px] font-semibold text-[#023836] hover:text-[#0F7A55] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlatformIcon className={`w-4 h-4 ${platform.color} shrink-0`} />
                        <span className="truncate">{platform.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#0F7A55] group-hover:underline flex items-center gap-1 shrink-0">
                        View <ExternalLink className="w-3 h-3" />
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-[8px] bg-[#F8FBFA] border border-[#EEF0F3] text-center">
                <p className="text-[13px] text-slate-500 italic">No social links shared by this candidate.</p>
              </div>
            )}
          </div>

          {/* Work Preferences Section */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Briefcase className="w-4 h-4 text-[#0F7A55]" /> Work Preferences</span></h4>
            <div className="bg-[#F8FBFA] border border-[#EEF0F3] p-3.5 rounded-[8px] space-y-3.5 text-[13px]">
              <div>
                <span className="text-[11px] font-semibold text-slate-800 block mb-1.5">Work Mode:</span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.preferredWorkModes && candidate.preferredWorkModes.length > 0 ? (
                    candidate.preferredWorkModes.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-[#E3F1EE] text-[#03443F] border border-[#7FD8C4] rounded-[6px] font-semibold text-[10px]">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Not specified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-800 block mb-1.5">Target Position Type:</span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.preferredWorkTypes && candidate.preferredWorkTypes.length > 0 ? (
                    candidate.preferredWorkTypes.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-300 rounded-[6px] font-semibold text-[10px]">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Not specified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-800 block mb-1.5">Preferred Locations:</span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.openToAnyLocation && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-400 rounded-[6px] font-semibold text-[10px]">
                      ✓ Open to Any Location / Relocate
                    </span>
                  )}
                  {candidate.preferredLocations && candidate.preferredLocations.length > 0 ? (
                    candidate.preferredLocations.map(l => (
                      <span key={l} className="px-2 py-0.5 bg-white border border-[#E4E6EA] rounded-[6px] font-medium text-[10px] text-slate-800">
                        📍 {l}
                      </span>
                    ))
                  ) : (
                    !candidate.openToAnyLocation && <span className="text-slate-500 italic">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills, Experience, Projects, Education, Certificates */}
        <div className="md:col-span-3 space-y-5">

          {/* Skills Grid */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold">Skills & Verified Ratings</span></h4>
            <div className="flex flex-wrap gap-2">
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((s, i) => (
                  <div key={i} className="px-3 py-1.5 bg-[#F8FBFA] border border-[#E4E6EA] rounded-[8px] text-[13px] font-medium text-[#023836] flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-[#0F7A55] font-semibold">Lvl {s.rating}/10</span>
                    {s.verifiedRating && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[9px] font-semibold rounded-[6px]">
                        Verified Lvl {s.verifiedRating}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-slate-500">No skills listed.</p>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Briefcase className="w-4 h-4 text-[#0F7A55]" /> Work Experience</span></h4>
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
                    <div className="grid grid-cols-2 gap-3 bg-[#F8FBFA] p-3.5 rounded-[8px] border border-[#EEF0F3] mb-3">
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-600 tracking-wider">Completed Gigs</p>
                          <p className="text-[13px] font-bold text-[#023836]">{completedGigsCount} Verified Task{completedGigsCount > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-600 tracking-wider">Average Rating</p>
                          <p className="text-[13px] font-bold text-[#023836]">{averageRating} / 5.0 Rating</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {candidate.experience && candidate.experience.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.experience.map((exp, idx) => (
                        <div key={idx} className={`p-3.5 border rounded-[8px] text-[13px] space-y-1.5 ${exp.expType === 'Gig' ? 'bg-emerald-50/50 border-emerald-300 ' : 'bg-[#F8FBFA] border-[#EEF0F3] '}`}>
                          <div className="flex justify-between font-semibold text-[#023836] flex-wrap gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm">{exp.designation}</span>
                              {exp.expType === 'Gig' && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-[6px] bg-emerald-100 text-emerald-900 text-[9px] font-semibold border border-emerald-400">
                                  ✓ Verified Gig
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-normal text-[11px]">{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                          </div>
                          <p className="text-[#0F7A55] font-semibold text-[13px]">{exp.companyName} {exp.location && <span className="text-[11px] text-slate-500 font-normal">({exp.location})</span>}</p>
                          {exp.description && (
                            <p className="text-slate-700 text-[13px] mt-1.5 leading-relaxed whitespace-pre-line">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-500">No experience listed.</p>
                  )}
                </>
              );
            })()}
          </div>

          {/* Projects */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EEF0F3]">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5"><span className="inline-flex items-center gap-1.5 font-semibold"><FolderGit2 className="w-4 h-4 text-[#0F7A55]" />
                  <span>Projects</span></span></h4>
                {hasJobContext && sortByRelevance && matchedProjectsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-[6px]">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>{matchedProjectsCount} Matching Job Skills</span>
                  </span>
                )}
              </div>

              {hasJobContext && candidate.projects && candidate.projects.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSortByRelevance(prev => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 bg-[#F4F8F6] hover:bg-[#E3F1EE] border border-[#E4E6EA] text-slate-800 rounded-[8px] transition-all cursor-pointer self-start sm:self-auto"
                  title={sortByRelevance ? "Currently ordered by relevance for this job. Click to show original order." : "Click to arrange by relevance for this job."}
                >
                  <ArrowUpDown className="w-3 h-3 text-[#0F7A55]" />
                  <span>{sortByRelevance ? 'Sorted: Job Relevance' : 'Sorted: Chronological'}</span>
                </button>
              )}
            </div>

            {hasJobContext && sortByRelevance && job?.title && (
              <div className="p-2.5 bg-[#E3F1EE]/80 border border-[#B5DDD3] rounded-[8px] text-[11px] text-[#023836] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#0F7A55] shrink-0" />
                <span>
                  Projects automatically arranged by relevance for <strong>{job.title}</strong> based on candidate's skill tags.
                </span>
              </div>
            )}

            {displayedProjects && displayedProjects.length > 0 ? (
              <div className="space-y-3">
                {displayedProjects.map((proj, idx) => {
                  const isMatch = hasJobContext && sortByRelevance && proj.matchCount > 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-[8px] text-[13px] space-y-2 transition-all ${
 isMatch
 ? 'bg-emerald-50/40 border-2 border-emerald-500/70 '
 : 'bg-[#F8FBFA] border border-[#EEF0F3] '
 }`}
                    >
                      {isMatch && (
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-[6px]">
                            <Sparkles className="w-3 h-3 text-emerald-700" />
                            <span>Relevance Match • {proj.matchCount} {proj.matchCount === 1 ? 'Skill Match' : 'Skills Match'}</span>
                          </span>
                          {proj.isTopMatch && (
                            <span className="text-[10px] font-semibold text-emerald-700">
                              Top Relevant Project
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between font-semibold text-[#023836]">
                        <span className="text-sm">{proj.title}</span>
                        <span className="text-slate-500 font-normal text-[11px]">
                          {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}
                        </span>
                      </div>

                      {proj.role && <p className="text-[#0F7A55] font-semibold text-[13px]">{proj.role}</p>}
                      {proj.description && <p className="text-slate-700 text-[13px] leading-relaxed">{proj.description}</p>}

                      {/* Skill Tags */}
                      {proj.skills && proj.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-slate-500 tracking-wider">
                            SKILLS:
                          </span>
                          {proj.skills.map((skill, sIdx) => {
                            const isSkillMatched = hasJobContext && (proj.matchedSkills || []).some(
                              m => m.toLowerCase() === skill.toLowerCase()
                            );

                            if (isSkillMatched) {
                              return (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-500 font-semibold rounded-[6px]"
                                >
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>{skill}</span>
                                </span>
                              );
                            }

                            return (
                              <span
                                key={sIdx}
                                className="text-[11px] px-2 py-0.5 bg-white border border-[#E4E6EA] text-slate-700 rounded-[6px] font-medium"
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 pt-1 font-semibold text-[13px]">
                        {proj.codeUrl && (
                          <a href={proj.codeUrl.startsWith('http') ? proj.codeUrl : `https://${proj.codeUrl}`} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-[#0F7A55] flex items-center gap-1">
                            Code Repo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {proj.hostedUrl && (
                          <a href={proj.hostedUrl.startsWith('http') ? proj.hostedUrl : `https://${proj.hostedUrl}`} target="_blank" rel="noopener noreferrer" className="text-[#0F7A55] hover:underline flex items-center gap-1">
                            Live Demo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {proj.videoUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedProjVideo({ url: proj.videoUrl, title: proj.title })}
                            className="text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Demo Video</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No projects listed.</p>
            )}
          </div>

          {/* Certificates */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Award className="w-4 h-4 text-[#0F7A55]" /> Licenses & Certifications</span></h4>
            {candidate.certificates && candidate.certificates.length > 0 ? (
              <div className="space-y-3">
                {candidate.certificates.map((cert, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F8FBFA] border border-[#EEF0F3] rounded-[8px] text-[13px] space-y-1">
                    <div className="flex justify-between font-semibold text-[#023836]">
                      <span className="text-sm">{cert.title}</span>
                      <span className="text-slate-500 font-normal text-[11px]">{cert.startDate}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{cert.org}</p>
                    {cert.link && (
                      <a href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`} target="_blank" rel="noopener noreferrer" className="text-[#0F7A55] hover:underline text-[13px] font-semibold block pt-1">
                        Credential Link &rarr;
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No certifications listed.</p>
            )}
          </div>

          {/* Education */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><GraduationCap className="w-4 h-4 text-[#0F7A55]" /> Education</span></h4>
            {candidate.education && candidate.education.length > 0 ? (
              <div className="space-y-3">
                {candidate.education.map((edu, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F8FBFA] border border-[#EEF0F3] rounded-[8px] text-[13px] space-y-1">
                    <div className="flex justify-between font-semibold text-[#023836]">
                      <span className="text-sm">{edu.degree} in {edu.fieldOfStudy}</span>
                      <span className="text-slate-500 font-normal text-[11px]">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{edu.institute}</p>
                    {edu.gradeValue && (
                      <p className="text-[13px] text-[#0F7A55] font-semibold">Grade: {edu.gradeValue} ({edu.gradeType})</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No education listed.</p>
            )}
          </div>


          {/* Extra-Curricular & Co-Curricular Activities */}
          <div className="bg-white border border-[#E4E6EA] rounded-[12px] p-4 sm:p-5 space-y-3">
            <h4 className="m-0 text-[15px] leading-[1.45] text-[#023836] flex items-center gap-1.5 pb-2 border-b border-[#EEF0F3]"><span className="inline-flex items-center gap-1.5 font-semibold"><Award className="w-4 h-4 text-[#0F7A55]" /> Extra-Curricular & Co-Curricular</span></h4>
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
                        <div key={idx} className="p-3.5 bg-[#F8FBFA] border border-[#EEF0F3] rounded-[8px] text-[13px] space-y-1">
                          <div className="flex justify-between font-semibold text-[#023836]">
                            <span className="text-sm">{title}</span>
                          </div>
                          {desc && (
                            <p className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-line">{desc}</p>
                          )}
                          {link && (
                            <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-[#0F7A55] hover:underline text-[13px] font-semibold block pt-1">
                              Proof / Certificate Link &rarr;
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return <p className="text-[13px] text-slate-500">No extra-curricular activities listed.</p>;
            })()}
          </div>

        </div>

      </div>
    </SideDrawer>
  );
}

