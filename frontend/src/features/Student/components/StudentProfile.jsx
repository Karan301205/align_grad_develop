import React from 'react';
import { CheckCircle, ChevronRight, Plus, ChevronDown, Star, Award, Briefcase, DollarSign } from 'lucide-react';
import { ALL_SKILLS } from '../../../constants';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { DOMAIN_OPTIONS } from '../../../constants/domains';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';
import { formatErrorMessage } from '../../../utils/errorFormatter';


export default function StudentProfile({
  profile,
  setProfile,
  username,
  setUsername,
  profilePic,
  setProfilePic,
  token,
  skillsList,
  setSkillsList,
  selectedNewSkill,
  setSelectedNewSkill,
  bio,
  setBio,
  nationality,
  setNationality,
  gender,
  setGender,
  profileEmail,
  setProfileEmail,
  dob,
  setDob,
  phone,
  setPhone,
  resumeUrl,
  setResumeUrl,
  socialLinks,
  setSocialLinks,
  educationList,
  setEducationList,
  experienceList,
  setExperienceList,
  certificatesList,
  setCertificatesList,
  projectsList,
  setProjectsList,
  cocurricular,
  setCocurricular,
  newEdu,
  setNewEdu,
  newExp,
  setNewExp,
  newCert,
  setNewCert,
  newProj,
  setNewProj,
  newCocurricular,
  setNewCocurricular,
  profileTab,
  setProfileTab,
  submittingProfile,
  feedbackMsg,
  handleUpdateProfile,
  handleRatingChange
}) {
  const tabsList = [
    { id: 'general', label: 'General' },
    { id: 'socials', label: 'Social Links' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'cocurricular', label: 'Co-curricular' }
  ];

  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = React.useState(false);
  const [usernameStatus, setUsernameStatus] = React.useState(''); // 'loading', 'available', 'taken', 'invalid', ''
  const [usernameMsg, setUsernameMsg] = React.useState('');

  const gigExperienceItems = (experienceList || []).filter(exp => exp.expType === 'Gig');
  const completedGigsCount = gigExperienceItems.length;
  let totalRating = 0;
  let ratedGigsCount = 0;
  gigExperienceItems.forEach(exp => {
    const match = exp.description?.match(/Rating:\s*(\d+)\/5/);
    if (match) {
      totalRating += parseInt(match[1]);
      ratedGigsCount++;
    }
  });
  const averageRating = ratedGigsCount > 0 ? (totalRating / ratedGigsCount).toFixed(1) : 'N/A';

  const [editingEduIdx, setEditingEduIdx] = React.useState(null);
  const [editingExpIdx, setEditingExpIdx] = React.useState(null);
  const [editingCertIdx, setEditingCertIdx] = React.useState(null);
  const [editingProjIdx, setEditingProjIdx] = React.useState(null);
  const [editingCocurricularIdx, setEditingCocurricularIdx] = React.useState(null);

  const debouncedCheckRef = React.useRef(null);

  const checkUsernameAvailability = async (val) => {
    if (!val) {
      setUsernameStatus('');
      setUsernameMsg('');
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(val)) {
      setUsernameStatus('invalid');
      setUsernameMsg('3-15 characters, letters/numbers/underscores only');
      return;
    }

    setUsernameStatus('loading');
    setUsernameMsg('Checking availability...');

    try {
      const res = await apiFetch(`/student/check-username?username=${val}`, { token });
      const data = await res.json();
      if (res.ok && data.available) {
        setUsernameStatus('available');
        setUsernameMsg(data.isCurrent ? 'Already yours!' : '✓ Username is available!');
      } else {
        setUsernameStatus('taken');
        setUsernameMsg(data.reason || '✗ Username is already taken');
      }
    } catch (err) {
      console.error(err);
      setUsernameStatus('error');
      setUsernameMsg('✗ Could not check availability.');
    }
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);

    if (debouncedCheckRef.current) {
      clearTimeout(debouncedCheckRef.current);
    }

    debouncedCheckRef.current = setTimeout(() => {
      checkUsernameAvailability(val);
    }, 400);
  };

  const [compressing, setCompressing] = React.useState(false);
  const [photoError, setPhotoError] = React.useState('');
  const [showUploadSuccess, setShowUploadSuccess] = React.useState(false);

  const compressImage = (file, maxKB = 100) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 300;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          while ((dataUrl.length * 0.75) > maxKB * 1024 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };
  const base64ToBlob = (base64Data, contentType) => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      return;
    }

    setPhotoError('');
    setCompressing(true);

    try {
      // 1. Compress image to under 100KB Base64
      const compressedBase64 = await compressImage(file, 100);

      // 2. Convert base64 data to binary Blob for S3 upload
      const imageBlob = base64ToBlob(compressedBase64, 'image/jpeg');

      // 3. Request pre-signed URL from server
      const urlRes = await apiFetch('/upload/request-url', {
        token,
        method: 'POST',
        json: {
          fileType: 'image',
          fileName: file.name || 'profile_pic.jpg',
          contentType: 'image/jpeg'
        }
      });

      if (!urlRes.ok) {
        throw new Error('Failed to request S3 upload URL from server.');
      }

      const { uploadUrl, publicUrl } = await urlRes.json();

      // 4. Upload binary Blob directly to S3 via pre-signed URL
      const s3Res = await putFileToS3(uploadUrl, imageBlob, 'image/jpeg', token);

      if (!s3Res.ok) {
        throw new Error('Failed to upload profile picture to S3.');
      }

      // 5. Update state with S3 public URL
      setProfilePic(publicUrl);
      setShowUploadSuccess(true);
      setTimeout(() => {
        setShowUploadSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Profile pic S3 upload error:', err);
      setPhotoError('Failed to upload image. Please try again.');
    } finally {
      setCompressing(false);
    }
  };

  const [countryCode, setCountryCode] = React.useState('+91');
  const [localPhone, setLocalPhone] = React.useState('');
  const [phoneWarning, setPhoneWarning] = React.useState('');
  const [isPhoneInitialized, setIsPhoneInitialized] = React.useState(false);

  // Parse phone number prop only once when it's populated/changed by parent
  React.useEffect(() => {
    if (phone && !isPhoneInitialized) {
      const parts = phone.trim().split(' ');
      if (parts.length >= 2 && parts[0].startsWith('+')) {
        setCountryCode(parts[0]);
        setLocalPhone(parts.slice(1).join(''));
      } else if (phone.startsWith('+')) {
        const match = phone.match(/^(\+\d{1,4})(\d+)$/);
        if (match) {
          setCountryCode(match[1]);
          setLocalPhone(match[2]);
        } else {
          setLocalPhone(phone);
        }
      } else {
        setLocalPhone(phone);
      }
      setIsPhoneInitialized(true);
    }
  }, [phone, isPhoneInitialized]);

  const validatePhone = (code, number) => {
    const digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.length === 0) {
      setPhoneWarning('');
      return true;
    }

    let expectedLength = null;
    let countryName = '';

    if (code === '+91') { expectedLength = 10; countryName = 'India'; }
    else if (code === '+1') { expectedLength = 10; countryName = 'USA/Canada'; }
    else if (code === '+44') { expectedLength = 10; countryName = 'UK'; }
    else if (code === '+61') { expectedLength = 9; countryName = 'Australia'; }
    else if (code === '+65') { expectedLength = 8; countryName = 'Singapore'; }

    if (expectedLength && digitsOnly.length !== expectedLength) {
      setPhoneWarning(`✗ Mobile number must be exactly ${expectedLength} digits for ${countryName} (${code})`);
      return false;
    } else if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneWarning('✗ Invalid phone number length (must be between 7 and 15 digits)');
      return false;
    } else {
      setPhoneWarning('');
      return true;
    }
  };

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    validatePhone(newCode, localPhone);
    setPhone(`${newCode} ${localPhone}`);
  };

  const handleLocalPhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setLocalPhone(val);
    validatePhone(countryCode, val);
    setPhone(`${countryCode} ${val}`);
  };

  const [class10Percent, setClass10Percent] = React.useState('');
  const [class12Percent, setClass12Percent] = React.useState('');
  const [class11Stream, setClass11Stream] = React.useState('');

  const [domainSearch, setDomainSearch] = React.useState('');
  const [showDomainDropdown, setShowDomainDropdown] = React.useState(false);

  const filteredDomains = DOMAIN_OPTIONS.filter(opt => {
    if (opt === "Other") return false;
    return opt.toLowerCase().includes(domainSearch.toLowerCase());
  });

  const originalProfileRef = React.useRef(null);

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dob);
  const isUnderage = age !== null && age < 17;

  const [certFileUploadError, setCertFileUploadError] = React.useState('');
  const [processingCertFile, setProcessingCertFile] = React.useState(false);

  const handleCertFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > 100) {
      alert('Maximum file size allowed is 100 KB.');
      e.target.value = '';
      return;
    }

    setCertFileUploadError('');
    setProcessingCertFile(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCert(prev => ({ ...prev, attachment: event.target.result }));
        setProcessingCertFile(false);
      };
      reader.onerror = () => {
        setCertFileUploadError('Failed to read file.');
        setProcessingCertFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Cert file process error:', err);
      setCertFileUploadError('Failed to process file.');
      setProcessingCertFile(false);
    }
  };

  React.useEffect(() => {
    if (profile && (!originalProfileRef.current || feedbackMsg?.toLowerCase().includes('success'))) {
      originalProfileRef.current = JSON.parse(JSON.stringify(profile));
    }
  }, [profile, feedbackMsg]);

  const hasChanges = React.useMemo(() => {
    if (!originalProfileRef.current) return false;
    const orig = originalProfileRef.current;

    // Compare simple fields
    if ((orig.name || '') !== (profile?.name || '')) return true;
    if ((orig.username || '') !== (username || '')) return true;
    if ((orig.profilePic || '') !== (profilePic || '')) return true;
    if ((orig.bio || '') !== (bio || '')) return true;
    if ((orig.nationality || '') !== (nationality || '')) return true;
    if ((orig.gender || '') !== (gender || '')) return true;
    if ((orig.email || '') !== (profileEmail || '')) return true;
    if ((orig.dob || '') !== (dob || '')) return true;
    if ((orig.phone || '') !== (phone || '')) return true;
    if ((orig.resumeUrl || '') !== (resumeUrl || '')) return true;

    // Compare socialLinks
    const origSocials = orig.socialLinks || {};
    const currSocials = socialLinks || {};
    const socialKeys = [
      'linkedin', 'github', 'hackerEarth', 'hackerRank', 'codechef', 'leetcode', 'codeforces', 'kaggle', 'portfolio',
      'showLinkedin', 'showGithub', 'showHackerEarth', 'showHackerRank', 'showCodechef', 'showLeetcode', 'showCodeforces', 'showKaggle', 'showPortfolio'
    ];
    for (const key of socialKeys) {
      const origVal = origSocials[key] === undefined ? '' : String(origSocials[key]);
      const currVal = currSocials[key] === undefined ? '' : String(currSocials[key]);
      if (origVal !== currVal) return true;
    }

    // Compare lists
    if (JSON.stringify(orig.education || []) !== JSON.stringify(educationList || [])) return true;
    if (JSON.stringify(orig.experience || []) !== JSON.stringify(experienceList || [])) return true;
    if (JSON.stringify(orig.certificates || []) !== JSON.stringify(certificatesList || [])) return true;
    if (JSON.stringify(orig.projects || []) !== JSON.stringify(projectsList || [])) return true;
    if (JSON.stringify(orig.cocurricular || []) !== JSON.stringify(cocurricular || [])) return true;

    return false;
  }, [
    profile, username, profilePic, bio, nationality, gender, profileEmail, dob, phone, resumeUrl, cocurricular,
    socialLinks, educationList, experienceList, certificatesList, projectsList
  ]);

  const isSaveActive = React.useMemo(() => {
    const ageValue = calculateAge(dob);
    if (ageValue !== null && ageValue < 17) return false;

    const isFirstTime = !profile || !profile.name;
    return isFirstTime || hasChanges;
  }, [profile, hasChanges, dob]);

  const handleClass10Change = (val) => {
    setClass10Percent(val);
    const c12 = class12Percent;
    setNewEdu({
      ...newEdu,
      degree: `Class 10: ${val}% | Class 12: ${c12}%`
    });
  };

  const handleClass12Change = (val) => {
    setClass12Percent(val);
    const c10 = class10Percent;
    setNewEdu({
      ...newEdu,
      degree: `Class 10: ${c10}% | Class 12: ${val}%`
    });
  };

  const handleStreamChange = (val) => {
    setClass11Stream(val);
    setNewEdu({
      ...newEdu,
      fieldOfStudy: `Class 11 Stream: ${val}`
    });
  };

  const handleEduTypeChange = (e) => {
    const type = e.target.value;
    setClass10Percent('');
    setClass12Percent('');
    setClass11Stream('');
    setNewEdu({
      ...newEdu,
      eduType: type,
      degree: '',
      fieldOfStudy: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ageValue = calculateAge(dob);
    if (ageValue !== null && ageValue < 17) {
      alert('You must be at least 17 years old to access this platform.');
      return;
    }
    const isValid = validatePhone(countryCode, localPhone);
    if (!isValid) {
      alert('Please fix the phone number validation error before saving.');
      return;
    }
    handleUpdateProfile(e);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-success-container border border-success/30 text-on-success-container rounded-xl shadow-[var(--shadow-floating)] transition-all duration-500 ease-in-out ${showUploadSuccess
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}>
        {/* <CheckCircle className="w-5 h-5 text-success animate-bounce" /> */}
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Success</span>
          <span className="text-[11px] opacity-90">Photo uploaded successfully!</span>
        </div>
      </div>
      <PageHeader
        title="Profile & Ratings"
        subtitle="Update your professional details, social portfolios, academic history, and self-rate your proficiencies"
      />

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 w-full ${feedbackMsg.includes('success')
            ? 'bg-success-container border-success/30 text-on-success-container items-center'
            : 'bg-error-container border-error/30 text-on-error-container'
          }`}>
          {feedbackMsg.includes('success') ? (
            <>
              <CheckCircle className="w-5 h-5 shrink-0 text-success" />
              <span className="font-medium">{feedbackMsg}</span>
            </>
          ) : (
            formatErrorMessage(feedbackMsg)
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden grid grid-cols-12 min-h-[650px]">

        {/* Left Side: Sub-tabs Sidebar */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low border-r border-outline-variant p-6 flex flex-col gap-1">
          {[
            { id: 'general', label: 'General' },
            { id: 'socials', label: 'Social Links' },
            { id: 'education', label: 'Education' },
            { id: 'experience', label: 'Experience' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'projects', label: 'Projects' },
            { id: 'skills', label: 'Skills' },
            { id: 'cocurricular', label: 'Co-curricular' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProfileTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all text-xs flex items-center justify-between ${profileTab === tab.id
                  ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
            >
              <span>{tab.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          ))}

          <Button
            type="submit"
            loading={submittingProfile}
            disabled={!isSaveActive}
            fullWidth
            size="sm"
            className="mt-6 font-bold uppercase tracking-wider text-xs shadow-glow disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
          >
            Save Profile & Ratings
          </Button>
        </div>

        {/* Right Side: Tab Form Panel */}
        <div className="col-span-12 md:col-span-8 p-8 flex flex-col justify-between space-y-6">
          {(() => {
            const currentTabIdx = tabsList.findIndex(t => t.id === profileTab);
            const prevTab = currentTabIdx > 0 ? tabsList[currentTabIdx - 1] : null;
            const nextTab = currentTabIdx < tabsList.length - 1 ? tabsList[currentTabIdx + 1] : null;
            return (
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 select-none">
                <button
                  type="button"
                  disabled={!prevTab}
                  onClick={() => prevTab && setProfileTab(prevTab.id)}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-mono font-bold text-on-surface flex items-center gap-1.5 transition-all"
                >
                  &larr; Prev: {prevTab ? prevTab.label : 'None'}
                </button>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {tabsList[currentTabIdx]?.label}
                </span>
                {nextTab ? (
                  <button
                    type="button"
                    onClick={() => setProfileTab(nextTab.id)}
                    className="px-3 py-1.5 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-mono font-bold text-on-surface flex items-center gap-1.5 transition-all"
                  >
                    Next: {nextTab.label} &rarr;
                  </button>
                ) : (
                  <Button
                    type="submit"
                    loading={submittingProfile}
                    disabled={!isSaveActive}
                    size="sm"
                    className="font-bold uppercase tracking-wider text-[11px] shadow-glow disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none py-1.5 px-4"
                  >
                    Save
                  </Button>
                )}
              </div>
            );
          })()}

          <div className="flex-1 space-y-6 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">

            {/* Panel 1: General */}
            {profileTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">General Information</h3>

                {/* Profile Pic Upload Container */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-surface-container-low border border-outline-variant rounded-xl mb-4">
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-2xl overflow-hidden shrink-0">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div className="space-y-2 text-center md:text-left flex-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Profile Picture</label>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Recommended: square image. Automatically resized and compressed to under 100KB.
                    </p>
                    <div className="flex gap-2 justify-center md:justify-start">
                      <label className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all">
                        {compressing ? 'Processing...' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePicChange}
                          disabled={compressing}
                        />
                      </label>
                      {profilePic && (
                        <button
                          type="button"
                          onClick={() => setProfilePic('')}
                          className="px-3 py-1.5 bg-error-container border border-error/20 text-[10px] font-bold text-on-error-container rounded-xl hover:bg-error-container/80 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {photoError && (
                      <p className="text-[10px] text-error font-medium">{photoError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={profile?.name || ''}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface font-mono"
                      value={username || ''}
                      onChange={handleUsernameChange}
                      placeholder="e.g. johndoe"
                      required
                    />
                    {usernameMsg && (
                      <p className={`text-[10px] mt-1.5 font-medium ${usernameStatus === 'available' ? 'text-success' :
                          usernameStatus === 'loading' ? 'text-warning animate-pulse' :
                            'text-error'
                        }`}>
                        {usernameMsg}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Describe Yourself</label>
                  <textarea
                    rows="3"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Software Engineer specializing in Full-Stack..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Nationality</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                    >
                      <option value="">Select Nationality</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Germany">Germany</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Gender</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="name@domain.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                    />
                    {isUnderage && (
                      <p className="text-[10px] text-error font-medium mt-1.5 animate-pulse">
                        ✗ You must be at least 17 years old to access this platform.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Phone Number</label>
                  <div className="flex gap-3">
                    {/* Country Code Select */}
                    <select
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface w-24 shrink-0 font-mono"
                      value={countryCode}
                      onChange={handleCountryCodeChange}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+65">+65 (SG)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+82">+82 (KR)</option>
                      <option value="+81">+81 (JP)</option>
                    </select>

                    {/* Local Number input */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface font-mono"
                        value={localPhone}
                        onChange={handleLocalPhoneChange}
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>
                  {phoneWarning && (
                    <p className="text-[10px] text-error mt-1.5 font-medium">{phoneWarning}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">Resume / Portfolio Link</label>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition-all text-on-surface"
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/your-resume.pdf"
                  />
                </div>
              </div>
            )}

            {/* Panel 2: Social Links */}
            {profileTab === 'socials' && (
              <div className="space-y-4">
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Social Profiles</h3>
                <p className="text-xs text-on-surface-variant mb-4">Tick the checkbox to show the link on your resume.</p>
                {[
                  {
                    key: 'linkedin',
                    label: 'LinkedIn Profile Link',
                    placeholder: 'https://linkedin.com/in/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABW0lEQVR4nO2ZvUoDQRRGjyh2/oC2goW+ge+g4C5aikI6S1/BRgJ5EJ/BThP1QewUfxB0U6W5sjCNYXZnZi32jtwDXxPuzH6HzWazCRiG0ZUjYAJMAek5U2AMlKkSIwXlpSHDlDMhylPEiEwUFJVA7mJEKgVFJZDvGBHJJEH6LigmMkfb4hfgBNhwOQPechTZV/RxHaRt8apnfi1HkdIzX+Qo8g4MgE2X+hp5zVFEFCVI3wXFRObosjhl5tHdi7aAZWAF2AMugY8cROob50Hg2OvAjXaRnZiDA0vAg2aRFLaBWQ4iixEz15pFLoBnN/cEnLfMnmoVOU58/t7VKnLfsGf9GwEdvoz2JvLZsGf9uo8FrSJ/3VdMBBPxYiKYCCYiJuJHTIT2xZoS5N+IVApKSiBfMSJjBUUlkNsYkVJBUQnkkEiGCspKQ65IpHD/nmq4Zir3doo+E4Zh8IsfFdRDh8Z3YCsAAAAASUVORK5CYII=" alt="linkedin" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'github',
                    label: 'GitHub Profile Link',
                    placeholder: 'https://github.com/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACi0lEQVR4nO2YS0hVURSGv+ulhzRyUFCIZYNe0qwGNbWEdNTAWRBBo3AmWYKRQRmZ1jScFSRJSNhrakERNQl6QUSBVDQPe5F1YscKDoe9jse717EL7g8WnHvu3v9ae6/9PBCJRCKROmM90AX0AMfE3HMn0EKd0gaMAu+AZB57C5wHtlIHbAGmgN8FAs+aq3MD2Pw/Am8ABoAfNQSete9Av2guCquAuwaBZ+2WaJce/MMSgk/EHpTZiIaSej7xZKKU4TSQcfQT2AHsAa7I76JBurKXgXZgJzCX+d/NCfPVJjthn3uWUpehaWAIOAx0i7nns8A9KbMtU/elZ2JvsmzAlKcXHxnqP/boT1qJtynr/GsrB8Abj/4vq81uJGf9rhroV0XL5+Ocgb56PDiDHUOKD5eZIFoU4W9AE3Y0iabPV3OIcJciehN7biu+9oWI9iiiF7DnouLrSIhovyLahz19iq+gTe2oIjqIPacUXy6GmjmkiF7FnmuKr4Mhop2K6EfjA1cV+FTGJF6Tc9vabxc/3YoP53t1qPgrRfw9sM4g+GbJqM/HCwP9v9t5othToDVAeyPwLEffnWCDaU2d112vd8inkll591nuCmsXoOkyd0LqasHPyScaEyZTF5HjQAXYKyfG9Hh1KT+ZozMoZYp8xZjAEJeFLynxA/K+1+PYNUyjo0DgiWTXrPd9m9qH1OXbnZfuAE+AS8CKHI3Ggr3fSwlUJK3/nAzXqKOdOhOxcfFVCiuB+ylnY8B2YDmwrOCymteA6XkyaEKjsu27ofE1oAHk0kGLQkXmRHpiJzU2YFbGfGnDJo8NwPXUPjFToM5Map2fqJdP7m7JOw3sKlB2t5Q1XyYjkUgksvT4A9CAyJgLiLHIAAAAAElFTkSuQmCC" alt="github" className="w-6.5 h-6.5 object-contain shrink-0" />
                  },
                  {
                    key: 'hackerEarth',
                    label: 'HackerEarth Profile Link',
                    placeholder: 'https://hackerearth.com/@username',
                    logo: (
                      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="Hackerearth--Streamline-Simple-Icons" className="w-4.5 h-4.5 shrink-0" fill="currentColor">
                        <title>HackerEarth</title>
                        <path d="M18.447 20.936H5.553V19.66h12.894zM20.973 0H9.511v6.51h0.104c0.986 -1.276 2.206 -1.4 3.538 -1.306 1.967 0.117 3.89 1.346 4.017 5.169v7.322c0 0.089 -0.05 0.177 -0.138 0.177h-2.29c-0.09 0 -0.253 -0.082 -0.253 -0.177V10.6c0 -1.783 -0.58 -3.115 -2.341 -3.115 -1.282 0 -2.637 0.892 -2.637 2.77v7.417c0 0.089 -0.008 0.072 -0.102 0.072h-2.29c-0.09 0 -0.29 0.022 -0.29 -0.072V0H3.178c-0.843 0 -1.581 0.673 -1.581 1.515v20.996c0 0.843 0.738 1.489 1.58 1.489h17.797c0.843 0 1.431 -0.646 1.431 -1.489V1.515c0 -0.842 -0.588 -1.515 -1.43 -1.515" strokeWidth="1"></path>
                      </svg>
                    )
                  },
                  {
                    key: 'hackerRank',
                    label: 'HackerRank Profile Link',
                    placeholder: 'https://hackerrank.com/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABl0lEQVR4nLWWu0qDQRCFP9BKBQu1sDHgGxgvxOANfAGfwkrFzkZFEFSwUxFsxIew0spSI6igUcGEBALemmhSeeGXhSmG5d/N/qIDp5mcM5PM7p4JhEUXsAIUBctAJ38QbcACUAUiCzVgA2j/TeFmYB54jSls4wWYBZpCi/cDuYDCkYVLINNoHHvAtyWsA9eBTYx2B2i1i6eA+xhBFUgDLcBxgl+TB3p0gwMH8QzoFs5qwpHt6wa+mfcJ50rlnoBpYM2jO9UNyh7igHBurREg43PpSrqB7zoOCaeocua8TAx6dM+6Qd1DHBZOReUKkst4dO+6wZeHOCKcTbnGBuuSy3p0n6ENxnDHqEf3oYk1D3FcOIfAueBIchOhI/IdclY4BZV7lNxk6CGXA27RncpVAhqUQh/aFNALPKic+ULI+QQ9NJdVRA5sKQ/LhVhFynqpjXAi7mus/S3m8xvb7BCL3Y2x68iBfMwDNdptcV9npMVFo4S4aLRw7JU5J+uwUWFzHWeSrEx7bP+y9O0wf1GW5LEZLAIdIcofdeZeKYubThQAAAAASUVORK5CYII=" alt="hackerRank" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'codechef',
                    label: 'CodeChef Profile Link',
                    placeholder: 'https://codechef.com/users/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFjUlEQVR4nO2aeWxVVRDGfy2CtlJDFRcQMVHQiqJBIkpcAyh1wR0XggbcRepeIMGoMY2xaEUNaAyKCzUoKlUTrVLFFa0QFNS44PKHKyKiogXF1pqJ300mJ+e10Hf72hq+5CbvnHvPnDvnzpn5Zs6DrWgV+UAxUEQXw3bABGAh8CPwD9DsrnXAZ7p/KzAO2JtOhN2BCmBN8OJ2/S4FNkXuJdf3wBxgFJCXa5M5ErgFeB34273UUuAaYHZkXG/gFOBM4EagBlgbKPU+MCYXShwBfBhMvhF4UvcMl7vfHqbEbpFFOQSYD3znZM4FeraXEmOBvzSR7YE7gRuAnYPn5gE9IuMfySC3F3A1sC1wFdCgOT4C+qatxAFugueAAvWbTR8TPFsdGT8wQ7/hJuBQ1y5xX/0TYCdSxDwJfgCYAhS6eycB27v2U5Hx1+qFQ3QH3pCJeewIrNCciyL32wQTsl7udE9gMvCaE74rcIF73txriAXA+ZH+02RWMQwANkiZTM9sEQZK2JfOnJYBpe4Z+1IJXorI+FSeLsRc7ZEQBUAdcIbm/k0LlhWGStg7rs880x2ubZNuo9/vRkzB4skeEbOqzDDn3VLS8Izmn5WlHuwjQRaV/Wd/xbWf0HOJUmaCCQo13iK/h7noYZH5Bik2Hav2iRpfm60i3eWxmoB+rv8D93sGcIJ+20oe5+71kq2HGJ9hEz8KrAa6qX29FLmPFDBfwspd39PALvo92W34aUBZENG/jchMFPfoIzpzj9pmrp9r7uPTUGSMhK0MXOpIF7WNmiSeyNtzT8WFEN5ZJCjXPMPVvkTtj9PiYT0cKTxIfcOdWxzq4oTtj5fd2Hy56xCmfIiV8nB5YsbrNefppIhZEmr7AW3exG7NxKrcs0uCscZuPbrJtXr0l/xpkr1M7cdIGYdJ8DfuM3sTMu6VoDogffZyHkYeRwR9FwON4lcPaa4vlJylijzHUI0PGW6WV0u8S4JJwMGubQmXx17A4KDPXv55jbU5/og8kxoe1yS2eiha2/5AGV+CwUE73Nj7RyK1sd0qMWyjQ2fRjiiTIkYiE1s/W79HiIZXiFutUnCs056x/TQVGC3JnDCBRI4o8JPk3047Y1/HfQrlzewFl7eQysYuW/G3gIskp5+7tzhQst1QrwnvUr6QvMBa5SrTFbVLFWdOVtts/3652EY37itxLvv9q7xXTnBFsLrLZV6xrDATiqTc0kDWVHKIvq7UM9N5rbZ6wtmSZdTEJ2g5wdua/JzISh8l25+i+pWt8kSlsz6zTFDqKig5R+K9nlVUv06eqamVTd4o+j9JZNJwtO69mns1/osBjcob/gxKQ/a1HgRu01Wp+LMiKNQ1KIGa4LxVh2CRc6W1IoGt2Xix6P6Lka9naUGHYD9VDC22tLXElKSxzfo6XRqWDtybxYKkCiOBQ0Q1RinWdPrjhAHApUG+na/EymLCqSohWYl1S2B5fpnS3Xb3VJUqJNRniAnZ4DzgB5HHalVTUkWhssIN4knjM5C6PHGhVap7xTBSxYT6SPHbYKZ5uKr7G4MKZtZYLK9S0UoBYIhIX7lWNoYXVNhbrWifCYNU1EuKdKlgoWKFlUwvbIFb9VaQe1MFhBiqlJ806MAnhonAL6rSpH6CdaCqiRbEvhaPiuXS47Tq5rliKFZKO8MV4Hwhr0YL5o8Z2gUlqgQ2KTqnCcsuHwZ2IIcYtpnV8SRJytNX7bIoEI2fqdPfTov+kb7RMr8al6+U6AzRaP+VkYPOnKW3mTBHm9tOoy5z+XxyNamEuiToX6Pj7bHyZFY96VBMbyWR2qTEq7aV56ym1aHoE5yPh5e5abTR17VQGjqXTsJ8F4hSNCtrrHMnTr5oYab4s1PgPR1DdCrkKeBtzlFykf4gsBX/W/wL6eSc61JkiqEAAAAASUVORK5CYII=" alt="codechef" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'leetcode',
                    label: 'LeetCode Profile Link',
                    placeholder: 'https://leetcode.com/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABcUlEQVR4nLWVSytFURTHf96vsRkjX0CGBnTiSuIDmAmZmPgG0r0DJckzYSiZiYi6MvAVlJmJieRKHhfXu1371Go711nn3ONfa3LWf/3Wbp+914boKgeWgAdgJEZ9KHwd+LZxnCS8GMgT8BfASxK+LOAFYCBJ+IqAmxhMEr7owE3cA2mgslT4fABcxgFQE7fBnAPbBSaBTeBDfN8DqqPCZwXgExh28ikgLzw7QIUWPiMKv4CxIr5O4FF4+zTwtAMfD/G3AzngGmgKg3dbqN9gQrMi+5OrNMZ9AZ/iH5Sz8JuA8+0BdyFH1g9zwjaCGhSs4SwgN62Ey4v4Sxc2+Rrww5qBLSCriMNio2RBrOAUaNDurVZmlbeiyQlQr6jrB3q1TTqAJ9EkC9T94c8Ir7kTKnnOGDgCakNuvBknrURQF/DsNGm0ObNtqw58iBhK2WdRPpHn9rGX42Q0DtxXjwOU8VYq3FeLfewvgXfgCtgG2jTVPwrwoQTdUqOjAAAAAElFTkSuQmCC" alt="leetcode" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'codeforces',
                    label: 'CodeForces Profile Link',
                    placeholder: 'https://codeforces.com/profile/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAdUlEQVR4nO2VQQrAIAwE5zE+UegHah9ZfEg9pRQUSmtA2hw8ZGFBwq4DOSi4jLQBBZDq65wwVLld3nxYAkTxHIAARGCpjnVmBsid4m4JkIGyzAAI2qqtAFlbtRVAtIwDmhzA58zIU1z+ZFLnM1kf5WSUcfHSCQs09IEYzMYTAAAAAElFTkSuQmCC" alt="codeforces" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'kaggle',
                    label: 'Kaggle Profile Link',
                    placeholder: 'https://kaggle.com/username',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA1UlEQVR4nO3WMQrCQBCF4T9WVnoJG/EA9h5AULDIEewtlYAgqGBn7xns7FLYiq3WXkBQEKtEFlIM4yIGJ2CRgWlml/exU4SAv3ZAmnWPAioWQFgCviqB/wcCYA4cRHesgABYi3PXK8sXLFT4Mm/4J2Cmwt2asAKmVuE+YKTCJ7+Ea2Cvwh2GJZCKToBBkUAK3IGWJZAAY+AiZmegbgVE2awNPMV8C1QsgFDMh2pdkTXgaqPW18cYqAJHcX4DmpaAqwZwFXdOQC0P8M1vSxd4iHvuC/tWL9T+il5MsxLWAAAAAElFTkSuQmCC" alt="kaggle" className="w-4.5 h-4.5 object-contain shrink-0" />
                  },
                  {
                    key: 'portfolio',
                    label: 'Personal Portfolio Link',
                    placeholder: 'https://myportfolio.com',
                    logo: <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAByElEQVR4nO2YzStEURiHn/JR2LCQKWQUkRUlHzsr/gUslLUFZWNlZaZs5Z/QZEmxVaSoYW2hFOUrxqyUObp13MY0M/frXPe9uk/9ms095/09zZ3TnQsJ/5MeIAcUAOUy1rX7wCCCJF48CFTGWtuNAHK60IGWcot17aFeu4cACrqMF4kfevXaNwSgdKJab4xEJGyRFJAF8kAxwGlkOkXdKQN0OUksCCuvauQDmK8lsQiUBJRULlOqJpPSllGXUz6+mV+3WVZAKb/ZKhe5ElDIb6wDwCaOt5XSsbrbhDnoC3jVn2HNsDG98QOwCYwCTXrGLvAZJ5FjoIPqtOhj/km6yC3QijP9hmVsTG24invWJIuMeRDpkyyS9iDSLFlkyoNIt2SRDQ8iS5JFpj2IjEgWGfYg0ilZZAdocCmSkSyigEkXEmnDM21MbrqNM+txECkCQ3UkBgK+YlV/JWLlpo7IRQjzbFSYm1dwHyeRxzoi13EReQZm64hMAHeSRfLACtCOM23AMnAqSSQPzOCfceAkapFL/fc1KI3AUZQic5gjyENkYBHrwc8k71H+RiTEJuoiiQiJCCJjE3WRRIQKkXMBZfzmrFwkASF8AwtIav6AvpvW" alt="portfolio" className="w-4.5 h-4.5 object-contain shrink-0" />
                  }
                ].map(link => {
                  const showKey = `show${link.key.charAt(0).toUpperCase()}${link.key.slice(1)}`;
                  const hasLink = socialLinks[link.key] !== undefined && socialLinks[link.key] !== null && String(socialLinks[link.key]).trim() !== '';
                  return (
                    <div key={link.key} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center gap-4">
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {hasLink && (
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-4 h-4 animate-fade-in"
                              checked={socialLinks[showKey] || false}
                              onChange={e => setSocialLinks({ ...socialLinks, [showKey]: e.target.checked })}
                            />
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {link.logo}
                          <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">{link.label}</label>
                        </div>
                        <input
                          type="url"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                          value={socialLinks[link.key] || ''}
                          onChange={e => setSocialLinks({ ...socialLinks, [link.key]: e.target.value })}
                          placeholder={link.placeholder}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Panel 3: Education */}
            {profileTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Education History</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{educationList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {educationList.length > 0 && (
                  <div className="space-y-3">
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{edu.degree} - {edu.fieldOfStudy}</p>
                          <p className="text-xs text-on-surface-variant">{edu.institute} ({edu.eduType})</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {edu.startDate} to {edu.endDate} • {edu.gradeType}: {edu.gradeValue || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const item = educationList[idx];
                              setNewEdu({ ...item });
                              if (item.eduType === 'High School') {
                                const match10 = item.degree.match(/Class 10:\s*([\d.]+)%/);
                                const match12 = item.degree.match(/Class 12:\s*([\d.]+)%/);
                                const match11 = item.fieldOfStudy.match(/Class 11 Stream:\s*(.*)/);
                                if (match10) setClass10Percent(match10[1]);
                                if (match12) setClass12Percent(match12[1]);
                                if (match11) setClass11Stream(match11[1]);
                              }
                              setEditingEduIdx(idx);
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-mono transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEducationList(educationList.filter((_, i) => i !== idx));
                              if (editingEduIdx === idx) {
                                setEditingEduIdx(null);
                                setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                                setClass10Percent('');
                                setClass12Percent('');
                                setClass11Stream('');
                              }
                            }}
                            className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Education Record</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Education Type</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newEdu.eduType}
                        onChange={handleEduTypeChange}
                      >
                        <option value="">Select level of education</option>
                        {!educationList.some(e => e.eduType === 'High School') && (
                          <option value="High School">High School</option>
                        )}
                        {!educationList.some(e => e.eduType === 'Diploma') && (
                          <option value="Diploma">Diploma</option>
                        )}
                        {!educationList.some(e => e.eduType === 'Bachelors') && (
                          <option value="Bachelors">Bachelors Degree</option>
                        )}
                        {!educationList.some(e => e.eduType === 'Masters') && (
                          <option value="Masters">Masters Degree</option>
                        )}
                        {!educationList.some(e => e.eduType === 'Doctorate') && (
                          <option value="Doctorate">Doctorate / PhD</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Institute</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your Institute Name"
                        value={newEdu.institute}
                        onChange={e => setNewEdu({ ...newEdu, institute: e.target.value })}
                      />
                    </div>
                  </div>

                  {newEdu.eduType === 'High School' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Percentage in Class 10</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="e.g. 92%"
                          value={class10Percent}
                          onChange={e => handleClass10Change(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Percentage in Class 12</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="e.g. 88%"
                          value={class12Percent}
                          onChange={e => handleClass12Change(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Stream in Class 11</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="e.g. Science"
                          value={class11Stream}
                          onChange={e => handleStreamChange(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Degree</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="ex. Bachelor of Education"
                          value={newEdu.degree}
                          onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Field of Study</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="ex. Computer Science"
                          value={newEdu.fieldOfStudy}
                          onChange={e => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {newEdu.eduType !== 'High School' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                        <input
                          type="date"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                          value={newEdu.startDate}
                          onChange={e => setNewEdu({ ...newEdu, startDate: e.target.value })}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                        <input
                          type="date"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                          value={newEdu.endDate}
                          onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Grade Type</label>
                        <select
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          value={newEdu.gradeType}
                          onChange={e => setNewEdu({ ...newEdu, gradeType: e.target.value })}
                        >
                          <option value="">Select Grade Type</option>
                          <option value="Percentage">Percentage (%)</option>
                          <option value="CGPA">CGPA</option>
                          <option value="GPA">GPA</option>
                          <option value="Grade">Letter Grade</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Grade Value</label>
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                          placeholder="e.g. 9.4 / 92%"
                          value={newEdu.gradeValue}
                          onChange={e => setNewEdu({ ...newEdu, gradeValue: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newEdu.eduType || !newEdu.institute || !newEdu.degree) {
                          alert('Please fill out Education Type, Institute, and Degree/Class details.');
                          return;
                        }
                        if (editingEduIdx !== null) {
                          const updatedList = [...educationList];
                          updatedList[editingEduIdx] = newEdu;
                          setEducationList(updatedList);
                          setEditingEduIdx(null);
                        } else {
                          setEducationList([...educationList, newEdu]);
                        }
                        setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                        setClass10Percent('');
                        setClass12Percent('');
                        setClass11Stream('');
                      }}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {editingEduIdx !== null ? 'Save Edit' : 'Add to List'}
                    </button>
                    {editingEduIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEduIdx(null);
                          setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                          setClass10Percent('');
                          setClass12Percent('');
                          setClass11Stream('');
                        }}
                        className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 4: Experience */}
            {profileTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Work Experience</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{experienceList.length} Items Added</span>
                </div>

                {/* Verified Gig Stats Card */}
                {gigExperienceItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-high/40 p-4 rounded-xl border border-outline-variant/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-on-surface-variant">Completed Geeks</p>
                        <p className="text-xs font-bold text-on-surface">{completedGigsCount} Verified Geeks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center border border-warning/20 shadow-inner">
                        <Star className="w-5 h-5 fill-warning/20" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-on-surface-variant">Average Rating</p>
                        <p className="text-xs font-bold text-on-surface">{averageRating} / 5.0 Rating</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing items */}
                {experienceList.length > 0 && (
                  <div className="space-y-3">
                    {experienceList.map((exp, idx) => (
                      <div key={idx} className={`p-4 border rounded-xl flex justify-between items-start ${exp.expType === 'Gig' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-container-low border-outline-variant'}`}>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-on-surface">{exp.designation} at {exp.companyName}</p>
                            {exp.expType === 'Gig' && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-mono font-bold border border-emerald-500/20">
                                <Award className="w-3 h-3" /> Verified Gig
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">{exp.domain} ({exp.expType || 'Experience'}) {exp.involvesTech && '• Tech Role'}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {exp.startDate} to {exp.currentlyWorking ? 'Present' : exp.endDate} • {exp.location || 'Remote'}
                          </p>
                          {exp.expType === 'Gig' && exp.description && (
                            <p className="text-xs text-on-surface-variant mt-2 italic bg-surface-container-high/40 p-2.5 rounded-lg border border-outline-variant/30 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                        {exp.expType !== 'Gig' && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const item = experienceList[idx];
                                setNewExp({ ...item });
                                setDomainSearch('');
                                setEditingExpIdx(idx);
                              }}
                              className="text-primary hover:text-primary/70 text-xs font-mono transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExperienceList(experienceList.filter((_, i) => i !== idx));
                                if (editingExpIdx === idx) {
                                  setEditingExpIdx(null);
                                  setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                                  setDomainSearch('');
                                }
                              }}
                              className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Work Experience</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Experience Type</label>
                      <select
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        value={newExp.expType}
                        onChange={e => setNewExp({ ...newExp, expType: e.target.value })}
                      >
                        <option value="">Select type of experience</option>
                        <option value="Internship">Internship</option>
                        <option value="Full-Time">Full-Time Job</option>
                        <option value="Freelance">Freelance Contract</option>
                        <option value="Part-Time">Part-Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Designation</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your role"
                        value={newExp.designation}
                        onChange={e => setNewExp({ ...newExp, designation: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* <div className="flex items-center gap-2.5 py-1">
                    <input
                      type="checkbox"
                      id="involves-tech"
                      className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      checked={newExp.involvesTech}
                      onChange={e => setNewExp({ ...newExp, involvesTech: e.target.checked })}
                    />
                    <label htmlFor="involves-tech" className="text-xs text-on-surface-variant cursor-pointer select-none">
                      This position involves tasks of programming languages, APIs, or frameworks
                    </label>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Company Name</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Company Name"
                        value={newExp.companyName}
                        onChange={e => setNewExp({ ...newExp, companyName: e.target.value })}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Domain of Experience</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary pr-8"
                          placeholder="Search or select domain"
                          value={domainSearch || newExp.domain || ''}
                          onChange={e => {
                            setDomainSearch(e.target.value);
                            setNewExp({ ...newExp, domain: e.target.value });
                            setShowDomainDropdown(true);
                          }}
                          onFocus={() => setShowDomainDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowDomainDropdown(false);
                            }, 200);
                          }}
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                          onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {showDomainDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-surface-container-high border border-outline-variant rounded-xl shadow-floating max-h-56 overflow-y-auto pr-1 py-1 custom-scrollbar">
                          {filteredDomains.length === 0 && domainSearch.trim() !== '' && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-primary/10 transition-colors font-mono"
                              onClick={() => {
                                setNewExp({ ...newExp, domain: domainSearch });
                                setDomainSearch('');
                                setShowDomainDropdown(false);
                              }}
                            >
                              Use custom: "{domainSearch}"
                            </button>
                          )}
                          {filteredDomains.map(opt => (
                            <button
                              type="button"
                              key={opt}
                              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                setNewExp({ ...newExp, domain: opt });
                                setDomainSearch('');
                                setShowDomainDropdown(false);
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-primary/10 border-t border-outline-variant/30 transition-colors font-bold text-secondary"
                            onClick={() => {
                              setNewExp({ ...newExp, domain: 'Other' });
                              setDomainSearch('');
                              setShowDomainDropdown(false);
                            }}
                          >
                            Other
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newExp.startDate}
                        onChange={e => setNewExp({ ...newExp, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        disabled={newExp.currentlyWorking}
                        value={newExp.currentlyWorking ? '' : newExp.endDate}
                        onChange={e => setNewExp({ ...newExp, endDate: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 w-3.5 h-3.5"
                          checked={newExp.currentlyWorking}
                          onChange={e => setNewExp({ ...newExp, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newExp.endDate })}
                        />
                        <span className="text-[11px] text-on-surface-variant font-medium">Currently Working Here</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Location</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="e.g. San Francisco / Remote"
                        value={newExp.location}
                        onChange={e => setNewExp({ ...newExp, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="3"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="List key responsibilities or accomplishments..."
                      value={newExp.description}
                      onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newExp.expType || !newExp.designation || !newExp.companyName) {
                          alert('Please fill out Experience Type, Designation, and Company Name.');
                          return;
                        }
                        if (editingExpIdx !== null) {
                          const updatedList = [...experienceList];
                          updatedList[editingExpIdx] = newExp;
                          setExperienceList(updatedList);
                          setEditingExpIdx(null);
                        } else {
                          setExperienceList([...experienceList, newExp]);
                        }
                        setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                        setDomainSearch('');
                      }}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {editingExpIdx !== null ? 'Save Edit' : 'Add to List'}
                    </button>
                    {editingExpIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpIdx(null);
                          setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                          setDomainSearch('');
                        }}
                        className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 5: Certificates */}
            {profileTab === 'certificates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Certifications</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{certificatesList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {certificatesList.length > 0 && (
                  <div className="space-y-3">
                    {certificatesList.map((cert, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{cert.title}</p>
                          <p className="text-xs text-on-surface-variant">Issued by: {cert.org}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            Issued: {cert.startDate} • {cert.link ? <a href={cert.link} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/70">View Certificate Link</a> : 'No Link'}
                            {cert.certNumber && ` • ID: ${cert.certNumber}`}
                            {cert.attachment && (
                              <>
                                {' • '}
                                <a
                                  href={cert.attachment}
                                  download={`certificate_${cert.title.toLowerCase().replace(/\s+/g, '_')}`}
                                  className="underline text-primary hover:text-primary/70 cursor-pointer"
                                >
                                  Download Certificate File
                                </a>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const item = certificatesList[idx];
                              setNewCert({ ...item });
                              setCertFileUploadError('');
                              setEditingCertIdx(idx);
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-mono transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCertificatesList(certificatesList.filter((_, i) => i !== idx));
                              if (editingCertIdx === idx) {
                                setEditingCertIdx(null);
                                setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
                                setCertFileUploadError('');
                              }
                            }}
                            className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Certification</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certificate Title</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter certificate title"
                        value={newCert.title}
                        onChange={e => setNewCert({ ...newCert, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Provider Organisation Name</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Organisation Name"
                        value={newCert.org}
                        onChange={e => setNewCert({ ...newCert, org: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newCert.startDate}
                        onChange={e => setNewCert({ ...newCert, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certification Link</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Certification Link"
                        value={newCert.link}
                        onChange={e => setNewCert({ ...newCert, link: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certification Number</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter Certification Number (optional)"
                        value={newCert.certNumber || ''}
                        onChange={e => setNewCert({ ...newCert, certNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Upload Certificate File (Optional, max 100KB)</label>
                    <div className="flex items-center gap-4 p-3 bg-surface-container border border-outline-variant rounded-lg">
                      <input
                        type="file"
                        id="cert-file-upload"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleCertFileChange}
                      />
                      <label
                        htmlFor="cert-file-upload"
                        className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all flex items-center gap-1.5"
                      >
                        {processingCertFile ? 'Processing...' : 'Choose File'}
                      </label>
                      <div className="flex-1 min-w-0">
                        {newCert.attachment ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-on-surface truncate font-mono">✓ Certificate file attached</span>
                            <button
                              type="button"
                              onClick={() => setNewCert(prev => ({ ...prev, attachment: '' }))}
                              className="text-[10px] text-error hover:underline font-mono"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-mono">No file selected (Supports PDF or Images)</span>
                        )}
                      </div>
                    </div>
                    {certFileUploadError && (
                      <p className="text-[10px] text-error font-medium">{certFileUploadError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="2"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Enter description..."
                      value={newCert.description}
                      onChange={e => setNewCert({ ...newCert, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCert.title || !newCert.org) {
                          alert('Please enter Certificate Title and Provider Organisation.');
                          return;
                        }
                        if (editingCertIdx !== null) {
                          const updatedList = [...certificatesList];
                          updatedList[editingCertIdx] = newCert;
                          setCertificatesList(updatedList);
                          setEditingCertIdx(null);
                        } else {
                          setCertificatesList([...certificatesList, newCert]);
                        }
                        setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
                        setCertFileUploadError('');
                      }}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {editingCertIdx !== null ? 'Save Edit' : 'Add to List'}
                    </button>
                    {editingCertIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCertIdx(null);
                          setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
                          setCertFileUploadError('');
                        }}
                        className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 6: Projects */}
            {profileTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Projects</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{projectsList.length} Items Added</span>
                </div>

                {/* Existing items */}
                {projectsList.length > 0 && (
                  <div className="space-y-3">
                    {projectsList.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{proj.title}</p>
                          <p className="text-xs text-on-surface-variant">Role: {proj.role}</p>
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate}
                          </p>
                          <div className="flex gap-3 mt-1">
                            {proj.codeUrl && (
                              <a href={proj.codeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-secondary hover:underline">
                                Code URL
                              </a>
                            )}
                            {proj.hostedUrl && (
                              <a href={proj.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-secondary hover:underline">
                                Hosted URL
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const item = projectsList[idx];
                              setNewProj({ ...item });
                              setEditingProjIdx(idx);
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-mono transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProjectsList(projectsList.filter((_, i) => i !== idx));
                              if (editingProjIdx === idx) {
                                setEditingProjIdx(null);
                                setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                              }
                            }}
                            className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Project Record</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Title</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Name of your project"
                        value={newProj.title}
                        onChange={e => setNewProj({ ...newProj, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Company / Role</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter your role"
                        value={newProj.role}
                        onChange={e => setNewProj({ ...newProj, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Code URL</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter the code URL for the project"
                        value={newProj.codeUrl}
                        onChange={e => setNewProj({ ...newProj, codeUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Hosted URL</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter hosted URL (optional)"
                        value={newProj.hostedUrl}
                        onChange={e => setNewProj({ ...newProj, hostedUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        value={newProj.startDate}
                        onChange={e => setNewProj({ ...newProj, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        disabled={newProj.currentlyWorking}
                        value={newProj.currentlyWorking ? '' : newProj.endDate}
                        onChange={e => setNewProj({ ...newProj, endDate: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary bg-surface-container-low w-3.5 h-3.5 focus:ring-0"
                          checked={newProj.currentlyWorking}
                          onChange={e => setNewProj({ ...newProj, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newProj.endDate })}
                        />
                        <span className="text-[11px] text-on-surface-variant font-medium">Currently Working Here</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      rows="3"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Add key features, stacks, or descriptions... (New line for bullet point)"
                      value={newProj.description}
                      onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newProj.title || !newProj.role) {
                          alert('Please fill out Project Title and Role.');
                          return;
                        }
                        if (editingProjIdx !== null) {
                          const updatedList = [...projectsList];
                          updatedList[editingProjIdx] = newProj;
                          setProjectsList(updatedList);
                          setEditingProjIdx(null);
                        } else {
                          setProjectsList([...projectsList, newProj]);
                        }
                        setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                      }}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {editingProjIdx !== null ? 'Save Edit' : 'Add to List'}
                    </button>
                    {editingProjIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProjIdx(null);
                          setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                        }}
                        className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Panel 7: Skills */}
            {profileTab === 'skills' && (
              <div className="space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Your Stacks & Skills</label>

                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-5">
                  {/* Searchable input & dropdown to add a skill */}
                  <div className="flex gap-3 pb-3 border-b border-outline-variant">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search and select a skill..."
                        value={selectedNewSkill}
                        onChange={e => {
                          setSelectedNewSkill(e.target.value);
                          setIsSkillDropdownOpen(true);
                        }}
                        onFocus={() => setIsSkillDropdownOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setIsSkillDropdownOpen(false), 200);
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:border-primary focus:outline-none transition-all"
                      />

                      {isSkillDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-high/95 backdrop-blur-md border border-outline-variant rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                          {ALL_SKILLS.filter(
                            s => s.skill.toLowerCase().includes(selectedNewSkill.toLowerCase()) &&
                              !skillsList.some(exist => exist.name.toLowerCase() === s.skill.toLowerCase())
                          ).length === 0 ? (
                            <div className="px-4 py-3 text-xs text-on-surface-variant font-mono">No matching skills found</div>
                          ) : (
                            ALL_SKILLS.filter(
                              s => s.skill.toLowerCase().includes(selectedNewSkill.toLowerCase()) &&
                                !skillsList.some(exist => exist.name.toLowerCase() === s.skill.toLowerCase())
                            ).map(s => (
                              <button
                                key={s.skill}
                                type="button"
                                onClick={() => {
                                  setSelectedNewSkill(s.skill);
                                  setIsSkillDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group"
                              >
                                <span>{s.skill}</span>
                                <span className="text-[10px] opacity-60 group-hover:opacity-100 font-mono capitalize px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant text-on-surface-variant group-hover:border-primary/20 group-hover:text-primary transition-all">
                                  {s.type}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      id="student-add-skill-btn"
                      onClick={() => {
                        const trimmed = selectedNewSkill.trim();
                        if (!trimmed) return;
                        const match = ALL_SKILLS.find(
                          s => s.skill.toLowerCase() === trimmed.toLowerCase()
                        );
                        if (!match) {
                          alert("Please select a valid skill from the matching suggestions list.");
                          return;
                        }
                        if (skillsList.some(exist => exist.name.toLowerCase() === match.skill.toLowerCase())) {
                          alert("This skill has already been added.");
                          return;
                        }
                        setSkillsList(prev => [...prev, { name: match.skill, rating: 1 }]);
                        setSelectedNewSkill('');
                      }}
                      className="px-4 py-3 bg-secondary text-on-secondary font-bold rounded-xl text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Skill
                    </button>
                  </div>

                  {skillsList.length === 0 ? (
                    <p className="text-xs text-on-surface-variant font-mono">No skills added yet. Select a skill above.</p>
                  ) : (
                    skillsList.map(skill => {
                      const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === skill.name.toLowerCase());
                      const isTech = skillObj ? skillObj.type === 'technical' : true;
                      return (
                        <div key={skill.name} className="space-y-2 pb-3 border-b border-outline-variant last:border-b-0">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface">{skill.name}</span>
                              {!isTech && (
                                <span className="text-[9px] opacity-60 font-mono capitalize px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant">
                                  Non-Technical
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {isTech && (
                                <div className="flex items-center gap-2">
                                  <span className="text-secondary font-mono text-xs">
                                    Rating: {skill.verifiedRating !== null && skill.verifiedRating !== undefined ? `${skill.verifiedRating} / 10` : `${skill.rating} / 10`}
                                  </span>
                                  {skill.verifiedRating !== null && skill.verifiedRating !== undefined && (
                                    <span className="text-[9px] bg-success-container border border-success/30 text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1 select-none">
                                      <span className="text-[8px]">✓</span> Verified
                                    </span>
                                  )}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setSkillsList(prev => prev.filter(s => s.name !== skill.name))}
                                className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {profileTab === 'cocurricular' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Co-curricular & POR</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">{cocurricular.length} Items Added</span>
                </div>

                {/* Existing items */}
                {cocurricular.length > 0 && (
                  <div className="space-y-3">
                    {cocurricular.map((act, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{act.activity}</p>
                          {act.description && <p className="text-xs text-on-surface-variant mt-1">{act.description}</p>}
                          <p className="text-[10px] text-secondary font-mono mt-1">
                            {act.link ? <a href={act.link} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/70">View Certification Link</a> : 'No Link'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const item = cocurricular[idx];
                              setNewCocurricular({ ...item });
                              setEditingCocurricularIdx(idx);
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-mono transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCocurricular(cocurricular.filter((_, i) => i !== idx));
                              if (editingCocurricularIdx === idx) {
                                setEditingCocurricularIdx(null);
                                setNewCocurricular({ activity: '', link: '', description: '' });
                              }
                            }}
                            className="text-error hover:text-error/70 text-xs font-mono transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Form */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-primary">Add Co-curricular Activity</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Activity / Title</label>
                      <input
                        type="text"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="e.g. Football Captain, Debate Club Coordinator"
                        value={newCocurricular.activity}
                        onChange={e => setNewCocurricular({ ...newCocurricular, activity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Certification Link (Optional)</label>
                      <input
                        type="url"
                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                        placeholder="Enter link to certificate/proof"
                        value={newCocurricular.link}
                        onChange={e => setNewCocurricular({ ...newCocurricular, link: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">Description (Optional)</label>
                    <textarea
                      rows="2"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Describe your role or accomplishment..."
                      value={newCocurricular.description}
                      onChange={e => setNewCocurricular({ ...newCocurricular, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCocurricular.activity) {
                          alert('Please enter Activity / Title.');
                          return;
                        }
                        if (editingCocurricularIdx !== null) {
                          const updatedList = [...cocurricular];
                          updatedList[editingCocurricularIdx] = newCocurricular;
                          setCocurricular(updatedList);
                          setEditingCocurricularIdx(null);
                        } else {
                          setCocurricular([...cocurricular, newCocurricular]);
                        }
                        setNewCocurricular({ activity: '', link: '', description: '' });
                      }}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {editingCocurricularIdx !== null ? 'Save Edit' : 'Add to List'}
                    </button>
                    {editingCocurricularIdx !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCocurricularIdx(null);
                          setNewCocurricular({ activity: '', link: '', description: '' });
                        }}
                        className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save button */}
          <div className="pt-4 border-t border-outline-variant flex justify-end">
            {/* <Button
              type="submit"
              loading={submittingProfile}
              disabled={!isSaveActive}
              size="sm"
              className="font-bold uppercase tracking-wider text-xs shadow-glow disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none px-6"
            >
              Save Profile & Ratings
            </Button> */}
          </div>
        </div>
      </form>
    </div>
  );
}
