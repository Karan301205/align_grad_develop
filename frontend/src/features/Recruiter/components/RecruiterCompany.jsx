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
  Check, 
  FileText, 
  ExternalLink, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { MAJOR_INDUSTRIES } from '../../../constants/industries';
import { INDIAN_STATES } from '../../../constants/indianStates';
import { ToastNotification } from '../../../utils/errorFormatter';
import { isCompanyProfileComplete } from '../../../utils/profileCompleteness';

const VERIFICATION_DOC_TYPES = [
  'Certificate of Incorporation',
  'CIN',
  'PAN Card',
  'GST Registration Certificate',
  'Company Registration Certificate if separate',
  'Registered Office Address Proof'
];

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  const pattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
  return pattern.test(s);
}

function isGmailAddress(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(str.trim());
}

export default function RecruiterCompany({ 
  company, 
  token, 
  docLink, 
  setDocLink, 
  submittingDoc, 
  handleVerification, 
  handleUpdateCompany,
  setAlertConfig
}) {
  const isProfileLocked = isCompanyProfileComplete(company);

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
  
  // Photos gallery
  const [photos, setPhotos] = useState([]);

  // Upload/Saving indicators
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Trust & Verification states (strictly 2 docs max)
  const [stagedDocs, setStagedDocs] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('Certificate of Incorporation');
  const [uploadingVerificationDoc, setUploadingVerificationDoc] = useState(false);

  // Field validation error states & local alert fallback
  const [fieldErrors, setFieldErrors] = useState({});
  const [localAlert, setLocalAlert] = useState(null);

  const showAlert = (message, type = 'warning') => {
    if (typeof setAlertConfig === 'function') {
      setAlertConfig({ message, type });
    } else {
      setLocalAlert({ message, type });
    }
  };

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

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

      if (Array.isArray(company.verificationDocs) && company.verificationDocs.length > 0) {
        setStagedDocs(company.verificationDocs.slice(0, 2));
      } else if (company.docUrl) {
        setStagedDocs([{
          docType: 'Certificate of Incorporation',
          docUrl: company.docUrl,
          fileName: 'Incorporation_Document.pdf'
        }]);
      }
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
        showAlert('Logo uploaded successfully!', 'success');
      } else {
        showAlert('Failed to get upload URL for logo', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error uploading logo. Please try again.', 'error');
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
        showAlert('Office photo uploaded successfully!', 'success');
      } else {
        showAlert('Failed to get upload URL for photo', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error uploading office photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete gallery photo
  const handleDeletePhoto = (photoUrl) => {
    setPhotos(prev => prev.filter(p => p !== photoUrl));
  };

  // Upload single verification legal document (strictly 2 docs max)
  const handleUploadVerificationDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (stagedDocs.length >= 2) {
      showAlert('Only 2 verification documents can be uploaded. Remove an existing document to replace it.', 'warning');
      e.target.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      showAlert('Please upload a PDF document.', 'warning');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showAlert('File size exceeds the 10MB limit.', 'warning');
      e.target.value = '';
      return;
    }

    if (stagedDocs.some(d => d.docType === selectedDocType)) {
      showAlert(`A document for "${selectedDocType}" is already uploaded. Please remove it first if you wish to replace it.`, 'warning');
      e.target.value = '';
      return;
    }

    setUploadingVerificationDoc(true);
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
      if (!urlRes.ok) {
        throw new Error('Failed to request upload URL from server.');
      }
      const { uploadUrl, publicUrl } = await urlRes.json();
      const s3Res = await putFileToS3(uploadUrl, file, file.type, token);
      if (!s3Res.ok) {
        throw new Error('Failed to upload document to S3.');
      }

      const newDoc = {
        docType: selectedDocType,
        docUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size
      };

      setStagedDocs(prev => {
        const next = [...prev, newDoc].slice(0, 2);
        const nextAvailable = VERIFICATION_DOC_TYPES.find(t => !next.some(d => d.docType === t));
        if (nextAvailable) setSelectedDocType(nextAvailable);
        return next;
      });
      clearFieldError('verification');
      showAlert(`"${selectedDocType}" uploaded successfully!`, 'info');
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error uploading document', 'error');
    } finally {
      setUploadingVerificationDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (indexToRemove) => {
    setStagedDocs(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Profile Changes (Single Unified Button)
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (isProfileLocked) {
      showAlert('Company profile is already completed and verified. Editing is locked.', 'info');
      return;
    }

    const errors = {};
    if (!name?.trim()) errors.name = 'Company Name is required.';
    if (!industry?.trim()) errors.industry = 'Industry is required.';
    if (!companySize?.trim()) errors.companySize = 'Company Size is required.';
    if (!location?.trim()) errors.location = 'Headquarters Location is required.';

    // Website URL validation
    if (!website?.trim()) {
      errors.website = 'Official Website URL is required.';
    } else if (!isValidUrl(website)) {
      errors.website = 'Official Website URL must be a valid website link (e.g. https://company.com).';
    }

    if (!description?.trim()) errors.description = 'Company Description is required.';
    if (!recruiterName?.trim()) errors.recruiterName = 'Recruiter Name is required.';
    if (!recruiterDesignation?.trim()) errors.recruiterDesignation = 'Recruiter Designation is required.';

    // Official Email Address validation: must be @gmail.com
    if (!officialEmail?.trim()) {
      errors.officialEmail = 'Official Email Address is required.';
    } else if (!isGmailAddress(officialEmail)) {
      errors.officialEmail = 'Official Email Address must be a valid Gmail address (ending in @gmail.com).';
    }

    // LinkedIn URL validation (optional, but if filled must be a valid URL)
    if (linkedin?.trim() && !isValidUrl(linkedin)) {
      errors.linkedin = 'Company LinkedIn Page must be a valid URL (e.g. https://linkedin.com/company/name).';
    }

    // Trust & Verification: strictly 2 documents required
    if (stagedDocs.length !== 2) {
      errors.verification = 'Trust & Verification requires exactly 2 legal verification documents.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMsg = Object.values(errors)[0];
      showAlert(firstErrorMsg, 'warning');

      // Scroll smoothly to the first missing field container without jumping to page top
      const firstErrorKey = Object.keys(errors)[0];
      const targetEl = document.getElementById(`field-${firstErrorKey}`) || document.getElementById(`section-${firstErrorKey}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const input = targetEl.querySelector('input, select, textarea, button');
        if (input && typeof input.focus === 'function') input.focus();
      }
      return;
    }

    setSavingProfile(true);
    
    // Normalize website and linkedin URLs
    let normalizedWebsite = website.trim();
    if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    let normalizedLinkedin = linkedin.trim();
    if (normalizedLinkedin && !/^https?:\/\//i.test(normalizedLinkedin)) {
      normalizedLinkedin = `https://${normalizedLinkedin}`;
    }

    const profilePayload = {
      name,
      logoUrl: logoUrl || null,
      description: description || null,
      industry: industry || null,
      companySize: companySize || null,
      website: normalizedWebsite || null,
      location: location || null,
      foundedYear: foundedYear || null,
      officialEmail: officialEmail.trim().toLowerCase() || null,
      recruiterName: recruiterName || null,
      recruiterDesignation: recruiterDesignation || null,
      socialLinks: {
        linkedin: normalizedLinkedin || null
      },
      photos
    };

    try {
      // 1. Submit the 2 verification legal documents silently
      if (stagedDocs.length === 2) {
        await handleVerification(stagedDocs, true);
      }
      // 2. Submit company profile updates with unified confirmation notification
      await handleUpdateCompany(profilePayload, 'Company profile and verification documents saved successfully!');
      setFieldErrors({});
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error saving company profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-left animate-fade-in">
      
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

      {/* Profile Completed & Locked Read-Only Notice */}
      {isProfileLocked && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600 dark:border-emerald-500 p-4 sm:p-5 rounded-none shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-none bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-headline font-bold text-emerald-950 dark:text-emerald-100">
                Company Profile Completed & Locked (Read-Only Mode)
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-headline font-bold uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-none">
                Verified
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-sans mt-1 leading-relaxed">
              Your company profile and legal verification documents are verified and locked. Profile fields cannot be modified to ensure trusted credibility across candidate search and job publishing.
            </p>
          </div>
        </div>
      )}

      {/* Main Single Chassis Container: All Sections Unified in ONE Container */}
      <form onSubmit={handleSubmitProfile} noValidate className="space-y-6 min-w-0">
        
        {/* Single Unified Container with divide-y dividers */}
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs divide-y divide-slate-300 dark:divide-slate-700">
          
          {/* Section 1: Brand & Basic Identity */}
          <div id="section-name" className="p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Brand & Basic Identity</span>
              </h3>
              <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                SECTION 1 OF 5
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
                {!isProfileLocked ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-headline font-bold text-slate-600 dark:text-slate-400 py-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Verified Organization Logo (Locked)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Company Name (Can take letters and numbers) */}
              <div id="field-name" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={isProfileLocked}
                  placeholder="e.g. Acme Corporation"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.name
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={name}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Industry Search / Dropdown (Alphabetical only) */}
              <div id="field-industry" className="relative space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Industry <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={isProfileLocked}
                  placeholder="Search or select industry..."
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.industry
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={industry}
                  onChange={e => {
                    if (isProfileLocked) return;
                    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setIndustry(cleaned);
                    setIsIndustryDropdownOpen(true);
                    clearFieldError('industry');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onFocus={() => !isProfileLocked && setIsIndustryDropdownOpen(true)}
                  onClick={() => !isProfileLocked && setIsIndustryDropdownOpen(true)}
                />
                {fieldErrors.industry && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.industry}</span>
                  </p>
                )}

                {!isProfileLocked && isIndustryDropdownOpen && (
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
                              clearFieldError('industry');
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
              <div id="field-companySize" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company Size <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <select
                  disabled={isProfileLocked}
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.companySize
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20 cursor-pointer'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700 cursor-pointer'
                  }`}
                  value={companySize}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setCompanySize(e.target.value);
                    clearFieldError('companySize');
                  }}
                >
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="501-1000 employees">501-1000 employees</option>
                  <option value="1000+ employees">1000+ employees</option>
                </select>
                {fieldErrors.companySize && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.companySize}</span>
                  </p>
                )}
              </div>

              {/* Headquarters Location */}
              <div id="field-location" className="relative space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Headquarters Location <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={isProfileLocked}
                  placeholder="Search & select location (e.g. Bengaluru, Karnataka)..."
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.location
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={location}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setLocation(e.target.value);
                    setIsLocationDropdownOpen(true);
                    clearFieldError('location');
                  }}
                  onFocus={() => !isProfileLocked && setIsLocationDropdownOpen(true)}
                  onClick={() => !isProfileLocked && setIsLocationDropdownOpen(true)}
                />
                {fieldErrors.location && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.location}</span>
                  </p>
                )}

                {!isProfileLocked && isLocationDropdownOpen && (
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
                              clearFieldError('location');
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

              {/* Founded Year (Numeric only) */}
              <div id="field-foundedYear" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Founded Year
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={4}
                  readOnly={isProfileLocked}
                  placeholder="e.g. 2019"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={foundedYear}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setFoundedYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              {/* Official Website URL (Only accepts URLs) */}
              <div id="field-website" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Official Website URL <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  readOnly={isProfileLocked}
                  placeholder="https://example.com"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.website
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={website}
                  onChange={e => {
                    if (isProfileLocked) return;
                    const cleaned = e.target.value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g, '');
                    setWebsite(cleaned);
                    clearFieldError('website');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (e.key === ' ' || (!/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                      e.preventDefault();
                    }
                  }}
                />
                {fieldErrors.website && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.website}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Company Description */}
            <div id="field-description" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Company Description <span className="text-rose-500 font-bold">*</span>
                </label>
                {isProfileLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                )}
              </div>
              <textarea
                rows="4"
                required
                readOnly={isProfileLocked}
                placeholder="Introduce your company mission, tech stack, culture, and core operations..."
                className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs custom-scrollbar ${
                  isProfileLocked
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                    : fieldErrors.description
                      ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                }`}
                value={description}
                onChange={e => {
                  if (isProfileLocked) return;
                  setDescription(e.target.value);
                  clearFieldError('description');
                }}
              ></textarea>
              {fieldErrors.description && (
                <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.description}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Recruiter Details */}
          <div id="section-recruiterName" className="p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Recruiter Details</span>
              </h3>
              <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                SECTION 2 OF 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Recruiter Name (Alphabetical only) */}
              <div id="field-recruiterName" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Recruiter Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={isProfileLocked}
                  placeholder="e.g. John Doe"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.recruiterName
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={recruiterName}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setRecruiterName(e.target.value.replace(/[^a-zA-Z\s]/g, ''));
                    clearFieldError('recruiterName');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {fieldErrors.recruiterName && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.recruiterName}</span>
                  </p>
                )}
              </div>

              {/* Recruiter Designation (Alphabetical only) */}
              <div id="field-recruiterDesignation" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Recruiter Designation <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  readOnly={isProfileLocked}
                  placeholder="e.g. Talent Acquisition"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.recruiterDesignation
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={recruiterDesignation}
                  onChange={e => {
                    if (isProfileLocked) return;
                    setRecruiterDesignation(e.target.value.replace(/[^a-zA-Z\s]/g, ''));
                    clearFieldError('recruiterDesignation');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {fieldErrors.recruiterDesignation && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.recruiterDesignation}</span>
                  </p>
                )}
              </div>

              {/* Official Email Address (Only accepts @gmail.com) */}
              <div id="field-officialEmail" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Official Email Address (@gmail.com) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  readOnly={isProfileLocked}
                  placeholder="recruiter@gmail.com"
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.officialEmail
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={officialEmail}
                  onChange={e => {
                    if (isProfileLocked) return;
                    let val = e.target.value.replace(/[^a-zA-Z0-9._%+-@]/g, '');
                    const atIdx = val.indexOf('@');
                    if (atIdx !== -1) {
                      val = val.slice(0, atIdx + 1) + val.slice(atIdx + 1).replace(/@/g, '');
                    }
                    setOfficialEmail(val);
                    clearFieldError('officialEmail');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (e.key === ' ' || (!/[a-zA-Z0-9._%+-@]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                      e.preventDefault();
                    }
                  }}
                />
                {fieldErrors.officialEmail && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.officialEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Trust & Verification (Strictly 2 documents, no redundant confirm button) */}
          <div id="section-verification" className="p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Trust & Verification</span>
                <span className="text-rose-500 font-bold">*</span>
              </h3>
              <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                SECTION 3 OF 5
              </span>
            </div>

            {/* Status & Progress Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs">
                <span className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                  Company Status
                </span>
                {company?.verified || isProfileLocked ? (
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

              {/* Upload Progress Badge */}
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs text-xs font-headline">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Verification Requirement:
                </span>
                {stagedDocs.length === 2 || company?.verified || isProfileLocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Requirement Met (2/2 Uploaded)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {stagedDocs.length} of 2 Uploaded (Mandatory)
                  </span>
                )}
              </div>
            </div>

            {/* Document Type Selection Dropdown & Uploader (Only when NOT locked) */}
            {!isProfileLocked && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 block">
                    Select Legal Document Type <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    disabled={stagedDocs.length >= 2}
                    value={selectedDocType}
                    onChange={e => setSelectedDocType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3.5 py-2.5 text-xs sm:text-sm font-sans text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {VERIFICATION_DOC_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type} {stagedDocs.some(d => d.docType === type) ? '✓ (Uploaded)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Choose 2 distinct documents to verify company identity.
                  </p>
                </div>

                <div id="field-verification" className="space-y-1.5">
                  <label className="text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 block">
                    Upload PDF (Max 10MB) <span className="text-rose-500 font-bold">*</span>
                  </label>

                  {stagedDocs.length >= 2 ? (
                    <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 text-center rounded-none shadow-2xs flex flex-col items-center justify-center gap-1.5 h-[108px]">
                      <div className="w-8 h-8 rounded-none bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-2xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <p className="text-xs font-headline font-bold text-emerald-900 dark:text-emerald-100">
                        2 of 2 Legal Documents Uploaded
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans">
                        To replace a document, remove one from below.
                      </p>
                    </div>
                  ) : (
                    <div 
                      onClick={() => !uploadingVerificationDoc && document.getElementById('company-doc-upload').click()}
                      className={`border-2 border-dashed ${
                        fieldErrors.verification && stagedDocs.length !== 2
                          ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-blue-700'
                      } rounded-none p-5 text-center cursor-pointer bg-white dark:bg-slate-900 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-1.5 group shadow-2xs ${
                        uploadingVerificationDoc ? 'opacity-60 cursor-wait' : ''
                      }`}
                    >
                      <input 
                        id="company-doc-upload"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={uploadingVerificationDoc || stagedDocs.length >= 2}
                        onChange={handleUploadVerificationDoc}
                      />
                      <div className="w-8 h-8 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold font-headline text-slate-900 dark:text-slate-100">
                        Click to upload: {selectedDocType}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                        PDF document up to 10MB (Upload 2 documents)
                      </p>
                    </div>
                  )}

                  {uploadingVerificationDoc && (
                    <div className="text-center text-xs text-blue-700 dark:text-blue-400 font-sans font-medium animate-pulse flex items-center justify-center gap-1.5 py-1">
                      <div className="w-3.5 h-3.5 border-2 border-blue-700 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading document to S3...</span>
                    </div>
                  )}
                  {fieldErrors.verification && stagedDocs.length !== 2 && (
                    <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.verification}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Showcase Uploaded Documents */}
            {stagedDocs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Uploaded Legal Documents ({stagedDocs.length}/2)
                  </p>
                  <span className="text-[10px] text-slate-500 font-sans">
                    {isProfileLocked ? 'Verified Records (Locked)' : 'Exactly 2 Required'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stagedDocs.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none flex items-center justify-between gap-3 shadow-2xs hover:border-slate-400 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 text-[10px] font-headline font-bold bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 rounded-none">
                            {doc.docType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans font-medium truncate">
                          {doc.fileName || 'verification_doc.pdf'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.docUrl && (
                          <a
                            href={doc.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-none border border-transparent hover:border-blue-300 transition-colors cursor-pointer"
                            title="View uploaded document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!isProfileLocked ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-none border border-transparent hover:border-rose-300 transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-headline font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-none">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Established Banner */}
            {(company?.verified || isProfileLocked) && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-start gap-3 shadow-2xs mt-3">
                <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="font-headline font-bold text-xs tracking-wider text-emerald-900 dark:text-emerald-100">
                    Trust Established
                  </h5>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans font-medium">
                    Your company account is verified. Candidates matching your skill requirements will see your verified status.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Social Profile Links */}
          <div id="section-linkedin" className="p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Social Profile Links</span>
              </h3>
              <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                SECTION 4 OF 5
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div id="field-linkedin" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Company LinkedIn Page
                  </label>
                  {isProfileLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  readOnly={isProfileLocked}
                  placeholder="https://linkedin.com/company/..."
                  className={`w-full border rounded-none px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none transition-all shadow-2xs ${
                    isProfileLocked
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                      : fieldErrors.linkedin
                        ? 'bg-white dark:bg-slate-900 border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-700'
                  }`}
                  value={linkedin}
                  onChange={e => {
                    if (isProfileLocked) return;
                    const cleaned = e.target.value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g, '');
                    setLinkedin(cleaned);
                    clearFieldError('linkedin');
                  }}
                  onKeyDown={e => {
                    if (isProfileLocked) return;
                    if (e.key === ' ' || (!/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/.test(e.key) && !['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                      e.preventDefault();
                    }
                  }}
                />
                {fieldErrors.linkedin && (
                  <p className="text-xs text-rose-600 font-sans font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{fieldErrors.linkedin}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Office Showcase Gallery */}
          <div className="p-6 sm:p-7 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Office Showcase Gallery</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-headline font-bold text-slate-500 dark:text-slate-400 tracking-wider hidden sm:inline-block">
                  SECTION 5 OF 5
                </span>
                {!isProfileLocked && (
                  <>
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
                  </>
                )}
                {isProfileLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-headline font-medium">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                )}
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
                  {isProfileLocked ? 'No showcase photos uploaded.' : "No showcase photos uploaded yet. Click 'Upload Photo' to build your office profile gallery."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden group shadow-2xs">
                    <img src={p} alt="Office" className="w-full h-full object-cover" />
                    {!isProfileLocked && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-none opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Unified Submit Button or Locked Status Banner */}
        <div>
          {isProfileLocked ? (
            <div className="w-full py-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-2 select-none shadow-2xs">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Company Profile Completed & Verified (Editing Locked)</span>
            </div>
          ) : (
            <button 
              type="submit" 
              disabled={savingProfile}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-headline font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Profile & Verification Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          )}
        </div>

      </form>

      {/* Local Slide-in Toast Notification fallback */}
      {localAlert && (
        <ToastNotification 
          msg={localAlert.message} 
          type={localAlert.type} 
          onClose={() => setLocalAlert(null)} 
        />
      )}
    </div>
  );
}
