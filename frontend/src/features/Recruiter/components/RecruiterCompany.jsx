import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  UploadCloud, 
  Globe, 
  MapPin, 
  Building, 
  Calendar, 
  Mail, 
  User, 
  Shield, 
  Briefcase, 
  Plus, 
  Trash2, 
  Link, 
  Check 
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { MAJOR_INDUSTRIES } from '../../../constants/industries';
import { INDIAN_STATES } from '../../../constants/indianStates';

export default function RecruiterCompany({ 
  company, 
  token, 
  docLink, 
  setDocLink, 
  submittingDoc, 
  handleVerification, 
  handleUpdateCompany 
}) {
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16 text-left animate-fade-in">
      
      {/* Recruiter Executive Top Header Banner */}
      <header className="bg-surface border border-slate-300 dark:border-slate-700 p-5 sm:p-6 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-2">
            <span>Organization Profile</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Company Profile Settings
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-sans font-medium mt-1">
            Establish company credibility, customize company branding, and verify your business identity.
          </p>
        </div>
      </header>

      {/* Main Content Grid: Left Form Container & Right Verification Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): All 4 Sections Unified in ONE Single Chassis Container */}
        <form onSubmit={handleSubmitProfile} className="lg:col-span-8 space-y-6 min-w-0">
          
          {/* Single Unified Container with divide-y dividers */}
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs divide-y divide-slate-300 dark:divide-slate-700">
            
            {/* Section 1: Brand & Basic Identity */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Brand & Basic Identity</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  SECTION 1 OF 4
                </span>
              </div>

              {/* Logo Frame & Uploader */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
                <div className="relative shrink-0 w-24 h-24 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-2xs group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-center sm:text-left">
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
                    className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-headline font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 mx-auto sm:mx-0"
                  >
                    <span>Change Logo</span>
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                    JPG, PNG up to 2MB. Square dimensions recommended.
                  </p>
                </div>
              </div>

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Industry Search / Dropdown */}
                <div className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Industry *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Search or select industry..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
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
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-56 overflow-y-auto custom-scrollbar z-30 p-1 divide-y divide-slate-100 dark:divide-slate-800">
                        {MAJOR_INDUSTRIES.filter(ind =>
                          ind.toLowerCase().includes((industry || '').toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 dark:text-slate-400 font-sans font-medium text-center">
                            Type custom industry or select from list
                          </div>
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
                              className={`w-full text-left px-3.5 py-2 text-xs rounded-none transition-colors cursor-pointer flex items-center justify-between font-sans ${
                                industry === indName
                                  ? 'bg-blue-700 text-white font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
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

                {/* Company Size */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company Size *
                  </label>
                  <select
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs cursor-pointer"
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

                {/* Headquarters Location */}
                <div className="relative space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Headquarters Location
                  </label>
                  <input
                    type="text"
                    placeholder="Search & select location (e.g. Bengaluru, Karnataka)..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                        {INDIAN_STATES.filter(loc =>
                          loc.toLowerCase().includes((location || '').toLowerCase())
                        ).length === 0 ? (
                          <div className="px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
                            No matching locations found
                          </div>
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
                              className={`w-full text-left px-3.5 py-2 text-xs rounded-none transition-colors cursor-pointer flex items-center justify-between font-sans ${
                                location === locName
                                  ? 'bg-blue-700 text-white font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
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

                {/* Founded Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Founded Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2019"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={foundedYear}
                    onChange={e => setFoundedYear(e.target.value)}
                  />
                </div>

                {/* Official Website URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {/* Company Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Company Description *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Introduce your company mission, tech stack, culture, and core operations..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs custom-scrollbar"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Section 2: Recruiter Details */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Recruiter Details</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  SECTION 2 OF 4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Recruiter Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={recruiterName}
                    onChange={e => setRecruiterName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Recruiter Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Talent Acquisition"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={recruiterDesignation}
                    onChange={e => setRecruiterDesignation(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="recruiting@company.com"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={officialEmail}
                    onChange={e => setOfficialEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Social Profile Links */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Link className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Social Profile Links</span>
                </h3>
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  SECTION 3 OF 4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company LinkedIn Page
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company GitHub / Tech Repository
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs"
                    value={github}
                    onChange={e => setGithub(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Office Showcase Gallery */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Office Showcase Gallery</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider hidden sm:inline-block">
                    SECTION 4 OF 4
                  </span>
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
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold text-xs rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>
                </div>
              </div>
              
              {uploadingPhoto && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-none text-xs font-sans font-medium animate-pulse flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-blue-700 dark:border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading gallery image to S3...</span>
                </div>
              )}

              {photos.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-none text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <Globe className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium">
                    No showcase photos uploaded yet. Click 'Upload Photo' to build your office profile gallery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative aspect-video rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden group shadow-2xs">
                      <img src={p} alt="Office" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-none opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Submit Action Button */}
          <div>
            <button 
              type="submit" 
              disabled={savingProfile}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-headline font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Profile Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>

        </form>

        {/* Right Side: Trust & Verification Status Widget */}
        <aside className="lg:col-span-4 sticky top-6 space-y-6">
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Trust & Verification</span>
              </h3>
            </div>

            {/* Status Row */}
            <div className="flex justify-between items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs">
              <span className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                Company Status
              </span>
              {company?.verified ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-headline font-bold tracking-wider rounded-none bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-headline font-bold tracking-wider rounded-none bg-rose-100 dark:bg-rose-950/70 border border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 shadow-2xs">
                  <span>Unverified</span>
                </span>
              )}
            </div>

            {/* Legal Document Upload (when unverified) */}
            {!company?.verified && (
              <div className="space-y-3">
                <label className="text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 block">
                  Upload Incorporation or Legal Document (PDF, max 10MB)
                </label>
                <div 
                  onClick={() => document.getElementById('company-doc-upload').click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-700 rounded-none p-8 text-center cursor-pointer bg-white dark:bg-slate-900 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-2 group shadow-2xs"
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
                  <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold font-headline text-slate-900 dark:text-slate-100">
                    Click to select legal document
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                    PDF up to 10MB
                  </p>
                </div>
                {submittingDoc && (
                  <div className="text-center text-xs text-blue-700 dark:text-blue-400 font-sans font-medium animate-pulse flex items-center justify-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-blue-700 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading and verifying document on S3...</span>
                  </div>
                )}
              </div>
            )}

            {/* Verification Success Notice (when verified) */}
            {company?.verified && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-start gap-3 shadow-2xs">
                <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-headline font-bold text-xs tracking-wider text-emerald-900 dark:text-emerald-100">
                    Trust Established
                  </h5>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans font-medium">
                    Your company account is fully verified. Candidates matching your skill thresholds will see a verification badge and will be allowed to submit applications directly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
