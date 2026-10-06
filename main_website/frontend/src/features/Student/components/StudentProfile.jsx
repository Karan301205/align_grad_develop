import React from 'react';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Plus, ChevronDown, Star, Award, Briefcase, DollarSign, X, Camera, Trash2, User, GraduationCap, FolderGit2, Activity, FileText } from 'lucide-react';
import { ALL_SKILLS, hasSkillMcq } from '../../../constants';
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { DOMAIN_OPTIONS } from '../../../constants/domains';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';
import { ToastNotification, formatAlertMessage, formatErrorMessage, renderFormattedMessage } from '../../../utils/errorFormatter';
import { getProfileCompletionDetails } from '../../../utils/profileCompleteness';

import { INDIAN_STATES } from '../../../constants/indianStates';
import StudentShowcase from './StudentShowcase';

const isValidUrl = (str) => {
  if (!str || typeof str !== 'string' || !str.trim()) return true;
  const trimmed = str.trim();
  try {
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(formatted);
    const parts = url.hostname.split('.');
    if (parts.length < 2) return false;
    const tld = parts[parts.length - 1];
    if (tld.length < 2) return false;
    return true;
  } catch (_) {
    return false;
  }
};

const ensureUrlProtocol = (str) => {
  if (!str) return str;
  const trimmed = str.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

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
  techSkills = [],
  selectedNewSkill,
  setSelectedNewSkill,
  bio,
  setBio,
  gender,
  setGender,
  profileEmail,
  setProfileEmail,
  dob,
  setDob,
  phone,
  setPhone,
  preferredWorkModes = [],
  setPreferredWorkModes,
  preferredWorkTypes = [],
  setPreferredWorkTypes,
  preferredLocations = [],
  setPreferredLocations,
  openToAnyLocation = false,
  setOpenToAnyLocation,
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
  handleRatingChange,
  handleDownloadGeneratedResume,
  generatingPdf
}) {
  const tabsList = [
    { id: 'general', label: 'General' },
    { id: 'showcase', label: 'Introduction' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'certificates', label: 'Certifications' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'cocurricular', label: 'Co-Curricular' }
  ];

  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = React.useState(false);
  const [usernameStatus, setUsernameStatus] = React.useState(''); // 'loading', 'available', 'taken', 'invalid', ''
  const [usernameMsg, setUsernameMsg] = React.useState('');

  const [firstName, setFirstName] = React.useState(() => {
    const cleaned = (profile?.name || '').replace(/[0-9]/g, '');
    const parts = cleaned.trim().split(' ');
    return parts[0] || '';
  });
  const [lastName, setLastName] = React.useState(() => {
    const cleaned = (profile?.name || '').replace(/[0-9]/g, '');
    const parts = cleaned.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  });

  React.useEffect(() => {
    if (profile?.name !== undefined) {
      const cleaned = (profile?.name || '').replace(/[0-9]/g, '');
      const parts = cleaned.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [profile?.name]);

  const updateFullName = (first, last) => {
    const full = [first.trim(), last.trim()].filter(Boolean).join(' ');
    setProfile(prev => ({ ...prev, name: full }));
  };

  const [locationSearchQuery, setLocationSearchQuery] = React.useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = React.useState(false);

  const locationContainerRef = React.useRef(null);
  const skillContainerRef = React.useRef(null);
  const domainContainerRef = React.useRef(null);
  const bioRef = React.useRef(null);

  React.useEffect(() => {
    if (bioRef.current) {
      bioRef.current.style.height = 'auto';
      bioRef.current.style.height = `${Math.max(80, bioRef.current.scrollHeight)}px`;
    }
  }, [bio, profileTab]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationContainerRef.current && !locationContainerRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
      if (skillContainerRef.current && !skillContainerRef.current.contains(event.target)) {
        setIsSkillDropdownOpen(false);
      }
      if (domainContainerRef.current && !domainContainerRef.current.contains(event.target)) {
        setShowDomainDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleWorkMode = (mode) => {
    if (preferredWorkModes.includes(mode)) {
      setPreferredWorkModes(preferredWorkModes.filter(m => m !== mode));
    } else {
      setPreferredWorkModes([...preferredWorkModes, mode]);
    }
  };

  const toggleWorkType = (type) => {
    if (preferredWorkTypes.includes(type)) {
      setPreferredWorkTypes(preferredWorkTypes.filter(t => t !== type));
    } else {
      setPreferredWorkTypes([...preferredWorkTypes, type]);
    }
  };

  const addLocation = (loc) => {
    if (!preferredLocations.includes(loc)) {
      setPreferredLocations([...preferredLocations, loc]);
    }
    setLocationSearchQuery('');
    setIsLocationDropdownOpen(false);
  };

  const removeLocation = (loc) => {
    setPreferredLocations(preferredLocations.filter(l => l !== loc));
  };

  const handleAddSkill = (skillNameToAdd) => {
    const name = (skillNameToAdd || selectedNewSkill || '').trim();
    if (!name) return;
    
    // Check if skill already exists in skillsList
    if (skillsList.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSelectedNewSkill('');
      setIsSkillDropdownOpen(false);
      return;
    }

    const matchInAll = ALL_SKILLS.find(s => s.skill.toLowerCase() === name.toLowerCase());
    const canonicalName = matchInAll ? matchInAll.skill : name;

    setSkillsList(prev => [...prev, { name: canonicalName, rating: 1 }]);
    setSelectedNewSkill('');
    setIsSkillDropdownOpen(false);
  };

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
  const [activeModal, setActiveModal] = React.useState(null); // 'education' | 'experience' | 'certificates' | 'projects' | 'cocurricular' | null
  const [alertToast, setAlertToast] = React.useState(null); // { id: number, msg: string, type: 'error' | 'success' }
  const showAlert = (msg, type = 'error') => {
    setAlertToast({ id: Date.now(), msg, type });
    try {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        const scrollables = document.querySelectorAll('.overflow-y-auto');
        scrollables.forEach(el => {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } catch (_) {}
  };

  const openAddEduModal = () => {
    setEditingEduIdx(null);
    setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
    setClass10Percent('');
    setClass12Percent('');
    setClass11Stream('');
    setActiveModal('education');
  };

  const openAddExpModal = () => {
    setEditingExpIdx(null);
    setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
    setDomainSearch('');
    setActiveModal('experience');
  };

  const openAddCertModal = () => {
    setEditingCertIdx(null);
    setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
    setCertFileUploadError('');
    setActiveModal('certificates');
  };

  const openAddProjModal = () => {
    setEditingProjIdx(null);
    setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
    setActiveModal('projects');
  };

  const openAddCocurricularModal = () => {
    setEditingCocurricularIdx(null);
    setNewCocurricular({ activity: '', link: '', description: '' });
    setActiveModal('cocurricular');
  };

  const closeModal = () => {
    setActiveModal(null);
    setShowDomainDropdown(false);
    setDomainSearch('');
  };

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

  const isValidDriveUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
      return (
        parsed.hostname === 'drive.google.com' ||
        parsed.hostname === 'docs.google.com' ||
        parsed.hostname.endsWith('.drive.google.com') ||
        parsed.hostname.endsWith('.docs.google.com')
      );
    } catch (e) {
      return false;
    }
  };

  const isInvalidResumeUrl = Boolean(resumeUrl && resumeUrl.trim() && !isValidDriveUrl(resumeUrl));

  const [certFileUploadError, setCertFileUploadError] = React.useState('');
  const [processingCertFile, setProcessingCertFile] = React.useState(false);

  const handleCertFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > 100) {
      showAlert('Maximum file size allowed is **100 KB**.', 'error');
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
    if ((orig.gender || '') !== (gender || '')) return true;
    if ((orig.email || '') !== (profileEmail || '')) return true;
    if ((orig.dob || '') !== (dob || '')) return true;
    if ((orig.phone || '') !== (phone || '')) return true;
    if ((orig.resumeUrl || '') !== (resumeUrl || '')) return true;

    // Compare socialLinks
    const origSocials = orig.socialLinks || {};
    const currSocials = socialLinks || {};
    const socialKeys = ['linkedin', 'portfolio'];
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

    // Compare skills list
    const origSkills = orig.skills || [];
    const currSkills = skillsList || [];
    if (origSkills.length !== currSkills.length) return true;
    for (const skill of currSkills) {
      const match = origSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
      if (!match) return true;
      if (match.rating !== skill.rating) return true;
      if (match.verifiedRating !== skill.verifiedRating) return true;
    }

    return false;
  }, [
    profile, username, profilePic, bio, gender, profileEmail, dob, phone, resumeUrl, cocurricular,
    socialLinks, educationList, experienceList, certificatesList, projectsList, skillsList
  ]);

  const isSaveActive = React.useMemo(() => {
    const ageValue = calculateAge(dob);
    if (ageValue !== null && ageValue < 17) return false;
    if (resumeUrl && !isValidDriveUrl(resumeUrl)) return false;

    const isFirstTime = !profile || !profile.name;
    return isFirstTime || hasChanges;
  }, [profile, hasChanges, dob, resumeUrl]);

  const { overallCompletion, missingProfileItems } = React.useMemo(() => {
    const details = getProfileCompletionDetails({
      name: profile?.name,
      username,
      bio,
      profileEmail,
      localPhone,
      dob,
      gender,
      resumeUrl,
      linkedin: socialLinks?.linkedin,
      portfolio: socialLinks?.portfolio,
      profilePic,
      preferredWorkModes,
      preferredWorkTypes,
      preferredLocations,
      skillsList,
      educationList,
      experienceList,
      projectsList,
      certificatesList,
      introVideoUrl: profile?.introVideoUrl
    });
    return {
      overallCompletion: details.percentage,
      missingProfileItems: details.missingItems
    };
  }, [
    profile?.name, username, bio, profileEmail, localPhone, dob, gender, resumeUrl,
    socialLinks?.linkedin, socialLinks?.portfolio, profilePic, preferredWorkModes,
    preferredWorkTypes, preferredLocations, skillsList, educationList,
    experienceList, projectsList, certificatesList, profile?.introVideoUrl
  ]);

  const sanitizeDateYear = (val) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length > 0) {
      let year = parts[0];
      if (year.length > 4) year = year.slice(0, 4);
      const num = parseInt(year, 10);
      if (!isNaN(num)) {
        if (num > 2099) year = '2099';
        else if (year.length === 4 && num < 1950) year = '1950';
      }
      parts[0] = year;
      return parts.join('-');
    }
    return val;
  };

  const handleClass10Change = (val) => {
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (parseFloat(cleaned) > 100) cleaned = '100';
    setClass10Percent(cleaned);
    const c12 = class12Percent;
    setNewEdu(prev => ({
      ...prev,
      degree: `Class 10: ${cleaned}% | Class 12: ${c12}%`
    }));
  };

  const handleClass12Change = (val) => {
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (parseFloat(cleaned) > 100) cleaned = '100';
    setClass12Percent(cleaned);
    const c10 = class10Percent;
    setNewEdu(prev => ({
      ...prev,
      degree: `Class 10: ${c10}% | Class 12: ${cleaned}%`
    }));
  };

  const handleStreamChange = (val) => {
    const cleaned = val.replace(/[^a-zA-Z\s]/g, '');
    setClass11Stream(cleaned);
    setNewEdu(prev => ({
      ...prev,
      fieldOfStudy: `Class 11 Stream: ${cleaned}`
    }));
  };

  const handleEduTypeChange = (e) => {
    const type = e.target.value;
    setClass10Percent('');
    setClass12Percent('');
    setClass11Stream('');
    setNewEdu(prev => ({
      ...prev,
      eduType: type,
      institute: type !== 'High School' ? (prev.institute || '').replace(/[0-9]/g, '') : prev.institute,
      degree: '',
      fieldOfStudy: ''
    }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const ageValue = calculateAge(dob);
    if (ageValue !== null && ageValue < 17) {
      showAlert('You must be at least **17 years old** to access this platform.', 'error');
      return;
    }
    const isValid = validatePhone(countryCode, localPhone);
    if (!isValid) {
      showAlert('Please enter the valid **Phone Number** before saving.', 'error');
      return;
    }
    if (resumeUrl && resumeUrl.trim() && !isValidDriveUrl(resumeUrl)) {
      showAlert('Please enter a valid **Google Drive URL** for your resume (e.g. https://drive.google.com/...).', 'error');
      return;
    }
    if (socialLinks?.linkedin && socialLinks.linkedin.trim() && !isValidUrl(socialLinks.linkedin)) {
      showAlert('Please enter a valid **LinkedIn Profile URL** (e.g. https://linkedin.com/in/...).', 'error');
      return;
    }
    if (socialLinks?.portfolio && socialLinks.portfolio.trim() && !isValidUrl(socialLinks.portfolio)) {
      showAlert('Please enter a valid **Personal Portfolio URL** (e.g. https://myportfolio.com).', 'error');
      return;
    }
    const activeTabObj = tabsList.find(t => t.id === profileTab);
    const sectionName = activeTabObj ? activeTabObj.label : 'Profile';
    handleUpdateProfile(e, sectionName);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {alertToast && (
        <ToastNotification
          key={alertToast.id}
          msg={alertToast.msg}
          type={alertToast.type}
          onClose={() => setAlertToast(null)}
        />
      )}
      <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 rounded-none shadow-md transition-all duration-500 ease-in-out ${showUploadSuccess
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}>
        <div className="flex flex-col">
          <span className="text-xs font-headline font-bold tracking-wider">Success</span>
          <span className="text-xs font-sans">Photo uploaded successfully!</span>
        </div>
      </div>
      <PageHeader
        title="Your Profile"
        subtitle="Update your professional details, social portfolios, academic history, and self-rate your proficiencies"
        action={
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleDownloadGeneratedResume}
              disabled={generatingPdf}
              className="font-headline font-bold text-xs px-4 py-2 flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-700 hover:text-blue-800 dark:hover:text-blue-300 rounded-none shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>{generatingPdf ? 'Generating PDF...' : 'Generate Resume'}</span>
            </button>
            <button
              type="submit"
              form="student-profile-form"
              disabled={!isSaveActive || submittingProfile}
              className="font-headline font-bold text-xs px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              {submittingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        }
      />

      {/* Overall Profile Completion Widget */}
      <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 flex items-center justify-center font-headline font-extrabold text-sm shrink-0 border border-blue-400 dark:border-blue-600 shadow-2xs">
              {overallCompletion}%
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-headline font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                  Overall Profile Completion
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-none font-headline font-bold tracking-wider border ${
                  overallCompletion === 100
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
                    : overallCompletion >= 70
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border-blue-400 dark:border-blue-700'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-700'
                }`}>
                  {overallCompletion === 100 ? 'All-Star (Complete)' : overallCompletion >= 70 ? 'Strong Profile' : 'In Progress'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                {overallCompletion === 100 ? (
                  'Your profile is 100% completed and optimized for recruiter discovery.'
                ) : (
                  <>
                    <span className="font-bold text-slate-900 dark:text-slate-100">To reach 100%:</span> Add {missingProfileItems.join(', ')}.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-headline font-extrabold text-blue-700 dark:text-blue-400">{overallCompletion}%</span>
          </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-none overflow-hidden border border-slate-300 dark:border-slate-700">
          <div
            className="h-full rounded-none bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
      </div>

      {feedbackMsg && (() => {
        const isErr = /failed|error|invalid|denied/i.test(feedbackMsg);
        return (
          <div className={`p-4 rounded-none border text-xs sm:text-sm font-sans flex items-center gap-3 w-full animate-fade-in transition-all duration-300 ${
            isErr
              ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200'
              : 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
          }`}>
            {isErr ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="font-semibold">{renderFormattedMessage(feedbackMsg)}</span>
          </div>
        );
      })()}

      <form id="student-profile-form" onSubmit={handleSubmit} className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none flex flex-col justify-between min-h-[620px] shadow-2xs overflow-hidden relative">
        {/* Top Horizontal Stepper Navigation integrated as container header */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-700 p-3 sm:p-4 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {tabsList.map((tab, idx) => {
              const isActive = profileTab === tab.id;
              const currentIdx = tabsList.findIndex(t => t.id === profileTab);
              const isPast = currentIdx > idx;
              return (
                <React.Fragment key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setProfileTab(tab.id)}
                    className={`px-3.5 py-2 rounded-none text-xs font-headline font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-blue-700 text-white shadow-xs'
                        : isPast
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[10px] font-headline font-bold shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : isPast
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span className="whitespace-nowrap tracking-wider">{tab.label}</span>
                  </button>
                  {idx < tabsList.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0 select-none" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Section Content & Action Body */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-8">
          <div className="flex-1 space-y-6">

          {/* Panel 1: General */}
          {profileTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">General Information</h3>
              </div>

              {/* Profile Top Showcase Banner (Horizontal layout: Avatar + Name & Email) */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto">
                  {/* Avatar square with photo / initials */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-none bg-blue-50 dark:bg-blue-950/70 border-2 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300 flex items-center justify-center font-headline font-extrabold text-2xl sm:text-3xl overflow-hidden shrink-0 shadow-2xs">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile preview" className="w-full h-full object-cover rounded-none" />
                      ) : (
                        profile?.name?.charAt(0) || 'S'
                      )}
                    </div>
                  </div>

                  {/* Name and Email side-by-side horizontally */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      {profile?.name || 'Your Name'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans truncate">
                      {profileEmail || 'name@domain.com'}
                    </p>
                    {username && (
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-bold">
                        @{username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Upload / Remove Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <label className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{compressing ? 'Processing...' : 'Upload Photo'}</span>
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
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs font-headline font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-none transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
              {photoError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{photoError}</p>
              )}

              {/* Basic Information Section */}
              <div className="pt-2 border-t border-slate-300 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h4 className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 tracking-wider">Basic Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1, Col 1: First Name */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      First Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                      value={firstName}
                      onChange={e => {
                        const val = e.target.value.replace(/[0-9]/g, '');
                        setFirstName(val);
                        updateFullName(val, lastName);
                      }}
                      onKeyDown={e => {
                        if (/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="e.g. John"
                      required
                    />
                  </div>

                  {/* Row 1, Col 2: Last Name */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Last Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                      value={lastName}
                      onChange={e => {
                        const val = e.target.value.replace(/[0-9]/g, '');
                        setLastName(val);
                        updateFullName(firstName, val);
                      }}
                      onKeyDown={e => {
                        if (/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="e.g. Doe"
                      required
                    />
                  </div>

                  {/* Row 2, Col 1: Username */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Username <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                        value={username || ''}
                        onChange={handleUsernameChange}
                        placeholder="e.g. johndoe"
                        required
                      />
                      {usernameMsg && (
                        <p className={`text-[11px] mt-1.5 font-sans font-medium ${usernameStatus === 'available' ? 'text-emerald-600 dark:text-emerald-400' :
                            usernameStatus === 'loading' ? 'text-amber-600 dark:text-amber-400 animate-pulse' :
                              'text-rose-600 dark:text-rose-400'
                          }`}>
                          {usernameMsg}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2, Col 2: Date of Birth */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Date of Birth <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      min="1920-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      value={dob}
                      onChange={e => setDob(sanitizeDateYear(e.target.value))}
                    />
                    {isUnderage && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1.5 animate-pulse">
                        ✗ You must be at least 17 years old to access this platform.
                      </p>
                    )}
                  </div>

                  {/* Row 3: Professional Summary (Full Width - Auto-Expanding) */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Professional Summary <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      ref={bioRef}
                      rows="3"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs resize-none min-h-[80px] overflow-hidden leading-relaxed"
                      value={bio}
                      onChange={e => {
                        setBio(e.target.value);
                        if (bioRef.current) {
                          bioRef.current.style.height = 'auto';
                          bioRef.current.style.height = `${Math.max(80, bioRef.current.scrollHeight)}px`;
                        }
                      }}
                      placeholder="Software Engineer specializing in Full-Stack development, building responsive web applications..."
                    />
                  </div>

                  {/* Row 4, Col 1: Phone Number */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Phone Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 w-24 shrink-0 font-sans font-medium shadow-2xs"
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
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                          value={localPhone}
                          onChange={handleLocalPhoneChange}
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>
                    {phoneWarning && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-sans font-semibold">{phoneWarning}</p>
                    )}
                  </div>

                  {/* Row 4, Col 2: Email Address */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Email Address <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="name@domain.com"
                    />
                  </div>

                  {/* Row 5, Col 1: Gender */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Gender <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
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

                  {/* Row 5, Col 2: Resume URL (Upload A Drive URL) */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Resume URL (Google Drive URL)
                    </label>
                    <input
                      type="url"
                      className={`w-full bg-white dark:bg-slate-900 border rounded-none px-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs ${
                        isInvalidResumeUrl
                          ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                      }`}
                      value={resumeUrl}
                      onChange={e => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/your-resume.pdf"
                    />
                    {isInvalidResumeUrl && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1.5">
                        * Only valid Google Drive URLs are accepted.
                      </p>
                    )}
                  </div>

                  {/* Row 6, Col 1: LinkedIn Profile Link */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      LinkedIn Profile Link
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none text-slate-500 flex items-center">
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABW0lEQVR4nO2ZvUoDQRRGjyh2/oC2goW+ge+g4C5aikI6S1/BRgJ5EJ/BThP1QewUfxB0U6W5sjCNYXZnZi32jtwDXxPuzH6HzWazCRiG0ZUjYAJMAek5U2AMlKkSIwXlpSHDlDMhylPEiEwUFJVA7mJEKgVFJZDvGBHJJEH6LigmMkfb4hfgBNhwOQPechTZV/RxHaRt8apnfi1HkdIzX+Qo8g4MgE2X+hp5zVFEFCVI3wXFRObosjhl5tHdi7aAZWAF2AMugY8cROob50Hg2OvAjXaRnZiDA0vAg2aRFLaBWQ4iixEz15pFLoBnN/cEnLfMnmoVOU58/t7VKnLfsGf9GwEdvoz2JvLZsGf9uo8FrSJ/3VdMBBPxYiKYCCYiJuJHTIT2xZoS5N+IVApKSiBfMSJjBUUlkNsYkVJBUQnkkEiGCspKQ65IpHD/nmq4Zir3doo+E4Zh8IsfFdRDh8Z3YCsAAAAASUVORK5CYII="
                          alt="LinkedIn"
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <input
                        type="url"
                        className={`w-full bg-white dark:bg-slate-900 border ${
                          socialLinks?.linkedin && !isValidUrl(socialLinks.linkedin)
                            ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                        } rounded-none pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs`}
                        value={socialLinks?.linkedin || ''}
                        onChange={e => setSocialLinks({ ...socialLinks, linkedin: e.target.value, showLinkedin: true })}
                        onBlur={() => {
                          if (socialLinks?.linkedin && isValidUrl(socialLinks.linkedin)) {
                            setSocialLinks(prev => ({ ...prev, linkedin: ensureUrlProtocol(prev?.linkedin) }));
                          }
                        }}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    {socialLinks?.linkedin && !isValidUrl(socialLinks.linkedin) && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                        * Please enter a valid URL (e.g. https://linkedin.com/in/username)
                      </p>
                    )}
                  </div>

                  {/* Row 6, Col 2: Personal Portfolio Link */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Personal Portfolio Link
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none text-slate-500 flex items-center">
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAByElEQVR4nO2YzStEURiHn/JR2LCQKWQUkRUlHzsr/gUslLUFZWNlZaZs5Z/QZEmxVaSoYW2hFOUrxqyUObp13MY0M/frXPe9uk/9ms095/09zZ3TnQsJ/5MeIAcUAOUy1rX7wCCCJF48CFTGWtuNAHK60IGWcot17aFeu4cACrqMF4kfevXaNwSgdKJab4xEJGyRFJAF8kAxwGlkOkXdKQN0OUksCCuvauQDmK8lsQiUBJRULlOqJpPSllGXUz6+mV+3WVZAKb/ZKhe5ElDIb6wDwCaOt5XSsbrbhDnoC3jVn2HNsDG98QOwCYwCTXrGLvAZJ5FjoIPqtOhj/km6yC3QijP9hmVsTG24invWJIuMeRDpkyyS9iDSLFlkyoNIt2SRDQ8iS5JFpj2IjEgWGfYg0ilZZAdocCmSkSyigEkXEmnDM21MbrqNM+txECkCQ3UkBgK+YlV/JWLlpo7IRQjzbFSYm1dwHyeRxzoi13EReQZm64hMAHeSRfLACtCOM23AMnAqSSQPzOCfceAkapFL/fc1KI3AUZQic5gjyENkYBHrwc8k71H+RiTEJuoiiQiJCCJjE3WRRIQKkXMBZfzmrFwkASF8AwtIav6AvpvW"
                          alt="Portfolio"
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <input
                        type="url"
                        className={`w-full bg-white dark:bg-slate-900 border ${
                          socialLinks?.portfolio && !isValidUrl(socialLinks.portfolio)
                            ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                        } rounded-none pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs`}
                        value={socialLinks?.portfolio || ''}
                        onChange={e => setSocialLinks({ ...socialLinks, portfolio: e.target.value, showPortfolio: true })}
                        onBlur={() => {
                          if (socialLinks?.portfolio && isValidUrl(socialLinks.portfolio)) {
                            setSocialLinks(prev => ({ ...prev, portfolio: ensureUrlProtocol(prev?.portfolio) }));
                          }
                        }}
                        placeholder="https://myportfolio.com"
                      />
                    </div>
                    {socialLinks?.portfolio && !isValidUrl(socialLinks.portfolio) && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                        * Please enter a valid URL (e.g. https://myportfolio.com)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Preferences & Location Block */}
              <div className="pt-4 border-t border-slate-300 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h3 className="text-xs font-headline font-bold tracking-wider text-slate-900 dark:text-slate-100">Work Preferences & Location</h3>
                </div>

                {/* Mode of Work and Type of Work as Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode of Work Dropdown */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Mode of Work <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                      value={preferredWorkModes[0] || ''}
                      onChange={e => setPreferredWorkModes(e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">Open to All Modes</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-Site">On-Site</option>
                    </select>
                  </div>

                  {/* Type of Work Looking For Dropdown */}
                  <div>
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                      Type of Work Looking For <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs focus:border-blue-700 focus:outline-none transition-all text-slate-900 dark:text-slate-100 font-sans font-medium shadow-2xs"
                      value={preferredWorkTypes[0] || ''}
                      onChange={e => setPreferredWorkTypes(e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">Open to All Types</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Location in India */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">
                      Preferred Location(s) in India <span className="text-rose-500 font-bold">*</span>
                    </label>

                    {/* Any Location Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={openToAnyLocation}
                        onChange={e => setOpenToAnyLocation(e.target.checked)}
                        className="rounded-none border-slate-300 dark:border-slate-700 text-blue-700 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200">Any Location / Open to Relocate</span>
                    </label>
                  </div>

                  {/* Search bar & dropdown for states */}
                  <div className="relative" ref={locationContainerRef}>
                    <input
                      type="text"
                      placeholder="Search district, city or state (e.g. Hyderabad, Telangana)..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 transition-all font-sans font-medium shadow-2xs"
                      value={locationSearchQuery}
                      onChange={e => {
                        setLocationSearchQuery(e.target.value);
                        setIsLocationDropdownOpen(true);
                      }}
                      onFocus={() => setIsLocationDropdownOpen(true)}
                    />

                    {isLocationDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl z-30 custom-scrollbar divide-y divide-slate-200 dark:divide-slate-800">
                        {INDIAN_STATES.filter(state => state.toLowerCase().includes(locationSearchQuery.toLowerCase())).length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center font-sans">No matching districts or states found</div>
                        ) : (
                          INDIAN_STATES.filter(state => state.toLowerCase().includes(locationSearchQuery.toLowerCase())).map(state => {
                            const isAdded = preferredLocations.includes(state);
                            return (
                              <div
                                key={state}
                                onClick={() => addLocation(state)}
                                className={`px-4 py-2.5 text-xs font-sans flex justify-between items-center cursor-pointer transition-colors ${
                                  isAdded ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span>{state}</span>
                                {isAdded && <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-none font-sans font-bold">Added</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Locations Badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {preferredLocations.length === 0 ? (
                      <span className="text-xs text-slate-500 font-sans italic">No specific locations selected yet.</span>
                    ) : (
                      preferredLocations.map(loc => (
                        <span key={loc} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs">
                          <span>📍 {loc}</span>
                          <button
                            type="button"
                            onClick={() => removeLocation(loc)}
                            className="text-slate-500 hover:text-rose-600 transition-colors text-xs font-bold px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Panel 2: Video Showcase */}
            {profileTab === 'showcase' && (
              <div className="space-y-4">
                <StudentShowcase
                  profile={profile}
                  token={token}
                  onVideoSaved={(url) => setProfile(prev => ({ ...prev, introVideoUrl: url }))}
                />
              </div>
            )}

            {/* Panel 3: Education */}
            {profileTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Education History</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-600 dark:text-slate-400">{educationList.length} Items Added</span>
                    {educationList.length > 0 && (
                      <button
                        type="button"
                        onClick={openAddEduModal}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Education
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State */}
                {educationList.length === 0 && (
                  <div className="p-8 sm:p-12 border border-slate-300 dark:border-slate-700 border-dashed rounded-none bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">You haven't added any record</h4>
                      <p className="text-xs font-sans text-slate-600 dark:text-slate-400 max-w-sm">
                        Add your school, college, or university education to display your academic background.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddEduModal}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Education
                    </button>
                  </div>
                )}

                {/* Existing items */}
                {educationList.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {educationList.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none flex flex-col gap-3.5 shadow-2xs transition-all overflow-hidden w-full max-w-full"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 rounded-none text-[10px] font-headline font-bold tracking-wider">
                                {edu.eduType || 'Degree'}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                              <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                                {edu.degree || edu.eduType}
                              </h4>
                              {edu.fieldOfStudy && (
                                <p className="text-xs sm:text-sm font-sans font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <span>{edu.fieldOfStudy}</span>
                                </p>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              🏛️ <span className="font-semibold">{edu.institute}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {(edu.startDate || edu.endDate) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                                  🗓️ {sanitizeDateYear(edu.startDate) || 'N/A'} - {sanitizeDateYear(edu.endDate) || 'N/A'}
                                </span>
                              )}
                              {edu.gradeValue && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 rounded-none text-xs font-headline font-bold text-blue-900 dark:text-blue-200 shadow-2xs">
                                  ⭐ {edu.gradeType || 'Grade'}: {edu.gradeValue}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:self-start">
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
                                setActiveModal('education');
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
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
                                  closeModal();
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pop-up Modal for Add/Edit Education */}
                {activeModal === 'education' && (
                  <div
                    className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 dark:bg-black/25 flex items-start sm:items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) closeModal();
                    }}
                  >
                    <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-700 pb-3">
                        <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 shadow-2xs">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                            {editingEduIdx !== null ? 'Edit Education Record' : 'Add Education Record'}
                          </h3>
                          <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                            {editingEduIdx !== null ? 'Update your academic credentials' : 'Enter details of your school, college, or university'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Education Type <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <select
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              value={newEdu.eduType}
                              onChange={handleEduTypeChange}
                            >
                              <option value="">Select level of education</option>
                              {(!educationList.some((e, i) => e.eduType === 'High School' && i !== editingEduIdx)) && (
                                <option value="High School">High School / Intermediate</option>
                              )}
                              {(!educationList.some((e, i) => e.eduType === 'Diploma' && i !== editingEduIdx)) && (
                                <option value="Diploma">Diploma</option>
                              )}
                              {(!educationList.some((e, i) => e.eduType === 'Bachelors' && i !== editingEduIdx)) && (
                                <option value="Bachelors">Bachelors Degree</option>
                              )}
                              {(!educationList.some((e, i) => e.eduType === 'Masters' && i !== editingEduIdx)) && (
                                <option value="Masters">Masters Degree</option>
                              )}
                              {(!educationList.some((e, i) => e.eduType === 'Doctorate' && i !== editingEduIdx)) && (
                                <option value="Doctorate">Doctorate / PhD</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Institute <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter your Institute Name"
                              value={newEdu.institute}
                              onKeyDown={e => {
                                if (newEdu.eduType !== 'High School') {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }
                              }}
                              onChange={e => {
                                const val = newEdu.eduType !== 'High School' ? e.target.value.replace(/[0-9]/g, '') : e.target.value;
                                setNewEdu(prev => ({ ...prev, institute: val }));
                              }}
                            />
                          </div>
                        </div>

                        {newEdu.eduType === 'High School' ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Percentage in Class 10 <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder="e.g. 92"
                                value={class10Percent}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (e.key === '.' && !class10Percent.includes('.')) return;
                                  if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => handleClass10Change(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Percentage in Class 12 <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder="e.g. 88"
                                value={class12Percent}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (e.key === '.' && !class12Percent.includes('.')) return;
                                  if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => handleClass12Change(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Stream in Class 11 <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder="e.g. Science"
                                value={class11Stream}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (!/^[a-zA-Z\s]$/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => handleStreamChange(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Degree <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder="ex. Bachelor of Technology"
                                value={newEdu.degree}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => setNewEdu(prev => ({ ...prev, degree: e.target.value.replace(/[0-9]/g, '') }))}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Field of Study <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder="ex. Computer Science"
                                value={newEdu.fieldOfStudy}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={e => setNewEdu(prev => ({ ...prev, fieldOfStudy: e.target.value.replace(/[0-9]/g, '') }))}
                              />
                            </div>
                          </div>
                        )}

                        {newEdu.eduType !== 'High School' && (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Start Date <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="date"
                                min="1950-01-01"
                                max={newEdu.endDate ? sanitizeDateYear(newEdu.endDate) : "2099-12-31"}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                value={sanitizeDateYear(newEdu.startDate)}
                                onChange={e => setNewEdu(prev => ({ ...prev, startDate: sanitizeDateYear(e.target.value) }))}
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                End Date <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="date"
                                min={newEdu.startDate ? sanitizeDateYear(newEdu.startDate) : "1950-01-01"}
                                max="2099-12-31"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                value={sanitizeDateYear(newEdu.endDate)}
                                onChange={e => setNewEdu(prev => ({ ...prev, endDate: sanitizeDateYear(e.target.value) }))}
                              />
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Grade Type <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                value={newEdu.gradeType}
                                onChange={e => {
                                  const selectedType = e.target.value;
                                  let cleanedVal = newEdu.gradeValue || '';
                                  if (selectedType === 'Grade') {
                                    cleanedVal = cleanedVal.replace(/[^a-zA-Z+-]/g, '').toUpperCase();
                                  } else {
                                    cleanedVal = cleanedVal.replace(/\D/g, '');
                                  }
                                  setNewEdu({ ...newEdu, gradeType: selectedType, gradeValue: cleanedVal });
                                }}
                              >
                                <option value="">Select Grade Type</option>
                                <option value="Percentage">Percentage (%)</option>
                                <option value="CGPA">CGPA</option>
                                <option value="GPA">GPA</option>
                                <option value="Grade">Letter Grade</option>
                              </select>
                            </div>

                            <div className="md:col-span-1">
                              <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                                Grade Value <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                                placeholder={newEdu.gradeType === 'Grade' ? 'e.g. A+' : newEdu.gradeType === 'Percentage' ? 'e.g. 85' : 'e.g. 9'}
                                value={newEdu.gradeValue}
                                onKeyDown={e => {
                                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                  if (newEdu.gradeType === 'Grade') {
                                    if (!/^[a-zA-Z+-]$/.test(e.key)) {
                                      e.preventDefault();
                                    }
                                  } else {
                                    if (!/[0-9]/.test(e.key)) {
                                      e.preventDefault();
                                    }
                                  }
                                }}
                                onChange={e => {
                                  let val = e.target.value;
                                  if (newEdu.gradeType === 'Grade') {
                                    val = val.replace(/[^a-zA-Z+-]/g, '').toUpperCase();
                                  } else {
                                    val = val.replace(/\D/g, '');
                                  }
                                  setNewEdu({ ...newEdu, gradeValue: val });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEduIdx(null);
                            setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                            setClass10Percent('');
                            setClass12Percent('');
                            setClass11Stream('');
                            closeModal();
                          }}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-headline font-bold rounded-none text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newEdu.eduType || !newEdu.institute || !newEdu.institute.trim()) {
                              showAlert('Please fill out **Education Type** and **Institute**.', 'error');
                              return;
                            }
                            if (newEdu.eduType === 'High School') {
                              if (!class10Percent || !class12Percent || !class11Stream) {
                                showAlert('Please fill out **Percentage in Class 10**, **Percentage in Class 12**, and **Stream in Class 11**.', 'error');
                                return;
                              }
                            } else {
                              if (!newEdu.degree || !newEdu.degree.trim() || !newEdu.fieldOfStudy || !newEdu.fieldOfStudy.trim()) {
                                showAlert('Please fill out **Degree** and **Field of Study**.', 'error');
                                return;
                              }
                              if (!newEdu.startDate || !newEdu.endDate) {
                                showAlert('Please select both **Start Date** and **End Date**.', 'error');
                                return;
                              }
                              if (!newEdu.gradeType) {
                                showAlert('Please select **Grade Type**.', 'error');
                                return;
                              }
                              if (!newEdu.gradeValue || !newEdu.gradeValue.trim()) {
                                showAlert('Please enter **Grade Value**.', 'error');
                                return;
                              }
                            }
                            if (newEdu.startDate && newEdu.endDate && newEdu.startDate > newEdu.endDate) {
                              showAlert('**End Date** cannot be earlier than **Start Date**.', 'error');
                              return;
                            }
                            const recordToSave = {
                              ...newEdu,
                              startDate: sanitizeDateYear(newEdu.startDate),
                              endDate: sanitizeDateYear(newEdu.endDate)
                            };
                            if (editingEduIdx !== null) {
                              const updatedList = [...educationList];
                              updatedList[editingEduIdx] = recordToSave;
                              setEducationList(updatedList);
                              setEditingEduIdx(null);
                            } else {
                              setEducationList([...educationList, recordToSave]);
                            }
                            setNewEdu({ eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' });
                            setClass10Percent('');
                            setClass12Percent('');
                            setClass11Stream('');
                            closeModal();
                          }}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingEduIdx !== null ? 'Save Edit' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel 4: Experience */}
            {profileTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Work Experience</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-600 dark:text-slate-400">{experienceList.length} Items Added</span>
                    {experienceList.length > 0 && (
                      <button
                        type="button"
                        onClick={openAddExpModal}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Experience
                      </button>
                    )}
                  </div>
                </div>

                {/* Verified Gig Stats Card */}
                {gigExperienceItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-none border border-slate-300 dark:border-slate-700 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-400 dark:border-emerald-600 shadow-2xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">Completed Geeks</p>
                        <p className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">{completedGigsCount} Verified Geeks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-400 dark:border-amber-600 shadow-2xs">
                        <Star className="w-5 h-5 fill-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">Average Rating</p>
                        <p className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">{averageRating} / 5.0 Rating</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {experienceList.length === 0 && (
                  <div className="p-8 sm:p-12 border border-slate-300 dark:border-slate-700 border-dashed rounded-none bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">You haven't added any record</h4>
                      <p className="text-xs font-sans text-slate-600 dark:text-slate-400 max-w-sm">
                        Add your internships, full-time jobs, or freelance projects to showcase your professional journey.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddExpModal}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Experience
                    </button>
                  </div>
                )}

                {/* Existing items */}
                {experienceList.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {experienceList.map((exp, idx) => (
                      <div
                        key={idx}
                        className={`p-5 sm:p-6 border rounded-none flex flex-col gap-4 shadow-2xs transition-all overflow-hidden w-full max-w-full ${
                          exp.expType === 'Gig'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 hover:border-blue-600'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 rounded-none text-[10px] font-headline font-bold tracking-wider">
                                {exp.expType || 'Role'}
                              </span>
                              {exp.expType === 'Gig' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-[10px] font-headline font-bold border border-emerald-400 dark:border-emerald-600">
                                  <Award className="w-3 h-3" /> Verified Gig
                                </span>
                              )}
                              {exp.involvesTech && (
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-none text-[10px] font-headline font-bold">
                                  Tech Role
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                              <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                                {exp.designation}
                              </h4>
                              <p className="text-xs sm:text-sm font-sans font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span>🏢 {exp.companyName}</span>
                                {exp.domain && <span className="opacity-75">• {exp.domain}</span>}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                                🗓️ {exp.startDate} to {exp.currentlyWorking ? 'Present' : exp.endDate || 'N/A'}
                              </span>
                              {exp.location && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                                  📍 {exp.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {exp.expType !== 'Gig' && (
                            <div className="flex items-center gap-2 shrink-0 sm:self-start">
                              <button
                                type="button"
                                onClick={() => {
                                  const item = experienceList[idx];
                                  setNewExp({ ...item });
                                  setDomainSearch('');
                                  setEditingExpIdx(idx);
                                  setActiveModal('experience');
                                }}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
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
                                    closeModal();
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {exp.description && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 w-full overflow-hidden">
                            <p className="text-xs sm:text-sm font-sans font-normal text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-none border border-slate-200 dark:border-slate-700 whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] w-full">
                              {exp.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pop-up Modal for Add/Edit Experience */}
                {activeModal === 'experience' && (
                  <div
                    className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 dark:bg-black/25 flex items-start sm:items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) closeModal();
                    }}
                  >
                    <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-700 pb-3">
                        <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 shadow-2xs">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                            {editingExpIdx !== null ? 'Edit Work Experience' : 'Add Work Experience'}
                          </h3>
                          <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                            {editingExpIdx !== null ? 'Update your career information' : 'Enter details of your work, internship, or freelance experience'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Experience Type <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <select
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
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
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Designation <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter your role"
                              value={newExp.designation}
                              onChange={e => setNewExp({ ...newExp, designation: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Company Name <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter Company Name"
                              value={newExp.companyName}
                              onChange={e => setNewExp({ ...newExp, companyName: e.target.value })}
                            />
                          </div>

                          <div className="relative" ref={domainContainerRef}>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Domain of Experience</label>
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 pr-8 font-sans font-medium shadow-2xs"
                                placeholder="Search or select domain"
                                value={domainSearch !== '' ? domainSearch : (newExp.domain || '')}
                                onChange={e => {
                                  setDomainSearch(e.target.value);
                                  setNewExp(prev => ({ ...prev, domain: e.target.value }));
                                  setShowDomainDropdown(true);
                                }}
                                onFocus={() => setShowDomainDropdown(true)}
                              />
                              <button
                                type="button"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                onClick={() => setShowDomainDropdown(prev => !prev)}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {showDomainDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-xl max-h-56 overflow-y-auto pr-1 py-1 custom-scrollbar divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredDomains.length === 0 && domainSearch.trim() !== '' && (
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-sans cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setNewExp(prev => ({ ...prev, domain: domainSearch }));
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
                                    className="w-full text-left px-3 py-2 text-xs text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-sans font-medium cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setNewExp(prev => ({ ...prev, domain: opt }));
                                      setDomainSearch('');
                                      setShowDomainDropdown(false);
                                    }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-headline font-bold cursor-pointer"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setNewExp(prev => ({ ...prev, domain: 'Other' }));
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
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Start Date <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="date"
                              min="1950-01-01"
                              max={newExp.endDate ? sanitizeDateYear(newExp.endDate) : "2099-12-31"}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              value={sanitizeDateYear(newExp.startDate)}
                              onChange={e => setNewExp(prev => ({ ...prev, startDate: sanitizeDateYear(e.target.value) }))}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">End Date</label>
                            <input
                              type="date"
                              min={newExp.startDate ? sanitizeDateYear(newExp.startDate) : "1950-01-01"}
                              max="2099-12-31"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              disabled={newExp.currentlyWorking}
                              value={newExp.currentlyWorking ? '' : sanitizeDateYear(newExp.endDate)}
                              onChange={e => setNewExp(prev => ({ ...prev, endDate: sanitizeDateYear(e.target.value) }))}
                            />
                          </div>

                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="rounded-none border-slate-300 dark:border-slate-700 text-blue-700 bg-white dark:bg-slate-900 focus:ring-0 w-3.5 h-3.5"
                                checked={newExp.currentlyWorking}
                                onChange={e => setNewExp({ ...newExp, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newExp.endDate })}
                              />
                              <span className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200">Currently Working Here</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Location</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="e.g. San Francisco / Remote"
                              value={newExp.location}
                              onKeyDown={e => {
                                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                if (/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={e => setNewExp({ ...newExp, location: e.target.value.replace(/[0-9]/g, '') })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Roles And Responsibilities</label>
                          <textarea
                            rows="3"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                            placeholder="List key responsibilities or accomplishments..."
                            value={newExp.description}
                            onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpIdx(null);
                            setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                            setDomainSearch('');
                            closeModal();
                          }}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-headline font-bold rounded-none text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newExp.expType || !newExp.designation || !newExp.designation.trim() || !newExp.companyName || !newExp.companyName.trim() || !newExp.startDate) {
                              showAlert('Please fill out all mandatory fields: **Experience Type**, **Designation**, **Company Name**, and **Start Date**.', 'error');
                              return;
                            }
                            if (newExp.location && /[0-9]/.test(newExp.location)) {
                              showAlert('**Location** cannot contain numbers.', 'error');
                              return;
                            }
                            if (newExp.startDate && newExp.endDate && !newExp.currentlyWorking && newExp.startDate > newExp.endDate) {
                              showAlert('**End Date** cannot be earlier than **Start Date**.', 'error');
                              return;
                            }
                            const recordToSave = {
                              ...newExp,
                              startDate: sanitizeDateYear(newExp.startDate),
                              endDate: newExp.currentlyWorking ? '' : sanitizeDateYear(newExp.endDate)
                            };
                            if (editingExpIdx !== null) {
                              const updatedList = [...experienceList];
                              updatedList[editingExpIdx] = recordToSave;
                              setExperienceList(updatedList);
                              setEditingExpIdx(null);
                            } else {
                              setExperienceList([...experienceList, recordToSave]);
                            }
                            setNewExp({ expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' });
                            setDomainSearch('');
                            closeModal();
                          }}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingExpIdx !== null ? 'Save Edit' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel 5: Certificates */}
            {profileTab === 'certificates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Certifications</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-600 dark:text-slate-400">{certificatesList.length} Items Added</span>
                    {certificatesList.length > 0 && (
                      <button
                        type="button"
                        onClick={openAddCertModal}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Certificate
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State */}
                {certificatesList.length === 0 && (
                  <div className="p-8 sm:p-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-none bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shadow-2xs">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">You haven't added any record</h4>
                      <p className="text-xs font-sans font-normal text-slate-600 dark:text-slate-400 max-w-sm">
                        Add licenses, verified credentials, and specialized course certifications you have earned.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddCertModal}
                      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Certificate
                    </button>
                  </div>
                )}

                {/* Existing items */}
                {certificatesList.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {certificatesList.map((cert, idx) => (
                      <div
                        key={idx}
                        className="p-5 sm:p-6 bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none flex flex-col gap-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden w-full max-w-full"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 rounded-none text-[10px] font-headline font-bold tracking-wider">
                              Certification
                            </span>

                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                              <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                                {cert.title}
                              </h4>
                              <p className="text-xs sm:text-sm font-sans font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span>🏛️ Issued by: {cert.org}</span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {cert.startDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200">
                                  🗓️ Issued: {cert.startDate}
                                </span>
                              )}
                              {cert.certNumber && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 rounded-none text-xs font-headline font-bold text-blue-800 dark:text-blue-300">
                                  ID: {cert.certNumber}
                                </span>
                              )}
                              {cert.link && (
                                <a
                                  href={cert.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-blue-700 dark:text-blue-400 transition-all shadow-2xs"
                                >
                                  🔗 View Link
                                </a>
                              )}
                              {cert.attachment && (
                                <a
                                  href={cert.attachment}
                                  download={`certificate_${cert.title.toLowerCase().replace(/\s+/g, '_')}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 transition-all shadow-2xs"
                                >
                                  📥 Download File
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:self-start">
                            <button
                              type="button"
                              onClick={() => {
                                const item = certificatesList[idx];
                                setNewCert({ ...item });
                                setCertFileUploadError('');
                                setEditingCertIdx(idx);
                                setActiveModal('certificates');
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-slate-800 dark:text-slate-200 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
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
                                  closeModal();
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {cert.description && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 w-full overflow-hidden">
                            <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-none border border-slate-200 dark:border-slate-800 whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] w-full">
                              {cert.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pop-up Modal for Add/Edit Certification */}
                {activeModal === 'certificates' && (
                  <div
                    className="absolute inset-0 z-50 backdrop-blur-md flex items-start sm:items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) closeModal();
                    }}
                  >
                    <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-700 pb-3">
                        <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-2xs">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                            {editingCertIdx !== null ? 'Edit Certification' : 'Add Certification'}
                          </h3>
                          <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">
                            {editingCertIdx !== null ? 'Update your certificate details' : 'Enter your course, license, or credential information'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Certificate Title <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter certificate title"
                              value={newCert.title}
                              onChange={e => setNewCert({ ...newCert, title: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Provider Organisation Name <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter Organisation Name"
                              value={newCert.org}
                              onChange={e => setNewCert({ ...newCert, org: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Start Date</label>
                            <input
                              type="date"
                              min="1950-01-01"
                              max="2099-12-31"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              value={sanitizeDateYear(newCert.startDate)}
                              onChange={e => setNewCert(prev => ({ ...prev, startDate: sanitizeDateYear(e.target.value) }))}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Certification Link</label>
                            <input
                              type="url"
                              className={`w-full bg-white dark:bg-slate-900 border ${
                                newCert.link && !isValidUrl(newCert.link)
                                  ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                              } rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-sans font-medium shadow-2xs`}
                              placeholder="https://example.com/certificate"
                              value={newCert.link}
                              onChange={e => setNewCert({ ...newCert, link: e.target.value })}
                              onBlur={() => {
                                if (newCert.link && isValidUrl(newCert.link)) {
                                  setNewCert(prev => ({ ...prev, link: ensureUrlProtocol(prev.link) }));
                                }
                              }}
                            />
                            {newCert.link && !isValidUrl(newCert.link) && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                                * Please enter a valid URL (e.g. https://example.com)
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Certification Number</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter Certification Number (integers only)"
                              value={newCert.certNumber || ''}
                              onKeyDown={e => {
                                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={e => setNewCert({ ...newCert, certNumber: e.target.value.replace(/\D/g, '') })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 tracking-wider">Upload Certificate File (Optional, max 100KB)</label>
                          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none">
                            <input
                              type="file"
                              id="cert-file-upload"
                              className="hidden"
                              accept="image/*,application/pdf"
                              onChange={handleCertFileChange}
                            />
                            <label
                              htmlFor="cert-file-upload"
                              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              {processingCertFile ? 'Processing...' : 'Choose File'}
                            </label>
                            <div className="flex-1 min-w-0">
                              {newCert.attachment ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-800 dark:text-slate-200 truncate font-sans font-medium">✓ Certificate file attached</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewCert(prev => ({ ...prev, attachment: '' }))}
                                    className="text-xs text-rose-600 hover:underline font-headline font-bold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">No file selected (Supports PDF or Images)</span>
                              )}
                            </div>
                          </div>
                          {certFileUploadError && (
                            <p className="text-xs text-rose-600 font-medium">{certFileUploadError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Description</label>
                          <textarea
                            rows="2"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                            placeholder="Enter description..."
                            value={newCert.description}
                            onChange={e => setNewCert({ ...newCert, description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCertIdx(null);
                            setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
                            setCertFileUploadError('');
                            closeModal();
                          }}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-headline font-bold rounded-none text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCert.title || !newCert.title.trim() || !newCert.org || !newCert.org.trim()) {
                              showAlert('Please enter **Certificate Title** and **Provider Organisation Name**.', 'error');
                              return;
                            }
                            if (newCert.link && newCert.link.trim() && !isValidUrl(newCert.link)) {
                              showAlert('Please enter a valid **Certification Link** (e.g. https://...).', 'error');
                              return;
                            }
                            if (newCert.certNumber && /\D/.test(newCert.certNumber)) {
                              showAlert('**Certification Number** must contain only integers.', 'error');
                              return;
                            }
                            const recordToSave = {
                              ...newCert,
                              link: newCert.link ? ensureUrlProtocol(newCert.link) : ''
                            };
                            if (editingCertIdx !== null) {
                              const updatedList = [...certificatesList];
                              updatedList[editingCertIdx] = recordToSave;
                              setCertificatesList(updatedList);
                              setEditingCertIdx(null);
                            } else {
                              setCertificatesList([...certificatesList, recordToSave]);
                            }
                            setNewCert({ title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' });
                            setCertFileUploadError('');
                            closeModal();
                          }}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingCertIdx !== null ? 'Save Edit' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel 6: Projects */}
            {profileTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Projects</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-600 dark:text-slate-400">{projectsList.length} Items Added</span>
                    {projectsList.length > 0 && (
                      <button
                        type="button"
                        onClick={openAddProjModal}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Project
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State */}
                {projectsList.length === 0 && (
                  <div className="p-8 sm:p-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-none bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shadow-2xs">
                      <FolderGit2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">You haven't added any record</h4>
                      <p className="text-xs font-sans font-normal text-slate-600 dark:text-slate-400 max-w-sm">
                        Showcase personal, academic, or open-source projects along with live links and repository URLs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddProjModal}
                      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Project
                    </button>
                  </div>
                )}

                {/* Existing items */}
                {projectsList.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {projectsList.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-5 sm:p-6 bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none flex flex-col gap-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden w-full max-w-full"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 rounded-none text-[10px] font-headline font-bold tracking-wider">
                              Project
                            </span>

                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                              <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                                {proj.title}
                              </h4>
                              {proj.role && (
                                <p className="text-xs sm:text-sm font-sans font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <span>Role: <strong className="text-slate-900 dark:text-slate-100">{proj.role}</strong></span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {(proj.startDate || proj.endDate) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-800 dark:text-slate-200">
                                  🗓️ {proj.startDate} - {proj.currentlyWorking ? 'Present' : proj.endDate || 'N/A'}
                                </span>
                              )}
                              {proj.codeUrl && (
                                <a
                                  href={proj.codeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-blue-700 dark:text-blue-400 transition-all shadow-2xs"
                                >
                                  💻 Code URL
                                </a>
                              )}
                              {proj.hostedUrl && (
                                <a
                                  href={proj.hostedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 transition-all shadow-2xs"
                                >
                                  🚀 Live Demo
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:self-start">
                            <button
                              type="button"
                              onClick={() => {
                                const item = projectsList[idx];
                                setNewProj({ ...item });
                                setEditingProjIdx(idx);
                                setActiveModal('projects');
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-slate-800 dark:text-slate-200 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
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
                                  closeModal();
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {proj.description && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 w-full overflow-hidden">
                            <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-none border border-slate-200 dark:border-slate-800 whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] w-full">
                              {proj.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pop-up Modal for Add/Edit Project */}
                {activeModal === 'projects' && (
                  <div
                    className="absolute inset-0 z-50 backdrop-blur-md flex items-start sm:items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) closeModal();
                    }}
                  >
                    <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-700 pb-3">
                        <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-2xs">
                          <FolderGit2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                            {editingProjIdx !== null ? 'Edit Project Record' : 'Add Project Record'}
                          </h3>
                          <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">
                            {editingProjIdx !== null ? 'Update your project information' : 'Showcase personal, academic, or professional projects'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Title <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Name of your project"
                              value={newProj.title}
                              onChange={e => setNewProj({ ...newProj, title: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Company / Role <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="Enter your role"
                              value={newProj.role}
                              onChange={e => setNewProj({ ...newProj, role: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Code URL</label>
                            <input
                              type="url"
                              className={`w-full bg-white dark:bg-slate-900 border ${
                                newProj.codeUrl && !isValidUrl(newProj.codeUrl)
                                  ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                              } rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-sans font-medium shadow-2xs`}
                              placeholder="https://github.com/username/project"
                              value={newProj.codeUrl}
                              onChange={e => setNewProj({ ...newProj, codeUrl: e.target.value })}
                              onBlur={() => {
                                if (newProj.codeUrl && isValidUrl(newProj.codeUrl)) {
                                  setNewProj(prev => ({ ...prev, codeUrl: ensureUrlProtocol(prev.codeUrl) }));
                                }
                              }}
                            />
                            {newProj.codeUrl && !isValidUrl(newProj.codeUrl) && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                                * Please enter a valid URL (e.g. https://github.com/...)
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Hosted URL</label>
                            <input
                              type="url"
                              className={`w-full bg-white dark:bg-slate-900 border ${
                                newProj.hostedUrl && !isValidUrl(newProj.hostedUrl)
                                  ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                              } rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-sans font-medium shadow-2xs`}
                              placeholder="https://myproject.com (optional)"
                              value={newProj.hostedUrl}
                              onChange={e => setNewProj({ ...newProj, hostedUrl: e.target.value })}
                              onBlur={() => {
                                if (newProj.hostedUrl && isValidUrl(newProj.hostedUrl)) {
                                  setNewProj(prev => ({ ...prev, hostedUrl: ensureUrlProtocol(prev.hostedUrl) }));
                                }
                              }}
                            />
                            {newProj.hostedUrl && !isValidUrl(newProj.hostedUrl) && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                                * Please enter a valid URL (e.g. https://myproject.com)
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Start Date <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="date"
                              min="1950-01-01"
                              max={newProj.endDate ? sanitizeDateYear(newProj.endDate) : "2099-12-31"}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              value={sanitizeDateYear(newProj.startDate)}
                              onChange={e => setNewProj(prev => ({ ...prev, startDate: sanitizeDateYear(e.target.value) }))}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">End Date</label>
                            <input
                              type="date"
                              min={newProj.startDate ? sanitizeDateYear(newProj.startDate) : "1950-01-01"}
                              max="2099-12-31"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              disabled={newProj.currentlyWorking}
                              value={newProj.currentlyWorking ? '' : sanitizeDateYear(newProj.endDate)}
                              onChange={e => setNewProj(prev => ({ ...prev, endDate: sanitizeDateYear(e.target.value) }))}
                            />
                          </div>

                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="rounded-none border-slate-300 dark:border-slate-700 text-blue-700 bg-white dark:bg-slate-900 w-3.5 h-3.5 focus:ring-0"
                                checked={newProj.currentlyWorking}
                                onChange={e => setNewProj({ ...newProj, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : newProj.endDate })}
                              />
                              <span className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200">Currently Working Here</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Description</label>
                          <textarea
                            rows="3"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                            placeholder="Add key features, stacks, or descriptions... (New line for bullet point)"
                            value={newProj.description}
                            onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProjIdx(null);
                            setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                            closeModal();
                          }}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-headline font-bold rounded-none text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newProj.title || !newProj.title.trim() || !newProj.role || !newProj.role.trim() || !newProj.startDate) {
                              showAlert('Please fill out **Project Title**, **Role**, and **Start Date**.', 'error');
                              return;
                            }
                            if (newProj.codeUrl && newProj.codeUrl.trim() && !isValidUrl(newProj.codeUrl)) {
                              showAlert('Please enter a valid **Code URL** (e.g. https://github.com/...).', 'error');
                              return;
                            }
                            if (newProj.hostedUrl && newProj.hostedUrl.trim() && !isValidUrl(newProj.hostedUrl)) {
                              showAlert('Please enter a valid **Hosted URL** (e.g. https://...).', 'error');
                              return;
                            }
                            if (newProj.startDate && newProj.endDate && !newProj.currentlyWorking && newProj.startDate > newProj.endDate) {
                              showAlert('**End Date** cannot be earlier than **Start Date**.', 'error');
                              return;
                            }
                            const recordToSave = {
                              ...newProj,
                              codeUrl: newProj.codeUrl ? ensureUrlProtocol(newProj.codeUrl) : '',
                              hostedUrl: newProj.hostedUrl ? ensureUrlProtocol(newProj.hostedUrl) : '',
                              startDate: sanitizeDateYear(newProj.startDate),
                              endDate: newProj.currentlyWorking ? '' : sanitizeDateYear(newProj.endDate)
                            };
                            if (editingProjIdx !== null) {
                              const updatedList = [...projectsList];
                              updatedList[editingProjIdx] = recordToSave;
                              setProjectsList(updatedList);
                              setEditingProjIdx(null);
                            } else {
                              setProjectsList([...projectsList, recordToSave]);
                            }
                            setNewProj({ title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
                            closeModal();
                          }}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingProjIdx !== null ? 'Save Edit' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel 7: Skills */}
            {profileTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <label className="block text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Your Stacks & Skills</label>
                  <span className="text-xs font-sans font-medium text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 px-3 py-1.5 rounded-none flex items-center gap-1.5 shadow-2xs">
                    Skills with MCQ quizzes are verified via Skill Tests (starts at 1/10). Soft skills and technical skills without quizzes can be self-rated (1–10).
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 space-y-5 shadow-2xs">
                  {/* Searchable input & add button */}
                  <div className="pb-3 border-b border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1" ref={skillContainerRef}>
                        <input
                          type="text"
                          placeholder="Search or type a skill name..."
                          value={selectedNewSkill}
                          onChange={e => {
                            setSelectedNewSkill(e.target.value);
                            setIsSkillDropdownOpen(true);
                          }}
                          onFocus={() => setIsSkillDropdownOpen(true)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-700 focus:outline-none transition-all shadow-2xs font-sans font-medium"
                        />

                        {isSkillDropdownOpen && selectedNewSkill.trim() && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                            {(() => {
                              const filtered = ALL_SKILLS.filter(
                                s => s.skill.toLowerCase().includes(selectedNewSkill.toLowerCase()) &&
                                  !skillsList.some(exist => exist.name.toLowerCase() === s.skill.toLowerCase())
                              );

                              const isExactMatch = ALL_SKILLS.some(
                                s => s.skill.toLowerCase() === selectedNewSkill.trim().toLowerCase()
                              );

                              return (
                                <>
                                  {filtered.map(s => (
                                    <button
                                      key={s.skill}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleAddSkill(s.skill);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-all flex items-center justify-between group cursor-pointer"
                                    >
                                      <span className="font-bold">{s.skill}</span>
                                      <span className="text-[10px] font-sans font-bold tracking-wider px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:border-blue-400 transition-all">
                                        {s.type}
                                      </span>
                                    </button>
                                  ))}

                                  {!isExactMatch && selectedNewSkill.trim() && (
                                    <button
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleAddSkill(selectedNewSkill.trim());
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center justify-between border-t border-slate-200 dark:border-slate-800 cursor-pointer font-bold"
                                    >
                                      <span>+ Add custom skill: "{selectedNewSkill.trim()}"</span>
                                      <span className="text-[10px] font-headline font-bold px-1.5 py-0.5 rounded-none bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">custom</span>
                                    </button>
                                  )}

                                  {filtered.length === 0 && isExactMatch && (
                                    <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">Skill already added</div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSkill()}
                        disabled={!selectedNewSkill.trim()}
                        className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Skill</span>
                      </button>
                    </div>
                  </div>

                  {skillsList.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">No skills added yet. Type or search a skill above.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {skillsList.map(skill => {
                        const skillObj = ALL_SKILLS.find(s => s.skill.toLowerCase() === skill.name.toLowerCase());
                        const isTech = skillObj ? skillObj.type === 'technical' : true;
                        const hasMcq = hasSkillMcq(skill.name) || (techSkills || []).some(t => t.name?.toLowerCase() === skill.name.toLowerCase() && t.hasQuiz);
                        const hasVerifiedRating = skill.verifiedRating !== null && skill.verifiedRating !== undefined;
                        const currentScore = skill.rating || 1;

                        return (
                          <div 
                            key={skill.name}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-slate-900 dark:text-slate-100 transition-all shadow-2xs group select-none"
                          >
                            <span className="font-bold text-slate-900 dark:text-slate-100">{skill.name}</span>
                            
                            {/* Rating Display / Selector */}
                            {hasMcq ? (
                              /* Skills with MCQ: Candidate cannot self-rate. Static score display with verified/unverified mark */
                              <div className="flex items-center gap-1.5" title={hasVerifiedRating ? `Verified by Skill Test (>= 70%): Level ${skill.verifiedRating}/10` : `Unverified Skill Test score: Level ${currentScore}/10`}>
                                <span className="text-xs font-sans font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-none border border-slate-300 dark:border-slate-600">
                                  {currentScore}/10
                                </span>
                                {hasVerifiedRating ? (
                                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 px-1.5 py-0.5 rounded-none font-headline font-bold tracking-wider flex items-center gap-0.5" title={`Verified: Level ${skill.verifiedRating}/10 (Cleared 70% threshold)`}>
                                    ✓ Verified
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-none font-headline font-bold tracking-wider" title="Unverified: Score >= 70% on the Skill Test to earn a verified rating">
                                    Unverified
                                  </span>
                                )}
                              </div>
                            ) : (
                              /* Untestable Technical Skills and Soft Skills: Candidate is allowed to self-rate */
                              <div className="relative inline-flex items-center" title="Set self-rating (1-10)">
                                <select
                                  value={skill.rating || 1}
                                  onChange={(e) => {
                                    const newRating = parseInt(e.target.value, 10);
                                    setSkillsList(prev => prev.map(s => s.name.toLowerCase() === skill.name.toLowerCase() ? { ...s, rating: newRating } : s));
                                  }}
                                  className="text-xs font-sans font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-none px-1.5 py-0.5 pr-4 appearance-none cursor-pointer focus:outline-none focus:border-blue-700 transition-all"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
                                    <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                      {r}/10
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400 absolute right-1 pointer-events-none opacity-70" />
                              </div>
                            )}

                            {!isTech && (
                              <span className="text-[9px] font-sans font-bold tracking-wider px-1 py-0.5 rounded-none bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                soft
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSkillsList(prev => prev.filter(s => s.name.toLowerCase() !== skill.name.toLowerCase()))}
                              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-0.5 p-0.5 rounded-none hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Remove skill"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel 8: Co-Curricular */}
            {profileTab === 'cocurricular' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Co-Curricular</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-sans font-medium tracking-wider text-slate-600 dark:text-slate-400">{cocurricular.length} Items Added</span>
                    {cocurricular.length > 0 && (
                      <button
                        type="button"
                        onClick={openAddCocurricularModal}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Activity
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State */}
                {cocurricular.length === 0 && (
                  <div className="p-8 sm:p-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-none bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shadow-2xs">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">You haven't added any record</h4>
                      <p className="text-xs font-sans font-normal text-slate-600 dark:text-slate-400 max-w-sm">
                        Add positions of responsibility, student clubs, hackathons, sports, or volunteer initiatives.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddCocurricularModal}
                      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Activity
                    </button>
                  </div>
                )}

                {/* Existing items */}
                {cocurricular.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {cocurricular.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-5 sm:p-6 bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none flex flex-col gap-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden w-full max-w-full"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-600 rounded-none text-[10px] font-headline font-bold tracking-wider">
                              Activity / POR
                            </span>

                            <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                              {act.activity}
                            </h4>

                            {act.link && (
                              <div className="pt-1">
                                <a
                                  href={act.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none text-xs font-headline font-bold text-blue-700 dark:text-blue-400 transition-all shadow-2xs"
                                >
                                  🔗 View Link
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:self-start">
                            <button
                              type="button"
                              onClick={() => {
                                const item = cocurricular[idx];
                                setNewCocurricular({ ...item });
                                setEditingCocurricularIdx(idx);
                                setActiveModal('cocurricular');
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-slate-800 dark:text-slate-200 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
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
                                  closeModal();
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-none text-xs font-headline font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {act.description && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 w-full overflow-hidden">
                            <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-none border border-slate-200 dark:border-slate-800 whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] w-full">
                              {act.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pop-up Modal for Add/Edit Co-curricular */}
                {activeModal === 'cocurricular' && (
                  <div
                    className="absolute inset-0 z-50 backdrop-blur-md flex items-start sm:items-center justify-center p-4 animate-fade-in overflow-y-auto"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) closeModal();
                    }}
                  >
                    <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-700 pb-3">
                        <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-2xs">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                            {editingCocurricularIdx !== null ? 'Edit Co-Curricular Activity' : 'Add Co-Curricular Activity'}
                          </h3>
                          <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">
                            {editingCocurricularIdx !== null ? 'Update your activity or position details' : 'Add positions of responsibility, clubs, sports, or volunteer work'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">
                              Activity / Title <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                              placeholder="e.g. Football Captain, Debate Club Coordinator"
                              value={newCocurricular.activity}
                              onChange={e => setNewCocurricular({ ...newCocurricular, activity: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Certification Link (Optional)</label>
                            <input
                              type="url"
                              className={`w-full bg-white dark:bg-slate-900 border ${
                                newCocurricular.link && !isValidUrl(newCocurricular.link)
                                  ? 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500/30'
                                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-700'
                              } rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-sans font-medium shadow-2xs`}
                              placeholder="https://example.com/certificate"
                              value={newCocurricular.link}
                              onChange={e => setNewCocurricular({ ...newCocurricular, link: e.target.value })}
                              onBlur={() => {
                                if (newCocurricular.link && isValidUrl(newCocurricular.link)) {
                                  setNewCocurricular(prev => ({ ...prev, link: ensureUrlProtocol(prev.link) }));
                                }
                              }}
                            />
                            {newCocurricular.link && !isValidUrl(newCocurricular.link) && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-sans font-semibold mt-1">
                                * Please enter a valid URL (e.g. https://...)
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-wider">Description (Optional)</label>
                          <textarea
                            rows="2"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-700 font-sans font-medium shadow-2xs"
                            placeholder="Describe your role or accomplishment..."
                            value={newCocurricular.description}
                            onChange={e => setNewCocurricular({ ...newCocurricular, description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCocurricularIdx(null);
                            setNewCocurricular({ activity: '', link: '', description: '' });
                            closeModal();
                          }}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-headline font-bold rounded-none text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCocurricular.activity || !newCocurricular.activity.trim()) {
                              showAlert('Please enter **Activity / Title**.', 'error');
                              return;
                            }
                            if (newCocurricular.link && newCocurricular.link.trim() && !isValidUrl(newCocurricular.link)) {
                              showAlert('Please enter a valid **Certification Link** (e.g. https://...).', 'error');
                              return;
                            }
                            const recordToSave = {
                              ...newCocurricular,
                              link: newCocurricular.link ? ensureUrlProtocol(newCocurricular.link) : ''
                            };
                            if (editingCocurricularIdx !== null) {
                              const updatedList = [...cocurricular];
                              updatedList[editingCocurricularIdx] = recordToSave;
                              setCocurricular(updatedList);
                              setEditingCocurricularIdx(null);
                            } else {
                              setCocurricular([...cocurricular, recordToSave]);
                            }
                            setNewCocurricular({ activity: '', link: '', description: '' });
                            closeModal();
                          }}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold rounded-none text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {editingCocurricularIdx !== null ? 'Save Edit' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Bottom Navigation & Save Action Bar */}
        {(() => {
          const currentTabIdx = tabsList.findIndex(t => t.id === profileTab);
          const prevTab = currentTabIdx > 0 ? tabsList[currentTabIdx - 1] : null;
          const nextTab = currentTabIdx < tabsList.length - 1 ? tabsList[currentTabIdx + 1] : null;

          return (
            <div className="pt-6 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                disabled={!prevTab}
                onClick={() => prevTab && setProfileTab(prevTab.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-none text-xs font-headline font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>PREVIOUS</span>
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={!isSaveActive || submittingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-600 text-slate-800 dark:text-slate-200 font-headline font-bold text-xs rounded-none shadow-2xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  {submittingProfile ? 'Saving...' : 'Save Profile'}
                </button>

                {nextTab ? (
                  <button
                    type="button"
                    onClick={() => setProfileTab(nextTab.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isSaveActive || submittingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold tracking-wider disabled:opacity-40 disabled:pointer-events-none shadow-xs cursor-pointer transition-all"
                  >
                    {submittingProfile ? 'Saving...' : 'Finish & Save Profile'}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
        </div>
      </form>
    </div>
  );
}
