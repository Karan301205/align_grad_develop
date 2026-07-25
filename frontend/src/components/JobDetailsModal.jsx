import React, { useState } from 'react';
import {
  X,
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
  CheckCircle,
  BookOpen,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { ALL_SKILLS } from '../constants';

const formatJoiningDate = (dateStr) => {
  if (!dateStr) return 'Not specified';
  // Check if it's YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }
  // Check if it's YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    try {
      const [year, month] = dateStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  }
  return dateStr;
};

export default function JobDetailsModal({ job, onClose, onApply, onUpgrade, isStudent, onOpenCompanyProfile }) {
  const [promptSkill, setPromptSkill] = useState(null);

  if (!job) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Set fonts and colors
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(24, 160, 251); // Primary color theme
    doc.text(job.title || job.designation, 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Company: ${job.companyName || job.company?.name || 'Aether Corp'}`, 20, 35);
    doc.text(`Location: ${job.location || 'Not specified'}`, 20, 42);
    doc.text(`Joining Date: ${formatJoiningDate(job.joiningMonth)}`, 20, 49);
    doc.text(`Desired Experience: ${job.desiredExperience || 'Fresher'}`, 20, 56);

    // Draw line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 62, 190, 62);

    let y = 70;

    // Description
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("Opportunity Summary", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const descLines = doc.splitTextToSize(job.description || '', 170);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 8;

    // Role & Responsibilities
    if (job.roleResponsibilities) {
      // Check page overflow
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text("Role & Responsibilities", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const responsibilitiesLines = doc.splitTextToSize(job.roleResponsibilities, 170);
      doc.text(responsibilitiesLines, 20, y);
      y += responsibilitiesLines.length * 5 + 8;
    }

    // Required Skill Thresholds
    if (job.requirements && job.requirements.length > 0) {
      // Check page overflow
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text("Required Rating Thresholds", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      job.requirements.forEach(req => {
        const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === req.skillName.toLowerCase());
        const isTech = skillObj ? skillObj.type === 'technical' : true;
        if (isTech) {
          doc.text(`- ${req.skillName}: Lvl ${req.minRating}/10`, 20, y);
        } else {
          doc.text(`- ${req.skillName} (Non-Technical)`, 20, y);
        }
        y += 6;
      });
      y += 4;
    }

    // Selection Process Rounds
    if (job.selectionProcess && job.selectionProcess.length > 0) {
      // Check page overflow
      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text("Selection Process Rounds", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      job.selectionProcess.forEach(round => {
        // Check page overflow
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`Round #${round.roundNumber}: ${round.name}`, 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const roundDescLines = doc.splitTextToSize(round.description, 170);
        doc.text(roundDescLines, 20, y);
        y += roundDescLines.length * 5 + 4;
      });
    }

    doc.save(`${(job.title || job.designation).replace(/\s+/g, '_')}_Job_Description.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up relative">

        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (job.company?.id && onOpenCompanyProfile) {
                  onOpenCompanyProfile(job.company.id);
                }
              }}
              title={job.company?.id ? "View Company Profile" : ""}
              disabled={!job.company?.id}
              className={`w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary font-bold text-xl shrink-0 overflow-hidden transition-all ${job.company?.id ? 'hover:border-primary/40 hover:scale-105 active:scale-95 cursor-pointer' : ''} shadow-md`}
            >
              {(job.company?.logoUrl || job.logoUrl || job.companyLogo) ? (
                <img src={job.company?.logoUrl || job.logoUrl || job.companyLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>{(job.companyName || job.company?.name || 'J').replace(/^c_/i, '').charAt(0).toUpperCase()}</span>
              )}
            </button>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-on-surface truncate">{job.title || job.designation}</h3>
              <div className="text-xs text-on-surface-variant font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Building className="w-3.5 h-3.5 shrink-0 text-secondary" />
                {job.company?.id ? (
                  <button
                    onClick={() => {
                      if (onOpenCompanyProfile) onOpenCompanyProfile(job.company.id);
                    }}
                    className="font-bold text-on-surface hover:text-primary hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {(job.company?.name || job.companyName || 'Aether Corp').replace(/^c_/i, '')}
                    {job.company?.verified && (
                      <span className="text-[9px] bg-success-container border border-success/30 text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center select-none scale-90">
                        ✓ Verified
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="font-bold text-on-surface">
                    {(job.companyName || job.company?.name || 'Aether Corp').replace(/^c_/i, '')}
                  </span>
                )}
                {job.company?.companySize && (
                  <span className="text-[10px] opacity-60">&bull; {job.company.companySize}</span>
                )}
                {job.company?.location && (
                  <span className="text-[10px] opacity-60">&bull; {job.company.location}</span>
                )}
                {job.officialWebsite && (
                  <a
                    href={job.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-0.5 ml-2 font-sans font-normal normal-case"
                  >
                    <Globe className="w-3 h-3" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-all shrink-0 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar bg-background">

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-low border border-outline-variant p-4 rounded-xl text-xs">
            <div className="space-y-1">
              <span className="text-on-surface-variant font-mono uppercase tracking-wider text-[9px] block">Location</span>
              <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                {job.locationUrl ? (
                  <a
                    href={job.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline hover:text-primary-light transition-colors"
                  >
                    {job.location || 'Map Link'}
                  </a>
                ) : (
                  <span>{job.location || 'Not specified'}</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-on-surface-variant font-mono uppercase tracking-wider text-[9px] block">Joining Date</span>
              <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{formatJoiningDate(job.joiningMonth)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-on-surface-variant font-mono uppercase tracking-wider text-[9px] block">Desired Exp</span>
              <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{job.desiredExperience || 'Fresher'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-on-surface-variant font-mono uppercase tracking-wider text-[9px] block">Openings</span>
              <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{job.openings ? `${job.openings} positions` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Job Summary Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider">Opportunity Summary</h4>
            <p className="text-sm text-on-surface leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Role and Responsibilities */}
          {job.roleResponsibilities && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider">Role & Responsibilities</h4>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                {job.roleResponsibilities}
              </p>
            </div>
          )}

          {/* Details & Stipend / Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Details Panel */}
            <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant text-xs">
              <h5 className="font-bold text-on-surface border-b border-outline-variant pb-1.5">Employment Parameters</h5>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Preferred Education:</span>
                <span className="text-on-surface font-semibold">{job.preferredEducation || 'Any Graduate'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Stipend (Part-Time):</span>
                <span className="text-on-surface font-semibold">{job.stipendPartTime || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Stipend (Full-Time):</span>
                <span className="text-on-surface font-semibold">{job.stipendFullTime || 'N/A'}</span>
              </div>
              {job.duration && (
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Duration (Internship):</span>
                  <span className="text-primary font-mono font-semibold">{job.duration}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-outline-variant/30 pt-1.5 mt-1.5">
                <span className="text-on-surface-variant">Listing Duration:</span>
                <span className="text-on-surface font-semibold">{job.activeDays || 30} days</span>
              </div>
            </div>

            {/* Required Stacks */}
            <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant text-xs">
              <h5 className="font-bold text-on-surface border-b border-outline-variant pb-1.5 flex items-center justify-between">
                <span>Required Rating Thresholds</span>
                <span className="text-[10px] font-mono text-on-surface-variant font-normal">Test Verified</span>
              </h5>
              <div className="space-y-2 pt-1 max-h-36 overflow-y-auto custom-scrollbar">
                {job.requirements && job.requirements.length > 0 ? (
                  job.requirements.map((req, i) => {
                    const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === req.skillName.toLowerCase());
                    const isTech = skillObj ? skillObj.type === 'technical' : true;
                    const reqStatus = job.requirementStatuses?.find(s => s.skillName.toLowerCase() === req.skillName.toLowerCase());
                    const isAutoVerified = reqStatus ? reqStatus.status === 'AUTO_VERIFIED_NO_QUIZ' : false;

                    return (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-surface-container border border-outline-variant rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-semibold">{req.skillName}</span>
                          {!isTech ? (
                            <span className="text-on-surface-variant/70 font-mono text-[9px] uppercase tracking-wider bg-surface-container-high border border-outline-variant px-1.5 py-0.5 rounded">Non-Technical</span>
                          ) : isAutoVerified ? (
                            <span className="text-[9px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Quiz is coming soon. Temporarily auto-verified so you can apply!">
                              <CheckCircle className="w-2.5 h-2.5" /> Auto-Verified (Quiz Coming Soon)
                            </span>
                          ) : missing ? (
                            <button
                              type="button"
                              onClick={() => isStudent && setPromptSkill(missing)}
                              className="cursor-pointer hover:scale-105 transition-transform"
                            >
                              {missing.isMissingFromProfile ? (
                                <span className="text-[9px] font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  + Not in Profile
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Unverified
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        {isTech && (
                          <span className={`font-mono font-bold text-xs ${isAutoVerified ? 'text-blue-600 dark:text-blue-400' : missing ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
                            Lvl {req.minRating}/10
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-on-surface-variant">No explicit thresholds added.</p>
                )}
              </div>
            </div>

          </div>

          {/* Selection Process Timeline */}
          {job.selectionProcess && job.selectionProcess.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-secondary" /> Selection Process (Rounds)
              </h4>

              <div className="relative border-l-2 border-outline-variant ml-3 pl-6 space-y-5 py-1">
                {job.selectionProcess.map((round, idx) => (
                  <div key={idx} className="relative group">
                    {/* Stepper Bullet */}
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[8px] text-primary font-bold">
                      {round.roundNumber}
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                        {round.name}
                      </h5>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {round.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleDownloadPDF}
            className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold border border-slate-700"
          >
            Download Description
          </Button>

          <div className="flex gap-3 items-center">
            {isStudent && (
              <div className="flex items-center gap-2">
                {job.applied ? (
                  <Badge variant="success" icon={CheckCircle} className="px-4 py-2 font-bold bg-emerald-700 text-white border-emerald-800">Applied</Badge>
                ) : job.matched ? (
                  <Button
                    size="sm"
                    icon={Send}
                    onClick={() => {
                      onApply(job.id);
                      onClose();
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
                  >
                    Apply for Role
                  </Button>
                ) : (
                  <>
                    {/* Non-Active (Disabled) Apply Button */}
                    <button
                      type="button"
                      disabled
                      onClick={() => {
                        const req = job.missingRequirements?.[0];
                        if (req) setPromptSkill(req);
                      }}
                      title="Apply button is non-active. You must verify required skills by passing the assessment."
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 font-mono text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-75 select-none"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Apply for Role
                    </button>

                    {/* Action Button to trigger skill verification */}
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Award}
                      onClick={() => {
                        const req = job.missingRequirements?.[0];
                        if (req) {
                          setPromptSkill(req);
                        } else {
                          onUpgrade({
                            skillName: job.requirements?.[0]?.skillName || 'Skill',
                            targetRating: job.requirements?.[0]?.minRating || 4,
                            jobId: job.id
                          });
                          onClose();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                    >
                      Get Verified to Apply
                    </Button>
                  </>
                )}
              </div>
            )}

            <Button
              variant="tertiary"
              size="sm"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-bold border border-slate-800"
            >
              Close Details
            </Button>
          </div>
        </div>

        {/* Interactive Verification Prompt Overlay Dialog */}
        {promptSkill && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-surface-container border border-primary/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up text-left">
              <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface font-headline text-base">Skill Verification Required</h4>
                  <p className="text-[11px] font-mono text-on-surface-variant">Gate required to unlock application</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-on-surface">
                <p>
                  To apply for <span className="font-bold text-primary">{job.title || job.designation}</span> at <span className="font-bold text-on-surface">{job.companyName || job.company?.name || 'Company'}</span>, you need a verified level of <span className="font-bold text-primary font-mono">{promptSkill.skillName} (Lvl {promptSkill.requiredRating || promptSkill.minRating}/10)</span>.
                </p>
                
                <div className="p-3 bg-surface-container-high border border-outline-variant rounded-xl font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Required Skill:</span>
                    <span className="font-bold text-on-surface">{promptSkill.skillName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Required Threshold:</span>
                    <span className="font-bold text-primary">Level {promptSkill.requiredRating || promptSkill.minRating}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Current Verified Status:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {promptSkill.isMissingFromProfile ? 'Not in Profile' : 'Unverified (0/10)'}
                    </span>
                  </div>
                </div>

                <p className="text-on-surface-variant font-sans">
                  Would you like to add <span className="font-bold text-on-surface">{promptSkill.skillName}</span> to your profile and get verified by taking the skill test now?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  size="sm"
                  icon={Award}
                  onClick={() => {
                    onUpgrade({
                      skillName: promptSkill.skillName,
                      targetRating: promptSkill.requiredRating || promptSkill.minRating || 4,
                      jobId: job.id
                    });
                    setPromptSkill(null);
                    onClose();
                  }}
                  className="flex-1 justify-center py-2.5"
                >
                  Add Skill & Take Test
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPromptSkill(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
