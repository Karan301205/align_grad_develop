import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Clock,
  User,
  Search,
  Send,
  Paperclip,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Star,
  Sparkles,
  X,
  Plus,
  ShieldCheck,
  ChevronDown,
  Check,
  Info,
  Users,
  MessageSquare,
  Lock
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { ALL_SKILLS } from '../../../constants';
import AnimatedContent from '../../../components/ui/AnimatedContent';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import Badge from '../../../components/ui/Badge';
import { formatAlertMessage } from '../../../utils/errorFormatter';
import CandidateProfileModal from '../../Recruiter/components/CandidateProfileModal';

const RAW_GIG_CATEGORIES = [
  "Artificial Intelligence (AI)", "Machine Learning", "Generative AI", "Natural Language Processing (NLP)",
  "Computer Vision", "Data Science", "Data Analytics", "Business Analytics", "Data Engineering",
  "Business Intelligence (BI)", "Full Stack Development", "Frontend Development", "Backend Development",
  "Web Development", "Mobile App Development", "Android Development", "iOS Development", "Game Development",
  "DevOps", "Cloud Computing", "Site Reliability Engineering (SRE)", "Platform Engineering", "Cyber Security",
  "Ethical Hacking", "Network Engineering", "Cloud Security", "Software Testing (QA)", "Automation Testing",
  "SDET", "Database Development", "SQL Development", "Python Development", "Java Development",
  "JavaScript Development", "C++ Development", ".NET Development", "PHP Development", "Go Development",
  "Embedded Systems", "IoT Development", "Robotics & Drones", "Blockchain & Web3", "AR/VR Development",
  "UI/UX Design", "Graphic Design", "Product Management", "Product Analytics", "Technical Support",
  "Research & Development (R&D)", "Open Source Contributions", "API Development", "Microservices",
  "SaaS Development", "E-commerce Development", "Automation & Scripting", "Low-Code / No-Code",
  "Prompt Engineering", "AI Agent Development", "MLOps", "FinTech", "HealthTech", "EdTech",
  "Digital Marketing", "Content Writing", "Technical Writing", "Video Editing", "Motion Graphics"
];

const GIG_CATEGORIES = [...RAW_GIG_CATEGORIES].sort((a, b) => a.localeCompare(b));

