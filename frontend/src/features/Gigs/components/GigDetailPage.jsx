import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Building,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  Paperclip,
  Send,
  AlertTriangle,
  RefreshCw,
  Edit3,
  ExternalLink,
  Briefcase,
  Award,
  Plus,
  ArrowRight,
  X,
  Lock
} from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import { getCurrencySymbol } from '../gigConstants';

export default function GigDetailPage({
  gig,
  loading = false,
  user,
  profile,
  token,
  onBack,
  onApply,
  onOpenCompanyProfile,
  onNavigateToTests,
  onStartSkillTest,
  onAddSkillAndUpgrade,
  onUpdateProfile,
  onEditGig,
  onManageInWorkspace
}) {
  const [testPromptModal, setTestPromptModal] = useState(null);

  const openTestModal = (modalData) => {
    setTestPromptModal(modalData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const el = document.getElementById('skill-test-prompt-modal');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  useEffect(() => {
    if (testPromptModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('skill-test-prompt-modal');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [testPromptModal]);

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-outline-variant rounded-none p-12">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-headline font-medium tracking-wider text-on-surface-variant">
          Loading Gig Details...
        </p>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-outline-variant rounded-none p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-on-surface-variant/40" />
        <h3 className="text-base font-headline font-medium text-on-surface">Gig Not Found</h3>
        <p className="text-xs text-on-surface-variant max-w-sm">
          The gig you are looking for does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-primary text-white text-xs font-headline font-medium rounded-none hover:opacity-90 transition-all cursor-pointer"
        >
          Return to Browse Gigs
        </button>
      </div>
    );
  }

  const catList = (gig.categories && gig.categories.length > 0)
    ? gig.categories
    : (gig.category ? [gig.category] : ['General']);

  const candidateIds = [user?.id, user?.userId, user?._id, profile?.id, profile?.userId].filter(Boolean).map(id => id.toString());
  const isCandidate = user?.role === 'STUDENT';
  const isOwner = gig.ownerId === user?.id || (user?.id && gig.ownerId?.toString() === user.id.toString());
  const hasApplied = isCandidate && (
    gig.hasApplied ||
    (gig.applicants || []).some(a => candidateIds.includes(a.candidateId?.toString()))
  );

  // Calculate missing skill thresholds for candidates
  const userSkills = profile?.skills || [];
  const gigReqs = (gig.requirements && gig.requirements.length > 0)
    ? gig.requirements
    : (gig.skills || []).map(s => ({ skillName: s, minRating: gig.minRating || 1 }));

  const evaluatedRequirements = gigReqs.map(req => {
    const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === req.skillName.toLowerCase());
    const isTech = skillObj ? skillObj.type === 'technical' : true;
    const userSkillObj = userSkills.find(s => s.name?.toLowerCase() === req.skillName.toLowerCase());
    const userRating = userSkillObj
      ? ((userSkillObj.verifiedRating && userSkillObj.verifiedRating > 0) ? userSkillObj.verifiedRating : (userSkillObj.rating || 0))
      : 0;
    const reqMinRating = req.minRating || 1;
    const hasSkill = Boolean(userSkillObj);
    const isSatisfied = hasSkill && userRating >= reqMinRating;

    return {
      skillName: req.skillName,
      minRating: reqMinRating,
      isTech,
      userRating,
      hasSkill,
      isSatisfied
    };
  });

  const missingSkillReqs = evaluatedRequirements.filter(r => !r.isSatisfied);
  const isRatingMatched = missingSkillReqs.length === 0;

  const handleOpenFirstTest = () => {
    if (missingSkillReqs.length > 0) {
      const first = missingSkillReqs[0];
      openTestModal({
        skillName: first.skillName,
        minRating: first.minRating,
        userRating: first.userRating,
        hasSkill: first.hasSkill,
        isSubmitting: false
      });
    } else {
      onNavigateToTests?.();
    }
  };

  const handleConfirmTestRedirect = async () => {
    if (!testPromptModal) return;
    if (testPromptModal.hasSkill) {
      onStartSkillTest?.(testPromptModal.skillName);
      setTestPromptModal(null);
    } else {
      setTestPromptModal(prev => ({ ...prev, isSubmitting: true }));
      try {
        if (onAddSkillAndUpgrade) {
          await onAddSkillAndUpgrade({
            skillName: testPromptModal.skillName,
            targetRating: testPromptModal.minRating,
            gigId: gig.id
          });
        } else {
          onStartSkillTest?.(testPromptModal.skillName);
        }
      } finally {
        setTestPromptModal(null);
      }
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Navigation Bar - Sticky Pinned */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-xs py-2.5 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between gap-4 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 transition-all cursor-pointer shadow-2xs shrink-0 ml-2"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Back to Browse Gigs</span>
        </button>

        {/* Quick Action in Top Nav */}
        <div className="flex items-center gap-2 shrink-0">
          {isCandidate && !isOwner && gig.status === 'OPEN' && !hasApplied && isRatingMatched && (
            <button
              type="button"
              onClick={() => {
                onApply(gig);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-1.5 bg-primary hover:brightness-110 text-on-primary rounded-none font-headline font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs mr-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Pitch & Apply</span>
            </button>
          )}

          {isCandidate && !isOwner && gig.status === 'OPEN' && !hasApplied && !isRatingMatched && (
            <button
              type="button"
              onClick={handleOpenFirstTest}
              className="px-3.5 py-1.5 bg-primary hover:brightness-110 text-on-primary rounded-none font-headline font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs mr-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Take Test</span>
            </button>
          )}

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditGig?.(gig)}
                className="px-3 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-headline font-bold text-slate-900 dark:text-slate-100 rounded-none flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Edit3 className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onManageInWorkspace?.(gig.id)}
                className="px-3 py-1.5 bg-primary hover:brightness-110 text-on-primary text-xs font-headline font-bold rounded-none flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
              >
                <Briefcase className="w-3 h-3" />
                <span>Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Gig Details Chassis */}
      <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 space-y-2.5 shadow-2xs">
        {/* Header Block with Hero Compensation & Action Box */}
        <div className="pb-2.5 border-slate-300 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Logo Frame */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden shadow-2xs">
                {(gig.logo || gig.company?.logo || gig.company?.logoUrl) ? (
                  <img
                    src={gig.logo || gig.company?.logo || gig.company?.logoUrl}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.detail-fallback-initial');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`detail-fallback-initial w-full h-full p-2 items-center justify-center flex flex-col text-slate-800 dark:text-slate-200 ${(gig.logo || gig.company?.logo || gig.company?.logoUrl) ? 'hidden' : 'flex'}`}
                >
                  <div className="w-9 h-9 rounded-none bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-headline font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {((gig.company ? gig.company.name : gig.ownerName) || gig.title || 'G').replace(/^c_/i, '').charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                {/* 1. Gig Title on Top */}
                <h1 className="text-xl sm:text-2xl font-headline font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {gig.title}
                </h1>

                {/* 2. All Tags Below the Title */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className={`px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none ${gig.status === 'OPEN'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700'
                      : gig.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}>
                    {gig.status || 'OPEN'}
                  </span>

                  {catList.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-headline font-semibold tracking-wider px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Right Hero Card: Wider & Compact Compensation, Timeline & Direct Actions */}
            <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3 flex flex-col justify-center gap-2 shrink-0 w-full lg:w-[400px] xl:w-[460px] shadow-2xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Pay:
                  </span>
                  <span className="text-base sm:text-lg font-headline font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 px-2.5 py-0.5 rounded-none shadow-2xs">
                    {getCurrencySymbol(gig.currency)}{gig.budget}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans">
                  <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span className="text-[20px] font-medium text-slate-600 dark:text-slate-400">Delivery Timeline:</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-bold text-xl">{gig.deliveryTime} {/^\d+$/.test(gig.deliveryTime?.toString().trim()) ? 'days' : ''}</strong>
                </div>
              </div>

              {/* Action Buttons Integrated Right Here */}
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                {/* Candidate Actions */}
                {isCandidate && !isOwner && (
                  (() => {
                    if (gig.status === 'CLOSED') {
                      return (
                        <div className="w-full py-2 px-2.5 bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700 rounded-none font-headline text-xs font-bold tracking-wider text-center">
                          Closed for Applications
                        </div>
                      );
                    }

                    if (gig.status === 'PAUSED') {
                      return (
                        <div className="w-full py-2 px-2.5 bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 rounded-none font-headline text-xs font-bold tracking-wider text-center">
                          Currently Paused
                        </div>
                      );
                    }

                    if (hasApplied) {
                      return (
                        <div className="w-full py-2 px-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 rounded-none font-headline text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">Pitch Submitted &bull; Awaiting Client</span>
                        </div>
                      );
                    }

                    if (!isRatingMatched) {
                      return (
                        <button
                          type="button"
                          onClick={handleOpenFirstTest}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-none font-headline text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Take Skill Test to Unlock
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          onApply(gig);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-2 px-3 bg-primary hover:brightness-110 text-on-primary rounded-none font-headline text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Pitch & Apply for Gig
                      </button>
                    );
                  })()
                )}

                {/* Recruiter / Owner Actions */}
                {isOwner && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => onEditGig?.(gig)}
                      className="px-2.5 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      Edit Gig
                    </button>
                    <button
                      type="button"
                      onClick={() => onManageInWorkspace?.(gig.id)}
                      className="px-2.5 py-1.5 bg-primary hover:brightness-110 text-on-primary rounded-none text-xs font-headline font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Manage
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Locked Ratings Alert for Candidate */}
        {isCandidate && !isOwner && !hasApplied && !isRatingMatched && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 rounded-none space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-headline font-bold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <span>Proficiency Thresholds Required</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              This client requires test-verified proficiency ratings on the following skills before accepting pitches:
            </p>
            <ul className="space-y-1 text-xs">
              {missingSkillReqs.map(m => (
                <li key={m.skillName} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-none border border-slate-300 dark:border-slate-700 font-sans text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{m.skillName}</span>
                  <span className="text-amber-900 dark:text-amber-200 font-bold font-headline">
                    {m.hasSkill ? `Your Rating: Lvl ${m.userRating}/10` : 'Not on Profile'} &bull; Required: Lvl {m.minRating}/10
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenFirstTest}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-xs font-headline font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Take Skill Test to Unlock
              </button>
            </div>
          </div>
        )}

        {/* Task Description Section */}
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 pb-1">
            Task Description & Deliverables
          </h3>
          <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
            {gig.description}
          </div>
        </div>

        {/* Required Skills & Thresholds */}
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 pb-1">
            Required Technical Stack & Proficiency Thresholds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {evaluatedRequirements.map(r => {
              return (
                <div
                  key={r.skillName}
                  className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none flex flex-col justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-sans truncate">{r.skillName}</span>
                    {r.isTech ? (
                      <span className="text-[10px] font-headline font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-950/70 px-2 py-0.5 rounded-none border border-blue-400 dark:border-blue-600 shrink-0">
                        Lvl {r.minRating}/10 Req
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-none border border-slate-300 dark:border-slate-700 shrink-0">
                        Required
                      </span>
                    )}
                  </div>

                  {isCandidate && (
                    <>
                      <div className="flex items-center justify-between text-[11px] font-sans text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>
                          Proficiency:{' '}
                          <strong className="text-slate-900 dark:text-slate-100">
                            {r.hasSkill ? `Lvl ${r.userRating}/10` : 'Not on profile'}
                          </strong>
                        </span>

                        {r.isSatisfied ? (
                          <span className="text-emerald-800 dark:text-emerald-300 font-headline font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Met
                          </span>
                        ) : (
                          <span className="text-amber-800 dark:text-amber-300 font-headline font-bold text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Test Needed
                          </span>
                        )}
                      </div>

                      {!r.isSatisfied && (
                        <button
                          type="button"
                          onClick={() => {
                            openTestModal({
                              skillName: r.skillName,
                              minRating: r.minRating,
                              userRating: r.userRating,
                              hasSkill: r.hasSkill,
                              isSubmitting: false
                            });
                          }}
                          className="w-full mt-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-headline font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{r.hasSkill ? `Take ${r.skillName} Test to Unlock` : `Add ${r.skillName} & Take Test`}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Brief Attachments - Stretched Horizontally Across Container */}
        {gig.attachments?.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 pb-1.5">
              Brief Attachments & Reference Files
            </h3>
            <div className="flex flex-col gap-2 w-full">
              {gig.attachments.map((link, idx) => {
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(link) || link.includes('/avatar/') || link.includes('image');
                const fileName = (link.split('/').pop() || `Attachment #${idx + 1}`).split('?')[0];
                return (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="group w-full p-3 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isImage ? (
                        <div className="w-10 h-10 rounded-none overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <img src={link} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="overflow-hidden min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          Attachment #{idx + 1}
                        </p>
                        <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 truncate block">
                          {fileName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-headline font-bold text-blue-700 dark:text-blue-400 group-hover:underline shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span>Open file</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA for Long Descriptions */}
        {isCandidate && !isOwner && gig.status === 'OPEN' && !hasApplied && isRatingMatched && (
          <div className="p-3.5 sm:p-4 bg-surface border border-slate-300 dark:border-slate-700 rounded-none flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 shadow-2xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">Ready to work on this gig?</h4>
              <p className="text-xs font-sans text-slate-600 dark:text-slate-400">Send your pitch and portfolio directly to {gig.company?.name ? gig.company.name.replace(/^c_/i, '') : gig.ownerName || 'the client'}.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onApply(gig);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2 bg-primary hover:brightness-110 text-on-primary rounded-none font-headline text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Pitch & Apply for Gig
            </button>
          </div>
        )}

        {/* Bottom CTA if Locked */}
        {isCandidate && !isOwner && gig.status === 'OPEN' && !hasApplied && !isRatingMatched && (
          <div className="p-3.5 sm:p-4 bg-surface border border-amber-400 dark:border-amber-700 rounded-none flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 shadow-2xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-sm font-headline font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                Application Locked
              </h4>
              <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                Complete the required skill tests above to unlock your application for this gig.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenFirstTest}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-none font-headline text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Take Skill Test to Unlock
            </button>
          </div>
        )}
      </div>

      {/* Skill Verification & Addition Gating Modal */}
      {testPromptModal && (
        <div id="skill-test-prompt-modal" className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container border-2 border-slate-400 dark:border-slate-600 rounded-none max-w-md w-full p-6 shadow-2xl space-y-5 text-left animate-scale-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border ${
                  testPromptModal.hasSkill
                    ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                }`}>
                  {testPromptModal.hasSkill ? (
                    <Award className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900 dark:text-slate-100">
                    {testPromptModal.hasSkill
                      ? `Take ${testPromptModal.skillName} Test`
                      : `Add ${testPromptModal.skillName} & Take Test`}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                    {testPromptModal.hasSkill
                      ? 'Verification test required to unlock gig pitch'
                      : 'Skill addition and test verification required'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestPromptModal(null)}
                disabled={testPromptModal.isSubmitting}
                className="p-1 hover:bg-surface-container-high text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs font-sans text-slate-700 dark:text-slate-300">
              {testPromptModal.hasSkill ? (
                <div className="space-y-3">
                  <p className="leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-100">{testPromptModal.skillName}</strong> is already added to your profile.
                  </p>
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200 space-y-1.5 rounded-none">
                    <div className="flex justify-between font-headline font-semibold text-[11px]">
                      <span>Your Current Rating:</span>
                      <strong className="text-slate-900 dark:text-slate-100">Level {testPromptModal.userRating}/10</strong>
                    </div>
                    <div className="flex justify-between font-headline font-semibold text-[11px]">
                      <span>Required Rating:</span>
                      <strong className="text-blue-800 dark:text-blue-300">Level {testPromptModal.minRating}/10</strong>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
                      To qualify for this gig, you must complete the verification assessment to meet the required threshold.
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Would you like to be redirected to the <strong>{testPromptModal.skillName}</strong> certification test now?
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-100">{testPromptModal.skillName}</strong> is not currently in your profile skills.
                  </p>
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 space-y-1.5 rounded-none">
                    <div className="flex justify-between font-headline font-semibold text-[11px]">
                      <span>Profile Status:</span>
                      <strong className="text-amber-800 dark:text-amber-300">Not on profile</strong>
                    </div>
                    <div className="flex justify-between font-headline font-semibold text-[11px]">
                      <span>Required Rating:</span>
                      <strong className="text-amber-800 dark:text-amber-300">Level {testPromptModal.minRating}/10</strong>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                      This skill will be added to your profile at baseline Level 1, and you will immediately be redirected to take the certification test to unlock your application.
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Would you like to add <strong>{testPromptModal.skillName}</strong> to your profile and start the test?
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTestPromptModal(null)}
                disabled={testPromptModal.isSubmitting}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-surface-container-high font-headline font-bold text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTestRedirect}
                disabled={testPromptModal.isSubmitting}
                className={`px-4 py-2 text-white font-headline font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                  testPromptModal.hasSkill
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {testPromptModal.isSubmitting ? (
                  <span>Adding & Redirecting...</span>
                ) : testPromptModal.hasSkill ? (
                  <>
                    <span>Proceed to Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Add Skill & Take Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
