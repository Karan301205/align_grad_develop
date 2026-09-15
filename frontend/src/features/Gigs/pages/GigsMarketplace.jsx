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
  Lock,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Briefcase,
  Building
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
import GigFilterSidebar from '../components/GigFilterSidebar';
import GigCard from '../components/GigCard';
import GigDetailPage from '../components/GigDetailPage';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '../gigConstants';

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
          className="w-full bg-surface-container-low border border-outline-variant rounded-none px-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none pr-8 font-sans transition-all placeholder:text-on-surface-variant/60"
        />
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2 text-on-surface-variant hover:text-on-surface p-1 rounded-none cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-none shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-1">
          {isFilter && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-none transition-all flex items-center justify-between cursor-pointer font-sans ${
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
                  className="mt-2 w-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-none text-xs font-bold font-sans transition-all flex items-center justify-center gap-1 cursor-pointer"
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
                className={`w-full text-left px-3 py-2 text-xs rounded-none transition-all flex items-center justify-between cursor-pointer font-sans ${
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
          className="w-full bg-surface-container-low border border-outline-variant rounded-none px-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none pr-8 font-sans transition-all placeholder:text-on-surface-variant/60"
        />
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2 text-on-surface-variant hover:text-on-surface p-1 rounded-none cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-none shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-1">
          {filteredCategories.length === 0 ? (
            <div className="p-2.5 text-center text-xs text-on-surface-variant font-sans font-normal">
              No matching field found
              {allowCustom && searchTerm.trim() && !values.includes(searchTerm.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(searchTerm.trim());
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-none text-xs font-bold font-sans transition-all flex items-center justify-center gap-1 cursor-pointer"
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
                  className={`w-full text-left px-3 py-2 text-xs rounded-none transition-all flex items-center justify-between cursor-pointer font-sans ${
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
              className="inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-1 rounded-none bg-primary/10 text-primary border border-primary/20 font-semibold shrink-0"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(cat, e)}
                className="hover:bg-primary/20 p-0.5 rounded-none transition-colors cursor-pointer"
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

export default function GigsMarketplace({
  user,
  token,
  theme,
  profile,
  onUpdateProfile,
  onOpenCompanyProfile,
  autoSelectOpportunity,
  setAutoSelectOpportunity,
  onNavigateToTests,
  onStartSkillTest,
  onAddSkillAndUpgrade,
  activeSubTab: externalSubTab,
  onSubTabChange,
  setActiveSubTab: setExternalSubTab
}) {
  const [internalSubTab, setInternalSubTab] = useState(externalSubTab || 'browse'); // 'browse', 'post', 'my-gigs'

  useEffect(() => {
    if (externalSubTab && externalSubTab !== internalSubTab) {
      setInternalSubTab(externalSubTab);
    }
  }, [externalSubTab]);

  const activeSubTab = externalSubTab || internalSubTab;

  const setActiveSubTab = (newSubTab) => {
    setInternalSubTab(newSubTab);
    if (onSubTabChange) onSubTabChange(newSubTab);
    if (setExternalSubTab) setExternalSubTab(newSubTab);
  };

  const [gigs, setGigs] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoSelectOpportunity && autoSelectOpportunity.type === 'gig') {
      setSelectedGigId(autoSelectOpportunity.id);
      fetchGigDetails(autoSelectOpportunity.id);
      setActiveSubTab('gig-detail');
      setAutoSelectOpportunity(null);
    }
  }, [autoSelectOpportunity, setAutoSelectOpportunity]);

  const [q, setQ] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState('0');
  const [sortBy, setSortBy] = useState('newest');

  // Create Gig state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [gigLogoFile, setGigLogoFile] = useState(null);
  const [gigLogoPreview, setGigLogoPreview] = useState(null);
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
  const [editCurrency, setEditCurrency] = useState('INR');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editAttachmentFile, setEditAttachmentFile] = useState(null);
  const [editGigLogo, setEditGigLogo] = useState(null);
  const [editGigLogoFile, setEditGigLogoFile] = useState(null);
  const [editGigLogoPreview, setEditGigLogoPreview] = useState(null);
  const [updatingGig, setUpdatingGig] = useState(false);

  // Keep a reference to profile to satisfy eslint
  React.useEffect(() => {
    if (profile) {
      console.log('Active profile:', profile.name);
    }
  }, [profile]);

  // Auto-scroll to top / pitch popup when Pitch & Apply modal opens
  React.useEffect(() => {
    if (showApplyModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('pitch-apply-modal-dialog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showApplyModal]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchGigs = async (customFilters = {}) => {
    setLoading(true);
    try {
      const activeQ = customFilters.q !== undefined ? customFilters.q : q;
      const activeCategory = customFilters.category !== undefined ? customFilters.category : selectedCategoryFilter;
      const activeSkills = customFilters.skills !== undefined ? customFilters.skills : selectedSkills;
      const activeMinBudget = customFilters.minBudget !== undefined ? customFilters.minBudget : minBudget;
      const activeMaxBudget = customFilters.maxBudget !== undefined ? customFilters.maxBudget : maxBudget;
      const activeDelivery = customFilters.deliveryTimeline !== undefined ? customFilters.deliveryTimeline : deliveryTimeline;
      const activeVerified = customFilters.verifiedOnly !== undefined ? customFilters.verifiedOnly : verifiedOnly;
      const activeMinRating = customFilters.minRating !== undefined ? customFilters.minRating : minRating;
      const activeSortBy = customFilters.sortBy !== undefined ? customFilters.sortBy : sortBy;

      const params = new URLSearchParams();
      if (activeQ) params.append('q', activeQ);
      if (activeCategory) params.append('category', activeCategory);
      if (activeSkills) params.append('skills', activeSkills);
      if (activeMinBudget) params.append('minBudget', activeMinBudget);
      if (activeMaxBudget) params.append('maxBudget', activeMaxBudget);
      if (activeDelivery && activeDelivery !== 'all') params.append('deliveryTimeline', activeDelivery);
      if (activeVerified) params.append('verifiedOnly', 'true');
      if (activeMinRating && activeMinRating !== '0') params.append('minRating', activeMinRating);
      if (activeSortBy && activeSortBy !== 'newest') params.append('sortBy', activeSortBy);

      const queryString = params.toString();
      const res = await apiFetch(`/gigs${queryString ? `?${queryString}` : ''}`, { token });
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

  const handleResetFilters = () => {
    setQ('');
    setSelectedCategoryFilter('');
    setSelectedSkills('');
    setMinBudget('');
    setMaxBudget('');
    setDeliveryTimeline('all');
    setVerifiedOnly(false);
    setMinRating('0');
    setSortBy('newest');
    fetchGigs({
      q: '',
      category: '',
      skills: '',
      minBudget: '',
      maxBudget: '',
      deliveryTimeline: 'all',
      verifiedOnly: false,
      minRating: '0',
      sortBy: 'newest'
    });
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
    setEditCurrency(gig.currency || 'INR');
    setEditDeliveryTime(gig.deliveryTime);
    setEditAttachmentFile(null);
    setEditGigLogo(gig.logo || null);
    setEditGigLogoFile(null);
    setEditGigLogoPreview(null);
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

      let finalLogoUrl = editGigLogo;
      if (editGigLogoFile) {
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'image',
            fileName: editGigLogoFile.name,
            contentType: editGigLogoFile.type || 'image/png'
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, editGigLogoFile, editGigLogoFile.type || 'image/png', token);
          finalLogoUrl = publicUrl;
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
        currency: editCurrency || 'INR',
        deliveryTime: editDeliveryTime,
        minRating: editReqs.length > 0 ? Math.max(...editReqs.map(r => r.minRating || 1)) : 1,
        attachments: uploadedUrl ? [uploadedUrl] : [],
        logo: finalLogoUrl || null
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

      let uploadedLogoUrl = null;
      if (gigLogoFile) {
        const urlRes = await apiFetch('/upload/request-url', {
          token,
          method: 'POST',
          json: {
            fileType: 'image',
            fileName: gigLogoFile.name,
            contentType: gigLogoFile.type || 'image/png'
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, gigLogoFile, gigLogoFile.type || 'image/png', token);
          uploadedLogoUrl = publicUrl;
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
        currency: currency || 'INR',
        deliveryTime,
        minRating: reqs.length > 0 ? Math.max(...reqs.map(r => r.minRating || 1)) : 1,
        attachments: uploadedUrl ? [uploadedUrl] : [],
        logo: uploadedLogoUrl || null
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
        setCurrency('INR');
        setDeliveryTime('');
        setAttachmentFile(null);
        setGigLogoFile(null);
        setGigLogoPreview(null);
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
      {/* Main Workspace Body */}
      <AnimatedContent distance={40} direction="vertical">
        {(() => {
          const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
          const displayGigs = user?.role === 'STUDENT'
            ? gigs.filter(g => {
                const hasApplied = g.hasApplied || (g.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()));
                const isHired = candidateIds.some(cId => Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString()).includes(cId));
                return !hasApplied && !isHired;
              })
            : gigs;

          return (
            <>
              {activeSubTab === 'browse' && (
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Left Column: Vertical Filter Panel */}
                  <GigFilterSidebar
                    q={q}
                    setQ={setQ}
                    selectedCategoryFilter={selectedCategoryFilter}
                    setSelectedCategoryFilter={setSelectedCategoryFilter}
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                    minBudget={minBudget}
                    setMinBudget={setMinBudget}
                    maxBudget={maxBudget}
                    setMaxBudget={setMaxBudget}
                    deliveryTimeline={deliveryTimeline}
                    setDeliveryTimeline={setDeliveryTimeline}
                    verifiedOnly={verifiedOnly}
                    setVerifiedOnly={setVerifiedOnly}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onSearch={() => fetchGigs()}
                    onReset={handleResetFilters}
                    loading={loading}
                    totalGigs={displayGigs.length}
                  />

                  {/* Right Column: Stack of Gigs (Zero gap, divide-y) */}
                  <div className="flex-1 w-full min-w-0 flex flex-col">
                    {loading ? (
                      <div className="flex justify-center py-20 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    ) : displayGigs.length === 0 ? (
                      <div className="text-center py-20 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs">
                        <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-60" />
                        <h3 className="font-headline font-bold text-slate-900 dark:text-slate-100">No open gigs available</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">Try adjusting your search criteria or check your workspace for active gigs.</p>
                      </div>
                    ) : (
                      <div className="bg-surface border border-slate-300 dark:border-slate-700 divide-y divide-slate-300 dark:divide-slate-700 rounded-none shadow-2xs">
                        {displayGigs.map(gig => (
                          <GigCard
                            key={gig.id}
                            gig={gig}
                            isCandidate={user?.role === 'STUDENT'}
                            candidateIds={candidateIds}
                            onClick={(gigId) => {
                              setSelectedGigId(gigId);
                              fetchGigDetails(gigId);
                              setActiveSubTab('gig-detail');
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSubTab === 'gig-detail' && (
                <GigDetailPage
                  gig={gigDetails}
                  loading={loadingDetails}
                  user={user}
                  profile={profile}
                  token={token}
                  onBack={() => setActiveSubTab('browse')}
                  onApply={(gig) => {
                    setTargetApplyGig(gig);
                    setShowApplyModal(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenCompanyProfile={onOpenCompanyProfile}
                  onNavigateToTests={onNavigateToTests}
                  onStartSkillTest={onStartSkillTest}
                  onAddSkillAndUpgrade={onAddSkillAndUpgrade}
                  onUpdateProfile={onUpdateProfile}
                  onEditGig={(gig) => {
                    setEditTitle(gig.title || '');
                    setEditDescription(gig.description || '');
                    setEditCategories(gig.categories || (gig.category ? [gig.category] : []));
                    setEditReqs(gig.requirements || []);
                    setEditBudget(gig.budget || '');
                    setEditCurrency(gig.currency || 'INR');
                    setEditDeliveryTime(gig.deliveryTime || '');
                    setEditGigLogo(gig.logo || null);
                    setEditGigLogoFile(null);
                    setEditGigLogoPreview(null);
                    setShowEditModal(true);
                  }}
                  onManageInWorkspace={(gigId) => {
                    setSelectedGigId(gigId);
                    fetchGigDetails(gigId);
                    fetchMyGigs();
                    setActiveSubTab('my-gigs');
                  }}
                />
              )}
            </>
          );
        })()}

        {activeSubTab === 'post' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6 bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs font-sans">
            <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-primary" /> Post a paid Task / Gig
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Hire other verified candidates to help complete milestones.</p>
            </div>

            <form onSubmit={handlePostGig} className="space-y-4">
              <div>
                <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Gig Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build Neumorphic Sidebar Layout in React"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Description details</label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed project requirements, expectations, and instructions..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Category of Field *</label>
                  <MultiSearchableCategorySelect
                    values={categories}
                    onChange={(vals) => setCategories(vals)}
                    placeholder="Search or select category/field(s)..."
                    showTags={false}
                  />
                </div>
                <div>
                  <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Currency *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans cursor-pointer h-[38px]"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-surface text-slate-900 dark:text-slate-100">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Budget ({currency}) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter Amount"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Delivery Time *</label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g. 3 Days"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans"
                    required
                  />
                </div>
                {categories.length > 0 && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-4 flex flex-wrap gap-2 pt-1">
                    {categories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-none bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-semibold shadow-2xs shrink-0"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => setCategories(categories.filter(v => v !== cat))}
                          className="hover:bg-blue-200 dark:hover:bg-blue-900 p-0.5 rounded-none transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-blue-800 dark:text-blue-200" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100">
                  Required Skills & Rating *
                </label>

                <div className="relative">
                  <input
                    type="text"
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
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans"
                  />

                  {isSkillDropdownOpen && skillSearchTerm.trim() !== '' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSkillDropdownOpen(false)}></div>
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-56 overflow-y-auto custom-scrollbar p-1">
                        {ALL_SKILLS.filter(
                          s => s.skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
                            !reqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 font-sans font-normal text-center">
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
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-all flex items-center justify-between group cursor-pointer rounded-none font-sans"
                            >
                              <span>{s.skill}</span>
                              <span className="text-[10px] font-sans font-normal capitalize px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
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
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-none text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">No skill requirements added yet. Search and select skills above.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {reqs.map(r => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={r.skillName} className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-none space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-headline">{r.skillName}</span>
                            <div className="flex items-center gap-3">
                              {isTech ? (
                                <span className="text-blue-700 dark:text-blue-300 font-headline font-bold text-xs bg-blue-100 dark:bg-blue-950/70 px-2 py-0.5 rounded-none border border-blue-300 dark:border-blue-700">
                                  Required Level: Lvl {r.minRating}/10
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-400 font-headline font-medium text-[10px] tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-none">Required Skill</span>
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
                              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-none appearance-none cursor-pointer accent-primary"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gig Logo Upload */}
              <div>
                <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center justify-between">
                  <span>Gig Logo (Optional)</span>
                  {gigLogoFile && (
                    <button
                      type="button"
                      onClick={() => { setGigLogoFile(null); setGigLogoPreview(null); }}
                      className="text-[11px] text-error hover:underline cursor-pointer font-sans"
                    >
                      Remove Logo
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-none">
                  <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden">
                    {gigLogoPreview ? (
                      <img src={gigLogoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-xs font-headline font-bold text-slate-900 dark:text-slate-100 rounded-none transition-colors">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>{gigLogoFile ? 'Change Logo Image' : 'Upload Gig Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setGigLogoFile(file);
                            setGigLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                      Displayed on gig card in the marketplace.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1.5">Brief Attachments (Optional)</label>
                <label className="cursor-pointer text-xs font-headline font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 rounded-none flex items-center gap-2 shadow-xs w-full">
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
                <button
                  type="submit"
                  disabled={postingGig}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-bold uppercase tracking-wider rounded-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {postingGig ? 'Publishing...' : 'Publish Gig to Marketplace'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeSubTab === 'my-gigs' && (
          /* Main Unified 3-Column Gig Workspace Chassis */
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-300 dark:divide-slate-700 h-[calc(100vh-140px)] min-h-[660px] items-stretch font-sans">
            {/* COLUMN 1: LEFT PANEL - HOSTED GIGS */}
            <div className="w-full lg:w-56 xl:w-64 shrink-0 flex flex-col min-h-0 bg-surface">
              {/* Hosted Gigs Header */}
              <div className="p-3.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">
                    {user?.role === 'STUDENT' ? 'Gigs Hired In' : 'Hosted Gigs'}
                  </h4>
                  <span className="text-[10px] font-headline font-bold px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                    {(() => {
                      const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                      if (user?.role === 'STUDENT') {
                        return myGigs.filter(g => {
                          const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                          return candidateIds.some(cId => allHired.includes(cId));
                        }).length;
                      }
                      return myGigs.filter(g => g.ownerId === user.id).length;
                    })()}
                  </span>
                </div>
                {user?.role === 'RECRUITER' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('post');
                      setSelectedGigId(null);
                      setGigDetails(null);
                    }}
                    title="Post a new gig"
                    className="p-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-500 transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Gigs List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700 custom-scrollbar">
                {user?.role === 'STUDENT' ? (
                  (() => {
                    const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                    const hiredGigs = myGigs.filter(g => {
                      const allHired = Array.from(new Set([...(g.hiredCandidateIds || []), g.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                      return candidateIds.some(cId => allHired.includes(cId));
                    });

                    if (hiredGigs.length === 0) {
                      return <p className="text-center text-xs font-sans font-normal text-slate-500 dark:text-slate-400 py-8 px-4">No active hired gigs found.</p>;
                    }
                    return hiredGigs.map(gig => {
                      const isSelected = gig.id === selectedGigId;
                      return (
                        <div
                          key={gig.id}
                          onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                          className={`p-3 transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{gig.title}</h5>
                            <span className={`text-[9px] font-headline font-bold px-1.5 py-0.5 rounded-none shrink-0 ${gig.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-300'}`}>{gig.status}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-sans font-normal pt-0.5">
                            <span className="text-slate-600 dark:text-slate-400">Budget: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{getCurrencySymbol(gig.currency)}{gig.budget}</strong></span>
                            <span className="text-slate-500 dark:text-slate-400 text-[9px]">{gig.deliveryTime || ''}</span>
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  myGigs.filter(g => g.ownerId === user.id).length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No gigs posted yet.</p>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('post')}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-headline font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 rounded-none hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Post Your First Gig
                      </button>
                    </div>
                  ) : (
                    myGigs.filter(g => g.ownerId === user.id).map(gig => {
                      const isSelected = gig.id === selectedGigId;
                      const pitchCount = gig.applicants?.length || 0;
                      return (
                        <div
                          key={gig.id}
                          onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                          className={`p-3 transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{gig.title}</h5>
                            <span className={`text-[9px] font-headline font-bold px-1.5 py-0.5 rounded-none shrink-0 ${
                              gig.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300'
                                : gig.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-300'
                                : gig.status === 'CLOSED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300'
                                : gig.status === 'PAUSED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-200 border border-yellow-300'
                            }`}>{gig.status}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-sans font-normal pt-0.5">
                            <span className="text-slate-600 dark:text-slate-400">Budget: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{getCurrencySymbol(gig.currency)}{gig.budget}</strong></span>
                            <span className="text-slate-500 dark:text-slate-400 text-[9px] font-medium">
                              {pitchCount} {pitchCount === 1 ? 'pitch' : 'pitches'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>

            {/* COLUMN 2: CENTER PANEL - GIG CONTROL & CANDIDATE CHAT */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-surface">
              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : gigDetails ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* GIG HEADER: Title, View Brief, Controls & Metrics (Screenshot 1 & 2) */}
                  <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0 space-y-3">
                    {/* Top Row: Status pill, View Brief & Recruiter Action Controls */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-headline font-bold tracking-wider px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                          <span className="w-1.5 h-1.5 rounded-none bg-blue-600 animate-pulse" />
                          {gigDetails.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowGigInfoModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-headline font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>View Brief</span>
                          <ExternalLink className="w-3 h-3 text-primary" />
                        </button>
                      </div>

                      {/* Recruiter Owner Action Controls */}
                      {isOwner && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(gigDetails.status === 'OPEN' || gigDetails.status === 'PAUSED') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(gigDetails)}
                              className="px-2.5 py-1 text-[10px] font-headline font-bold rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTogglePause(gigDetails)}
                            className="px-2.5 py-1 text-[10px] font-headline font-bold rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:text-warning transition-all cursor-pointer shadow-2xs"
                          >
                            {gigDetails.status === 'PAUSED' ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleClose(gigDetails)}
                            className={`px-2.5 py-1 text-[10px] font-headline font-bold rounded-none border transition-all cursor-pointer shadow-2xs ${
                              gigDetails.status === 'CLOSED'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                : 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {gigDetails.status === 'CLOSED' ? 'Re-Open' : 'Close Gig'}
                          </button>
                          {(gigDetails.status === 'OPEN' || gigDetails.status === 'PAUSED') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGig(gigDetails.id)}
                              className="px-2.5 py-1 text-[10px] font-headline font-bold rounded-none border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Gig Title & Metadata */}
                    <div>
                      <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-slate-100 font-headline leading-snug line-clamp-1">
                        {gigDetails.title}
                      </h2>
                      <p className="text-[11px] font-sans font-normal text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {(gigDetails.categories?.[0] || gigDetails.category || 'Specialized Gig')} &bull; Delivery: {gigDetails.deliveryTime || 'Flexible'} &bull; Created {new Date(gigDetails.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Metrics Row (Budget, Delivery for Candidate; plus Assigned, Queue for Recruiter) */}
                    <div className={`grid gap-2 pt-1 border-t border-slate-300 dark:border-slate-700 ${isOwner ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-none border border-slate-300 dark:border-slate-700 shadow-2xs">
                        <p className="text-[9px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">Budget</p>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-sans mt-0.5">{getCurrencySymbol(gigDetails.currency)}{gigDetails.budget}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-none border border-slate-300 dark:border-slate-700 shadow-2xs">
                        <p className="text-[9px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">Delivery</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-sans mt-0.5">{gigDetails.deliveryTime || 'Flexible'}</p>
                      </div>
                      {isOwner && (
                        <>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-none border border-slate-300 dark:border-slate-700 shadow-2xs">
                            <p className="text-[9px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">Assigned</p>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 font-sans mt-0.5">
                              {gigDetails.hiredCandidates?.length || (gigDetails.selectedCandidateId ? 1 : 0)} Talent
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-none border border-slate-300 dark:border-slate-700 shadow-2xs">
                            <p className="text-[9px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">Review Queue</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-sans mt-0.5">
                              {(() => {
                                const hiredIds = Array.from(new Set([...(gigDetails?.hiredCandidateIds || []), gigDetails?.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                                return (gigDetails?.applicants || []).filter(a => !hiredIds.includes(a.candidateId?.toString()) && !a.isHired).length;
                              })()} Pitches
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE CANDIDATE SUBHEADER: Candidate Info, Submission & Profile Info (Screenshot 1) */}
                  {(() => {
                    const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.hiredCandidateIds && gigDetails.hiredCandidateIds[0]) || (gigDetails.applicants && gigDetails.applicants[0]?.candidateId);
                    const activeHiredCand = (gigDetails.hiredCandidates || []).find(c => c.id === activeCandId) || (gigDetails.applicants || []).find(a => a.candidateId === activeCandId)?.candidate;
                    const hiredName = activeHiredCand?.name || 'Assigned Freelancer';
                    const isCandidateMe = currentUserIds.includes(activeCandId?.toString());
                    const showOtherToggle = isOwner && (gigDetails.hiredCandidateIds?.length > 1 || (gigDetails.applicants && gigDetails.applicants.length > 1));

                    return (
                      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                            {isOwner ? hiredName.charAt(0) : (gigDetails.company?.name || gigDetails.ownerName || 'C').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {isOwner ? hiredName : (gigDetails.company?.name || gigDetails.ownerName || 'Recruiter Client')}
                              </span>
                              {/* {isCandidateMe && (
                                <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 px-1 rounded-none font-bold">
                                  You
                                </span>
                              )} */}
                              {/* <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-1 rounded-none font-bold">
                                Hired
                              </span> */}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">Direct communication channel</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {showOtherToggle && (
                            <button
                              type="button"
                              onClick={() => setShowOtherCandidatesModal(true)}
                              className="px-2.5 py-1 text-[10px] font-headline font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Users className="w-3 h-3 text-primary" />
                              <span>Rest of Candidates</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowSubmissionModal(true)}
                            className="px-2.5 py-1 text-[10px] font-headline font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 rounded-none text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Paperclip className="w-3 h-3 text-primary" />
                            <span>Submission</span>
                          </button>
                          {isOwner && activeCandId && (
                            <button
                              type="button"
                              onClick={() => handleOpenCandidateProfile(activeCandId, activeHiredCand)}
                              className="px-2.5 py-1 text-[10px] font-headline font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <User className="w-3 h-3 text-primary" />
                              <span>Profile Info</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Chat Messages Feed Area */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
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
                            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                            <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No direct messages yet. Send a message to start communicating.</p>
                          </div>
                        );
                      }

                      return filteredMessages.map(msg => {
                        const isMe = msg.senderId && currentUserIds.includes(msg.senderId.toString());
                        const isSystem = msg.text?.startsWith('[SYSTEM:');
                        return (
                          <div key={msg.id} className={`flex flex-col ${isSystem ? 'items-center w-full' : isMe ? 'items-end' : 'items-start'}`}>
                            {isSystem ? (
                              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 text-[10px] font-sans px-3 py-1 rounded-full text-center max-w-md shadow-2xs">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="max-w-[80%] space-y-1">
                                <div className={`p-3 text-xs leading-relaxed shadow-xs ${
                                  isMe
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs'
                                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-xs'
                                }`}>
                                  {msg.text}
                                  {msg.fileUrl && (
                                    <div className={`mt-2 p-1.5 rounded-xl text-[10px] font-sans flex items-center gap-1.5 ${isMe ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}>
                                      <Paperclip className="w-3 h-3" />
                                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline font-bold truncate max-w-[140px]">Attachment File</a>
                                    </div>
                                  )}
                                </div>
                                <p className={`text-[9px] font-sans font-normal text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                        <div className="p-3.5 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center shrink-0">
                          <p className="text-xs font-sans font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Application Pending Review &bull; Direct messaging unlocks when hired</span>
                          </p>
                        </div>
                      );
                    }

                    return (
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2 shrink-0">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatText}
                            onChange={(e) => setChatText(e.target.value)}
                            placeholder="Write a message..."
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 font-sans"
                          />
                          <button type="submit" disabled={sendingMessage} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-sm cursor-pointer font-bold text-xs active:scale-95 transition-all">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer text-[10px] font-headline font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-none px-2 py-1 bg-white dark:bg-slate-900 flex items-center gap-1 shadow-2xs">
                            <Paperclip className="w-3 h-3 text-primary" />
                            <span>{chatAttachment ? chatAttachment.name : 'Attach File'}</span>
                            <input type="file" onChange={(e) => setChatAttachment(e.target.files[0])} className="hidden" />
                          </label>
                          {chatAttachment && (
                            <button type="button" onClick={() => setChatAttachment(null)} className="text-[10px] text-error font-headline font-bold">Remove</button>
                          )}
                        </div>
                      </form>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Briefcase className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">Select a gig from the left panel to open workspace</p>
                </div>
              )}
            </div>

            {/* COLUMN 3: RIGHT PANEL - CANDIDATES (Screenshot 1 & 2) */}
            <div className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col min-h-0 bg-surface divide-y divide-slate-300 dark:divide-slate-700">
              {user?.role === 'STUDENT' || !isOwner ? (
                /* CANDIDATE VIEW: APPLIED GIGS PENDING REVIEW */
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="p-3.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
                    <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">
                      Applied Gigs (Pending)
                    </h4>
                    <span className="text-[10px] font-headline font-bold px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
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

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700 custom-scrollbar">
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
                          <div className="text-center py-8 px-4">
                            <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No pending applications.</p>
                          </div>
                        );
                      }

                      return pendingGigs.map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => { setSelectedGigId(gig.id); fetchGigDetails(gig.id); }}
                            className={`p-3 space-y-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{gig.title}</h5>
                              <span className="text-[9px] font-headline font-bold px-1.5 py-0.5 rounded-none bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0">
                                Pending Review
                              </span>
                            </div>
                            <p className="text-[10px] font-sans font-normal text-slate-600 dark:text-slate-400">Budget: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{getCurrencySymbol(gig.currency)}{gig.budget}</strong></p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                /* RECRUITER VIEW: ASSIGNED TALENT & UNREVIEWED PITCHES (Screenshot 1 & 2) */
                <>
                  {/* TOP SECTION: ASSIGNED TALENT (HIRED CANDIDATES) */}
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="p-3.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
                      <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">
                        Assigned Talent
                      </h4>
                      {gigDetails?.hiredCandidates?.length > 0 && (
                        <span className="text-[10px] font-headline font-bold px-2 py-0.5 rounded-none bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
                          {gigDetails.hiredCandidates.length} Hired
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700 custom-scrollbar">
                      {gigDetails?.hiredCandidates && gigDetails.hiredCandidates.length > 0 ? (
                        gigDetails.hiredCandidates.map((hc) => {
                          const isSelected = (selectedOtherCandidateId || gigDetails.selectedCandidateId) === hc.candidateId;
                          return (
                            <div key={hc.candidateId} className="flex flex-col">
                              <div
                                onClick={() => setSelectedOtherCandidateId(hc.candidateId)}
                                className={`p-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-none bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-headline font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                                    {hc.candidate?.avatar || hc.candidate?.profilePic ? (
                                      <img src={hc.candidate.avatar || hc.candidate.profilePic} alt={hc.candidate.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{hc.candidate?.name?.charAt(0) || 'C'}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{hc.candidate?.name || 'Hired Freelancer'}</h5>
                                    <p className="text-[9px] font-sans font-bold text-emerald-700 dark:text-emerald-300">Active Gig Talent</p>
                                  </div>
                                  <span className="text-[10px] font-headline font-bold px-2 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shrink-0">
                                    {getCurrencySymbol(gigDetails.currency)}{gigDetails.budget}
                                  </span>
                                </div>
                              </div>

                              {/* Feedback Room Panel when gig is COMPLETED */}
                              {gigDetails.status === 'COMPLETED' && isSelected && (
                                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border-t border-emerald-300 dark:border-emerald-700 space-y-2">
                                  <h5 className="text-[10px] font-headline font-bold tracking-wider text-emerald-800 dark:text-emerald-200">Feedback Room</h5>
                                  {(() => {
                                    const currentUserIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
                                    const myReview = gigDetails.reviews?.find(r => r.reviewerId && currentUserIds.includes(r.reviewerId.toString()));
                                    if (myReview) {
                                      return (
                                        <div className="text-xs space-y-1">
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} className={`w-3 h-3 ${star <= myReview.rating ? 'text-warning fill-warning' : 'text-slate-300 dark:text-slate-700'}`} />
                                            ))}
                                          </div>
                                          <p className="text-slate-800 dark:text-slate-200 italic text-[10px]">"{myReview.review}"</p>
                                        </div>
                                      );
                                    }
                                    return (
                                      <form onSubmit={handleSubmitReview} className="space-y-2">
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition-transform cursor-pointer">
                                              <Star className={`w-4 h-4 ${star <= rating ? 'text-warning fill-warning' : 'text-slate-300 dark:text-slate-700'}`} />
                                            </button>
                                          ))}
                                        </div>
                                        <TextArea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write feedback review..." rows={2} required />
                                        <Button type="submit" disabled={submittingReview} className="w-full text-[10px] py-1.5 rounded-none font-bold">Submit Feedback</Button>
                                      </form>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 px-4">
                          <Users className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
                          <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No candidates hired yet.</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Review pending pitches below to assign talent.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM SECTION: AWAITING REVIEW (UNREVIEWED PITCHES) */}
                  {(() => {
                    const hiredIds = Array.from(new Set([...(gigDetails?.hiredCandidateIds || []), gigDetails?.selectedCandidateId].filter(Boolean))).map(id => id.toString());
                    const unreviewedApplicants = (gigDetails?.applicants || []).filter(a => !hiredIds.includes(a.candidateId?.toString()) && !a.isHired);

                    return (
                      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="p-3.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
                          <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">
                            Awaiting Review
                          </h4>
                          <span className="text-[10px] font-headline font-bold px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                            {unreviewedApplicants.length} {unreviewedApplicants.length === 1 ? 'pitch' : 'pitches'}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700 custom-scrollbar">
                          {unreviewedApplicants.length === 0 ? (
                            <div className="text-center py-6 px-4">
                              <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No pending pitches to review.</p>
                            </div>
                          ) : (
                            unreviewedApplicants.map(app => (
                              <div
                                key={app.id}
                                onClick={() => {
                                  setSelectedOtherCandidateId(app.candidateId);
                                  setSelectedUnreviewedPitchApp(app);
                                }}
                                className={`p-3 space-y-2 transition-all cursor-pointer ${
                                  selectedOtherCandidateId === app.candidateId
                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                                }`}
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-headline font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                                      {app.candidate?.avatar || app.candidate?.profilePic ? (
                                        <img src={app.candidate.avatar || app.candidate.profilePic} alt={app.candidate.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{app.candidate?.name?.charAt(0) || 'C'}</span>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{app.candidate?.name || 'Candidate'}</h5>
                                      <p className="text-[8px] font-sans font-normal text-slate-500 dark:text-slate-400 truncate">@{app.candidate?.username || 'candidate'}</p>
                                    </div>
                                  </div>
                                  {isOwner && (
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectCandidate(app.candidateId)}
                                        className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 text-[9px] font-headline font-bold rounded-none hover:bg-rose-600 hover:text-white cursor-pointer transition-colors"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectCandidate(app.candidateId)}
                                        className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-headline font-bold rounded-none hover:bg-blue-700 cursor-pointer shadow-2xs transition-colors"
                                      >
                                        Hire
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {app.attachments?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {app.attachments.map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[9px] font-sans font-normal text-slate-700 dark:text-slate-300 hover:text-blue-600"
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
        <div id="pitch-apply-modal-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xs animate-fade-in pointer-events-auto">
          <div className="w-full max-w-lg bg-surface border-2 border-slate-300 dark:border-slate-700 rounded-none shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">Apply to: {targetApplyGig?.title}</h3>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">Submit your pitch proposal and showcase work samples.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100">Pitch Message / Cover Letter *</label>
              <TextArea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this task and highlight your relevant skills..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 flex justify-between items-center">
                <span>Attach Work Sample Image (Optional)</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">Max 2MB</span>
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
                className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-none file:border-0 file:text-[10px] file:font-headline file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
              />
              {applyFile && (
                <p className="text-[10px] font-sans text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-bold">
                  ✓ Attached: {applyFile.name} ({(applyFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-none text-xs font-headline font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToGig}
                disabled={applying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-bold rounded-none transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {applying ? 'Submitting...' : 'Send Pitch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gig Modal (Horizontal 2-Column Responsive Dialog) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in pointer-events-auto">
          <form
            onSubmit={handleUpdateGigSubmit}
            className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-surface border-2 border-slate-300 dark:border-slate-700 rounded-none shadow-2xl overflow-hidden animate-scale-up"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">Edit Gig Details</h3>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">Update scope, technical requirements, and compensation parameters.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable 2-Column Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column: Scope, Classification, Budget & Attachments */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                  </div>

                  {/* Category of Field */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Category of Field *
                    </label>
                    <MultiSearchableCategorySelect
                      values={editCategories}
                      onChange={(vals) => setEditCategories(vals)}
                      placeholder="Search or select category/field(s)..."
                      showTags={false}
                    />
                    {editCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-y-auto custom-scrollbar">
                        {editCategories.map(cat => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1.5 text-[11px] font-sans px-2.5 py-0.5 rounded-none bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-bold shrink-0"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => setEditCategories(editCategories.filter(v => v !== cat))}
                              className="hover:bg-blue-200 dark:hover:bg-blue-900 p-0.5 rounded-none transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3 text-blue-800 dark:text-blue-200" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Currency, Budget, Delivery Time in 3 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Currency *
                      </label>
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans cursor-pointer h-[35px]"
                      >
                        {SUPPORTED_CURRENCIES.map(c => (
                          <option key={c.code} value={c.code} className="bg-surface text-slate-900 dark:text-slate-100">
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Budget ({editCurrency}) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {getCurrencySymbol(editCurrency)}
                        </span>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans"
                          value={editBudget}
                          onChange={e => setEditBudget(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Delivery Time *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 3 days"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans"
                        value={editDeliveryTime}
                        onChange={e => setEditDeliveryTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Description & Deliverables *
                    </label>
                    <TextArea
                      required
                      rows={5}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Detailed brief, deliverables, and scope of work..."
                    />
                  </div>

                  {/* Spec Attachment */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Update Spec Attachment (Optional)
                    </label>
                    <input
                      type="file"
                      className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 font-sans"
                      onChange={e => setEditAttachmentFile(e.target.files[0])}
                    />
                  </div>
                </div>

                {/* Right Column: Required Stacks & Rating Sliders + Logo Upload */}
                <div className="space-y-4">
                  {/* Required Stacks & Rating Thresholds */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-between">
                      <span>Required Stacks & Rating Thresholds *</span>
                      <span className="text-[9px] font-sans text-slate-500 dark:text-slate-400 font-normal">
                        {editReqs.length} {editReqs.length === 1 ? 'skill' : 'skills'} added
                      </span>
                    </label>
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
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-none font-sans"
                      />

                      {isEditSkillDropdownOpen && editSkillSearchTerm.trim() !== '' && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsEditSkillDropdownOpen(false)}></div>
                          <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {ALL_SKILLS.filter(
                              s => s.skill.toLowerCase().includes(editSkillSearchTerm.toLowerCase()) &&
                                !editReqs.some(exist => exist.skillName.toLowerCase() === s.skill.toLowerCase())
                            ).length === 0 ? (
                              <div className="p-2.5 text-[11px] text-slate-500 font-sans font-normal text-center">
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
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-all flex items-center justify-between group cursor-pointer rounded-none font-sans"
                                >
                                  <span>{s.skill}</span>
                                  <span className="text-[9px] font-sans font-normal capitalize px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    {s.type}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Skills List with Scroll Constraints */}
                    {editReqs.length === 0 ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-none text-center mt-2">
                        <p className="text-[11px] text-slate-500 font-sans">No required skills selected yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                        {editReqs.map(r => {
                          const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === r.skillName.toLowerCase());
                          const isTech = skillObj ? skillObj.type === 'technical' : true;
                          return (
                            <div key={r.skillName} className="p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-none space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-900 dark:text-slate-100 font-headline">{r.skillName}</span>
                                <div className="flex items-center gap-2">
                                  {isTech ? (
                                    <span className="text-blue-700 dark:text-blue-300 font-headline font-bold text-[10px] bg-blue-100 dark:bg-blue-950/70 px-2 py-0.5 rounded-none border border-blue-300 dark:border-blue-700">
                                      Lvl {r.minRating}/10
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 dark:text-slate-400 font-headline font-medium text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded-none">Required</span>
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
                                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none appearance-none cursor-pointer accent-primary"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Edit Gig Logo */}
                  <div>
                    <label className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-between">
                      <span>Gig / Project Logo (Optional)</span>
                      {(editGigLogo || editGigLogoFile) && (
                        <button
                          type="button"
                          onClick={() => { setEditGigLogo(null); setEditGigLogoFile(null); setEditGigLogoPreview(null); }}
                          className="text-[10px] text-error hover:underline cursor-pointer font-sans"
                        >
                          Remove Logo
                        </button>
                      )}
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-none">
                      <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden">
                        {editGigLogoPreview ? (
                          <img src={editGigLogoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : editGigLogo ? (
                          <img src={editGigLogo} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-xs font-headline font-bold text-slate-900 dark:text-slate-100 rounded-none transition-colors">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>{editGigLogo || editGigLogoFile ? 'Change Logo' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEditGigLogoFile(file);
                                setEditGigLogoPreview(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Square PNG, JPG, or SVG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-none text-xs font-headline font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingGig}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-bold rounded-none transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {updatingGig ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Info Modal */}
      {showGigInfoModal && gigDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] bg-surface border-2 border-slate-300 dark:border-slate-700 rounded-none shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 flex items-center justify-center font-bold">
                  <Info className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">{gigDetails.title}</h3>
                  <p className="text-[10px] font-sans font-normal text-slate-500 dark:text-slate-400">Full Project Brief & Specifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowGigInfoModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar font-sans text-xs">
              {/* Categories & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-300 dark:border-slate-700">
                <div className="flex flex-wrap gap-1.5">
                  {(gigDetails.categories || [gigDetails.category]).filter(Boolean).map(c => (
                    <span key={c} className="px-2.5 py-0.5 rounded-none bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[10px] font-headline font-bold">
                      {c}
                    </span>
                  ))}
                </div>
                <span className="px-2.5 py-1 rounded-none text-[10px] font-headline font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  {gigDetails.status}
                </span>
              </div>

              {/* Budget & Delivery */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-none">
                <div>
                  <span className="text-[10px] font-headline font-bold text-slate-600 dark:text-slate-400 block">Budget Rate</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-sans">{getCurrencySymbol(gigDetails.currency)}{gigDetails.budget}</span>
                </div>
                <div>
                  <span className="text-[10px] font-headline font-bold text-slate-600 dark:text-slate-400 block">Delivery Time</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{gigDetails.deliveryTime}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Detailed Requirements</h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-none text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                  {gigDetails.description}
                </div>
              </div>

              {/* Required Stacks */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Required Skills & Ratings</h4>
                <div className="flex flex-wrap gap-2">
                  {((gigDetails.requirements && gigDetails.requirements.length > 0)
                    ? gigDetails.requirements
                    : (gigDetails.skills || []).map(s => ({ skillName: s, minRating: gigDetails.minRating || 1 }))
                  ).map(r => (
                    <div key={r.skillName} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{r.skillName}</span>
                      <span className="text-[9px] font-headline font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 px-2 py-0.5 rounded-none">Lvl {r.minRating || 1}/10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brief Attachments */}
              {gigDetails.attachments?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-300 dark:border-slate-700">
                  <h4 className="text-[10px] font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Brief Attachments ({gigDetails.attachments.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {gigDetails.attachments.map((url, idx) => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/avatar/') || url.includes('image');
                      const filename = url.split('/').pop() || `Attachment ${idx + 1}`;
                      return isImage ? (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-none border border-slate-300 dark:border-slate-700 overflow-hidden hover:opacity-90 transition-all">
                          <img src={url} alt="Brief Attachment" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-sans font-normal text-slate-700 dark:text-slate-300 hover:text-blue-600">
                          <Paperclip className="w-4 h-4 text-primary" />
                          <span className="max-w-[160px] truncate">{filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setShowGigInfoModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none cursor-pointer shadow-2xs"
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
          <div className="w-full max-w-3xl max-h-[88vh] bg-surface border-2 border-slate-300 dark:border-slate-700 rounded-none shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 flex items-center justify-center font-bold">
                  <Users className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">Rest of Candidates</h3>
                  <p className="text-[10px] font-sans font-normal text-slate-500 dark:text-slate-400">Review pitches & communicate directly with applicants</p>
                </div>
              </div>
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar font-sans text-xs">
              {/* Section 1: Candidate Pitches */}
              <div className="space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase">
                  <span>Candidate Pitches</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 rounded-none font-bold">{gigDetails.applicants?.length || 0} Total</span>
                </h4>

                {gigDetails.applicants?.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/40 rounded-none border border-slate-300 dark:border-slate-700 border-dashed">
                    <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No other candidate pitches submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gigDetails.applicants?.map(app => {
                      const isHired = gigDetails.selectedCandidateId === app.candidateId;
                      return (
                        <div key={app.id} className={`p-4 rounded-none border transition-all space-y-3 shadow-2xs ${isHired ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-headline font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                                {app.candidate?.avatar || app.candidate?.profilePic ? (
                                  <img src={app.candidate.avatar || app.candidate.profilePic} alt={app.candidate.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{app.candidate?.name?.charAt(0) || 'C'}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{app.candidate?.name || 'Candidate'}</h4>
                                  {isHired && <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[8px] font-headline font-bold rounded-none ">Currently Hired</span>}
                                </div>
                                <p className="text-[9px] font-sans font-normal text-slate-500 dark:text-slate-400">@{app.candidate?.username || 'candidate'}</p>
                              </div>
                            </div>
                            {isOwner && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRejectCandidate(app.candidateId)}
                                  className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 hover:bg-rose-600 hover:text-white text-[9px] font-headline font-bold rounded-none transition-all shadow-2xs cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectCandidate(app.candidateId)}
                                  className={`px-3 py-1 text-[9px] font-headline font-bold rounded-none transition-all shadow-2xs cursor-pointer ${isHired ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                  {isHired ? 'Selected' : 'Switch Hire'}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-none text-xs text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-300 dark:border-slate-700">
                            {app.message}
                          </div>
                          {app.attachments?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-300 dark:border-slate-700">
                              <p className="text-[10px] font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-primary" /> Pitch Attachments ({app.attachments.length}):
                              </p>
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {app.attachments.map((url, idx) => {
                                  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/avatar/') || url.includes('image');
                                  const filename = url.split('/').pop() || `Attachment ${idx + 1}`;
                                  return isImage ? (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-none border border-slate-300 dark:border-slate-700 overflow-hidden hover:opacity-95 transition-all">
                                      <img src={url} alt="Pitch Attachment" className="w-full h-full object-cover" />
                                    </a>
                                  ) : (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-sans font-normal text-slate-700 dark:text-slate-300 hover:text-blue-600">
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
              <div className="pt-4 border-t border-slate-300 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                  Other Candidate Chats
                </h4>

                {gigDetails.applicants?.length === 0 ? (
                  <p className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">No candidates to chat with.</p>
                ) : (
                  <div className="border border-slate-300 dark:border-slate-700 rounded-none overflow-hidden bg-white dark:bg-slate-900">
                    {/* Candidate Tab Selection Bar */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-300 dark:border-slate-700 overflow-x-auto custom-scrollbar">
                      {gigDetails.applicants?.map(app => {
                        const isSelectedTab = (selectedOtherCandidateId || gigDetails.applicants[0]?.candidateId) === app.candidateId;
                        return (
                          <button
                            key={app.candidateId}
                            type="button"
                            onClick={() => setSelectedOtherCandidateId(app.candidateId)}
                            className={`px-3 py-1.5 rounded-none text-xs font-headline font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                              isSelectedTab ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600'
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
                            <div className="max-h-56 overflow-y-auto space-y-2 p-2 border border-slate-300 dark:border-slate-700 rounded-none bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                              {candMessages.length === 0 ? (
                                <p className="text-center text-xs font-sans font-normal text-slate-500 dark:text-slate-400 py-6">No direct chat history with this candidate yet. Type a message below to start.</p>
                              ) : (
                                candMessages.map(msg => {
                                  const isMe = msg.senderId === user.id;
                                  return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      <div className={`p-2.5 rounded-none text-xs max-w-[80%] shadow-2xs ${isMe ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'}`}>
                                        {msg.text}
                                        {msg.fileUrl && (
                                          <div className="mt-1 text-[9px] font-sans font-normal underline">
                                            <a href={msg.fileUrl} target="_blank" rel="noreferrer">View Attachment</a>
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[8px] font-sans font-normal text-slate-500 dark:text-slate-400 px-1 mt-0.5">
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
                                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 font-sans"
                                />
                                <button type="submit" disabled={sendingOtherChat} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold text-xs cursor-pointer shadow-2xs">
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-sans font-normal">
                                <label className="cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-none px-2 py-1 bg-white dark:bg-slate-900 flex items-center gap-1 shadow-2xs">
                                  <Paperclip className="w-3 h-3 text-primary" />
                                  <span>{otherCandidateChatFile ? otherCandidateChatFile.name : 'Attach File'}</span>
                                  <input type="file" onChange={e => setOtherCandidateChatFile(e.target.files[0])} className="hidden" />
                                </label>
                                {otherCandidateChatFile && (
                                  <button type="button" onClick={() => setOtherCandidateChatFile(null)} className="text-error font-bold">Remove</button>
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

            <div className="p-3 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setShowOtherCandidatesModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none cursor-pointer shadow-2xs"
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
          <div className="w-full max-w-lg bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300 font-headline font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                  {selectedUnreviewedPitchApp.candidate?.avatar || selectedUnreviewedPitchApp.candidate?.profilePic ? (
                    <img src={selectedUnreviewedPitchApp.candidate.avatar || selectedUnreviewedPitchApp.candidate.profilePic} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedUnreviewedPitchApp.candidate?.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">{selectedUnreviewedPitchApp.candidate?.name || 'Candidate'}</h3>
                  <p className="text-xs font-sans font-bold text-blue-700 dark:text-blue-400">@{selectedUnreviewedPitchApp.candidate?.username || 'candidate'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUnreviewedPitchApp(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar bg-white dark:bg-slate-950 text-left">
              <div className="space-y-1.5">
                <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Candidate Pitch Message</h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedUnreviewedPitchApp.message}
                </div>
              </div>

              {selectedUnreviewedPitchApp.attachments?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-300 dark:border-slate-700">
                  <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Pitch Attachments ({selectedUnreviewedPitchApp.attachments.length})
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
                          className="group relative block w-24 h-24 rounded-none border border-slate-300 dark:border-slate-700 overflow-hidden hover:opacity-95 transition-all shadow-xs"
                        >
                          <img src={url} alt="Pitch Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        </a>
                      ) : (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-sans text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs"
                        >
                          <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="max-w-[180px] truncate font-bold">{filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Toolbar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                disabled={loadingProfile}
                onClick={() => {
                  handleOpenCandidateProfile(
                    selectedUnreviewedPitchApp.candidateId,
                    selectedUnreviewedPitchApp.candidate
                  );
                }}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-headline font-bold rounded-none flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
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
                    className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-400 dark:border-rose-600 hover:bg-rose-200 dark:hover:bg-rose-900 text-xs font-headline font-bold rounded-none transition-all cursor-pointer active:scale-95 shadow-2xs"
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-bold rounded-none transition-all shadow-2xs cursor-pointer active:scale-95 border border-blue-700"
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
          <div className="w-full max-w-lg bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 font-headline font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                  <Paperclip className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">Candidate Work Deliverables</h3>
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400">Project: {gigDetails.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmissionModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar bg-white dark:bg-slate-950 text-left font-sans">
              {isHiredCandidate && gigDetails.status === 'IN_PROGRESS' && (
                <form onSubmit={async (e) => {
                  await handleSubmitWork(e);
                  setShowSubmissionModal(false);
                }} className="space-y-3 pb-3 border-b border-slate-300 dark:border-slate-700">
                  <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Submission Form</h4>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200">Work Description *</label>
                    <TextArea value={submitText} onChange={(e) => setSubmitText(e.target.value)} placeholder="Describe your completed deliverables, instructions, or links..." rows={3} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200">Attach Work File (PDF/PNG/JPG/DOCX/ZIP)</label>
                    <input type="file" onChange={(e) => setSubmitFile(e.target.files[0])} className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 cursor-pointer" />
                  </div>
                  <Button type="submit" disabled={submittingWork} className="w-full text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-headline font-bold rounded-none shadow-2xs border border-blue-700 cursor-pointer transition-all active:scale-95">
                    {submittingWork ? 'Uploading & Submitting...' : 'Submit Work Deliverables'}
                  </Button>
                </form>
              )}

              {(() => {
                const activeCandId = selectedOtherCandidateId || gigDetails.selectedCandidateId || (gigDetails.hiredCandidateIds && gigDetails.hiredCandidateIds[0]);
                const candSubmission = (gigDetails.submissions || []).find(s => s.candidateId === activeCandId || currentUserIds.includes(s.candidateId?.toString())) || gigDetails.submissions?.[0];

                if (!candSubmission) {
                  return !isHiredCandidate ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-none border border-slate-300 dark:border-slate-700 border-dashed p-4">
                      <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-sans text-slate-600 dark:text-slate-400">No work deliverables submitted yet by this candidate.</p>
                    </div>
                  ) : null;
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">Submitted Deliverables</h4>
                      <span className={`text-[10px] font-headline font-bold px-2.5 py-0.5 rounded-none border ${
                        candSubmission.status === 'ACCEPTED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600'
                          : candSubmission.status === 'REJECTED'
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600'
                      }`}>
                        {candSubmission.status || 'PENDING REVIEW'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {candSubmission.text}
                    </div>
                    {candSubmission.fileUrl && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-sans text-slate-800 dark:text-slate-200 truncate">
                          <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{candSubmission.fileUrl.split('/').pop() || 'Work Deliverable File'}</span>
                        </div>
                        <a
                          href={candSubmission.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none transition-all shrink-0 shadow-2xs"
                        >
                          View Work File
                        </a>
                      </div>
                    )}

                    {isOwner && (
                      <div className="flex gap-2 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={async () => {
                            await handleReviewAction('ACCEPT', candSubmission.candidateId);
                            setShowSubmissionModal(false);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold rounded-none shadow-2xs cursor-pointer border border-emerald-700 transition-all active:scale-95"
                        >
                          Accept Work
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleReviewAction('REVISION', candSubmission.candidateId);
                            setShowSubmissionModal(false);
                          }}
                          className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-headline font-bold rounded-none shadow-2xs cursor-pointer border border-amber-700 transition-all active:scale-95"
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
            <div className="p-3 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none cursor-pointer shadow-2xs"
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
