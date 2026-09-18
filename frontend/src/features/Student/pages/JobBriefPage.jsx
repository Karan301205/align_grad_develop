import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  Award,
  Users,
  Clock,
  ClipboardList,
  Send,
  Lock,
  CheckCircle2,
  BookOpen,
  Download,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Plus,
  ArrowRight,
  X,
  Share2,
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ALL_SKILLS } from '../../../constants';

const BG_COLORS = [
  'bg-blue-800',
  'bg-slate-800',
  'bg-emerald-800',
  'bg-indigo-800',
  'bg-purple-800',
  'bg-cyan-800',
  'bg-amber-800',
  'bg-rose-800'
];

function getCompanyInitials(name) {
  if (!name) return 'AG';
  const cleanName = name.replace(/^c_/i, '').trim();
  if (!cleanName) return 'AG';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

function getCompanyColor(name) {
  if (!name) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[idx];
}

function formatStipendDisplay(job) {
  if (!job) return 'Stipend Unspecified';
  if (job.showSalary === false) {
    return job.opportunityType === 'INTERNSHIP' ? 'Stipend Undisclosed' : 'Salary Undisclosed';
  }

  const full = job.stipendFullTime || job.stipendFull;
  const part = job.stipendPartTime || job.stipendPart;
  const sal = job.salary;
  const st = job.stipend;

  const formatAmount = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';
    const clean = str.replace(/^₹\s*/, '');
    const num = parseInt(clean.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      return num.toLocaleString('en-IN');
    }
    return clean;
  };

  if (full && part) {
    const formattedPart = formatAmount(part);
    const formattedFull = formatAmount(full);
    if (formattedPart === formattedFull) {
      return `₹ ${formattedPart} /mo`;
    }
    return `₹ ${formattedPart} - ${formattedFull} /mo`;
  }

  const singleVal = full || part || sal || st;
  if (singleVal) {
    const formatted = formatAmount(singleVal);
    if (formatted.toLowerCase().includes('/mo') || formatted.toLowerCase().includes('month') || formatted.toLowerCase().includes('k/mo')) {
      return `₹ ${formatted}`;
    }
    return `₹ ${formatted} /mo`;
  }

  return 'Stipend Unspecified';
}

function formatLocationDisplay(job) {
  const loc = (job.location || job.workMode || '').trim();
  if (!loc) return 'Work from home / Remote';
  const lower = loc.toLowerCase();
  if (lower.includes('home') || lower.includes('remote') || lower === 'wfh') {
    return 'Work from home / Remote';
  }
  return loc;
}

