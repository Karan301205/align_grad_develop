import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  User,
  Search,
  MapPin,
  Briefcase,
  Loader2,
  CheckCircle2,
  Video,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Award,
  FolderGit2,
  GraduationCap,
  Calendar,
  Link as LinkIcon,
  ShieldCheck,
  Filter,
  Sparkles,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check
} from 'lucide-react';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';
import { openResumePdfInNewTab } from '../../../services/resumePdf';
import { INDIAN_STATES } from '../../../constants/indianStates';
import { recordViewedCandidate } from '../../../utils/recentCandidateViews';
import RecruiterCustomDropdown from './RecruiterCustomDropdown';
import SkillFilterDropdown from './SkillFilterDropdown';
import { hasSkillMcq } from '../../../constants';

function ActiveSkillChip({ skill, onUpdateRating, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const isMcq = hasSkillMcq(skill.name);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const hasLevelSet = skill.verifiedOnly || (skill.minRating && skill.minRating > 0);
  const levelLabel = skill.verifiedOnly
    ? '🛡️ Verified'
    : skill.minRating > 0
    ? `Lvl ${skill.minRating}+`
    : 'Level';

  return (
    <div
      ref={popoverRef}
      className={`relative inline-flex items-center gap-1.5 px-2 py-0.5 border text-[11px] font-sans rounded-none shadow-2xs transition-all ${
        hasLevelSet
          ? 'bg-blue-100 dark:bg-blue-950/80 border-blue-500 dark:border-blue-400 text-blue-950 dark:text-blue-100 font-semibold'
          : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-semibold'
      }`}
    >
      <span>Skill: {skill.name}</span>

      {/* Level Selector Button on the right of the skill name (Allowed for technical skills with MCQs) */}
      {isMcq && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }}
          className={`px-1.5 py-0.2 rounded-none border text-[10px] font-headline font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
            hasLevelSet
              ? 'bg-blue-700 text-white border-blue-800 hover:bg-blue-800'
              : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
          }`}
          title="Filter by skill proficiency level"
        >
          <span>{levelLabel}</span>
          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Remove Skill Button */}
      <button
        type="button"
        onClick={() => onRemove(skill.name)}
        className="hover:text-red-600 dark:hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
        title={`Remove Skill: ${skill.name}`}
      >
        <X className="w-3 h-3" />
      </button>

      {/* Themed Level Menu Popover */}
      {isOpen && isMcq && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl z-50 py-1 max-h-56 overflow-y-auto custom-scrollbar animate-scale-up text-left">
          <div className="px-2.5 py-1 text-[10px] font-headline font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 select-none">
            {skill.name} Level
          </div>

          <button
            type="button"
            onClick={() => {
              onUpdateRating(skill.name, 0, false);
              setIsOpen(false);
            }}
            className={`w-full px-2.5 py-1.5 text-left text-xs font-sans flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer ${
              !skill.verifiedOnly && (!skill.minRating || skill.minRating === 0)
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>Any Level</span>
            {!skill.verifiedOnly && (!skill.minRating || skill.minRating === 0) && (
              <Check className="w-3.5 h-3.5 text-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdateRating(skill.name, 0, true);
              setIsOpen(false);
            }}
            className={`w-full px-2.5 py-1.5 text-left text-xs font-sans flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer ${
              skill.verifiedOnly
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Only</span>
            </span>
            {skill.verifiedOnly && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                onUpdateRating(skill.name, lvl, false);
                setIsOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-xs font-sans flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer ${
                !skill.verifiedOnly && skill.minRating === lvl
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>Level {lvl}+</span>
              {!skill.verifiedOnly && skill.minRating === lvl && (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const WORK_MODE_OPTIONS = [
  { value: '', label: 'All Work Modes' },
  { value: 'Remote', label: 'Remote' },
  { value: 'On-Site', label: 'On-Site' },
  { value: 'Hybrid', label: 'Hybrid' },
];

const WORK_TYPE_OPTIONS = [
  { value: '', label: 'All Work Types' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Full-Time', label: 'Full-Time' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'Any Location', label: 'Open to Relocate / Any' },
  ...INDIAN_STATES.map(state => ({
    value: state,
    label: state,
    group: 'States & Union Territories'
  }))
];

const CREDENTIAL_OPTIONS = [
  { value: '', label: 'All Profiles' },
  { value: 'verified_skills', label: '🛡️ Has Verified Skills' },
  { value: 'has_video', label: '🎥 Has Video Showcase' },
  { value: 'has_resume', label: '📄 Has Resume Attached' },
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'All Experience Levels' },
  { value: 'experienced', label: 'Experienced (1+ Roles)' },
  { value: 'fresher', label: 'Freshers / Entry-Level' },
];

const MATCH_SCORE_OPTIONS = [
  { value: '', label: 'All Match Scores' },
  { value: '70', label: '🔥 Top Match (≥ 70%)' },
  { value: '50', label: '⚡ Good Match (≥ 50%)' },
  { value: 'any', label: '✨ Any Positive Match (> 0%)' },
];

const SORT_BY_OPTIONS = [
  { value: 'recommended', label: 'Recommended Order' },
  { value: 'verified_desc', label: 'Most Verified Skills' },
  { value: 'skills_count', label: 'Highest Skill Count' },
  { value: 'name_asc', label: 'Candidate Name (A-Z)' },
  { value: 'newest', label: 'Newest First' },
];

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', showKey: 'showLinkedin', label: 'LinkedIn', icon: LinkIcon, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'github', showKey: 'showGithub', label: 'GitHub', icon: FolderGit2, color: 'text-purple-600 dark:text-purple-400' },
  { key: 'portfolio', showKey: 'showPortfolio', label: 'Personal Portfolio', icon: Globe, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'hackerEarth', showKey: 'showHackerEarth', label: 'HackerEarth', icon: Globe, color: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'hackerRank', showKey: 'showHackerRank', label: 'HackerRank', icon: Globe, color: 'text-green-600 dark:text-green-400' },
  { key: 'codechef', showKey: 'showCodechef', label: 'CodeChef', icon: Globe, color: 'text-amber-600 dark:text-amber-400' },
  { key: 'leetcode', showKey: 'showLeetcode', label: 'LeetCode', icon: Globe, color: 'text-orange-600 dark:text-orange-400' },
  { key: 'codeforces', showKey: 'showCodeforces', label: 'CodeForces', icon: Globe, color: 'text-rose-600 dark:text-rose-400' },
  { key: 'kaggle', showKey: 'showKaggle', label: 'Kaggle', icon: Globe, color: 'text-sky-600 dark:text-sky-400' },
];

/**
 * Avatar with automated broken-image fallback to initial
 */
function CandidateAvatar({ candidate, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-xs';
  const initial = candidate?.name?.charAt(0)?.toUpperCase() || 'C';

  // Reset imgError if candidate changes
  useEffect(() => {
    setImgError(false);
  }, [candidate?.id, candidate?._id, candidate?.profilePic]);

  return (
    <div className={`${sizeClasses} rounded-none border border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-headline font-bold flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}>
      {candidate?.profilePic && !imgError ? (
        <img
          src={candidate.profilePic}
          alt={candidate.name || 'Candidate'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export default function RecruiterCandidates({ candidates = [], topTalents = null }) {
  const [selectedCandId, setSelectedCandId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]); // Array of { name, minRating, verifiedOnly }
  const [verificationFilter, setVerificationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [matchScoreFilter, setMatchScoreFilter] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [generatingResumeId, setGeneratingResumeId] = useState(null);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (setter, val) => {
    setter(val);
  };

  // Extract skill counts across candidate pool for the dropdown
  const { candidateSkillCounts, popularSkills } = useMemo(() => {
    const counts = {};
    (candidates || []).forEach(c => {
      (c.skills || []).forEach(s => {
        const name = (typeof s === 'string' ? s : s.name || '').trim();
        if (name) {
          counts[name] = (counts[name] || 0) + 1;
        }
      });
    });
    const sortedByCount = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      candidateSkillCounts: counts,
      popularSkills: sortedByCount.slice(0, 8)
    };
  }, [candidates]);

  // Sort candidate pool by recommendation / suggestion order (topTalents derived from active jobs demand profile)
  const orderedCandidates = useMemo(() => {
    if (!topTalents || !Array.isArray(topTalents) || topTalents.length === 0) {
      return candidates;
    }

    // Build map of candidate id -> { rank, data }
    const talentMap = new Map();
    topTalents.forEach((tal, idx) => {
      const id = String(tal.id || tal._id || tal.userId || '');
      if (id) {
        talentMap.set(id, { rank: idx, data: tal });
      }
    });

    const pool = [...candidates].map(c => {
      const id = String(c.id || c._id || c.userId || '');
      const matchedTalent = talentMap.get(id);
      if (matchedTalent) {
        return {
          ...c,
          matchScore: matchedTalent.data.matchScore,
          matchScoreDisplay: matchedTalent.data.matchScoreDisplay,
          matchingSkills: matchedTalent.data.matchingSkills,
          skillCoveragePercent: matchedTalent.data.skillCoveragePercent
        };
      }
      return c;
    });

    pool.sort((a, b) => {
      const idA = String(a.id || a._id || a.userId || '');
      const idB = String(b.id || b._id || b.userId || '');
      const rankA = talentMap.has(idA) ? talentMap.get(idA).rank : 999999;
      const rankB = talentMap.has(idB) ? talentMap.get(idB).rank : 999999;
      return rankA - rankB;
    });

    return pool;
  }, [candidates, topTalents]);

  const filteredCandidates = useMemo(() => {
    let list = orderedCandidates.filter(cand => {
      // 1. Text Search across Name, Username, Title/Role, Bio, and Skill names
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (cand.name || '').toLowerCase().includes(q);
        const usernameMatch = (cand.username || '').toLowerCase().includes(q);
        const titleMatch = (cand.title || cand.designation || '').toLowerCase().includes(q);
        const bioMatch = (cand.bio || '').toLowerCase().includes(q);
        const skillMatch = (cand.skills || []).some(s => {
          const sName = (typeof s === 'string' ? s : s.name || '').toLowerCase();
          return sName.includes(q);
        });
        if (!nameMatch && !usernameMatch && !titleMatch && !bioMatch && !skillMatch) {
          return false;
        }
      }

      // 2. Work Mode Filter
      if (workModeFilter) {
        const hasMode = cand.preferredWorkModes && cand.preferredWorkModes.includes(workModeFilter);
        if (!hasMode) return false;
      }

      // 3. Work Type Filter
      if (workTypeFilter) {
        const hasType = cand.preferredWorkTypes && cand.preferredWorkTypes.includes(workTypeFilter);
        if (!hasType) return false;
      }

      // 4. Location Filter
      if (locationFilter) {
        if (locationFilter === 'Any Location') {
          if (!cand.openToAnyLocation) return false;
        } else {
          const inPref = cand.preferredLocations && cand.preferredLocations.includes(locationFilter);
          const anyLoc = Boolean(cand.openToAnyLocation);
          if (!inPref && !anyLoc) return false;
        }
      }

      // 5. Skills Multi-Filter & Per-Skill Rating Check (Allowed only for technical skills with MCQs)
      if (selectedSkills && selectedSkills.length > 0) {
        const candidateSatisfiesAll = selectedSkills.every(reqSkill => {
          const candSkill = (cand.skills || []).find(s => {
            const sName = (typeof s === 'string' ? s : s.name || '').toLowerCase();
            return sName === reqSkill.name.toLowerCase();
          });
          if (!candSkill) return false;

          // If skill has MCQs and has a rating/verified requirement:
          if (hasSkillMcq(reqSkill.name)) {
            if (reqSkill.verifiedOnly) {
              if (!(candSkill.verifiedRating && candSkill.verifiedRating > 0)) {
                return false;
              }
            } else if (reqSkill.minRating && reqSkill.minRating > 0) {
              const effRating = candSkill.verifiedRating || candSkill.rating || 0;
              if (effRating < reqSkill.minRating) {
                return false;
              }
            }
          }

          return true;
        });

        if (!candidateSatisfiesAll) return false;
      }

      // 6. Verification & Media Assets Filter
      if (verificationFilter) {
        if (verificationFilter === 'verified_skills') {
          const hasVerified = (cand.skills || []).some(s => s.verifiedRating && s.verifiedRating > 0);
          if (!hasVerified) return false;
        } else if (verificationFilter === 'has_video') {
          if (!cand.introVideoUrl) return false;
        } else if (verificationFilter === 'has_resume') {
          if (!cand.resumeUrl) return false;
        }
      }

      // 7. Experience Level Filter
      if (experienceFilter) {
        const expCount = (cand.experience || []).length;
        if (experienceFilter === 'experienced' && expCount === 0) return false;
        if (experienceFilter === 'fresher' && expCount > 0) return false;
      }

      // 8. Match Score Filter
      if (matchScoreFilter) {
        const score = cand.matchScore || 0;
        if (matchScoreFilter === '70' && score < 70) return false;
        if (matchScoreFilter === '50' && score < 50) return false;
        if (matchScoreFilter === 'any' && score <= 0) return false;
      }

      return true;
    });

    // Sort according to sortBy
    if (sortBy === 'verified_desc') {
      list = [...list].sort((a, b) => {
        const verA = (a.skills || []).filter(s => s.verifiedRating > 0).length;
        const verB = (b.skills || []).filter(s => s.verifiedRating > 0).length;
        if (verB !== verA) return verB - verA;
        return (b.skills?.length || 0) - (a.skills?.length || 0);
      });
    } else if (sortBy === 'skills_count') {
      list = [...list].sort((a, b) => (b.skills?.length || 0) - (a.skills?.length || 0));
    } else if (sortBy === 'name_asc') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [
    orderedCandidates,
    searchQuery,
    workModeFilter,
    workTypeFilter,
    locationFilter,
    selectedSkills,
    verificationFilter,
    experienceFilter,
    matchScoreFilter,
    sortBy
  ]);

  const handleUpdateSkillRating = (skillName, minRating, verifiedOnly) => {
    setSelectedSkills(prev =>
      prev.map(s => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          return {
            ...s,
            minRating: parseInt(minRating, 10) || 0,
            verifiedOnly: Boolean(verifiedOnly)
          };
        }
        return s;
      })
    );
  };

  const handleRemoveSkill = (skillName) => {
    setSelectedSkills(prev => prev.filter(item => item.name.toLowerCase() !== skillName.toLowerCase()));
  };

  // Other active filters list with clear callbacks
  const otherActiveFilters = [];
  if (searchQuery.trim()) otherActiveFilters.push({ label: `Search: "${searchQuery}"`, clear: () => setSearchQuery('') });
  if (workModeFilter) otherActiveFilters.push({ label: `Mode: ${workModeFilter}`, clear: () => setWorkModeFilter('') });
  if (workTypeFilter) otherActiveFilters.push({ label: `Type: ${workTypeFilter}`, clear: () => setWorkTypeFilter('') });
  if (locationFilter) otherActiveFilters.push({ label: `Location: ${locationFilter}`, clear: () => setLocationFilter('') });
  if (verificationFilter) {
    const vLabel = verificationFilter === 'verified_skills' ? 'Verified Skills' : verificationFilter === 'has_video' ? 'Has Video' : 'Has Resume';
    otherActiveFilters.push({ label: vLabel, clear: () => setVerificationFilter('') });
  }
  if (experienceFilter) {
    const expLabel = experienceFilter === 'experienced' ? 'Experienced' : 'Freshers';
    otherActiveFilters.push({ label: `Exp: ${expLabel}`, clear: () => setExperienceFilter('') });
  }
  if (matchScoreFilter) {
    const mLabel = matchScoreFilter === '70' ? 'Match ≥ 70%' : matchScoreFilter === '50' ? 'Match ≥ 50%' : 'Any Match';
    otherActiveFilters.push({ label: mLabel, clear: () => setMatchScoreFilter('') });
  }
  if (sortBy !== 'recommended') {
    const sLabel = sortBy === 'verified_desc' ? 'Most Verified' : sortBy === 'skills_count' ? 'Most Skills' : sortBy === 'name_asc' ? 'A-Z' : 'Newest';
    otherActiveFilters.push({ label: `Sort: ${sLabel}`, clear: () => setSortBy('recommended') });
  }

  const totalActiveFiltersCount = (selectedSkills ? selectedSkills.length : 0) + otherActiveFilters.length;

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setWorkModeFilter('');
    setWorkTypeFilter('');
    setLocationFilter('');
    setVerificationFilter('');
    setExperienceFilter('');
    setMatchScoreFilter('');
    setSortBy('recommended');
  };

  // Automatically select first candidate by default
  const activeCandidate = filteredCandidates.find(c => (c.id || c._id) === selectedCandId) || filteredCandidates[0] || null;

  useEffect(() => {
    if (filteredCandidates.length > 0) {
      const currentExists = filteredCandidates.some(c => (c.id || c._id) === selectedCandId);
      if (!currentExists) {
        setSelectedCandId(filteredCandidates[0].id || filteredCandidates[0]._id);
      }
    } else {
      setSelectedCandId(null);
    }
  }, [filteredCandidates, selectedCandId]);

  /**
   * Fix for Resume Button:
   * 1. Opens valid Google Drive / Docs links with proper https protocol in a new tab.
   * 2. Otherwise, dynamically generates and displays the candidate's standardized PDF resume using ResumePdfTemplate.
   */
  const handleResumeClick = async (e, cand) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const candId = cand.id || cand._id;
    const rawUrl = (cand.resumeUrl || '').trim();

    const isDriveLink = rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com') || rawUrl.includes('dropbox.com');
    if (isDriveLink) {
      const formattedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const templateId = `candidate-resume-template-${candId}`;
    const element = document.getElementById(templateId);

    if (!element) {
      alert('Resume template element is preparing. Please try again in a moment.');
      return;
    }

    setGeneratingResumeId(candId);
    try {
      await openResumePdfInNewTab(element, `${cand.name || 'Candidate'}_Resume`);
    } catch (err) {
      console.error('Error generating candidate resume PDF:', err);
      alert('Failed to generate resume PDF. Please check your browser popup blocker settings.');
    } finally {
      setGeneratingResumeId(null);
    }
  };

  const socialLinks = activeCandidate?.socialLinks || {};
  const activeSocialLinks = SOCIAL_PLATFORMS.filter(platform => {
    const url = socialLinks[platform.key];
    const isChecked = Boolean(socialLinks[platform.showKey]);
    return url && typeof url === 'string' && url.trim() !== '' && isChecked;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-3 animate-fade-in text-left pb-1">

      {/* Recruiter Executive Top Header Banner */}
      <header className="bg-surface border border-slate-300 dark:border-slate-700 p-3.5 sm:p-4 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-1">
            <span>Talent Directory</span>
          </div>
          <h2 className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Explore Stacks & Candidates
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium mt-0.5">
            Browse candidates on the left and review full technical credentials, experience, and resumes on the right.
          </p>
        </div>
      </header>

      {/* Comprehensive Search & Multi-Filter Toolbar */}
      <div className="bg-surface border border-slate-300 dark:border-slate-700 p-3.5 rounded-none shadow-2xs space-y-3">
        {/* Row 1: Primary Search + Key Filters + Advanced Filters Toggle */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, @username, role, or skill..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-700 transition-all font-sans font-medium shadow-2xs"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Primary Filters Dropdowns using Themed Components */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter 1: Skills (Multi-select with search and per-skill MCQ ratings) */}
            <SkillFilterDropdown
              selectedSkills={selectedSkills}
              onChange={setSelectedSkills}
              candidateSkillCounts={candidateSkillCounts}
            />

            {/* Filter 2: Mode of Work */}
            <RecruiterCustomDropdown
              value={workModeFilter}
              onChange={setWorkModeFilter}
              options={WORK_MODE_OPTIONS}
              defaultLabel="All Work Modes"
            />

            {/* Filter 3: Type of Work */}
            <RecruiterCustomDropdown
              value={workTypeFilter}
              onChange={setWorkTypeFilter}
              options={WORK_TYPE_OPTIONS}
              defaultLabel="All Work Types"
            />

            {/* Filter 4: Preferred Location(s) in India (Searchable) */}
            <RecruiterCustomDropdown
              value={locationFilter}
              onChange={setLocationFilter}
              options={LOCATION_OPTIONS}
              defaultLabel="All Locations"
              searchable={true}
              searchPlaceholder="Search state or territory..."
            />

            {/* Advanced Filters Toggle Button */}
            {(() => {
              const advancedFiltersCount = [
                verificationFilter,
                experienceFilter,
                matchScoreFilter,
                sortBy !== 'recommended' ? sortBy : ''
              ].filter(Boolean).length;

              return (
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(prev => !prev)}
                  className={`px-3 py-2 text-xs font-headline font-bold rounded-none border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    showAdvancedFilters || advancedFiltersCount > 0
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 text-blue-900 dark:text-blue-200'
                      : 'bg-[#DBEAFF] dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>More Filters</span>
                  {advancedFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-none bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {advancedFiltersCount}
                    </span>
                  )}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Row 2: Advanced Filters (Collapsible panel with Themed Dropdowns) */}
        {(() => {
          const advancedFiltersCount = [
            verificationFilter,
            experienceFilter,
            matchScoreFilter,
            sortBy !== 'recommended' ? sortBy : ''
          ].filter(Boolean).length;

          if (!showAdvancedFilters && advancedFiltersCount === 0) return null;

          return (
            <div className="pt-2.5 pb-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-blue-600" /> Advanced:
              </span>

              {/* Filter: Verification & Media */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400">Credentials:</label>
                <RecruiterCustomDropdown
                  value={verificationFilter}
                  onChange={setVerificationFilter}
                  options={CREDENTIAL_OPTIONS}
                  defaultLabel="All Profiles"
                />
              </div>

              {/* Filter: Experience Level */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400">Experience:</label>
                <RecruiterCustomDropdown
                  value={experienceFilter}
                  onChange={setExperienceFilter}
                  options={EXPERIENCE_OPTIONS}
                  defaultLabel="All Experience Levels"
                />
              </div>

              {/* Filter: Match Score threshold */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400">Match Score:</label>
                <RecruiterCustomDropdown
                  value={matchScoreFilter}
                  onChange={setMatchScoreFilter}
                  options={MATCH_SCORE_OPTIONS}
                  defaultLabel="All Match Scores"
                />
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 ml-auto">
                <label className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-slate-500" /> Sort By:
                </label>
                <RecruiterCustomDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_BY_OPTIONS}
                  defaultLabel="Recommended Order"
                  align="right"
                />
              </div>
            </div>
          );
        })()}

        {/* Row 3: Popular Tech Stack Quick Chips */}
        {popularSkills && popularSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-headline font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Popular Stacks:
            </span>
            {popularSkills.map(skill => {
              const isSelected = selectedSkills.some(s => s.name.toLowerCase() === skill.toLowerCase());
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSkills(prev => prev.filter(s => s.name.toLowerCase() !== skill.toLowerCase()));
                    } else {
                      setSelectedSkills(prev => [
                        ...prev,
                        {
                          name: skill,
                          minRating: 0,
                          verifiedOnly: false,
                          hasMcq: hasSkillMcq(skill)
                        }
                      ]);
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 font-sans font-semibold rounded-none border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-blue-700 border-blue-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        )}

        {/* Row 4: Active Filter Tags & Results Status Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-sans font-medium text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Active Filters: <span className="font-headline font-bold text-blue-700 dark:text-blue-400">{totalActiveFiltersCount}</span>
            </span>

            {totalActiveFiltersCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>

                {/* Render Selected Skill Chips with Inline Level Selector */}
                {selectedSkills.map(skill => (
                  <ActiveSkillChip
                    key={skill.name}
                    skill={skill}
                    onUpdateRating={handleUpdateSkillRating}
                    onRemove={handleRemoveSkill}
                  />
                ))}

                {/* Render Other Filter Chips */}
                {otherActiveFilters.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 text-[11px] font-sans font-semibold rounded-none shadow-2xs"
                  >
                    <span>{f.label}</span>
                    <button
                      type="button"
                      onClick={f.clear}
                      className="hover:text-red-600 dark:hover:text-red-400 p-0.5 cursor-pointer"
                      title={`Remove ${f.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-xs font-headline font-bold text-red-600 dark:text-red-400 hover:underline px-1.5 py-0.5 cursor-pointer transition-colors"
                >
                  Reset All
                </button>
              </>
            )}
          </div>

          <div className="text-right">
            <span>
              Matching Candidates:{' '}
              <span className="font-headline font-bold text-blue-700 dark:text-blue-400">
                {filteredCandidates.length}
              </span>{' '}
              <span className="text-slate-400">/ {candidates?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Unified Single Chassis Split-Pane Container (Stretched down to bottom) */}
      <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs flex flex-col lg:flex-row h-[calc(100vh-175px)] min-h-[750px] xl:min-h-[820px] overflow-hidden">

        {/* Left Column: Candidates Master List (Separated by right vertical border) */}
        <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-700 flex flex-col h-full overflow-hidden bg-surface">

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                Candidates List
              </span>
              {sortBy === 'recommended' && topTalents && topTalents.length > 0 && !searchQuery && !workModeFilter && !workTypeFilter && !locationFilter && (!selectedSkills || selectedSkills.length === 0) && (
                <span className="text-[10px] font-headline font-bold px-1.5 py-0.2 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200">
                  Recommended Order
                </span>
              )}
              {sortBy !== 'recommended' && (
                <span className="text-[10px] font-headline font-bold px-1.5 py-0.2 rounded-none bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200">
                  {sortBy === 'verified_desc' ? 'Most Verified' : sortBy === 'skills_count' ? 'Most Skills' : sortBy === 'name_asc' ? 'A-Z' : 'Newest'}
                </span>
              )}
            </div>
            <span className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400">
              {filteredCandidates.length} {filteredCandidates.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-slate-800">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <User className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-headline">No Candidates Found</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">Try modifying your filters or search keyword.</p>
              </div>
            ) : (
              filteredCandidates.map(cand => {
                const candId = cand.id || cand._id;
                const isSelected = activeCandidate && (activeCandidate.id || activeCandidate._id) === candId;
                const isGenerating = generatingResumeId === candId;

                return (
                  <div
                    key={candId}
                    onClick={() => {
                      setSelectedCandId(candId);
                      recordViewedCandidate(cand);
                    }}
                    className={`p-4 transition-all cursor-pointer flex flex-col gap-2.5 border-l-4 text-left ${isSelected
                        ? 'border-l-blue-700 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-l-transparent bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                  >
                    {/* Top Row: Avatar, Name, Username, and Quick Resume Button */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <CandidateAvatar candidate={cand} size="md" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {cand.name}
                          </h4>
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-semibold truncate">
                            {cand.username ? `@${cand.username}` : 'Candidate'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleResumeClick(e, cand)}
                        disabled={isGenerating}
                        title="Open candidate resume"
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-[11px] font-headline font-bold rounded-none flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-700 dark:text-emerald-300" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Middle Row: Work Preferences, Match Score, & Showcase Video indicator */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {cand.matchScore !== undefined && cand.matchScore !== null && (
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-headline font-bold rounded-none">
                          {cand.matchScore}% Match
                        </span>
                      )}
                      {cand.introVideoUrl && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-headline font-bold rounded-none flex items-center gap-1">
                          🎥 Video
                        </span>
                      )}
                      {cand.preferredWorkModes && cand.preferredWorkModes.slice(0, 2).map(m => (
                        <span key={m} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-sans font-medium rounded-none">
                          {m}
                        </span>
                      ))}
                      {cand.openToAnyLocation ? (
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-sans font-medium rounded-none">
                          📍 Relocate
                        </span>
                      ) : (
                        cand.preferredLocations && cand.preferredLocations[0] && (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-sans font-medium rounded-none">
                            📍 {cand.preferredLocations[0]}
                          </span>
                        )
                      )}
                    </div>

                    {/* Bottom Row: Top skills preview (prioritizing selected skills) */}
                    {cand.skills && cand.skills.length > 0 && (() => {
                      const allCandSkills = cand.skills || [];
                      let prioritized = allCandSkills;
                      if (selectedSkills && selectedSkills.length > 0) {
                        const selectedNames = new Set(selectedSkills.map(s => s.name.toLowerCase()));
                        const match = allCandSkills.filter(s => selectedNames.has((typeof s === 'string' ? s : s.name || '').toLowerCase()));
                        const rest = allCandSkills.filter(s => !selectedNames.has((typeof s === 'string' ? s : s.name || '').toLowerCase()));
                        prioritized = [...match, ...rest];
                      }
                      const displayed = prioritized.slice(0, 3);
                      const remainingCount = prioritized.length - 3;

                      return (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {displayed.map((s, idx) => {
                            const sName = typeof s === 'string' ? s : s.name || '';
                            const sRating = typeof s === 'string' ? '' : s.rating;
                            const isMatchedSkill = selectedSkills && selectedSkills.some(req => req.name.toLowerCase() === sName.toLowerCase());
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-1.5 py-0.5 font-sans rounded-none ${
                                  isMatchedSkill
                                    ? 'bg-blue-100 dark:bg-blue-950/80 border border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-200 font-bold'
                                    : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium'
                                }`}
                              >
                                {sName}{' '}
                                {sRating && (
                                  <span className={`font-bold ${isMatchedSkill ? 'text-blue-800 dark:text-blue-300' : 'text-blue-700 dark:text-blue-400'}`}>
                                    Lvl {sRating}
                                  </span>
                                )}
                                {s.verifiedRating ? ' 🛡️' : ''}
                              </span>
                            );
                          })}
                          {remainingCount > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 self-center font-sans">
                              +{remainingCount} more
                            </span>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Candidate Dossier */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">

          {!activeCandidate ? (
            <div className="p-16 text-center space-y-3 m-auto">
              <div className="w-14 h-14 mx-auto rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xl shadow-2xs">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">No Candidate Selected</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans max-w-sm mx-auto">
                Select a candidate from the left list to view their complete credentials, proficiency levels, and portfolio.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">

              {/* Dossier Header */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-3.5">
                  <CandidateAvatar candidate={activeCandidate} size="lg" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {activeCandidate.name}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200">
                        Candidate Dossier
                      </span>
                      {/* {activeCandidate.matchScore !== undefined && activeCandidate.matchScore !== null && (
                        <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200">
                          {activeCandidate.matchScore}% Match
                        </span>
                      )} */}
                    </div>
                    {activeCandidate.username && (
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-bold mt-0.5">
                        @{activeCandidate.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Header Action: View / Download Standardized Resume */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={(e) => handleResumeClick(e, activeCandidate)}
                    disabled={generatingResumeId === (activeCandidate.id || activeCandidate._id)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generatingResumeId === (activeCandidate.id || activeCandidate._id) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Resume...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>View / Download Resume PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dossier Body Content */}
              <div className="p-5 sm:p-6 space-y-5 text-left flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">

                {/* Contact & Preferences Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Personal Contact Details */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Contact Details</span>
                    </h4>
                    <div className="space-y-1.5 text-xs font-sans">
                      {activeCandidate.email && (
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{activeCandidate.email}</span>
                        </div>
                      )}
                      {activeCandidate.phone && (
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{activeCandidate.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{activeCandidate.preferredLocations?.join(', ') || 'India'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Work Preferences</span>
                    </h4>
                    <div className="space-y-1.5 text-xs font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-600 dark:text-slate-400">Mode:</span>
                        {activeCandidate.preferredWorkModes && activeCandidate.preferredWorkModes.length > 0 ? (
                          activeCandidate.preferredWorkModes.map(m => (
                            <span key={m} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-headline font-bold text-[10px] rounded-none">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Not specified</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-600 dark:text-slate-400">Type:</span>
                        {activeCandidate.preferredWorkTypes && activeCandidate.preferredWorkTypes.length > 0 ? (
                          activeCandidate.preferredWorkTypes.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-headline font-bold text-[10px] rounded-none">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Not specified</span>
                        )}
                      </div>

                      {activeCandidate.openToAnyLocation && (
                        <div className="pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-headline font-bold text-[10px] rounded-none">
                            ✓ Open to Relocate / Any Location
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Video Introduction Showcase (if present) */}
                {activeCandidate.introVideoUrl && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Video Introduction</span>
                    </h4>
                    <div className="max-w-xl aspect-video rounded-none bg-black overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                      <video
                        src={activeCandidate.introVideoUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Bio & Professional Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    Professional Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {activeCandidate.bio || 'No summary statement provided yet by this candidate.'}
                  </p>
                </div>

                {/* Technical Skills & Verified Proficiency Levels */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    Technical Proficiencies & Verified Levels
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeCandidate.skills && activeCandidate.skills.length > 0 ? (
                      activeCandidate.skills.map((s, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 shadow-2xs"
                        >
                          <span>{s.name}</span>
                          <span className="text-blue-700 dark:text-blue-400 font-headline font-bold">Lvl {s.rating}/10</span>
                          {s.verifiedRating && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 text-[9px] font-headline font-bold rounded-none">
                              ✓ Verified Lvl {s.verifiedRating}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No skills listed yet.</span>
                    )}
                  </div>
                </div>

                {/* Experience History */}
                {activeCandidate.experience && activeCandidate.experience.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Work Experience</span>
                    </h4>
                    <div className="space-y-3">
                      {activeCandidate.experience.map((exp, idx) => (
                        <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none space-y-1 shadow-2xs">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">{exp.designation || exp.title}</p>
                              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium font-sans">{exp.companyName || exp.company}</p>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                              {exp.startDate} - {exp.endDate || 'Present'}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pt-1">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio Projects */}
                {activeCandidate.projects && activeCandidate.projects.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Projects</span>
                    </h4>
                    <div className="space-y-3">
                      {activeCandidate.projects.map((proj, idx) => (
                        <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none space-y-1 shadow-2xs">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <p className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">{proj.title}</p>
                            {proj.link && (
                              <a
                                href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <span>Live Project</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pt-1">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {activeCandidate.certificates && activeCandidate.certificates.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Certifications</span>
                    </h4>
                    <div className="space-y-3">
                      {activeCandidate.certificates.map((cert, idx) => (
                        <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none space-y-1 shadow-2xs">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">{cert.title || cert.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">{cert.org || cert.issuer}</p>
                            </div>
                            {cert.link && (
                              <a
                                href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <span>Credential</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {activeCandidate.education && activeCandidate.education.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Education</span>
                    </h4>
                    <div className="space-y-3">
                      {activeCandidate.education.map((edu, idx) => (
                        <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none space-y-1 shadow-2xs">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <p className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">{edu.degree || edu.title}</p>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">{edu.year || edu.startDate}</span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-sans">{edu.institution || edu.school}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Social & Professional Links */}
                {activeSocialLinks.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 p-4 rounded-none shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                      Social & Coding Profiles
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeSocialLinks.map(platform => {
                        const url = socialLinks[platform.key];
                        const PlatformIcon = platform.icon;
                        return (
                          <a
                            key={platform.key}
                            href={url.startsWith('http') ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 rounded-none shadow-2xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <PlatformIcon className={`w-4 h-4 ${platform.color} shrink-0`} />
                              <span className="truncate">{platform.label}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0 ml-2" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>

      {/* Off-screen Resume Templates for active candidates to ensure instantaneous, reliable PDF generation */}
      {filteredCandidates.map(cand => (
        <ResumePdfTemplate
          key={`template-${cand.id || cand._id}`}
          id={`candidate-resume-template-${cand.id || cand._id}`}
          candidate={cand}
        />
      ))}

    </div>
  );
}
