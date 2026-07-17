import React, { useState, useEffect } from 'react';
import { X, Building, Globe, MapPin, CheckCircle, Shield, Star, Briefcase, DollarSign, Mail, User, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { apiFetch } from '../services/apiClient';

export default function CompanyProfileModal({ companyId, isOpen, onClose, token, onViewOpportunity }) {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (isOpen && companyId) {
      const fetchCompanyDetails = async () => {
        setLoading(true);
        try {
          const res = await apiFetch(`/recruiter/companies/${companyId}`, { token });
          if (res.ok) {
            const data = await res.json();
            setCompany(data);
          } else {
            console.error('Failed to retrieve company details');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchCompanyDetails();
    } else {
      setCompany(null);
    }
  }, [isOpen, companyId, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-container border border-outline-variant rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative animate-zoom-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface rounded-full border border-outline-variant transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-on-surface-variant">Retrieving company credibility profile...</p>
          </div>
        ) : !company ? (
          <div className="p-16 text-center space-y-4">
            <Building className="w-16 h-16 text-on-surface-variant/40 mx-auto" />
            <p className="text-sm font-semibold text-on-surface">Company Profile Not Found</p>
            <button onClick={onClose} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-mono font-bold">
              Go Back
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex-1 p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-10 h-10 text-on-surface-variant/40" />
                )}
              </div>
              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="text-2xl font-headline font-bold text-on-surface">{company.name}</h2>
                  {company.verified && (
                    <span className="text-[10px] bg-success-container border border-success/30 text-success px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 select-none shadow-sm">
                      <span className="text-[10px]">✓</span> Verified
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-on-surface-variant/80 font-medium">{company.industry || 'General Business'} &bull; {company.companySize || '1-10 employees'}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-on-surface-variant font-mono">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-secondary" /> {company.location || 'Location Not Specified'}</span>
                  {company.foundedYear && <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-secondary" /> Founded {company.foundedYear}</span>}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Credibility Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low border border-outline-variant rounded-2xl p-4 shadow-inner">
              <div className="text-center p-2 space-y-1">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-on-surface-variant">Rating</span>
                <div className="flex items-center justify-center gap-1 text-sm font-bold text-on-surface">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span>{company.stats?.averageRating || '5.0'} / 5</span>
                </div>
              </div>
              <div className="text-center p-2 border-l border-outline-variant/60 space-y-1">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-on-surface-variant">Jobs Posted</span>
                <span className="block text-sm font-bold text-on-surface">{company.stats?.totalJobs || 0}</span>
              </div>
              <div className="text-center p-2 border-l border-outline-variant/60 space-y-1">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-on-surface-variant">Gigs Posted</span>
                <span className="block text-sm font-bold text-on-surface">{company.stats?.totalGigs || 0}</span>
              </div>
              <div className="text-center p-2 border-l border-outline-variant/60 space-y-1">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-on-surface-variant">Active Openings</span>
                <span className="block text-sm font-bold text-primary">{company.stats?.activeOpenings || 0}</span>
              </div>
            </div>

            {/* About / Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">About the Company</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low border border-outline-variant rounded-xl p-4">
                {company.description || "No company description provided yet."}
              </p>
            </div>

            {/* Recruiter Card & Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recruiter Identity Card */}
              {company.recruiterName && (
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Hiring Representative</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold font-mono text-sm shadow">
                      {company.recruiterName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{company.recruiterName}</p>
                      <p className="text-[10px] text-on-surface-variant">{company.recruiterDesignation || 'Hiring Partner'}</p>
                    </div>
                  </div>
                  {company.officialEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-mono">
                      <Mail className="w-3.5 h-3.5 text-secondary" />
                      <span>{company.officialEmail}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social links */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between gap-3">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Connect</h4>
                <div className="flex flex-wrap gap-2">
                  {company.socialLinks?.linkedin && (
                    <a
                      href={company.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs rounded-xl font-mono text-on-surface flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-primary" /> LinkedIn
                    </a>
                  )}
                  {company.socialLinks?.twitter && (
                    <a
                      href={company.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs rounded-xl font-mono text-on-surface flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-primary" /> Twitter
                    </a>
                  )}
                  {company.socialLinks?.github && (
                    <a
                      href={company.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs rounded-xl font-mono text-on-surface flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-primary" /> GitHub
                    </a>
                  )}
                  {!company.socialLinks?.linkedin && !company.socialLinks?.twitter && !company.socialLinks?.github && (
                    <span className="text-xs text-on-surface-variant font-mono">No social profiles linked.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Showcase Gallery */}
            {company.photos && company.photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Office Showcase</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {company.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-video rounded-xl border border-outline-variant overflow-hidden bg-surface-container-low shadow-sm">
                      <img src={photo} alt="Office showcase" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Openings section */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Active Opportunities</h3>
              
              {/* Jobs & Internships List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Jobs & Internships ({company.opportunities?.jobs?.length || 0})</h4>
                {company.opportunities?.jobs?.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant/80 font-mono">No active job listings right now.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {company.opportunities.jobs.map(job => (
                      <div
                        key={job.id}
                        onClick={() => {
                          onViewOpportunity(job.id, 'job');
                          onClose();
                        }}
                        className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-primary/40 rounded-xl cursor-pointer transition-all flex justify-between items-center group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{job.title}</p>
                          <p className="text-[10px] text-on-surface-variant/80 font-mono">{job.designation || 'Specialist'} &bull; {job.location || 'Remote'}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gigs List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Gigs ({company.opportunities?.gigs?.length || 0})</h4>
                {company.opportunities?.gigs?.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant/80 font-mono">No active gigs right now.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {company.opportunities.gigs.map(gig => (
                      <div
                        key={gig.id}
                        onClick={() => {
                          onViewOpportunity(gig.id, 'gig');
                          onClose();
                        }}
                        className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-secondary/40 rounded-xl cursor-pointer transition-all flex justify-between items-center group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">{gig.title}</p>
                          <p className="text-[10px] text-on-surface-variant/80 font-mono">Budget: ${gig.budget} &bull; {gig.deliveryTime || 'Flexible'}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-secondary transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
