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
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { putFileToS3 } from '../../services/uploadService';
import AnimatedContent from '../../components/ui/AnimatedContent';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Badge from '../../components/ui/Badge';
import { formatAlertMessage } from '../../utils/errorFormatter';

export default function GigsMarketplace({ user, token, theme, profile, onUpdateProfile, onOpenCompanyProfile, autoSelectOpportunity, setAutoSelectOpportunity }) {
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
  const [selectedSkills, setSelectedSkills] = useState('');
  
  // Create Gig state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
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

  // Edit Gig states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSkills, setEditSkills] = useState('');
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
    setGigDetails(prev => {
      if (!prev) return newData;
      // Extract any local unsent temporary messages
      const tempMsgs = prev.messages?.filter(m => m.sending) || [];
      
      // Combine new incoming messages from backend with our local unsent temporary messages
      const mergedMessages = [...(newData.messages || []), ...tempMsgs];
      
      const msgChanged = (prev.messages?.length !== mergedMessages.length) || 
                         JSON.stringify(prev.messages) !== JSON.stringify(mergedMessages);
      const subChanged = (prev.submissions?.length !== newData.submissions?.length) ||
                         JSON.stringify(prev.submissions) !== JSON.stringify(newData.submissions);
      const statusChanged = prev.status !== newData.status;
      const typingChanged = prev.typingUserId !== newData.typingUserId;
      
      if (msgChanged || subChanged || statusChanged || typingChanged) {
        return {
          ...newData,
          messages: mergedMessages
        };
      }
      return prev;
    });
  };

  const fetchGigDetails = async (gigId) => {
    setLoadingDetails(true);
    try {
      const res = await apiFetch(`/gigs/${gigId}`, { token });
      if (res.ok) {
        const data = await res.json();
        updateGigDetailsState(data);
      }
    } catch (err) {
      console.error(err);
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
      const owned = myGigs.filter(g => g.ownerId === user.id);
      const hired = myGigs.filter(g => g.selectedCandidateId === user.id);
      const allMy = [...owned, ...hired];
      if (allMy.length > 0) {
        const stillExists = allMy.some(g => g.id === selectedGigId);
        if (!selectedGigId || !stillExists) {
          setSelectedGigId(allMy[0].id);
          fetchGigDetails(allMy[0].id);
        }
      } else {
        setSelectedGigId(null);
        setGigDetails(null);
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
    setEditSkills(gig.skills.join(', '));
    setEditBudget(String(gig.budget));
    setEditDeliveryTime(gig.deliveryTime);
    setEditAttachmentFile(null);
    setShowEditModal(true);
  };

  const handleUpdateGigSubmit = async (e) => {
    e.preventDefault();
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
        skills: editSkills.split(',').map(s => s.trim()).filter(Boolean),
        budget: parseFloat(editBudget),
        deliveryTime: editDeliveryTime,
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
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        budget: parseFloat(budget),
        deliveryTime,
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
        setSkills('');
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
    setApplying(true);
    try {
      const res = await apiFetch(`/gigs/${targetApplyGig.id}/apply`, {
        token,
        method: 'POST',
        json: { message: applyMessage }
      });
      if (res.ok) {
        setAlertConfig({ message: 'Application submitted successfully!', type: 'success' });
        setShowApplyModal(false);
        setApplyMessage('');
        fetchGigs();
      } else {
        const d = await res.json();
        setAlertConfig({ message: d.error || 'Failed to apply', type: 'error' });
      }
    } catch (err) {
      console.error(err);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() && !chatAttachment) return;
    
    const textToSend = chatText;
    const attachmentToSend = chatAttachment;
    
    // Construct optimistic temp message
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      senderId: user.id,
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
          fileUrl: uploadedUrl
        }
      });
      if (res.ok) {
        // Replace temp message with actual data from backend
        fetchGigDetails(gigDetails.id);
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
            contentType: submitFile.type
          }
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await putFileToS3(uploadUrl, submitFile, submitFile.type, token);
          uploadedUrl = publicUrl;
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
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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

  const isOwner = gigDetails?.ownerId === user.id;

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
          className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider font-bold transition-all uppercase ${
            activeSubTab === 'browse'
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
            className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider font-bold transition-all uppercase ${
              activeSubTab === 'post'
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
            setSelectedGigId(null);
            setGigDetails(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider font-bold transition-all uppercase flex items-center gap-1.5 ${
            activeSubTab === 'my-gigs'
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
            {/* Search filter row - Indeed Combined Style */}
            <div className="bg-surface-container border border-outline-variant p-2 rounded-2xl shadow-[var(--shadow-card)] flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-4" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Job title, keywords, or description..."
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
                />
              </div>
              <div className="hidden md:block w-[1px] bg-outline-variant my-2" />
              <div className="flex-1 relative flex items-center">
                <Sparkles className="w-4 h-4 text-on-surface-variant absolute left-4" />
                <input
                  type="text"
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(e.target.value)}
                  placeholder="Skills (e.g. React, CSS, Node)"
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
                />
              </div>
              <button
                onClick={fetchGigs}
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-mono text-xs font-bold uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Find Gigs
              </button>
            </div>

            {/* Split Screen Feed & Detail Panel */}
            {loading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-20 bg-surface-container border border-outline-variant rounded-2xl shadow-[var(--shadow-card)]">
                <AlertTriangle className="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
                <h3 className="font-headline font-bold text-on-surface">No active gigs found</h3>
                <p className="text-xs text-on-surface-variant mt-1">Try resetting your queries or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Pane: Gigs List */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[680px]">
                  {gigs.map(gig => {
                    const isSelected = gig.id === selectedGigId;
                    return (
                      <div
                        key={gig.id}
                        onClick={() => {
                          setSelectedGigId(gig.id);
                          fetchGigDetails(gig.id);
                        }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[150px] relative ${
                          isSelected
                            ? 'bg-surface-container-high border-primary shadow-md border-l-4 border-l-primary'
                            : 'bg-surface-container border-outline-variant hover:border-on-surface-variant/40 shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="space-y-2">
                          {gig.company && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/30">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenCompanyProfile) onOpenCompanyProfile(gig.company.id);
                                }}
                                className="w-6 h-6 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0 overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                {gig.company.logoUrl ? (
                                  <img src={gig.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-primary font-bold">{gig.company.name.charAt(0)}</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenCompanyProfile) onOpenCompanyProfile(gig.company.id);
                                }}
                                className="text-[10px] font-bold text-on-surface-variant hover:text-primary hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {gig.company.name}
                                {gig.company.verified && (
                                  <span className="text-[8px] bg-success-container text-success px-1.5 py-0 rounded font-bold uppercase tracking-wider scale-90 font-mono">
                                    ✓
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xs font-headline font-bold text-on-surface line-clamp-1">{gig.title}</h3>
                            <div className="flex items-center gap-1 bg-success-container/30 px-2 py-0.5 rounded border border-success/20 text-success text-[10px] font-mono font-extrabold shrink-0">
                              <DollarSign className="w-3 h-3" />
                              <span>{gig.budget}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">{gig.description}</p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {gig.skills?.slice(0, 3).map(skill => (
                              <Badge key={skill} label={skill} theme={theme} />
                            ))}
                            {gig.skills?.length > 3 && (
                              <span className="text-[9px] font-mono text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-high/60">
                                +{gig.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-[9px] font-mono text-on-surface-variant uppercase">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {gig.deliveryTime}
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary font-extrabold rounded-md tracking-wider">
                            {gig.ownerRole || 'Client'}
                          </span>
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
                            <h2 className="text-base font-headline font-bold text-on-surface">{gigDetails.title}</h2>
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
                                      <span className="text-[8px] bg-success-container text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
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
                                <span className="px-1.5 py-0.5 bg-surface-container-high text-[9px] font-mono uppercase rounded text-on-surface-variant">
                                  {gigDetails.ownerRole}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-emerald-500 font-mono">${gigDetails.budget}</div>
                            <span className="text-[10px] font-mono text-on-surface-variant uppercase">Budget Rate</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                            <Clock className="w-4 h-4" />
                            <span>Expected Delivery: <strong className="text-on-surface">{gigDetails.deliveryTime}</strong></span>
                          </div>

                          {/* Application CTA */}
                          {user.role === 'STUDENT' && gigDetails.ownerId !== user.id && (
                            (() => {
                              const hasApplied = gigDetails.applicants?.some(a => a.candidateId === user.id);
                              return (
                                <button
                                  onClick={() => {
                                    setTargetApplyGig(gigDetails);
                                    setShowApplyModal(true);
                                  }}
                                  disabled={hasApplied}
                                  className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all shadow-md flex items-center gap-1.5 ${
                                    hasApplied
                                      ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant cursor-not-allowed shadow-none'
                                      : 'bg-primary text-white hover:opacity-90 active:scale-95'
                                  }`}
                                >
                                  {hasApplied ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Send className="w-3.5 h-3.5" />}
                                  {hasApplied ? 'Applied' : 'Pitch & Apply'}
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>

                      {/* Detail Description */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-primary">Task Description</h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{gigDetails.description}</p>
                      </div>

                      {/* Required Skills */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-primary">Required Skill Set</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {gigDetails.skills?.map(skill => (
                            <Badge key={skill} label={skill} theme={theme} />
                          ))}
                        </div>
                      </div>

                      {/* Attachments */}
                      {gigDetails.attachments?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-mono uppercase tracking-wider text-primary">Brief Attachments</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {gigDetails.attachments.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl border border-outline-variant bg-surface-container-low hover:border-primary transition-all flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary truncate"
                              >
                                <Paperclip className="w-4 h-4 shrink-0 text-primary" />
                                <span className="font-bold truncate">Attachment #{idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                      <AlertTriangle className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-xs font-mono">No gig selected or loaded</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'post' && (
          <Card className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="border-b border-outline-variant pb-3">
              <h3 className="text-sm font-headline font-bold text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-primary" /> Post a paid Task / Gig
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Hire other verified candidates to help complete milestones.</p>
            </div>

            <form onSubmit={handlePostGig} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Gig Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build Neumorphic Sidebar Layout in React"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description details</label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed project requirements, expectations, and instructions..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Budget rate ($ USD)</label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 150"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Expected Delivery Time</label>
                  <Input
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g. 3 Days"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Required Skills (comma separated)</label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, CSS, Zod"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Brief Attachments (Optional)</label>
                <label className="cursor-pointer text-xs font-mono text-on-surface-variant hover:text-on-surface border border-outline-variant bg-surface-container-low p-3 rounded-xl flex items-center gap-2 shadow-sm w-full">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px] items-stretch">
            {/* Left Pane: Workspace Gigs Feed */}
            <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar max-h-[680px]">
              {/* Student Hired Projects */}
              {user?.role === 'STUDENT' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">Hired Projects</h4>
                  {myGigs.filter(g => g.selectedCandidateId === user.id).length === 0 ? (
                    <div className="text-center py-10 bg-surface-container border border-outline-variant rounded-2xl shadow-sm">
                      <p className="text-xs font-mono text-on-surface-variant">No hired gigs found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myGigs.filter(g => g.selectedCandidateId === user.id).map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => {
                              setSelectedGigId(gig.id);
                              fetchGigDetails(gig.id);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                              isSelected
                                ? 'bg-surface-container-high border-primary shadow border-l-4 border-l-primary'
                                : 'bg-surface-container border-outline-variant hover:border-on-surface-variant/30 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-on-surface line-clamp-1">{gig.title}</h4>
                              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-md font-extrabold ${
                                gig.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                              }`}>{gig.status}</span>
                            </div>
                            <p className="text-[10px] font-mono text-on-surface-variant">Budget: <strong className="text-emerald-500">${gig.budget}</strong></p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recruiter Created Gigs */}
              {user?.role === 'RECRUITER' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">My Postings</h4>
                  {myGigs.filter(g => g.ownerId === user.id).length === 0 ? (
                    <div className="text-center py-10 bg-surface-container border border-outline-variant rounded-2xl shadow-sm">
                      <p className="text-xs font-mono text-on-surface-variant">No gigs posted yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myGigs.filter(g => g.ownerId === user.id).map(gig => {
                        const isSelected = gig.id === selectedGigId;
                        return (
                          <div
                            key={gig.id}
                            onClick={() => {
                              setSelectedGigId(gig.id);
                              fetchGigDetails(gig.id);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                              isSelected
                                ? 'bg-surface-container-high border-primary shadow border-l-4 border-l-primary'
                                : 'bg-surface-container border-outline-variant hover:border-on-surface-variant/30 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-on-surface line-clamp-1">{gig.title}</h4>
                              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-md font-extrabold ${
                                gig.status === 'COMPLETED' ? 'bg-success/15 text-success' : gig.status === 'IN_PROGRESS' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'
                              }`}>{gig.status}</span>
                            </div>
                            <p className="text-[10px] font-mono text-on-surface-variant">Budget: <strong className="text-emerald-500">${gig.budget}</strong></p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Pane: Work Room */}
            <div className="lg:col-span-8 flex flex-col bg-surface-container border border-outline-variant rounded-2xl shadow-md h-full max-h-[680px] overflow-hidden">
              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : gigDetails ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Work Room Title Bar */}
                  <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center shrink-0">
                    <div>
                      <h2 className="text-xs font-headline font-bold text-on-surface">{gigDetails.title}</h2>
                      <p className="text-[9px] font-mono text-on-surface-variant uppercase mt-0.5">
                        Budget: <span className="text-emerald-500 font-bold">${gigDetails.budget}</span> | Status: <span className="font-bold text-primary">{gigDetails.status}</span>
                      </p>
                    </div>
                    {gigDetails.ownerId === user.id && (gigDetails.status === 'OPEN' || gigDetails.status === 'PAUSED') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(gigDetails)}
                          className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border border-outline-variant bg-surface-container hover:text-primary transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePause(gigDetails)}
                          className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border border-outline-variant bg-surface-container hover:text-warning transition-all cursor-pointer"
                        >
                          {gigDetails.status === 'PAUSED' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => handleDeleteGig(gigDetails.id)}
                          className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border border-error/30 bg-surface-container text-error hover:bg-error hover:text-white transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inner Work Room Grid */}
                  <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 h-full">
                    {/* Main workspace (Applicants or Chat) */}
                    <div className="md:col-span-3 flex flex-col border-r border-outline-variant h-full overflow-hidden">
                      {gigDetails.status === 'OPEN' ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          <div className="border-b border-outline-variant pb-2">
                            <h3 className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Applicants Feed</h3>
                          </div>
                          {gigDetails.applicants?.length === 0 ? (
                            <div className="text-center py-10 bg-surface-container-low/50 rounded-xl border border-outline-variant border-dashed">
                              <p className="text-xs font-mono text-on-surface-variant">No candidates have pitched yet</p>
                            </div>
                          ) : (
                            gigDetails.applicants?.map(app => (
                              <div key={app.id} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-3 shadow-sm">
                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container font-mono font-bold flex items-center justify-center text-xs">
                                      {app.candidate?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                      <h4 className="text-[11px] font-bold text-on-surface">{app.candidate?.name}</h4>
                                      <p className="text-[9px] font-mono text-on-surface-variant">@{app.candidate?.username || 'candidate'}</p>
                                    </div>
                                  </div>
                                  {isOwner && (
                                    <button
                                      onClick={() => handleSelectCandidate(app.candidateId)}
                                      className="px-3 py-1 bg-primary text-white text-[9px] font-mono font-bold uppercase rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95"
                                    >
                                      Hire
                                    </button>
                                  )}
                                </div>
                                <div className="p-2.5 bg-surface-container-high/40 rounded-lg text-xs text-on-surface-variant leading-relaxed border border-outline-variant/20">
                                  {app.message}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                          {/* Chat Feed */}
                          <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-surface-container-high/10">
                            {gigDetails.messages?.map(msg => {
                              const isMe = msg.senderId === user.id;
                              const isSystem = msg.text?.startsWith('[SYSTEM:');
                              return (
                                <div key={msg.id} className={`flex flex-col ${isSystem ? 'items-center w-full' : isMe ? 'items-end' : 'items-start'}`}>
                                  {isSystem ? (
                                    <div className="bg-primary/5 border border-primary/20 text-on-surface-variant text-[9px] font-mono px-2.5 py-1 rounded-lg text-center max-w-md shadow-sm">
                                      {msg.text}
                                    </div>
                                  ) : (
                                    <div className="max-w-[80%] space-y-1">
                                      <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                                        isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low border border-outline-variant rounded-tl-none text-on-surface'
                                      }`}>
                                        {msg.text}
                                        {msg.fileUrl && (
                                          <div className={`mt-2 p-1.5 rounded-lg text-[9px] font-mono flex items-center gap-1.5 ${isMe ? 'bg-black/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                            <Paperclip className="w-3 h-3" />
                                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline font-bold truncate max-w-[120px]">Attachment File</a>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-[8px] font-mono text-on-surface-variant px-1 text-right flex items-center justify-end gap-1">
                                        {msg.sending ? (
                                          <>
                                            <Clock className="w-2.5 h-2.5 animate-spin" />
                                            <span>Sending...</span>
                                          </>
                                        ) : (
                                          new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Typing Indicator */}
                            {gigDetails.typingUserId && gigDetails.typingUserId !== user.id && (
                              <div className="flex flex-col items-start animate-fade-in">
                                <div className="max-w-[80%] space-y-1">
                                  <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Chat Input form */}
                          {gigDetails.status === 'IN_PROGRESS' && (
                            <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant bg-surface-container-low space-y-2 shrink-0">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={chatText}
                                  onChange={(e) => setChatText(e.target.value)}
                                  placeholder="Type message..."
                                  className="flex-1 bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                                />
                                <button type="submit" disabled={sendingMessage} className="p-2 bg-primary text-white rounded-xl shadow-md">
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="cursor-pointer text-[9px] font-mono text-on-surface-variant hover:text-on-surface border border-outline-variant rounded px-2 py-1 bg-surface-container flex items-center gap-1 shadow-sm">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{chatAttachment ? chatAttachment.name : 'Attach File'}</span>
                                  <input type="file" onChange={(e) => setChatAttachment(e.target.files[0])} className="hidden" />
                                </label>
                                {chatAttachment && (
                                  <button type="button" onClick={() => setChatAttachment(null)} className="text-[9px] text-error">Remove</button>
                                )}
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Pane Sidebar: Description & Actions */}
                    <div className="md:col-span-2 p-4 overflow-y-auto space-y-4 custom-scrollbar h-full bg-surface-container-low/30">
                      {/* Specs Summary Card */}
                      <div className="p-3.5 bg-surface-container border border-outline-variant rounded-xl space-y-2 shadow-sm">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Project Deliverables</h4>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{gigDetails.description}</p>
                      </div>

                      {/* Work Submission Panel */}
                      {gigDetails.status === 'IN_PROGRESS' && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 shadow-sm">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Submission Workspace</h4>
                          {!isOwner ? (
                            <form onSubmit={handleSubmitWork} className="space-y-2">
                              <TextArea
                                value={submitText}
                                onChange={(e) => setSubmitText(e.target.value)}
                                placeholder="Summary of deliverables..."
                                rows={2}
                                required
                              />
                              <label className="cursor-pointer text-[9px] font-mono text-on-surface-variant hover:text-on-surface border border-outline-variant bg-surface-container p-2 rounded-lg flex items-center justify-between shadow-sm w-full">
                                <span className="truncate">{submitFile ? submitFile.name : 'Upload Work'}</span>
                                <input type="file" onChange={(e) => setSubmitFile(e.target.files[0])} className="hidden" />
                              </label>
                              <Button type="submit" disabled={submittingWork} className="w-full text-[10px]">
                                {submittingWork ? 'Uploading...' : 'Submit Work'}
                              </Button>
                            </form>
                          ) : (
                            <div className="space-y-3">
                              {gigDetails.submissions?.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs space-y-1.5 shadow-inner">
                                    <p className="font-mono text-[8px] uppercase text-primary font-bold">Deliverable Pitch:</p>
                                    <p className="text-on-surface text-[11px]">{gigDetails.submissions[0].text}</p>
                                    {gigDetails.submissions[0].fileUrl && (
                                      <a href={gigDetails.submissions[0].fileUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1 text-[10px] font-mono mt-1">
                                        <Paperclip className="w-3.5 h-3.5" /> View Deliverables
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleReviewAction('ACCEPT')} className="flex-1 py-2 bg-success text-white text-[10px] font-mono font-bold uppercase rounded-lg hover:opacity-95 transition-opacity">Accept</button>
                                    <button onClick={() => handleReviewAction('REVISION')} className="flex-1 py-2 bg-error text-white text-[10px] font-mono font-bold uppercase rounded-lg hover:opacity-95 transition-opacity">Revision</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-on-surface-variant text-center py-3">Waiting for deliverables...</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Client-Freelaner Feedback Dialog */}
                      {gigDetails.status === 'COMPLETED' && (
                        <div className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-3 shadow-sm">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-success font-bold">Feedback Room</h4>
                          {(() => {
                            const myReview = gigDetails.reviews?.find(r => r.reviewerId === user.id);
                            if (myReview) {
                              return (
                                <div className="text-xs space-y-1.5">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={`w-3 h-3 ${star <= myReview.rating ? 'text-warning fill-warning' : 'text-outline-variant'}`} />
                                    ))}
                                  </div>
                                  <p className="text-on-surface italic text-[11px]">"{myReview.review}"</p>
                                </div>
                              );
                            }
                            return (
                              <form onSubmit={handleSubmitReview} className="space-y-3">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition-transform">
                                      <Star className={`w-5 h-5 ${star <= rating ? 'text-warning fill-warning' : 'text-outline-variant'}`} />
                                    </button>
                                  ))}
                                </div>
                                <TextArea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write feedback review..." rows={2} required />
                                <Button type="submit" disabled={submittingReview} className="w-full text-[10px]">Submit Feedback</Button>
                              </form>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                  <AlertTriangle className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-xs font-mono">No active workspace gig selected</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatedContent>

      {/* Pitch / Application modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <h3 className="text-sm font-headline font-bold text-on-surface">Apply to: {targetApplyGig?.title}</h3>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase text-on-surface-variant">Pitch Message / Cover Letter</label>
              <TextArea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this task and highlight your relevant skills..."
                rows={4}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToGig}
                disabled={applying}
                className="px-4 py-2 bg-primary text-white text-xs font-mono font-bold uppercase rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
              >
                {applying ? 'Submitting...' : 'Send Pitch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gig Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateGigSubmit} className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <h3 className="text-sm font-headline font-bold text-on-surface">Edit Gig Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Title *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Description *</label>
                <TextArea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Required Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                  placeholder="e.g. Logo Design, Photoshop, Branding"
                  value={editSkills}
                  onChange={e => setEditSkills(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Budget ($ USD) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                    value={editBudget}
                    onChange={e => setEditBudget(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Delivery Time *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                    value={editDeliveryTime}
                    onChange={e => setEditDeliveryTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">Update Spec Attachment (Optional)</label>
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
                className="px-4 py-2 rounded-xl text-xs font-mono bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingGig}
                className="px-4 py-2 bg-primary text-white text-xs font-mono font-bold uppercase rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {updatingGig ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top-Right Sliding Toast Notification */}
      {alertConfig && (
        formatAlertMessage(alertConfig.message, alertConfig.type, () => setAlertConfig(null))
      )}
    </div>
  );
}