export default function JobBriefPage({
  job,
  loading = false,
  profile,
  onBack,
  onApply,
  onUpgrade,
  onAddSkillAndUpgrade,
  onOpenCompanyProfile,
  isPublic = false
}) {
  const [applying, setApplying] = useState(false);
  const [testPromptModal, setTestPromptModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShareJob = async () => {
    try {
      const shareUrl = `${window.location.origin}/job_brief?id=${job?.id || ''}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleBack = () => {
    if (isPublic) {
      window.location.href = '/?auth_prompt=signup_required';
      return;
    }
    onBack?.();
  };

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
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-12 text-center text-left">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">
          Loading Opportunity Brief...
        </p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-12 text-center text-left">
        <AlertCircle className="w-12 h-12 text-blue-700 dark:text-blue-400" />
        <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
          Job Brief Not Found
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans max-w-md">
          The opportunity you are looking for may have expired or is currently unavailable.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none transition-colors cursor-pointer"
        >
          &larr; Back to Opportunities
        </button>
      </div>
    );
  }

  const rawCompanyName = job.companyName || job.company?.name || 'Company';
  const companyDisplayName = rawCompanyName.replace(/^c_/i, '').trim();
  const logoUrl = job.company?.logoUrl || job.logoUrl || job.companyLogo;
  const initials = getCompanyInitials(rawCompanyName);
  const colorClass = getCompanyColor(companyDisplayName);
  const isApplied = Boolean(job.applied);
  const locationText = formatLocationDisplay(job);
  const stipendText = formatStipendDisplay(job);

  // Skill evaluation logic against candidate profile
  const candidateSkills = profile?.skills || [];
  const evaluatedRequirements = (job.requirements || []).map(req => {
    const userSkill = candidateSkills.find(
      s => s.name.toLowerCase() === req.skillName.toLowerCase()
    );
    const userRating = userSkill
      ? (userSkill.verifiedRating || userSkill.rating || 0)
      : 0;
    const isSatisfied = userRating >= req.minRating;
    return {
      ...req,
      userRating,
      isSatisfied,
      hasSkill: Boolean(userSkill)
    };
  });

  const allRequirementsMet = evaluatedRequirements.every(r => r.isSatisfied);

  const handleApplyClick = async () => {
    if (isPublic) {
      window.location.href = '/?auth_prompt=signup_required';
      return;
    }
    if (isApplied || !allRequirementsMet) return;
    setApplying(true);
    try {
      await onApply?.(job.id);
    } finally {
      setApplying(false);
    }
  };

  const handleDownloadPDF = () => {
    if (isPublic) {
      window.location.href = '/?auth_prompt=signup_required';
      return;
    }
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(job.title || job.designation || 'Job Brief', 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Company: ${companyDisplayName}`, 20, 34);
    doc.text(`Place for Work: ${locationText}`, 20, 41);
    doc.text(`Compensation: ${stipendText}`, 20, 48);
    doc.text(`Desired Experience: ${job.desiredExperience || 'Fresher'}`, 20, 55);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 62, 190, 62);

    let y = 72;

    // Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Opportunity Summary", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(job.description || 'No description provided.', 170);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 10;

    // Role & Responsibilities
    if (job.roleResponsibilities) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Role & Responsibilities", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const respLines = doc.splitTextToSize(job.roleResponsibilities, 170);
      doc.text(respLines, 20, y);
      y += respLines.length * 5 + 10;
    }

    // Required Skills
    if (job.requirements && job.requirements.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Required Skill Thresholds", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      job.requirements.forEach(req => {
        doc.text(`• ${req.skillName}: Minimum Level ${req.minRating}/10`, 20, y);
        y += 6;
      });
      y += 4;
    }

    // Selection Rounds
    if (job.selectionProcess && job.selectionProcess.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Selection Process", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      job.selectionProcess.forEach(round => {
        doc.text(`Round ${round.roundNumber}: ${round.name} - ${round.description}`, 20, y);
        y += 6;
      });
    }

    doc.save(`${companyDisplayName.replace(/\s+/g, '_')}_${(job.title || 'Job').replace(/\s+/g, '_')}_Brief.pdf`);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16 text-left">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-700 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-headline font-bold text-blue-800 hover:text-blue-950 dark:text-blue-300 dark:hover:text-blue-100 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span> Back to Opportunities</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-700 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-headline font-bold rounded-none transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Download Brief PDF</span>
          </button>
        </div>
      </div>

      {/* Main Job Hero Card */}
      <div className="bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          {/* Logo & Core Details */}
          <div className="flex items-start gap-5 flex-1 min-w-0">
            {/* Square Logo Box */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-surface-container-low border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-center overflow-hidden shadow-xs">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyDisplayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.company-initials-box');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`company-initials-box w-full h-full ${colorClass} text-white flex items-center justify-center font-headline font-extrabold text-2xl sm:text-3xl tracking-wider select-none ${
                  logoUrl ? 'hidden' : 'flex'
                }`}
              >
                {initials}
              </div>
            </div>

            {/* Title, Company & Location */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {job.title}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-headline font-bold tracking-wider rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                  {job.opportunityType || 'Job'}
                </span>
                {job.designation && job.designation !== job.title && (
                  <span className="text-xs font-headline font-semibold text-slate-600 dark:text-slate-400">
                    ({job.designation})
                  </span>
                )}
              </div>

              {/* Company line with profile trigger */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenCompanyProfile?.(job.companyId || job.company?.id)}
                  className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>{companyDisplayName}</span>
                  {job.company?.verified && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 px-1.5 py-0.2 rounded-none font-headline font-bold tracking-wider">
                      ✓ Verified
                    </span>
                  )}
                </button>

                {job.officialWebsite && (
                  <>
                    <span className="text-slate-400">•</span>
                    <a
                      href={job.officialWebsite.startsWith('http') ? job.officialWebsite : `https://${job.officialWebsite}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-800 hover:text-blue-950 dark:text-blue-300 dark:hover:text-blue-100 font-semibold"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}

                <span className="text-slate-400">•</span>

                {/* Place for work (State name or WFH) */}
                <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>{locationText}</span>
                  {job.locationUrl && (
                    <a
                      href={job.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-800 hover:text-blue-950 dark:text-blue-300 ml-1"
                      title="View on Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stipend Box & Action */}
          <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 p-3 sm:px-4 sm:py-2.5 rounded-none text-left md:text-right shadow-xs">
              <span className="block text-[10px] font-headline font-bold tracking-wider text-emerald-900 dark:text-emerald-300">
                Compensation / Stipend
              </span>
              <span className="font-headline font-extrabold text-lg sm:text-xl text-emerald-950 dark:text-emerald-100">
                {stipendText}
              </span>
              {job.duration && (
                <span className="block text-[11px] font-sans font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Duration: {job.duration}
                </span>
              )}
            </div>

            {/* Application Status Pill / Share / Apply Now */}
            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShareJob}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-blue-700 font-headline font-bold text-xs rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Copy job share link"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span>Share</span>
                  </>
                )}
              </button>

              {isApplied ? (
                <div className="px-3.5 py-2.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-headline font-bold text-xs rounded-none flex items-center gap-1.5 tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Applied For This Role</span>
                </div>
              ) : (isPublic || allRequirementsMet) ? (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={applying}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold text-xs rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{applying ? 'Submitting Application...' : 'Apply Now'}</span>
                </button>
              ) : (
                <div className="px-3 py-2.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-headline font-bold text-xs rounded-none flex items-center gap-1.5 tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Test Verification Required</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Attributes Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Openings
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
              {job.openings ? `${job.openings} Positions` : '1 Position'}
            </span>
          </div>

          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Experience
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 truncate block">
              {job.desiredExperience || 'Fresher / Any'}
            </span>
          </div>

          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Education
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 truncate block">
              {job.preferredEducation || 'Graduate / Any'}
            </span>
          </div>

          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Duration
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
              {job.duration || 'Full-Time'}
            </span>
          </div>

          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Joining Month
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
              {job.joiningMonth || 'Immediate'}
            </span>
          </div>

          <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none">
            <span className="block text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
              Active Window
            </span>
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
              {job.activeDays ? `${job.activeDays} Days` : 'Open'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Detailed Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Summary, Responsibilities & Selection Rounds */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Summary / Description */}
          <div className="bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
              <ClipboardList className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                Opportunity Summary
              </h2>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-line">
              {job.description || 'No detailed opportunity summary provided by the recruiter.'}
            </p>
          </div>

          {/* Role & Responsibilities */}
          {job.roleResponsibilities && (
            <div className="bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                  Role & Responsibilities
                </h2>
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-line">
                {job.roleResponsibilities}
              </div>
            </div>
          )}

          {/* Selection Process / Rounds */}
          {job.selectionProcess && job.selectionProcess.length > 0 && (
            <div className="bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                <Award className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                  Selection Process & Rounds
                </h2>
              </div>

              <div className="space-y-3">
                {job.selectionProcess.map((round, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-surface border border-slate-300 dark:border-slate-700 rounded-none flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-none bg-blue-700 text-white font-headline font-extrabold text-sm flex items-center justify-center shrink-0">
                      {round.roundNumber || idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
                        {round.name || `Round ${idx + 1}`}
                      </h3>
                      <p className="text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                        {round.description || 'Details will be communicated prior to the round.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Skill Verification Thresholds & Gating */}
        <div className="space-y-6">
          <div className="bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h2 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                  Required Skills
                </h2>
              </div>
              <span className="text-[10px] font-headline font-bold tracking-wider text-slate-600 dark:text-slate-400">
                Rating Thresholds
              </span>
            </div>

            <p className="text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
              AlignGrade matches candidate verification ratings with recruiter requirements. You must meet or exceed the required rating for each skill to apply.
            </p>

            {/* List of Skills */}
            <div className="space-y-3">
              {evaluatedRequirements.length > 0 ? (
                evaluatedRequirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 border rounded-none text-left space-y-2 ${
                      req.isSatisfied
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                        : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
                        {req.skillName}
                      </span>
                      <span className="text-xs font-headline font-bold px-2 py-0.5 rounded-none bg-surface border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        Req: Lvl {req.minRating}/10
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-600 dark:text-slate-400">
                        Your Rating:{' '}
                        <strong className="text-slate-900 dark:text-slate-100">
                          {req.hasSkill ? `Level ${req.userRating}/10` : 'Not on profile'}
                        </strong>
                      </span>

                      {req.isSatisfied ? (
                        <span className="text-emerald-800 dark:text-emerald-300 font-headline font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Met
                        </span>
                      ) : (
                        <span className="text-amber-800 dark:text-amber-300 font-headline font-bold text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Test Needed
                        </span>
                      )}
                    </div>

                    {/* Action button if not satisfied */}
                    {!req.isSatisfied && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPublic) {
                            window.location.href = '/?auth_prompt=signup_required';
                            return;
                          }
                          openTestModal({
                            skillName: req.skillName,
                            minRating: req.minRating,
                            userRating: req.userRating,
                            hasSkill: req.hasSkill,
                            isSubmitting: false
                          });
                        }}
                        className="w-full mt-2 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-headline font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Take {req.skillName} Test to Unlock</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-surface border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-700 dark:text-slate-300 font-sans">
                  No specific technical ratings required for this opportunity.
                </div>
              )}
            </div>

            {/* Bottom Apply / Gated CTA */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              {isApplied ? (
                <div className="w-full py-3 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-headline font-bold text-xs rounded-none text-center tracking-wider flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Application Submitted</span>
                </div>
              ) : (isPublic || allRequirementsMet) ? (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={applying}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold text-sm rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{applying ? 'Applying...' : 'Apply for this Role'}</span>
                </button>
              ) : (
                <div className="space-y-2 text-center">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-headline font-bold text-xs rounded-none flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Application Locked</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                    Complete the required skill tests above to unlock your application for this position.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
                      ? 'Verification test required to unlock application'
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
                      To qualify for this position, you must complete the verification assessment to meet the required threshold.
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
                onClick={async () => {
                  if (testPromptModal.hasSkill) {
                    onUpgrade?.({
                      skillName: testPromptModal.skillName,
                      targetRating: testPromptModal.minRating,
                      jobId: job.id
                    });
                    setTestPromptModal(null);
                  } else {
                    setTestPromptModal(prev => ({ ...prev, isSubmitting: true }));
                    try {
                      if (onAddSkillAndUpgrade) {
                        await onAddSkillAndUpgrade({
                          skillName: testPromptModal.skillName,
                          targetRating: testPromptModal.minRating,
                          jobId: job.id
                        });
                      } else {
                        onUpgrade?.({
                          skillName: testPromptModal.skillName,
                          targetRating: testPromptModal.minRating,
                          jobId: job.id
                        });
                      }
                    } finally {
                      setTestPromptModal(null);
                    }
                  }
                }}
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
