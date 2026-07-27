import React, { useState, useEffect } from 'react';
import { CheckCircle, UploadCloud, Globe, MapPin, Building, Calendar, Mail, User, Shield, Briefcase, Plus, Trash2, Link, Check } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { MAJOR_INDUSTRIES } from '../../../constants/industries';
import { INDIAN_STATES } from '../../../constants/indianStates';

export default function RecruiterCompany({ company, token, docLink, setDocLink, submittingDoc, handleVerification, handleUpdateCompany }) {
  // Profile form states
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [companySize, setCompanySize] = useState('1-10 employees');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [foundedYear, setFoundedYear] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterDesignation, setRecruiterDesignation] = useState('');
  
  // Social links states
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  
  // Photos gallery
  const [photos, setPhotos] = useState([]);

  // Upload/Saving indicators
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile details when loaded
  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setLogoUrl(company.logoUrl || '');
      setDescription(company.description || '');
      setIndustry(company.industry || '');
      setCompanySize(company.companySize || '1-10 employees');
      setWebsite(company.website || '');
      setLocation(company.location || '');
      setFoundedYear(company.foundedYear || '');
      setOfficialEmail(company.officialEmail || '');
      setRecruiterName(company.recruiterName || '');
      setRecruiterDesignation(company.recruiterDesignation || '');
      setPhotos(company.photos || []);

      const socials = company.socialLinks || {};
      setLinkedin(socials.linkedin || '');
      setGithub(socials.github || '');
    }
  }, [company]);

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const urlRes = await apiFetch('/upload/request-url', {
        token,
        method: 'POST',
        json: {
          fileType: 'doc',
          fileName: file.name,
          contentType: file.type
        }
      });
      if (urlRes.ok) {
        const { uploadUrl, publicUrl } = await urlRes.json();
        await putFileToS3(uploadUrl, file, file.type, token);
        setLogoUrl(publicUrl);
      } else {
        alert('Failed to get upload URL');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle gallery photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const urlRes = await apiFetch('/upload/request-url', {
        token,
        method: 'POST',
        json: {
          fileType: 'doc',
          fileName: file.name,
          contentType: file.type
        }
      });
      if (urlRes.ok) {
        const { uploadUrl, publicUrl } = await urlRes.json();
        await putFileToS3(uploadUrl, file, file.type, token);
        setPhotos(prev => [...prev, publicUrl]);
      } else {
        alert('Failed to get upload URL');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete gallery photo
  const handleDeletePhoto = (photoUrl) => {
    setPhotos(prev => prev.filter(p => p !== photoUrl));
  };

  // Submit Profile Changes
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    const profilePayload = {
      name,
      logoUrl: logoUrl || null,
      description: description || null,
      industry: industry || null,
      companySize: companySize || null,
      website: website || null,
      location: location || null,
      foundedYear: foundedYear || null,
      officialEmail: officialEmail || null,
      recruiterName: recruiterName || null,
      recruiterDesignation: recruiterDesignation || null,
      socialLinks: {
        linkedin: linkedin || null,
        github: github || null
      },
      photos
    };

    await handleUpdateCompany(profilePayload);
    setSavingProfile(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      <PageHeader
        title="Company Profile Settings"
        subtitle="Establish company credibility, customize company branding, and verify your business identity."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Profile Customization Forms */}
        <form onSubmit={handleSubmitProfile} className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Brand & Basic Identity */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Building className="w-4 h-4" /> Brand & Basic Identity
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5 pb-3">
              <div className="relative shrink-0 w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center overflow-hidden shadow-inner group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-on-surface-variant/40" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('logo-upload').click()}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest rounded-xl text-xs font-mono font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Change Logo
                </button>
                <p className="text-[10px] text-on-surface-variant/70 font-mono">JPG, PNG up to 2MB. Square dimensions recommended.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Company Name *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Industry *</label>
                <input
                  type="text"
                  required
                  placeholder="Search or select industry..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner font-sans"
                  value={industry}
                  onChange={e => {
                    setIndustry(e.target.value);
                    setIsIndustryDropdownOpen(true);
                  }}
                  onFocus={() => setIsIndustryDropdownOpen(true)}
                />

                {isIndustryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsIndustryDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar z-30 p-1 divide-y divide-outline-variant/30">
                      {MAJOR_INDUSTRIES.filter(ind =>
                        ind.toLowerCase().includes((industry || '').toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-on-surface-variant font-mono text-center">Type custom industry or select from list</div>
                      ) : (
                        MAJOR_INDUSTRIES.filter(ind =>
                          ind.toLowerCase().includes((industry || '').toLowerCase())
                        ).map((indName) => (
                          <button
                            key={indName}
                            type="button"
                            onClick={() => {
                              setIndustry(indName);
                              setIsIndustryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              industry === indName
                                ? 'bg-primary text-on-primary font-bold'
                                : 'hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            <span>{indName}</span>
                            {industry === indName && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Company Size *</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={companySize}
                  onChange={e => setCompanySize(e.target.value)}
                >
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="501-1000 employees">501-1000 employees</option>
                  <option value="1000+ employees">1000+ employees</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Headquarters Location</label>
                <input
                  type="text"
                  placeholder="Search & select location (e.g. Bengaluru, Karnataka)..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    setIsLocationDropdownOpen(true);
                  }}
                  onFocus={() => setIsLocationDropdownOpen(true)}
                />

                {isLocationDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsLocationDropdownOpen(false)} 
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                      {INDIAN_STATES.filter(loc =>
                        loc.toLowerCase().includes((location || '').toLowerCase())
                      ).length === 0 ? (
                        <div className="px-3.5 py-2.5 text-xs text-on-surface-variant font-mono">No matching locations found</div>
                      ) : (
                        INDIAN_STATES.filter(loc =>
                          loc.toLowerCase().includes((location || '').toLowerCase())
                        ).map((locName) => (
                          <button
                            key={locName}
                            type="button"
                            onClick={() => {
                              setLocation(locName);
                              setIsLocationDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between font-sans ${
                              location === locName
                                ? 'bg-primary text-on-primary font-bold'
                                : 'hover:bg-surface-container-high text-on-surface'
                            }`}
                          >
                            <span>{locName}</span>
                            {location === locName && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Founded Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2019"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={foundedYear}
                  onChange={e => setFoundedYear(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Official Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Company Description *</label>
              <textarea
                rows="4"
                required
                placeholder="Introduce your company mission, tech stack, culture, and core operations..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner custom-scrollbar"
                value={description}
                onChange={e => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Section 2: Contact Person / Recruiter Business Card */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Recruiter Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Recruiter Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={recruiterName}
                  onChange={e => setRecruiterName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Recruiter Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Talent Acquisition"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={recruiterDesignation}
                  onChange={e => setRecruiterDesignation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="recruiting@company.com"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                  value={officialEmail}
                  onChange={e => setOfficialEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social & Showcase Media */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Link className="w-4 h-4" /> Social Profile Links
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Company LinkedIn Page</label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Office Showcase Photos */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="text-sm font-mono uppercase tracking-wider text-primary flex items-center gap-2">
                <Globe className="w-4 h-4" /> Office Showcase Gallery
              </h3>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => document.getElementById('photo-upload').click()}
                className="px-3 py-1.5 bg-secondary text-on-secondary hover:brightness-105 active:scale-95 font-mono font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Photo
              </button>
            </div>
            
            {uploadingPhoto && (
              <p className="text-xs text-primary font-mono animate-pulse">Uploading gallery image to S3...</p>
            )}

            {photos.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-mono">No showcase photos uploaded yet. Click upload to build your profile gallery.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl bg-surface-container-low border border-outline-variant overflow-hidden group">
                    <img src={p} alt="Office" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p)}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-error text-white hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" loading={savingProfile} fullWidth size="lg">
            {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
          </Button>

        </form>

        {/* Right Side: Trust Verification Status Widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Trust & Verification
            </h3>

            <div className="flex justify-between items-center gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl shadow-inner">
              <span className="text-xs font-bold text-on-surface">Company Status</span>
              {company?.verified ? (
                <Badge variant="success" icon={CheckCircle}>Verified</Badge>
              ) : (
                <Badge variant="error">Unverified</Badge>
              )}
            </div>

            {!company?.verified && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Upload Incorporation or Legal Document (PDF, max 10MB)
                </label>
                <div 
                  onClick={() => document.getElementById('company-doc-upload').click()}
                  className="border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer bg-surface-container-low transition-all hover:bg-surface-container flex flex-col items-center justify-center gap-2 group shadow-inner"
                >
                  <input 
                    id="company-doc-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.type !== 'application/pdf') {
                        alert('Please upload a PDF file.');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        alert('File size exceeds the 10MB limit.');
                        return;
                      }
                      await handleVerification(file);
                    }}
                  />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-on-surface">Click to select legal document</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">PDF up to 10MB</p>
                </div>
                {submittingDoc && (
                  <div className="text-center text-xs text-primary font-medium animate-pulse">
                    Uploading and verifying document on S3...
                  </div>
                )}
              </div>
            )}

            {company?.verified && (
              <div className="p-4 bg-success-container border border-success/20 rounded-xl flex items-start gap-3 shadow-inner">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-on-success-container text-sm">Trust established</h5>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Your company account is fully verified. Candidates matching your skill thresholds will see a verification badge and will be allowed to submit applications directly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