function SearchableCategorySelect({ value, onChange, placeholder = "Search or select field...", categories = GIG_CATEGORIES, allowCustom = true, isFilter = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const filteredCategories = sortedCategories.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          onChange={(e) => {
            const newVal = e.target.value;
            setSearchTerm(newVal);
            onChange(newVal);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none pr-8 font-sans transition-all placeholder:text-on-surface-variant/60"
        />
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2 text-on-surface-variant hover:text-on-surface p-1 rounded-md cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-1">
          {isFilter && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans ${
                !value ? 'bg-primary/15 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>All Categories / Fields</span>
              {!value && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          )}

          {filteredCategories.length === 0 ? (
            <div className="p-2.5 text-center text-xs text-on-surface-variant font-sans font-normal">
              No matching field found
              {allowCustom && searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchTerm.trim());
                    setIsOpen(false);
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Use "{searchTerm.trim()}"
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onChange(cat);
                  setSearchTerm(cat);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans ${
                  value === cat
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>{cat}</span>
                {value === cat && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MultiSearchableCategorySelect({ values = [], onChange, placeholder = "Search or select field...", categories = GIG_CATEGORIES, allowCustom = true, showTags = true, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const filteredCategories = sortedCategories.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (cat) => {
    if (!values.includes(cat)) {
      onChange([...values, cat]);
    } else {
      onChange(values.filter(v => v !== cat));
    }
    setSearchTerm('');
  };

  const handleRemove = (cat, e) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== cat));
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={values.length > 0 ? "Add another field..." : placeholder}
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none pr-8 font-sans transition-all placeholder:text-on-surface-variant/60"
        />
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2 text-on-surface-variant hover:text-on-surface p-1 rounded-md cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-1">
          {filteredCategories.length === 0 ? (
            <div className="p-2.5 text-center text-xs text-on-surface-variant font-sans font-normal">
              No matching field found
              {allowCustom && searchTerm.trim() && !values.includes(searchTerm.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(searchTerm.trim());
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Use "{searchTerm.trim()}"
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map(cat => {
              const isSelected = values.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      )}

      {showTags && values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map(cat => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-semibold shrink-0"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(cat, e)}
                className="hover:bg-primary/20 p-0.5 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3 h-3 text-primary" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GigsMarketplace({ user, token, theme, profile, onUpdateProfile, onOpenCompanyProfile, autoSelectOpportunity, setAutoSelectOpportunity, onNavigateToTests }) {
  const [activeSubTab, setActiveSubTab] = useState('browse'); // 'browse', 'post', 'my-gigs'
  const [gigs, setGigs] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoSelectOpportunity && autoSelectOpportunity.type === 'gig') {
      setSelectedGigId(autoSelectOpportunity.id);
      fetchGigDetails(autoSelectOpportunity.id);
      setAutoSelectOpportunity(null);
    }
  }, [autoSelectOpportunity, setAutoSelectOpportunity]);

  const [q, setQ] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');

  // Create Gig state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [budget, setBudget] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [postingGig, setPostingGig] = useState(false);

  // Detail / Work room state
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [gigDetails, setGigDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyFile, setApplyFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [targetApplyGig, setTargetApplyGig] = useState(null);

  // Chat message state
  const [chatText, setChatText] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Submission state
  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  // Review state
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // Info Modal, Submission Modal & Other Candidates Modal state
  const [showGigInfoModal, setShowGigInfoModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showOtherCandidatesModal, setShowOtherCandidatesModal] = useState(false);
  const [selectedOtherCandidateId, setSelectedOtherCandidateId] = useState(null);
  const [otherCandidateChatText, setOtherCandidateChatText] = useState('');
  const [otherCandidateChatFile, setOtherCandidateChatFile] = useState(null);
  // Unreviewed Pitch Details Modal & Candidate Profile Modal state
  const [selectedUnreviewedPitchApp, setSelectedUnreviewedPitchApp] = useState(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOpenCandidateProfile = async (candidateId, fallbackCandidate) => {
    if (!candidateId) {
      if (fallbackCandidate) setSelectedCandidateForProfile(fallbackCandidate);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await apiFetch('/api/recruiter/candidates', { token });
      if (res.ok) {
        const allCandidates = await res.json();
        const found = Array.isArray(allCandidates)
          ? allCandidates.find(c => c.id === candidateId || c.userId === candidateId)
          : null;
        if (found) {
          setSelectedCandidateForProfile(found);
        } else {
          setSelectedCandidateForProfile(fallbackCandidate);
        }
      } else {
        setSelectedCandidateForProfile(fallbackCandidate);
      }
    } catch (err) {
      console.error('Error fetching candidate profile:', err);
      setSelectedCandidateForProfile(fallbackCandidate);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Edit Gig states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editReqs, setEditReqs] = useState([]);
  const [editSkillSearchTerm, setEditSkillSearchTerm] = useState('');
  const [isEditSkillDropdownOpen, setIsEditSkillDropdownOpen] = useState(false);
  const [editBudget, setEditBudget] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editAttachmentFile, setEditAttachmentFile] = useState(null);
  const [updatingGig, setUpdatingGig] = useState(false);

  // Keep a reference to profile to satisfy eslint
  React.useEffect(() => {
    if (profile) {
      console.log('Active profile:', profile.name);
    }
  }, [profile]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchGigs = async () => {
    setLoading(true);
    try {
      let queryStr = '';
      if (q) queryStr += `q=${encodeURIComponent(q)}`;
      if (selectedCategoryFilter) {
        queryStr += (queryStr ? '&' : '') + `category=${encodeURIComponent(selectedCategoryFilter)}`;
      }
      if (selectedSkills) {
        queryStr += (queryStr ? '&' : '') + `skills=${encodeURIComponent(selectedSkills)}`;
      }

      const res = await apiFetch(`/gigs?${queryStr}`, { token });
      if (res.ok) {
        const data = await res.json();
        setGigs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGigs = async () => {
    try {
      const res = await apiFetch('/gigs/my-gigs', { token });
      if (res.ok) {
        const data = await res.json();
        setMyGigs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateGigDetailsState = (newData) => {
    if (!newData) return;
    setGigDetails(prev => {
      if (!prev || prev.id !== newData.id) return newData;
      const backendTexts = new Set((newData.messages || []).map(m => m.text));
      const tempMsgs = prev.messages?.filter(m => m.sending && !backendTexts.has(m.text)) || [];
      const mergedMessages = [...(newData.messages || []), ...tempMsgs];
      return {
        ...newData,
        messages: mergedMessages
      };
    });
  };

  const fetchGigDetails = async (gigId) => {
    if (!gigId) return;
    setLoadingDetails(true);
    try {
      const res = await apiFetch(`/gigs/${gigId}`, { token });
      if (res.ok) {
        const data = await res.json();
        updateGigDetailsState(data);
      } else {
        const localGig = gigs.find(g => g.id === gigId) || myGigs.find(g => g.id === gigId);
        if (localGig) {
          setGigDetails(localGig);
        }
      }
    } catch (err) {
      console.error(err);
      const localGig = gigs.find(g => g.id === gigId) || myGigs.find(g => g.id === gigId);
      if (localGig) {
        setGigDetails(localGig);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchGigDetailsSilently = async (gigId) => {
    try {
      const res = await apiFetch(`/gigs/${gigId}`, { token });
      if (res.ok) {
        const data = await res.json();
        updateGigDetailsState(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchGigs();
    fetchMyGigs();

    let intervalId = null;
    if (activeSubTab === 'my-gigs') {
      intervalId = setInterval(() => {
        fetchMyGigs();
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);

  // Auto-select first gig on browse tab
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeSubTab === 'browse') {
      if (gigs.length > 0) {
        const stillExists = gigs.some(g => g.id === selectedGigId);
        if (!selectedGigId || !stillExists) {
          setSelectedGigId(gigs[0].id);
          fetchGigDetails(gigs[0].id);
        }
      } else {
        setSelectedGigId(null);
        setGigDetails(null);
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gigs, activeSubTab]);

  // Auto-select first gig on workspace tab
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeSubTab === 'my-gigs') {
      const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
      const owned = myGigs.filter(g => g.ownerId && candidateIds.includes(g.ownerId.toString()));
      const hired = myGigs.filter(g => {
        const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
        return candidateIds.some(cId => allHired.includes(cId));
      });
      const applied = myGigs.filter(g => {
        const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
        const isHired = candidateIds.some(cId => allHired.includes(cId));
        const hasApplied = (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
        return (hasApplied || g.hasApplied) && !isHired;
      });

      const gigMap = new Map();
      [...owned, ...hired, ...applied].forEach(g => gigMap.set(g.id, g));
      const allMy = Array.from(gigMap.values());

      if (allMy.length > 0) {
        const stillExists = allMy.some(g => g.id === selectedGigId);
        if (!selectedGigId || !stillExists) {
          setSelectedGigId(allMy[0].id);
          fetchGigDetails(allMy[0].id);
        }
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myGigs, activeSubTab]);

  useEffect(() => {
    let interval;
    if (selectedGigId && gigDetails && (gigDetails.status === 'IN_PROGRESS' || gigDetails.status === 'OPEN')) {
      interval = setInterval(() => {
        fetchGigDetailsSilently(selectedGigId);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGigId, gigDetails?.status]);

  useEffect(() => {
    if (gigDetails && (gigDetails.status === 'IN_PROGRESS' || gigDetails.status === 'COMPLETED')) {
      scrollToBottom();
    }
  }, [gigDetails]);

  const handleTogglePause = async (gig) => {
    try {
      const nextStatus = gig.status === 'PAUSED' ? 'OPEN' : 'PAUSED';
      const res = await apiFetch(`/gigs/${gig.id}/status`, {
        token,
        method: 'PATCH',
        json: { status: nextStatus }
      });
      if (res.ok) {
        setAlertConfig({ message: `Gig ${gig.status === 'PAUSED' ? 'resumed' : 'paused'} successfully!`, type: 'success' });
        fetchGigDetails(gig.id);
        fetchMyGigs();
        fetchGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to toggle status', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleClose = async (gig) => {
    try {
      const nextStatus = gig.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
      const res = await apiFetch(`/gigs/${gig.id}/status`, {
        token,
        method: 'PATCH',
        json: { status: nextStatus }
      });
      if (res.ok) {
        setAlertConfig({ message: `Gig ${gig.status === 'CLOSED' ? 're-opened' : 'closed'} successfully!`, type: 'success' });
        fetchGigDetails(gig.id);
        fetchMyGigs();
        fetchGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update gig status', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm("Are you sure you want to delete this gig? This action cannot be undone.")) return;
    try {
      const res = await apiFetch(`/gigs/${gigId}`, {
        token,
        method: 'DELETE'
      });
      if (res.ok) {
        setAlertConfig({ message: 'Gig deleted successfully!', type: 'success' });
        setSelectedGigId(null);
        setGigDetails(null);
        fetchMyGigs();
        fetchGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to delete gig', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = (gig) => {
    setEditTitle(gig.title);
    setEditDescription(gig.description);
    const initialCats = (gig.categories && gig.categories.length > 0)
      ? gig.categories
      : (gig.category ? [gig.category] : []);
    setEditCategories(initialCats);

    let initialReqs = [];
    if (gig.requirements && Array.isArray(gig.requirements) && gig.requirements.length > 0) {
      initialReqs = gig.requirements;
    } else if (Array.isArray(gig.skills) && gig.skills.length > 0) {
      initialReqs = gig.skills.map(s => {
        const skillObj = ALL_SKILLS.find(item => item.skill.toLowerCase() === s.toLowerCase());
        const isTech = skillObj ? skillObj.type === 'technical' : true;
        return { skillName: s, minRating: isTech ? (gig.minRating || 4) : 0 };
      });
    }
    setEditReqs(initialReqs);
    setEditSkillSearchTerm('');
    setIsEditSkillDropdownOpen(false);
    setEditBudget(String(gig.budget));
    setEditDeliveryTime(gig.deliveryTime);
    setEditAttachmentFile(null);
    setShowEditModal(true);
  };

  const handleUpdateGigSubmit = async (e) => {
    e.preventDefault();
    if (!editCategories || editCategories.length === 0) {
      setAlertConfig({ message: 'Please select at least one Category of Field.', type: 'error' });
      return;
    }
    if (editReqs.length === 0) {
      setAlertConfig({ message: 'Please add at least one required skill.', type: 'error' });
      return;
    }
    setUpdatingGig(true);
    try {
      let uploadedUrl = gigDetails.attachments?.[0] || null;
      if (editAttachmentFile) {
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'doc',
            fileName: editAttachmentFile.name,
            contentType: editAttachmentFile.type
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, editAttachmentFile, editAttachmentFile.type, token);
          uploadedUrl = publicUrl;
        }
      }

      const gigData = {
        title: editTitle,
        description: editDescription,
        category: editCategories[0],
        categories: editCategories,
        skills: editReqs.map(r => r.skillName),
        requirements: editReqs,
        budget: parseFloat(editBudget),
        deliveryTime: editDeliveryTime,
        minRating: editReqs.length > 0 ? Math.max(...editReqs.map(r => r.minRating || 1)) : 1,
        attachments: uploadedUrl ? [uploadedUrl] : []
      };

      const res = await apiFetch(`/gigs/${gigDetails.id}`, {
        token,
        method: 'PUT',
        json: gigData
      });

      if (res.ok) {
        setAlertConfig({ message: 'Gig updated successfully!', type: 'success' });
        setShowEditModal(false);
        fetchGigDetails(gigDetails.id);
        fetchMyGigs();
        fetchGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update gig', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error updating gig', type: 'error' });
    } finally {
      setUpdatingGig(false);
    }
  };

  const handlePostGig = async (e) => {
    e.preventDefault();
    if (!categories || categories.length === 0) {
      setAlertConfig({ message: 'Please select at least one Category of Field for your gig.', type: 'error' });
      return;
    }
    if (reqs.length === 0) {
      setAlertConfig({ message: 'Please add at least one required skill.', type: 'error' });
      return;
    }
    setPostingGig(true);
    try {
      let uploadedUrl = null;
      if (attachmentFile) {
        // Upload attachment to S3
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'doc',
            fileName: attachmentFile.name,
            contentType: attachmentFile.type
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, attachmentFile, attachmentFile.type, token);
          uploadedUrl = publicUrl;
        }
      }

      const gigData = {
        title,
        description,
        category: categories[0],
        categories: categories,
        skills: reqs.map(r => r.skillName),
        requirements: reqs,
        budget: parseFloat(budget),
        deliveryTime,
        minRating: reqs.length > 0 ? Math.max(...reqs.map(r => r.minRating || 1)) : 1,
        attachments: uploadedUrl ? [uploadedUrl] : []
      };

      const res = await apiFetch('/gigs', {
        token,
        method: 'POST',
        json: gigData
      });

      if (res.ok) {
        setAlertConfig({ message: 'Gig created successfully in Marketplace!', type: 'success' });
        setTitle('');
        setDescription('');
        setCategories([]);
        setReqs([]);
        setSkillSearchTerm('');
        setBudget('');
        setDeliveryTime('');
        setAttachmentFile(null);
        setActiveSubTab('my-gigs');
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to create gig', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error posting gig', type: 'error' });
    } finally {
      setPostingGig(false);
    }
  };

  const handleApplyToGig = async () => {
    if (!applyMessage.trim() && !applyFile) {
      setAlertConfig({ message: 'Please write a pitch message or attach a work sample.', type: 'error' });
      return;
    }
    setApplying(true);
    try {
      let uploadedUrl = null;
      if (applyFile) {
        const fileTypeToUse = applyFile.type?.startsWith('image/') ? 'image' : 'doc';
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: fileTypeToUse,
            fileName: applyFile.name,
            contentType: applyFile.type || 'application/octet-stream'
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, applyFile, applyFile.type || 'application/octet-stream', token);
          uploadedUrl = publicUrl;
        } else {
          const d = await urlRes.json();
          setAlertConfig({ message: d.error || 'Failed to upload pitch attachment', type: 'error' });
          setApplying(false);
          return;
        }
      }

      const res = await apiFetch(`/gigs/${targetApplyGig.id}/apply`, {
        token,
        method: 'POST',
        json: {
          message: applyMessage,
          attachments: uploadedUrl ? [uploadedUrl] : []
        }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Application submitted successfully!', type: 'success' });
        setShowApplyModal(false);
        setApplyMessage('');
        setApplyFile(null);
        fetchGigs();
        fetchMyGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to apply', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error submitting application', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const handleSelectCandidate = async (candidateId) => {
    try {
      const res = await apiFetch(`/gigs/${gigDetails.id}/hire`, {
        token,
        method: 'POST',
        json: { candidateId }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Freelancer hired! Private workspace is now open.', type: 'success' });
        fetchGigDetails(gigDetails.id);
        fetchMyGigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    try {
      const res = await apiFetch(`/gigs/${gigDetails.id}/reject`, {
        token,
        method: 'POST',
        json: { candidateId }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Candidate application rejected', type: 'success' });
        fetchGigDetails(gigDetails.id);
        fetchMyGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to reject candidate', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error rejecting candidate', type: 'error' });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() && !chatAttachment) return;

    const textToSend = chatText;
    const attachmentToSend = chatAttachment;
    const targetReceiverId = isOwner
      ? (selectedOtherCandidateId || gigDetails?.selectedCandidateId || gigDetails?.hiredCandidateIds?.[0])
      : gigDetails?.ownerId;

    // Construct optimistic temp message
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: targetReceiverId,
      text: textToSend,
      fileUrl: attachmentToSend ? URL.createObjectURL(attachmentToSend) : null,
      createdAt: new Date().toISOString(),
      sending: true
    };

    // Instantly append to messages locally and clear input fields immediately
    setGigDetails(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), tempMessage]
      };
    });
    setChatText('');
    setChatAttachment(null);

    setSendingMessage(true);
    try {
      let uploadedUrl = null;
      if (attachmentToSend) {
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'doc',
            fileName: attachmentToSend.name,
            contentType: attachmentToSend.type
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, attachmentToSend, attachmentToSend.type, token);
          uploadedUrl = publicUrl;
        }
      }

      const res = await apiFetch(`/gigs/${gigDetails.id}/messages`, {
        token,
        method: 'POST',
        json: {
          text: textToSend,
          fileUrl: uploadedUrl,
          receiverId: targetReceiverId
        }
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setGigDetails(prev => {
          if (!prev) return prev;
          const cleaned = (prev.messages || []).filter(m => m.id !== tempId && m.text !== savedMsg.text);
          return {
            ...prev,
            messages: [...cleaned, savedMsg]
          };
        });
        fetchGigDetailsSilently(gigDetails.id);
      } else {
        // Rollback optimistic message if API failed
        setGigDetails(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).filter(m => m.id !== tempId)
          };
        });
      }
    } catch (err) {
      console.error(err);
      // Rollback optimistic message on error
      setGigDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).filter(m => m.id !== tempId)
        };
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitText.trim() && !submitFile) {
      setAlertConfig({ message: 'Please provide description text or attach a deliverables file.', type: 'error' });
      return;
    }
    setSubmittingWork(true);
    try {
      let uploadedUrl = null;
      if (submitFile) {
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'doc',
            fileName: submitFile.name,
            contentType: submitFile.type || 'application/octet-stream'
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, submitFile, submitFile.type || 'application/octet-stream', token);
          uploadedUrl = publicUrl;
        } else {
          const d = await urlRes.json();
          setAlertConfig({ message: d.error || 'Failed to request upload URL', type: 'error' });
          setSubmittingWork(false);
          return;
        }
      }

      const res = await apiFetch(`/gigs/${gigDetails.id}/submit`, {
        token,
        method: 'POST',
        json: {
          text: submitText,
          fileUrl: uploadedUrl
        }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Deliverables submitted for review!', type: 'success' });
        setSubmitText('');
        setSubmitFile(null);
        fetchGigDetails(gigDetails.id);
        fetchMyGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to submit work', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error submitting work deliverables', type: 'error' });
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleReviewAction = async (action) => {
    try {
      const res = await apiFetch(`/gigs/${gigDetails.id}/complete`, {
        token,
        method: 'POST',
        json: { action }
      });
      if (res.ok) {
        setAlertConfig({
          message: action === 'ACCEPT' ? 'Work accepted! Project marked Completed.' : 'Revisions requested.',
          type: 'success'
        });
        fetchGigDetails(gigDetails.id);
        fetchMyGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to update review status', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ message: 'Error updating review action', type: 'error' });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/gigs/${gigDetails.id}/review`, {
        token,
        method: 'POST',
        json: {
          rating: parseInt(rating),
          review
        }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Review submitted successfully!', type: 'success' });
        setReview('');
        setRating(5);
        fetchGigDetails(gigDetails.id);
        if (onUpdateProfile) onUpdateProfile();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to submit review', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentUserIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
  const isOwner = Boolean(user && gigDetails?.ownerId && currentUserIds.includes(gigDetails.ownerId.toString()));
  const isHiredCandidate = Boolean(user && gigDetails?.selectedCandidateId && currentUserIds.includes(gigDetails.selectedCandidateId.toString()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Sub Tabs Selection Header */}
      <div className="flex border-b border-outline-variant pb-2 gap-4">
        <button
          onClick={() => {
            setActiveSubTab('browse');
            setSelectedGigId(null);
            setGigDetails(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-headline font-medium tracking-wider font-bold transition-all uppercase ${activeSubTab === 'browse'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          Browse Gigs
        </button>
        {user?.role === 'RECRUITER' && (
          <button
            onClick={() => {
              setActiveSubTab('post');
              setSelectedGigId(null);
              setGigDetails(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-headline font-medium tracking-wider font-bold transition-all uppercase ${activeSubTab === 'post'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Post a Gig
          </button>
        )}
        <button
          onClick={() => {
            setActiveSubTab('my-gigs');
            fetchMyGigs();
            setSelectedGigId(null);
            setGigDetails(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-headline font-medium tracking-wider font-bold transition-all uppercase flex items-center gap-1.5 ${activeSubTab === 'my-gigs'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          My Gigs Workspace
        </button>
      </div>

      {/* Main Workspace Body */}
      <AnimatedContent distance={40} direction="vertical">
        {activeSubTab === 'browse' && (
          <div className="space-y-6">
            {/* Search filter row - Combined Title, Category & Skills Search */}
            <div className="bg-surface-container border border-outline-variant p-2 rounded-2xl shadow-[var(--shadow-card)] flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-4" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Job title, category, keywords..."
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
                />
              </div>
              <div className="hidden md:block w-[1px] bg-outline-variant my-2" />
              <div className="w-full md:w-64 relative flex items-center">
                <SearchableCategorySelect
                  value={selectedCategoryFilter}
                  onChange={(val) => setSelectedCategoryFilter(val)}
                  placeholder="All Categories"
                  isFilter={true}
                  allowCustom={false}
                  className="w-full"
                />
              </div>
              <div className="hidden md:block w-[1px] bg-outline-variant my-2" />
              <div className="flex-1 relative flex items-center">
                <Sparkles className="w-4 h-4 text-on-surface-variant absolute left-4" />
                <input
                  type="text"
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(e.target.value)}
                  placeholder="Skills (e.g. React, Python)"
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
                />
              </div>
              <button
                onClick={fetchGigs}
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-headline font-medium text-xs font-bold uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Find Gigs
              </button>
            </div>

            {/* Split Screen Feed & Detail Panel */}
            {(() => {
              const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
              const displayGigs = user?.role === 'STUDENT'
                ? gigs.filter(g => {
                    const hasApplied = g.hasApplied || (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
                    const isHired = candidateIds.some(cId => Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString()).includes(cId));
                    return !hasApplied && !isHired;
                  })
                : gigs;

              if (loading) {
                return (
                  <div className="flex justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                );
              }

              if (displayGigs.length === 0) {
                return (
                  <div className="text-center py-20 bg-surface-container border border-outline-variant rounded-2xl shadow-[var(--shadow-card)]">
                    <AlertTriangle className="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
                    <h3 className="font-headline font-medium text-on-surface">No open gigs available</h3>
                    <p className="text-xs text-on-surface-variant mt-1">Check your workspace for your applied and active gigs!</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Pane: Compact Gigs List (Matching Screenshot 2 Mockup) */}
                  <div className="lg:col-span-5 flex flex-col gap-3.5 overflow-y-auto pr-2 custom-scrollbar max-h-[680px]">
                    {displayGigs.map(gig => {
                      const isSelected = gig.id === selectedGigId;
                      const gigCategory = gig.category || (gig.categories && gig.categories[0]) || 'General';
                      const hasUserApplied = user.role === 'STUDENT' && (gig.hasApplied || gig.applicants?.some(a => candidateIds.includes(a.candidateId?.toString())));
                    return (
                      <div
                        key={gig.id}
                        onClick={() => {
                          setSelectedGigId(gig.id);
                          fetchGigDetails(gig.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${isSelected
                            ? 'bg-surface-container-high border-primary shadow-md border-l-4 border-l-primary'
                            : 'bg-surface-container border-outline-variant hover:border-on-surface-variant/40 shadow-sm hover:-translate-y-0.5'
                          }`}
                      >
                        {/* Top Row: Gig Name & Amount */}
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-xs font-headline font-medium text-on-surface line-clamp-1">{gig.title}</h3>
                          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-headline font-medium shrink-0">
                            <span>₹{gig.budget}</span>
                          </div>
                        </div>

                        {/* Middle Row: Category of Field */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center flex-wrap gap-1">
                            {(() => {
                              const catList = (gig.categories && gig.categories.length > 0)
                                ? gig.categories
                                : (gig.category ? [gig.category] : ['General']);
                              return catList.map((catItem, idx) => (
                                <span key={idx} className="text-[9px] font-headline font-medium uppercase font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0">
                                  <Sparkles className="w-3 h-3" />
                                  {catItem}
                                </span>
                              ));
                            })()}
                          </div>
                          {hasUserApplied && (
                            <span className="text-[9px] font-headline font-medium px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-md border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Applied
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Time to Complete (Left) & 3-4 Tech Stack Badges (Right) */}
                        <div className="flex justify-between items-center gap-2 pt-2 border-t border-outline-variant/30">
                          <div className="flex items-center gap-1 text-[10px] font-sans font-normal text-on-surface-variant shrink-0">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>Delivery: <strong className="text-on-surface">{gig.deliveryTime} {/^\d+$/.test(gig.deliveryTime?.toString().trim()) ? 'days' : ''}</strong></span>
                          </div>

                          {/* 3 or 4 Tech Stack Badges */}
                          <div className="flex flex-wrap items-center justify-end gap-1 overflow-hidden">
                            {(gig.skills || []).slice(0, 4).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/60 text-[9px] font-sans font-normal text-on-surface font-semibold">
                                {skill}
                              </span>
                            ))}
                            {(gig.skills || []).length > 4 && (
                              <span className="text-[8px] font-sans font-normal text-on-surface-variant px-1 rounded">
                                +{(gig.skills || []).length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Pane: Sticky Details View */}
                <div className="lg:col-span-7 flex flex-col bg-surface-container border border-outline-variant rounded-2xl shadow-md h-full max-h-[680px] overflow-hidden">
                  {loadingDetails ? (
                    <div className="flex-1 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : gigDetails ? (
                    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {/* Detail Header */}
                      <div className="border-b border-outline-variant pb-4 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h2 className="text-base font-headline font-medium text-on-surface">{gigDetails.title}</h2>
                            {gigDetails.company ? (
                              <div className="flex items-center gap-2 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onOpenCompanyProfile) onOpenCompanyProfile(gigDetails.company.id);
                                  }}
                                  className="w-7 h-7 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0 overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  {gigDetails.company.logoUrl ? (
                                    <img src={gigDetails.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs text-primary font-bold">{gigDetails.company.name.charAt(0)}</span>
                                  )}
                                </button>
                                <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                                  <span>Hiring:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onOpenCompanyProfile) onOpenCompanyProfile(gigDetails.company.id);
                                    }}
                                    className="font-bold text-on-surface hover:text-primary hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {gigDetails.company.name}
                                    {gigDetails.company.verified && (
                                      <span className="text-[8px] bg-success-container text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-headline font-medium">
                                        ✓ Verified
                                      </span>
                                    )}
                                  </button>
                                  {gigDetails.company.companySize && (
                                    <span className="opacity-60">&bull; {gigDetails.company.companySize}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-primary" />
                                <span>Posted by {gigDetails.ownerName || 'Client'}</span>
                                <span className="px-1.5 py-0.5 bg-surface-container-high text-[9px] font-headline font-medium uppercase rounded text-on-surface-variant">
                                  {gigDetails.ownerRole}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-emerald-500 font-sans font-normal">₹{gigDetails.budget}</div>
                            <span className="text-[10px] font-headline font-medium text-on-surface-variant uppercase">Budget Rate</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center justify-between pt-2">
                          <div className="flex items-center gap-3 text-xs font-sans font-normal text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-primary" /> Delivery: <strong className="text-on-surface ml-1">{gigDetails.deliveryTime}</strong>
                            </span>
                          </div>

                          {/* Application CTA */}
                          {user.role === 'STUDENT' && gigDetails.ownerId !== user.id && (
                            (() => {
                              if (gigDetails.status === 'CLOSED') {
                                return (
                                  <div className="px-4 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-xl font-headline font-medium text-xs font-bold flex items-center gap-2 shrink-0 animate-fade-in shadow-xs">
                                    <span>Closed for Applications</span>
                                  </div>
                                );
                              }

                              if (gigDetails.status === 'PAUSED') {
                                return (
                                  <div className="px-4 py-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl font-headline font-medium text-xs font-bold flex items-center gap-2 shrink-0 animate-fade-in shadow-xs">
                                    <span>Currently Paused</span>
                                  </div>
                                );
                              }

                              const hasApplied = gigDetails.hasApplied || gigDetails.applicants?.some(a => a.candidateId === user.id) || gigs.find(g => g.id === gigDetails.id)?.applicants?.some(a => a.candidateId === user.id);

                              if (hasApplied) {
                                return (
                                  <div className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-headline font-medium text-xs font-bold flex items-center gap-2 shrink-0 animate-fade-in shadow-xs">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Applied &bull; Awaiting Client Response</span>
                                  </div>
                                );
                              }

                              // Check candidate skill ratings against per-skill gig requirements
                              const userSkills = profile?.skills || [];
                              const gigReqs = (gigDetails.requirements && gigDetails.requirements.length > 0)
                                ? gigDetails.requirements
                                : (gigDetails.skills || []).map(s => ({ skillName: s, minRating: gigDetails.minRating || 1 }));

                              const missingSkillReqs = [];
                              gigReqs.forEach(req => {
                                const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === req.skillName.toLowerCase());
                                const isTech = skillObj ? skillObj.type === 'technical' : true;
                                if (isTech && req.minRating > 1) {
                                  const userSkillObj = userSkills.find(s => s.name.toLowerCase() === req.skillName.toLowerCase());
                                  const userRating = userSkillObj
                                    ? ((userSkillObj.verifiedRating && userSkillObj.verifiedRating > 0) ? userSkillObj.verifiedRating : (userSkillObj.rating || 0))
                                    : 0;
                                  if (userRating < req.minRating) {
                                    missingSkillReqs.push({
                                      skillName: req.skillName,
                                      requiredRating: req.minRating,
                                      currentRating: userRating
                                    });
                                  }
                                }
                              });
                              const isRatingMatched = missingSkillReqs.length === 0;

                              if (!isRatingMatched) {
                                return (
                                  <div className="w-full mt-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 text-left animate-fade-in">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-headline font-medium text-xs">
                                      <ShieldCheck className="w-4 h-4 shrink-0" />
                                      <span>Rating Requirements Locked</span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                      Your current proficiency level falls short of the required threshold for:
                                    </p>
                                    <ul className="space-y-1 text-xs">
                                      {missingSkillReqs.map(m => (
                                        <li key={m.skillName} className="flex items-center justify-between bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-sans font-normal text-[11px]">
                                          <span className="font-bold text-on-surface">{m.skillName}</span>
                                          <span className="text-amber-700 dark:text-amber-400 font-semibold">Your Rating: Lvl {m.currentRating}/10 &bull; Req: Lvl {m.requiredRating}/10</span>
                                        </li>
                                      ))}
                                    </ul>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onNavigateToTests) onNavigateToTests();
                                      }}
                                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-headline font-medium uppercase hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer mt-2"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> Take Skill Test to Upgrade Rating
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  onClick={() => {
                                    setTargetApplyGig(gigDetails);
                                    setShowApplyModal(true);
                                  }}
                                  className="px-5 py-2.5 rounded-xl font-headline font-medium text-xs font-bold uppercase transition-all shadow-md flex items-center gap-1.5 shrink-0 bg-primary text-white hover:opacity-90 active:scale-95 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Pitch & Apply
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>

                      {/* Detail Description */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-headline font-medium uppercase tracking-wider text-primary">Task Description</h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{gigDetails.description}</p>
                      </div>

                      {/* Required Skills */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-headline font-medium uppercase tracking-wider text-primary">Required Skill Set & Rating Thresholds</h3>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const reqs = (gigDetails.requirements && gigDetails.requirements.length > 0)
                              ? gigDetails.requirements
                              : (gigDetails.skills || []).map(s => ({ skillName: s, minRating: gigDetails.minRating || 1 }));

                            return reqs.map(r => {
                              const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                              const isTech = skillObj ? skillObj.type === 'technical' : true;
                              return (
                                <div key={r.skillName} className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-medium text-on-surface">
                                  <span className="font-bold">{r.skillName}</span>
                                  {isTech ? (
                                    <span className="text-[10px] font-headline font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                                      Lvl {r.minRating || 1}/10 Req
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-sans font-normal text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-lg border border-outline-variant">
                                      Required
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Attachments */}
                      {gigDetails.attachments?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-headline font-medium uppercase tracking-wider text-primary font-bold">Brief Attachments</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {gigDetails.attachments.map((link, idx) => {
                              const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(link) || link.includes('/avatar/') || link.includes('image');
                              return (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group p-3 rounded-xl border border-outline-variant bg-surface-container-low hover:border-primary/60 hover:bg-surface-container transition-all flex items-center gap-3 text-xs text-on-surface-variant hover:text-primary shadow-xs"
                                >
                                  {isImage ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant bg-surface-container-high">
                                      <img src={link} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                      <Paperclip className="w-5 h-5 text-primary" />
                                    </div>
                                  )}
                                  <div className="overflow-hidden">
                                    <p className="font-bold text-on-surface text-[11px] truncate group-hover:text-primary transition-colors">
                                      Attachment #{idx + 1}
                                    </p>
                                    <span className="text-[9px] font-sans font-normal text-on-surface-variant/70 block truncate">Click to view file</span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                      <AlertTriangle className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-xs font-sans font-normal">No gig selected or loaded</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          </div>
        )}

        {activeSubTab === 'post' && (
          <Card className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="border-b border-outline-variant pb-3">
              <h3 className="text-sm font-headline font-medium text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-primary" /> Post a paid Task / Gig
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Hire other verified candidates to help complete milestones.</p>
            </div>

            <form onSubmit={handlePostGig} className="space-y-4">
              <div>
                <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">Gig Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build Neumorphic Sidebar Layout in React"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">Description details</label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed project requirements, expectations, and instructions..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Category of Field *</label>
                  <MultiSearchableCategorySelect
                    values={categories}
                    onChange={(vals) => setCategories(vals)}
                    placeholder="Search or select category/field(s)..."
                    showTags={false}
                  />
                </div>
                <div>
                  <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5 font-headline font-medium">Budget rate (INR) *</label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter Amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5 font-headline font-medium">Expected Delivery Time *</label>
                  <Input
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g. 3 Days"
                    required
                  />
                </div>
                {categories.length > 0 && (
                  <div className="col-span-1 md:col-span-3 flex flex-wrap gap-2 pt-1">
                    {categories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs shrink-0"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => setCategories(categories.filter(v => v !== cat))}
                          className="hover:bg-primary/20 p-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant font-bold">
                  Required Stacks & Rating Thresholds *
                </label>

                <div className="relative">
                  <Input
                    value={skillSearchTerm}
                    onChange={(e) => {
                      setSkillSearchTerm(e.target.value);
                      setIsSkillDropdownOpen(true);
                    }}
                    onFocus={() => setIsSkillDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const matches = ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
                            !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        );
                        if (matches.length > 0) {
                          const match = matches[0];
                          const isTech = match.type === 'technical';
                          setReqs(prev => [...prev, { skillName: match.skill, minRating: isTech ? 4 : 0 }]);
                          setSkillSearchTerm('');
                          setIsSkillDropdownOpen(false);
                        } else if (skillSearchTerm.trim()) {
                          const custom = skillSearchTerm.trim();
                          if (!reqs.some(exist => exist.skillName.toLowerCase() === custom.toLowerCase())) {
                            setReqs(prev => [...prev, { skillName: custom, minRating: 4 }]);
                          }
                          setSkillSearchTerm('');
                          setIsSkillDropdownOpen(false);
                        }
                      }
                    }}
                    placeholder="Search and select skills (e.g. React, Python, AWS)..."
                  />

                  {isSkillDropdownOpen && skillSearchTerm.trim() !== '' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSkillDropdownOpen(false)}></div>
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar p-1">
                        {ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
                            !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-on-surface-variant font-sans font-normal text-center">
                            No matching skills found. Press Enter to add "{skillSearchTerm.trim()}"
                          </div>
                        ) : (
                          ALL_SKILLS.filter(
                            s => s.skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
                              !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                          ).slice(0, 10).map(s => (
                            <button
                              key={s.skill}
                              type="button"
                              onClick={() => {
                                const isTech = s.type === 'technical';
                                setReqs(prev => [...prev, { skillName: s.skill, minRating: isTech ? 4 : 0 }]);
                                setSkillSearchTerm('');
                                setIsSkillDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group cursor-pointer rounded-lg font-sans"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[10px] font-sans font-normal capitalize px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/60 text-on-surface-variant">
                                {s.type}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Added Skill Requirements with Rating Sliders */}
                {reqs.length === 0 ? (
                  <div className="p-4 bg-surface-container-low border border-dashed border-outline-variant/80 rounded-xl text-center">
                    <p className="text-xs text-on-surface-variant font-sans font-normal">No skill requirements added yet. Search and select skills above.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-on-surface font-headline">{r.skillName}</span>
                            <div className="flex items-center gap-3">
                              {isTech ? (
                                <span className="text-primary font-headline font-medium text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                  Required Level: Lvl {r.minRating}/10
                                </span>
                              ) : (
                                <span className="text-on-surface-variant font-headline font-medium text-[10px] uppercase tracking-wider bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded">Required Skill</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-error hover:underline text-[11px] font-sans font-normal cursor-pointer"
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
                              value={r.minRating}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                setReqs(prev => prev.map(item => item.skillName === r.skillName ? { ...item, minRating: val } : item));
                              }}
                              className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-headline font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">Brief Attachments (Optional)</label>
                <label className="cursor-pointer text-xs font-headline font-medium text-on-surface-variant hover:text-on-surface border border-outline-variant bg-surface-container-low p-3 rounded-xl flex items-center gap-2 shadow-sm w-full">
                  <Paperclip className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate">{attachmentFile ? attachmentFile.name : 'Select document / archive file'}</span>
                  <input
                    type="file"
                    onChange={(e) => setAttachmentFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={postingGig}
                  className="w-full flex justify-center items-center gap-1.5"
                >
                  {postingGig ? 'Publishing...' : 'Publish Gig to Marketplace'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeSubTab === 'my-gigs' && (
          /* Main 3-Column Gig Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[640px] items-stretch overflow-hidden font-sans">
            {/* COLUMN 1: LEFT SIDEBAR (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
              {/* TOP BOX: GIGS IN WHICH CANDIDATE IS HIRED / ALL POSTED GIGS FOR RECRUITER */}
              <div className="flex-1 min-h-0 bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col overflow-hidden shadow-xs">
                <div className="pb-2 border-b border-outline-variant/50 flex justify-between items-center shrink-0 mb-2">
                  <h4 className="text-[10px] font-headline font-medium uppercase tracking-widest text-primary font-bold">
                    {user?.role === 'STUDENT' ? 'Gigs in Which You Are Hired' : 'All My Posted Gigs'}
                  </h4>
                  <span className="text-[9px] font-headline font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {(() => {
                      const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                      if (user?.role === 'STUDENT') {
                        return myGigs.filter(g => {
                          const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                          return candidateIds.some(cId => allHired.includes(cId));
                        }).length;
                      }
                      return myGigs.filter(g => g.ownerId === user.id).length;
                    })()} Gigs
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                  {user?.role === 'STUDENT' ? (
                    (() => {
                      const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                      const hiredGigs = myGigs.filter(g => {
                        const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                        return candidateIds.some(cId => allHired.includes(cId));
                      });

                      if (hiredGigs.length === 0) {
                        return <p className="text-center text-xs font-sans font-normal text-on-surface-variant py-8">No active hired gigs found.</p>;
                      }
                      return hiredGigs.map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-surface-container-high border-primary shadow-xs border-l-4 border-l-primary' : 'bg-surface-container-low border-outline-variant hover:border-outline-variant/60'}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-on-surface line-clamp-1">{gig.title}</h5>
                              <span className={`text-[8px] font-headline font-medium uppercase px-1.5 py-0.5 rounded font-bold ${gig.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>{gig.status}</span>
                            </div>
                            <p className="text-[10px] font-sans font-normal text-on-surface-variant">Budget: <strong className="text-emerald-500">₹{gig.budget}</strong></p>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    myGigs.filter(g => g.ownerId === user.id).length === 0 ? (
                      <p className="text-center text-xs font-sans font-normal text-on-surface-variant py-8">No gigs posted yet.</p>
                    ) : (
                      myGigs.filter(g => g.ownerId === user.id).map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${isSelected ? 'bg-surface-container-high border-primary shadow-xs border-l-4 border-l-primary' : 'bg-surface-container-low border-outline-variant hover:border-outline-variant/60'}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-on-surface line-clamp-1">{gig.title}</h5>
                              <span className={`text-[8px] font-headline font-medium uppercase px-1.5 py-0.5 rounded font-bold ${
                                gig.status === 'COMPLETED'
                                  ? 'bg-success/15 text-success'
                                  : gig.status === 'IN_PROGRESS'
                                  ? 'bg-primary/15 text-primary'
                                  : gig.status === 'CLOSED'
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : gig.status === 'PAUSED'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-warning/15 text-warning'
                              }`}>{gig.status}</span>
                            </div>
                            <p className="text-[10px] font-sans font-normal text-on-surface-variant">Budget: <strong className="text-emerald-500">₹{gig.budget}</strong></p>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>

              {/* BOTTOM BOX: DETAIL OF THE GIG SELECTED */}
              <div className="h-60 shrink-0 bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col justify-between overflow-hidden shadow-xs">
                {gigDetails ? (
                  <div className="flex flex-col h-full justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Selected Gig Details</h4>
                        <span className="text-[8px] font-headline font-medium uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{gigDetails.status}</span>
                      </div>
                      <h3 className="text-xs font-bold text-on-surface line-clamp-1">{gigDetails.title}</h3>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">{gigDetails.description}</p>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-outline-variant/40">
                      <div className="flex justify-between text-[10px] font-sans font-normal">
                        <span className="text-on-surface-variant">Rate: <strong className="text-emerald-500">₹{gigDetails.budget}</strong></span>
                        <span className="text-on-surface-variant">Delivery: <strong className="text-on-surface">{gigDetails.deliveryTime}</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowGigInfoModal(true)}
                        className="w-full py-2 bg-primary text-white text-[10px] font-headline font-medium uppercase rounded-xl hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>INFO / Full Project Specifications</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <p className="text-xs font-sans font-normal text-on-surface-variant">Select a gig above to view details</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: CENTER MAIN WORKSPACE (lg:col-span-6 - CHAT SECTION WITH THE RECRUITER) */}
            <div className="lg:col-span-6 flex flex-col bg-surface-container border border-outline-variant rounded-2xl shadow-md h-full overflow-hidden">
              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : gigDetails ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Chat Section Header */}
                  <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {(() => {
                          const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.applicants && gigDetails.applicants[0]?.candidateId);
                          const activeCand = gigDetails.applicants?.find(a => a.candidateId === activeCandId)?.candidate;
                          return activeCand?.avatar || activeCand?.profilePic ? (
                            <img src={activeCand.avatar || activeCand.profilePic} alt={activeCand.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{activeCand?.name?.charAt(0) || 'C'}</span>
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-on-surface">
                          {(() => {
                            const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.applicants && gigDetails.applicants[0]?.candidateId);
                            const activeCand = gigDetails.applicants?.find(a => a.candidateId === activeCandId)?.candidate;
                            return activeCand?.name || (isOwner ? 'Candidate Communication Channel' : gigDetails.ownerName || 'Recruiter Client');
                          })()}
                        </h3>
                        <p className="text-[9px] font-headline font-medium text-on-surface-variant uppercase">
                          {gigDetails.title} &bull; <span className="text-emerald-500 font-bold">₹{gigDetails.budget}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Profile Button for Active Candidate or Recruiter */}
                      {(() => {
                        const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.applicants && gigDetails.applicants[0]?.candidateId);
                        const activeCand = gigDetails.applicants?.find(a => a.candidateId === activeCandId)?.candidate;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (isOwner) {
                                handleOpenCandidateProfile(activeCandId, activeCand);
                              } else {
                                handleOpenCandidateProfile(gigDetails.ownerId, { name: gigDetails.ownerName || 'Recruiter' });
                              }
                            }}
                            className="px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border border-outline-variant bg-surface-container text-on-surface hover:text-primary hover:border-primary/40 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <User className="w-3 h-3 text-primary" />
                            <span>Profile</span>
                          </button>
                        );
                      })()}

                      {/* Submission Button */}
                      {(isOwner || isHiredCandidate || gigDetails.submissions?.length > 0) && (
                        <button
                          type="button"
                          onClick={() => setShowSubmissionModal(true)}
                          className={`px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            gigDetails.submissions?.length > 0
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Submission</span>
                          {gigDetails.submissions?.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                          )}
                        </button>
                      )}

                      {/* Recruiter Owner Action Buttons */}
                      {isOwner && (
                        <>
                          {(gigDetails.status === 'OPEN' || gigDetails.status === 'PAUSED') && (
                            <button onClick={() => handleOpenEditModal(gigDetails)} className="px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border border-outline-variant bg-surface-container hover:text-primary transition-all cursor-pointer">Edit</button>
                          )}
                          <button onClick={() => handleTogglePause(gigDetails)} className="px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border border-outline-variant bg-surface-container hover:text-warning transition-all cursor-pointer">
                            {gigDetails.status === 'PAUSED' ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={() => handleToggleClose(gigDetails)}
                            className={`px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border transition-all cursor-pointer ${
                              gigDetails.status === 'CLOSED'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                : 'border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
                            }`}
                          >
                            {gigDetails.status === 'CLOSED' ? 'Re-Open' : 'Close Gig'}
                          </button>
                          {(gigDetails.status === 'OPEN' || gigDetails.status === 'PAUSED') && (
                            <button onClick={() => handleDeleteGig(gigDetails.id)} className="px-2 py-1 text-[9px] font-headline font-medium uppercase rounded-lg border border-error/30 bg-surface-container text-error hover:bg-error hover:text-white transition-all cursor-pointer">Delete</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Feed Area */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-surface-container-high/10">
                    {(() => {
                      const activeTargetId = selectedOtherCandidateId || gigDetails.selectedCandidateId || gigDetails.hiredCandidateIds?.[0];
                      const currentUserIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());

                      const filteredMessages = (gigDetails.messages || []).filter(msg => {
                        if (isOwner) {
                          if (!activeTargetId) return false;
                          const activeStr = activeTargetId.toString();
                          return msg.senderId?.toString() === activeStr || msg.receiverId?.toString() === activeStr;
                        } else {
                          return currentUserIds.some(cId => msg.senderId?.toString() === cId || msg.receiverId?.toString() === cId);
                        }
                      });

                      if (filteredMessages.length === 0) {
                        return (
                          <div className="text-center py-16">
                            <MessageSquare className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                            <p className="text-xs font-sans font-normal text-on-surface-variant">No direct messages yet. Send a message to start communicating.</p>
                          </div>
                        );
                      }

                      return filteredMessages.map(msg => {
                        const isMe = msg.senderId && currentUserIds.includes(msg.senderId.toString());
                        const isSystem = msg.text?.startsWith('[SYSTEM:');
                        return (
                          <div key={msg.id} className={`flex flex-col ${isSystem ? 'items-center w-full' : isMe ? 'items-end' : 'items-start'}`}>
                            {isSystem ? (
                              <div className="bg-primary/5 border border-primary/20 text-on-surface-variant text-[9px] font-sans font-normal px-2.5 py-1 rounded-lg text-center max-w-md shadow-sm">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="max-w-[80%] space-y-1">
                                <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low border border-outline-variant rounded-tl-none text-on-surface'}`}>
                                  {msg.text}
                                  {msg.fileUrl && (
                                    <div className={`mt-2 p-1.5 rounded-lg text-[9px] font-sans font-normal flex items-center gap-1.5 ${isMe ? 'bg-black/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                      <Paperclip className="w-3 h-3" />
                                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline font-bold truncate max-w-[120px]">Attachment File</a>
                                    </div>
                                  )}
                                </div>
                                <p className={`text-[8px] font-sans font-normal text-on-surface-variant px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  {msg.sending ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-primary" />
                                  ) : (
                                    new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Footer */}
                  {(() => {
                    const allHiredCandidateIds = Array.from(new Set([...(gigDetails?.hiredCandidateIds || []), gigDetails?.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                    const isHiredCandidate = currentUserIds.some(cId => allHiredCandidateIds.includes(cId));

                    if (!isOwner && !isHiredCandidate) {
                      return (
                        <div className="p-3.5 border-t border-outline-variant bg-surface-container-low text-center shrink-0">
                          <p className="text-xs font-sans font-normal text-on-surface-variant flex items-center justify-center gap-1.5 font-bold">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Application Pending Review &bull; Direct messaging unlocks when hired</span>
                          </p>
                        </div>
                      );
                    }

                    return (
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant bg-surface-container-low space-y-2 shrink-0">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatText}
                            onChange={(e) => setChatText(e.target.value)}
                            placeholder="Type message..."
                            className="flex-1 bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                          />
                          <button type="submit" disabled={sendingMessage} className="px-3.5 py-2 bg-primary text-white rounded-xl shadow-md cursor-pointer font-bold text-xs">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer text-[9px] font-headline font-medium text-on-surface-variant hover:text-on-surface border border-outline-variant rounded px-2 py-1 bg-surface-container flex items-center gap-1 shadow-sm">
                            <Paperclip className="w-3 h-3 text-primary" />
                            <span>{chatAttachment ? chatAttachment.name : 'Attach File'}</span>
                            <input type="file" onChange={(e) => setChatAttachment(e.target.files[0])} className="hidden" />
                          </label>
                          {chatAttachment && (
                            <button type="button" onClick={() => setChatAttachment(null)} className="text-[9px] text-error font-headline font-medium">Remove</button>
                          )}
                        </div>
                      </form>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <p className="text-xs font-sans font-normal text-on-surface-variant">Select a gig from the left panel to open workspace</p>
                </div>
              )}
            </div>

            {/* COLUMN 3: RIGHT SIDEBAR (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
              {user?.role === 'STUDENT' || !isOwner ? (
                /* CANDIDATE COLUMN 3: LIST OF GIGS APPLIED TO BUT NOT YET READ/HIRED BY RECRUITER */
                <div className="flex-1 min-h-0 bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col overflow-hidden shadow-xs">
                  <div className="pb-2 border-b border-outline-variant/50 flex justify-between items-center shrink-0 mb-2">
                    <h4 className="text-[10px] font-headline font-medium uppercase tracking-widest text-primary font-bold">
                      Applied Gigs (Pending Review)
                    </h4>
                    <span className="text-[9px] font-headline font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {(() => {
                        const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                        const pendingGigs = myGigs.filter(g => {
                          const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                          const isHired = candidateIds.some(cId => allHired.includes(cId));
                          const hasApplied = (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
                          return (hasApplied || g.hasApplied) && !isHired;
                        });
                        return pendingGigs.length;
                      })()}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                    {(() => {
                      const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                      const pendingGigs = myGigs.filter(g => {
                        const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                        const isHired = candidateIds.some(cId => allHired.includes(cId));
                        const hasApplied = (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
                        return (hasApplied || g.hasApplied) && !isHired;
                      });

                      if (pendingGigs.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-xs font-sans font-normal text-on-surface-variant">No pending applications.</p>
                          </div>
                        );
                      }

                      return pendingGigs.map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                            className={`p-3 rounded-xl border space-y-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-surface-container-high border-primary shadow-xs'
                                : 'bg-surface-container-low border-outline-variant hover:border-outline-variant/60'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-on-surface line-clamp-1">{gig.title}</h5>
                              <span className="text-[8px] font-headline font-medium uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                Pending Review
                              </span>
                            </div>
                            <p className="text-[10px] font-sans font-normal text-on-surface-variant">Budget: <strong className="text-emerald-500">₹{gig.budget}</strong></p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                /* RECRUITER COLUMN 3: ACCEPTED CANDIDATES & UNREVIEWED PITCHES */
                <>
                  {/* TOP BOX: ACCEPTED CANDIDATES */}
                  <div className="flex-1 min-h-0 bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col overflow-hidden shadow-xs">
                    <div className="pb-2 border-b border-outline-variant/50 flex justify-between items-center shrink-0 mb-2">
                      <h4 className="text-[10px] font-headline font-medium uppercase tracking-widest text-primary font-bold">
                        Accepted Candidates
                      </h4>
                      {gigDetails?.hiredCandidates?.length > 0 && (
                        <span className="text-[8px] font-headline font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          {gigDetails.hiredCandidates.length} Hired
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                      {gigDetails?.hiredCandidates && gigDetails.hiredCandidates.length > 0 ? (
                        gigDetails.hiredCandidates.map((hc) => {
                          const isSelected = (selectedOtherCandidateId || gigDetails.selectedCandidateId) === hc.candidateId;
                          return (
                            <div key={hc.candidateId} className="space-y-2">
                              <div
                                onClick={() => setSelectedOtherCandidateId(hc.candidateId)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                                  isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                                    : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                                    {hc.candidate?.avatar || hc.candidate?.profilePic ? (
                                      <img src={hc.candidate.avatar || hc.candidate.profilePic} alt={hc.candidate.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{hc.candidate?.name?.charAt(0) || 'C'}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-on-surface truncate">{hc.candidate?.name || 'Hired Freelancer'}</h5>
                                    <p className="text-[9px] font-sans font-normal text-emerald-500 font-bold">Active Gig Freelancer</p>
                                  </div>
                                </div>
                              </div>

                              {/* Feedback Room Panel when gig is COMPLETED */}
                              {gigDetails.status === 'COMPLETED' && isSelected && (
                                <div className="p-3 bg-success/5 border border-success/20 rounded-xl space-y-2 shadow-xs">
                                  <h5 className="text-[9px] font-headline font-medium uppercase tracking-wider text-success font-bold">Feedback Room</h5>
                                  {(() => {
                                    const currentUserIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                                    const myReview = gigDetails.reviews?.find(r => r.reviewerId && currentUserIds.includes(r.reviewerId.toString()));
                                    if (myReview) {
                                      return (
                                        <div className="text-xs space-y-1">
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} className={`w-3 h-3 ${star <= myReview.rating ? 'text-warning fill-warning' : 'text-outline-variant'}`} />
                                            ))}
                                          </div>
                                          <p className="text-on-surface italic text-[10px]">"{myReview.review}"</p>
                                        </div>
                                      );
                                    }
                                    return (
                                      <form onSubmit={handleSubmitReview} className="space-y-2">
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition-transform cursor-pointer">
                                              <Star className={`w-4 h-4 ${star <= rating ? 'text-warning fill-warning' : 'text-outline-variant'}`} />
                                            </button>
                                          ))}
                                        </div>
                                        <TextArea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write feedback review..." rows={2} required />
                                        <Button type="submit" disabled={submittingReview} className="w-full text-[9px] py-1.5">Submit Feedback</Button>
                                      </form>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-xs font-sans font-normal text-on-surface-variant">No candidate accepted yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM BOX: UNREVIEWED PITCHES */}
                  {(() => {
                    const hiredIds = gigDetails?.hiredCandidateIds || (gigDetails?.selectedCandidateId ? [gigDetails.selectedCandidateId] : []);
                    const unreviewedApplicants = (gigDetails?.applicants || []).filter(a => !hiredIds.includes(a.candidateId) && !a.isHired);

                    return (
                      <div className="flex-1 min-h-0 bg-surface-container border border-outline-variant rounded-2xl p-3.5 flex flex-col overflow-hidden shadow-xs">
                        <div className="pb-2 border-b border-outline-variant/50 flex justify-between items-center shrink-0 mb-2">
                          <h4 className="text-[10px] font-headline font-medium uppercase tracking-widest text-primary font-bold">
                            Unreviewed Pitches
                          </h4>
                          <span className="text-[9px] font-headline font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {unreviewedApplicants.length}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                          {unreviewedApplicants.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-xs font-sans font-normal text-on-surface-variant">No pending pitches to review.</p>
                            </div>
                          ) : (
                            unreviewedApplicants.map(app => (
                              <div
                                key={app.id}
                                onClick={() => {
                                  setSelectedOtherCandidateId(app.candidateId);
                                  setSelectedUnreviewedPitchApp(app);
                                }}
                                className={`p-3 rounded-xl border space-y-2 transition-all cursor-pointer ${
                                  selectedOtherCandidateId === app.candidateId
                                    ? 'bg-surface-container-high border-primary shadow-xs'
                                    : 'bg-surface-container-low border-outline-variant hover:border-outline-variant/60'
                                }`}
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                                      {app.candidate?.avatar || app.candidate?.profilePic ? (
                                        <img src={app.candidate.avatar || app.candidate.profilePic} alt={app.candidate.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{app.candidate?.name?.charAt(0) || 'C'}</span>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-[11px] font-bold text-on-surface line-clamp-1">{app.candidate?.name || 'Candidate'}</h5>
                                      <p className="text-[8px] font-sans font-normal text-on-surface-variant">@{app.candidate?.username || 'candidate'}</p>
                                    </div>
                                  </div>
                                  {isOwner && (
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectCandidate(app.candidateId)}
                                        className="px-2 py-0.5 bg-error/10 text-error border border-error/20 text-[8px] font-headline font-medium uppercase rounded hover:bg-error/20 cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectCandidate(app.candidateId)}
                                        className="px-2 py-0.5 bg-primary text-white text-[8px] font-headline font-medium uppercase rounded hover:opacity-90 cursor-pointer"
                                      >
                                        Hire
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* {app.message && (
                                  <p className="text-[10px] text-on-surface-variant line-clamp-2 italic bg-surface-container-high/40 p-1.5 rounded-lg border border-outline-variant/30">
                                    "{app.message}"
                                  </p>
                                )} */}

                                {app.attachments?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {app.attachments.map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-outline-variant bg-surface-container text-[8px] font-sans font-normal text-on-surface-variant hover:text-primary"
                                      >
                                        <Paperclip className="w-2.5 h-2.5 text-primary" />
                                        <span>Attachment #{idx + 1}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

          </div>
        )}
      </AnimatedContent>

      {/* Pitch / Application modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-fade-in pointer-events-auto">
          <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.3)] p-6 space-y-4 animate-scale-up">
            <h3 className="text-sm font-headline font-medium text-on-surface">Apply to: {targetApplyGig?.title}</h3>

            <div className="space-y-2">
              <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant font-bold">Pitch Message / Cover Letter *</label>
              <TextArea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this task and highlight your relevant skills..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant font-bold flex justify-between items-center">
                <span>Attach Work Sample Image (Optional)</span>
                <span className="text-[9px] text-on-surface-variant/70 font-normal">Max 2MB</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (!file.type.startsWith('image/')) {
                      setAlertConfig({ message: 'Only image files (PNG, JPG, WEBP) are allowed for work samples.', type: 'error' });
                      e.target.value = '';
                      setApplyFile(null);
                      return;
                    }
                    if (file.size > 2 * 1024 * 1024) {
                      setAlertConfig({ message: `Image size exceeds the 2MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`, type: 'error' });
                      e.target.value = '';
                      setApplyFile(null);
                      return;
                    }
                    setApplyFile(file);
                  } else {
                    setApplyFile(null);
                  }
                }}
                className="w-full text-xs text-on-surface bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-headline font-medium file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
              />
              {applyFile && (
                <p className="text-[10px] font-sans font-normal text-emerald-500 flex items-center gap-1 font-semibold">
                  ✓ Attached: {applyFile.name} ({(applyFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-headline font-medium bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToGig}
                disabled={applying}
                className="px-4 py-2 bg-primary text-white text-xs font-headline font-medium uppercase rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {applying ? 'Submitting...' : 'Send Pitch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gig Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-fade-in pointer-events-auto">
          <form onSubmit={handleUpdateGigSubmit} className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.3)] p-6 space-y-4 animate-scale-up">
            <h3 className="text-sm font-headline font-medium text-on-surface">Edit Gig Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1">Title *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1">Description *</label>
                <TextArea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1 font-bold">Required Stacks & Rating Thresholds *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editSkillSearchTerm}
                    onChange={(e) => {
                      setEditSkillSearchTerm(e.target.value);
                      setIsEditSkillDropdownOpen(true);
                    }}
                    onFocus={() => setIsEditSkillDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const matches = ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(editSkillSearchTerm.toLowerCase()) &&
                            !editReqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        );
                        if (matches.length > 0) {
                          const match = matches[0];
                          const isTech = match.type === 'technical';
                          setEditReqs(prev => [...prev, { skillName: match.skill, minRating: isTech ? 4 : 0 }]);
                          setEditSkillSearchTerm('');
                          setIsEditSkillDropdownOpen(false);
                        } else if (editSkillSearchTerm.trim()) {
                          const custom = editSkillSearchTerm.trim();
                          if (!editReqs.some(exist => exist.skillName.toLowerCase() === custom.toLowerCase())) {
                            setEditReqs(prev => [...prev, { skillName: custom, minRating: 4 }]);
                          }
                          setEditSkillSearchTerm('');
                          setIsEditSkillDropdownOpen(false);
                        }
                      }
                    }}
                    placeholder="Search and select skills..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                  />

                  {isEditSkillDropdownOpen && editSkillSearchTerm.trim() !== '' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsEditSkillDropdownOpen(false)}></div>
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(editSkillSearchTerm.toLowerCase()) &&
                            !editReqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-2.5 text-[11px] text-on-surface-variant font-sans font-normal text-center">
                            No matching skills found. Press Enter to add "{editSkillSearchTerm.trim()}"
                          </div>
                        ) : (
                          ALL_SKILLS.filter(
                            s => s.skill.toLowerCase().includes(editSkillSearchTerm.toLowerCase()) &&
                              !editReqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                          ).slice(0, 8).map(s => (
                            <button
                              key={s.skill}
                              type="button"
                              onClick={() => {
                                const isTech = s.type === 'technical';
                                setEditReqs(prev => [...prev, { skillName: s.skill, minRating: isTech ? 4 : 0 }]);
                                setEditSkillSearchTerm('');
                                setIsEditSkillDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group cursor-pointer rounded-lg font-sans"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[9px] font-sans font-normal capitalize px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/60 text-on-surface-variant">
                                {s.type}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Edit Skill Requirements with Rating Sliders */}
                {editReqs.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant/70 font-sans font-normal mt-1">No skills selected yet.</p>
                ) : (
                  <div className="space-y-2.5 pt-2">
                    {editReqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="p-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-on-surface font-headline">{r.skillName}</span>
                            <div className="flex items-center gap-2">
                              {isTech ? (
                                <span className="text-primary font-headline font-medium text-[10px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                  Lvl {r.minRating}/10
                                </span>
                              ) : (
                                <span className="text-on-surface-variant font-headline font-medium text-[9px] uppercase bg-surface-container-high border border-outline-variant px-1.5 py-0.5 rounded">Required</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditReqs(prev => prev.filter(item => item.skillName !== r.skillName))}
                                className="text-error hover:underline text-[10px] font-sans font-normal cursor-pointer"
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
                              value={r.minRating}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                setEditReqs(prev => prev.map(item => item.skillName === r.skillName ? { ...item, minRating: val } : item));
                              }}
                              className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1 font-bold">Category of Field *</label>
                <MultiSearchableCategorySelect
                  values={editCategories}
                  onChange={(vals) => setEditCategories(vals)}
                  placeholder="Search or select category/field(s)..."
                  showTags={false}
                />
                {editCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editCategories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 text-xs font-sans px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs shrink-0"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => setEditCategories(editCategories.filter(v => v !== cat))}
                          className="hover:bg-primary/20 p-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1 font-bold">Budget (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none font-sans font-normal"
                    value={editBudget}
                    onChange={e => setEditBudget(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1 font-bold">Delivery Time *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none font-sans font-normal"
                    value={editDeliveryTime}
                    onChange={e => setEditDeliveryTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant mb-1">Update Spec Attachment (Optional)</label>
                <input
                  type="file"
                  className="w-full text-xs text-on-surface bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2"
                  onChange={e => setEditAttachmentFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-headline font-medium bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingGig}
                className="px-4 py-2 bg-primary text-white text-xs font-headline font-medium uppercase rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {updatingGig ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Info Modal */}
      {showGigInfoModal && gigDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] bg-surface border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Info className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface font-sans">{gigDetails.title}</h3>
                  <p className="text-[10px] font-sans font-normal text-on-surface-variant">Full Project Brief & Specifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowGigInfoModal(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar font-sans text-xs">
              {/* Categories & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant/40">
                <div className="flex flex-wrap gap-1.5">
                  {(gigDetails.categories || [gigDetails.category]).filter(Boolean).map(c => (
                    <span key={c} className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-headline font-medium">
                      {c}
                    </span>
                  ))}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-headline font-medium uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {gigDetails.status}
                </span>
              </div>

              {/* Budget & Delivery */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl">
                <div>
                  <span className="text-[9px] font-headline font-medium uppercase text-on-surface-variant block font-bold">Budget Rate</span>
                  <span className="text-sm font-bold text-emerald-500 font-sans font-normal">₹{gigDetails.budget}</span>
                </div>
                <div>
                  <span className="text-[9px] font-headline font-medium uppercase text-on-surface-variant block font-bold">Delivery Time</span>
                  <span className="text-xs font-semibold text-on-surface">{gigDetails.deliveryTime}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Detailed Requirements</h4>
                <div className="p-3.5 bg-surface-container-high/30 rounded-xl text-on-surface border border-outline-variant/30 leading-relaxed whitespace-pre-wrap">
                  {gigDetails.description}
                </div>
              </div>

              {/* Required Stacks */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Required Skills & Ratings</h4>
                <div className="flex flex-wrap gap-2">
                  {((gigDetails.requirements && gigDetails.requirements.length > 0)
                    ? gigDetails.requirements
                    : (gigDetails.skills || []).map(s => ({ skillName: s, minRating: gigDetails.minRating || 1 }))
                  ).map(r => (
                    <div key={r.skillName} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container border border-outline-variant rounded-xl text-xs">
                      <span className="font-bold text-on-surface">{r.skillName}</span>
                      <span className="text-[9px] font-headline font-medium text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">Lvl {r.minRating || 1}/10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brief Attachments */}
              {gigDetails.attachments?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-outline-variant/40">
                  <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Brief Attachments ({gigDetails.attachments.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {gigDetails.attachments.map((url, idx) => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/avatar/') || url.includes('image');
                      const filename = url.split('/').pop() || `Attachment ${idx + 1}`;
                      return isImage ? (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl border border-outline-variant overflow-hidden hover:opacity-90 transition-all">
                          <img src={url} alt="Brief Attachment" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container text-xs font-sans font-normal hover:text-primary">
                          <Paperclip className="w-4 h-4 text-primary" />
                          <span className="max-w-[160px] truncate">{filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-end">
              <button
                onClick={() => setShowGigInfoModal(false)}
                className="px-4 py-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-headline font-medium rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Rest of Candidates Modal */}
      {showOtherCandidatesModal && gigDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl max-h-[88vh] bg-surface border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Users className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface font-sans">Rest of Candidates</h3>
                  <p className="text-[10px] font-sans font-normal text-on-surface-variant">Review pitches & communicate directly with applicants</p>
                </div>
              </div>
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar font-sans text-xs">
              {/* Section 1: Candidate Pitches */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-headline font-medium uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                  <span>Candidate Pitches</span>
                  <span className="text-[9px] px-2 py-0.5 bg-primary/10 rounded-full">{gigDetails.applicants?.length || 0} Total</span>
                </h4>

                {gigDetails.applicants?.length === 0 ? (
                  <div className="text-center py-6 bg-surface-container-low rounded-xl border border-outline-variant border-dashed">
                    <p className="text-xs font-sans font-normal text-on-surface-variant">No other candidate pitches submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gigDetails.applicants?.map(app => {
                      const isHired = gigDetails.selectedCandidateId === app.candidateId;
                      return (
                        <div key={app.id} className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs ${isHired ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-surface-container-low border-outline-variant'}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                                {app.candidate?.avatar || app.candidate?.profilePic ? (
                                  <img src={app.candidate.avatar || app.candidate.profilePic} alt={app.candidate.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{app.candidate?.name?.charAt(0) || 'C'}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-on-surface">{app.candidate?.name || 'Candidate'}</h4>
                                  {isHired && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-headline font-medium rounded-full uppercase">Currently Hired</span>}
                                </div>
                                <p className="text-[9px] font-sans font-normal text-on-surface-variant">@{app.candidate?.username || 'candidate'}</p>
                              </div>
                            </div>
                            {isOwner && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRejectCandidate(app.candidateId)}
                                  className="px-3 py-1 bg-error/10 text-error border border-error/20 hover:bg-error/20 text-[9px] font-headline font-medium uppercase rounded-lg transition-all shadow-xs cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectCandidate(app.candidateId)}
                                  className={`px-3 py-1 text-[9px] font-headline font-medium uppercase rounded-lg transition-all shadow-sm cursor-pointer ${isHired ? 'bg-emerald-600 text-white' : 'bg-primary text-white hover:opacity-90'}`}
                                >
                                  {isHired ? 'Selected' : 'Switch Hire'}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-surface-container-high/40 rounded-lg text-xs text-on-surface-variant leading-relaxed border border-outline-variant/20">
                            {app.message}
                          </div>
                          {app.attachments?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
                              <p className="text-[10px] font-headline font-medium text-on-surface-variant uppercase font-bold flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-primary" /> Pitch Attachments ({app.attachments.length}):
                              </p>
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {app.attachments.map((url, idx) => {
                                  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/avatar/') || url.includes('image');
                                  const filename = url.split('/').pop() || `Attachment ${idx + 1}`;
                                  return isImage ? (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-xl border border-outline-variant overflow-hidden hover:opacity-95 transition-all">
                                      <img src={url} alt="Pitch Attachment" className="w-full h-full object-cover" />
                                    </a>
                                  ) : (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-sans font-normal text-on-surface-variant hover:text-primary">
                                      <Paperclip className="w-3.5 h-3.5 text-primary" />
                                      <span className="max-w-[140px] truncate">{filename}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Other Candidate Chats */}
              <div className="pt-4 border-t border-outline-variant/50 space-y-3">
                <h4 className="text-[11px] font-headline font-medium uppercase tracking-wider text-primary font-bold">
                  Other Candidate Chats
                </h4>

                {gigDetails.applicants?.length === 0 ? (
                  <p className="text-xs font-sans font-normal text-on-surface-variant">No candidates to chat with.</p>
                ) : (
                  <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low/50">
                    {/* Candidate Tab Selection Bar */}
                    <div className="flex items-center gap-2 p-2 bg-surface-container border-b border-outline-variant overflow-x-auto custom-scrollbar">
                      {gigDetails.applicants?.map(app => {
                        const isSelectedTab = (selectedOtherCandidateId || gigDetails.applicants[0]?.candidateId) === app.candidateId;
                        return (
                          <button
                            key={app.candidateId}
                            type="button"
                            onClick={() => setSelectedOtherCandidateId(app.candidateId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-headline font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                              isSelectedTab ? 'bg-primary text-white shadow-xs' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span>{app.candidate?.name || 'Candidate'}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Chat Container for Selected Candidate */}
                    <div className="p-4 space-y-4">
                      {(() => {
                        const targetCandId = selectedOtherCandidateId || gigDetails.applicants[0]?.candidateId;
                        const candMessages = (gigDetails.messages || []).filter(
                          m => m.senderId === targetCandId || m.receiverId === targetCandId
                        );

                        return (
                          <div className="space-y-3">
                            <div className="max-h-56 overflow-y-auto space-y-2 p-2 border border-outline-variant/30 rounded-xl bg-surface-container-high/10 custom-scrollbar">
                              {candMessages.length === 0 ? (
                                <p className="text-center text-xs font-sans font-normal text-on-surface-variant py-6">No direct chat history with this candidate yet. Type a message below to start.</p>
                              ) : (
                                candMessages.map(msg => {
                                  const isMe = msg.senderId === user.id;
                                  return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      <div className={`p-2.5 rounded-xl text-xs max-w-[80%] ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container border border-outline-variant text-on-surface rounded-tl-none'}`}>
                                        {msg.text}
                                        {msg.fileUrl && (
                                          <div className="mt-1 text-[9px] font-sans font-normal underline">
                                            <a href={msg.fileUrl} target="_blank" rel="noreferrer">View Attachment</a>
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[8px] font-sans font-normal text-on-surface-variant px-1 mt-0.5">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Chat Input */}
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!otherCandidateChatText.trim() && !otherCandidateChatFile) return;
                                setSendingOtherChat(true);
                                try {
                                  let uploadedUrl = null;
                                  if (otherCandidateChatFile) {
                                    const fileTypeToUse = otherCandidateChatFile.type?.startsWith('image/') ? 'image' : 'doc';
                                    const urlRes = await apiFetch('/upload/request-url', {
                                      token,
                                      method: 'POST',
                                      json: { fileType: fileTypeToUse, fileName: otherCandidateChatFile.name, contentType: otherCandidateChatFile.type || 'application/octet-stream' }
                                    });
                                    if (urlRes.ok) {
                                      const { uploadUrl, publicUrl } = await urlRes.json();
                                      await putFileToS3(uploadUrl, otherCandidateChatFile, otherCandidateChatFile.type, token);
                                      uploadedUrl = publicUrl;
                                    }
                                  }
                                  const res = await apiFetch(`/gigs/${gigDetails.id}/messages`, {
                                    token,
                                    method: 'POST',
                                    json: {
                                      text: otherCandidateChatText,
                                      fileUrl: uploadedUrl,
                                      receiverId: targetCandId
                                    }
                                  });
                                  if (res.ok) {
                                    setOtherCandidateChatText('');
                                    setOtherCandidateChatFile(null);
                                    fetchGigDetails(gigDetails.id);
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setSendingOtherChat(false);
                                }
                              }}
                              className="space-y-2 pt-1"
                            >
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={otherCandidateChatText}
                                  onChange={e => setOtherCandidateChatText(e.target.value)}
                                  placeholder="Type message to this candidate..."
                                  className="flex-1 bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                                />
                                <button type="submit" disabled={sendingOtherChat} className="px-3 py-2 bg-primary text-white rounded-xl font-bold text-xs cursor-pointer">
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-sans font-normal">
                                <label className="cursor-pointer text-on-surface-variant hover:text-on-surface border border-outline-variant rounded px-2 py-1 bg-surface-container flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{otherCandidateChatFile ? otherCandidateChatFile.name : 'Attach File'}</span>
                                  <input type="file" onChange={e => setOtherCandidateChatFile(e.target.files[0])} className="hidden" />
                                </label>
                                {otherCandidateChatFile && (
                                  <button type="button" onClick={() => setOtherCandidateChatFile(null)} className="text-error">Remove</button>
                                )}
                              </div>
                            </form>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-end">
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="px-4 py-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-headline font-medium rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unreviewed Candidate Pitch Details Modal */}
      {selectedUnreviewedPitchApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in pointer-events-auto">
          <div className="w-full max-w-lg bg-surface-container border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 text-primary font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                  {selectedUnreviewedPitchApp.candidate?.avatar || selectedUnreviewedPitchApp.candidate?.profilePic ? (
                    <img src={selectedUnreviewedPitchApp.candidate.avatar || selectedUnreviewedPitchApp.candidate.profilePic} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedUnreviewedPitchApp.candidate?.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{selectedUnreviewedPitchApp.candidate?.name || 'Candidate'}</h3>
                  <p className="text-[10px] font-sans font-normal text-primary font-bold">@{selectedUnreviewedPitchApp.candidate?.username || 'candidate'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUnreviewedPitchApp(null)}
                className="p-1.5 hover:bg-surface-container-low rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar bg-background text-left">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-on-surface-variant font-bold">Candidate Pitch Message</h4>
                <div className="p-3.5 bg-surface-container border border-outline-variant/60 rounded-xl text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {selectedUnreviewedPitchApp.message}
                </div>
              </div>

              {selectedUnreviewedPitchApp.attachments?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-outline-variant/40">
                  <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-primary" /> Pitch Attachments ({selectedUnreviewedPitchApp.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedUnreviewedPitchApp.attachments.map((url, idx) => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/avatar/') || url.includes('image');
                      const filename = url.split('/').pop() || `Attachment ${idx + 1}`;
                      return isImage ? (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block w-24 h-24 rounded-xl border border-outline-variant overflow-hidden hover:opacity-95 transition-all shadow-xs"
                        >
                          <img src={url} alt="Pitch Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        </a>
                      ) : (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary/60 hover:bg-surface-container-high transition-all text-xs font-sans font-normal text-on-surface-variant hover:text-primary shadow-xs"
                        >
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="max-w-[180px] truncate font-semibold">{filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Toolbar */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                disabled={loadingProfile}
                onClick={() => {
                  handleOpenCandidateProfile(
                    selectedUnreviewedPitchApp.candidateId,
                    selectedUnreviewedPitchApp.candidate
                  );
                }}
                className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] font-headline font-medium uppercase rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loadingProfile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>Know About Candidate</span>
              </button>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const candId = selectedUnreviewedPitchApp.candidateId;
                      setSelectedUnreviewedPitchApp(null);
                      handleRejectCandidate(candId);
                    }}
                    className="px-3.5 py-2 bg-error/10 text-error border border-error/20 hover:bg-error/20 text-[10px] font-headline font-medium uppercase rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const candId = selectedUnreviewedPitchApp.candidateId;
                      setSelectedUnreviewedPitchApp(null);
                      handleSelectCandidate(candId);
                    }}
                    className="px-4 py-2 bg-primary text-white text-[10px] font-headline font-medium uppercase rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    Hire Candidate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Work Submission Modal */}
      {showSubmissionModal && gigDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in pointer-events-auto">
          <div className="w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary font-headline font-medium flex items-center justify-center text-xs overflow-hidden shrink-0">
                  <Paperclip className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Candidate Work Deliverables</h3>
                  <p className="text-[10px] font-sans font-normal text-on-surface-variant">Project: {gigDetails.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmissionModal(false)}
                className="p-1.5 hover:bg-surface-container-low rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar bg-background text-left font-sans">
              {isHiredCandidate && gigDetails.status === 'IN_PROGRESS' && (
                <form onSubmit={async (e) => {
                  await handleSubmitWork(e);
                  setShowSubmissionModal(false);
                }} className="space-y-3 pb-3 border-b border-outline-variant/40">
                  <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Submission Form</h4>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant font-bold">Work Description *</label>
                    <TextArea value={submitText} onChange={(e) => setSubmitText(e.target.value)} placeholder="Describe your completed deliverables, instructions, or links..." rows={3} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-headline font-medium uppercase text-on-surface-variant font-bold">Attach Work File (PDF/PNG/JPG/DOCX/ZIP)</label>
                    <input type="file" onChange={(e) => setSubmitFile(e.target.files[0])} className="w-full text-xs text-on-surface bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 cursor-pointer" />
                  </div>
                  <Button type="submit" disabled={submittingWork} className="w-full text-xs py-2 font-headline font-medium uppercase">
                    {submittingWork ? 'Uploading & Submitting...' : 'Submit Work Deliverables'}
                  </Button>
                </form>
              )}

              {(() => {
                const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.hiredCandidateIds && gigDetails.hiredCandidateIds[0]);
                const candSubmission = (gigDetails.submissions || []).find(s => s.candidateId === activeCandId || currentUserIds.includes(s.candidateId?.toString())) || gigDetails.submissions?.[0];

                if (!candSubmission) {
                  return !isHiredCandidate ? (
                    <div className="text-center py-8 bg-surface-container-low rounded-xl border border-outline-variant border-dashed p-4">
                      <Paperclip className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                      <p className="text-xs font-sans font-normal text-on-surface-variant">No work deliverables submitted yet by this candidate.</p>
                    </div>
                  ) : null;
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-headline font-medium uppercase tracking-wider text-primary font-bold">Submitted Deliverables</h4>
                      <span className={`text-[9px] font-headline font-medium px-2.5 py-0.5 rounded-full uppercase border ${
                        candSubmission.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : candSubmission.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {candSubmission.status || 'PENDING REVIEW'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-surface-container border border-outline-variant/60 rounded-xl text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                      {candSubmission.text}
                    </div>
                    {candSubmission.fileUrl && (
                      <div className="p-3 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-sans font-normal text-on-surface truncate">
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{candSubmission.fileUrl.split('/').pop() || 'Work Deliverable File'}</span>
                        </div>
                        <a
                          href={candSubmission.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-headline font-medium uppercase rounded-xl hover:opacity-90 transition-all shrink-0 shadow-xs"
                        >
                          View Work File
                        </a>
                      </div>
                    )}

                    {isOwner && (
                      <div className="flex gap-2 pt-3 border-t border-outline-variant/40">
                        <button
                          type="button"
                          onClick={async () => {
                            await handleReviewAction('ACCEPT', candSubmission.candidateId);
                            setShowSubmissionModal(false);
                          }}
                          className="flex-1 py-2 bg-success text-white text-xs font-headline font-medium uppercase rounded-xl hover:opacity-95 shadow-xs cursor-pointer font-bold"
                        >
                          Accept Work
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleReviewAction('REVISION', candSubmission.candidateId);
                            setShowSubmissionModal(false);
                          }}
                          className="flex-1 py-2 bg-error text-white text-xs font-headline font-medium uppercase rounded-xl hover:opacity-95 shadow-xs cursor-pointer font-bold"
                        >
                          Request Revision
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-headline font-medium rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidateForProfile && (
        <CandidateProfileModal
          candidate={selectedCandidateForProfile}
          onClose={() => setSelectedCandidateForProfile(null)}
        />
      )}

      {/* Top-Right Sliding Toast Notification */}
      {alertConfig && (
        formatAlertMessage(alertConfig.message, alertConfig.type, () => setAlertConfig(null))
      )}
    </div>
  );
}
