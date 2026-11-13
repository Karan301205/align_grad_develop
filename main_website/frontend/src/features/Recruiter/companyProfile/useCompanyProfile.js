import { useState } from 'react';
import { apiFetch } from '../../../services/apiClient';
import {
  DOC_MAX_BYTES,
  IMAGE_TYPES,
  LOGO_MAX_BYTES,
  MAX_OFFICE_PHOTOS,
  PHOTO_MAX_BYTES,
  REQUIRED_DOCS,
  VERIFICATION_DOC_TYPES
} from './constants';
import { uploadFile } from './uploadFile';
import { validateProfile, withProtocol } from './validation';

const PROFILE_KEYS = ['name', 'industry', 'companySize', 'location', 'foundedYear', 'website', 'description', 'recruiterName', 'recruiterDesignation', 'officialEmail'];

function initialValues(company) {
  const values = Object.fromEntries(PROFILE_KEYS.map((key) => [key, company?.[key] || '']));
  values.linkedin = company?.socialLinks?.linkedin || '';
  return values;
}

function initialDocs(company) {
  if (Array.isArray(company?.verificationDocs) && company.verificationDocs.length > 0) {
    return company.verificationDocs.slice(0, REQUIRED_DOCS);
  }
  // Legacy rows stored a single document URL (always the incorporation certificate).
  if (!company?.docUrl) return [];
  const fileName = decodeURIComponent(company.docUrl.split('?')[0].split('/').pop() || '');
  return [{ docType: 'Certificate of Incorporation', docUrl: company.docUrl, fileName }];
}

function focusField(key) {
  const container = document.getElementById(`field-${key}`);
  if (!container) return;
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  container.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
}

const initialPhotos = (company) => (Array.isArray(company?.photos) ? company.photos : []);

/**
 * Form state and actions for the company profile page.
 *
 * State is initialised from `company` and re-synced only when a different company
 * record arrives or the review status changes. The layout refreshes company data in
 * place (silent refresh) after saving, so the page is not remounted and unsaved
 * edits and staged documents survive a failed submit.
 */
export default function useCompanyProfile({ company, status, token, locked, notify, handleUpdateCompany, handleVerification }) {
  const [values, setValues] = useState(() => initialValues(company));
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl || '');
  const [docs, setDocs] = useState(() => initialDocs(company));
  const [photos, setPhotos] = useState(() => initialPhotos(company));
  // When the record first loads (e.g. after a failed load and a retry) or the review
  // status changes (e.g. just submitted), the saved record is the truth: show it,
  // including server-normalised values such as https:// links.
  const syncKey = company ? `${company.id || ''}:${status}` : '';
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setValues(initialValues(company));
    setLogoUrl(company?.logoUrl || '');
    setDocs(initialDocs(company));
    setPhotos(initialPhotos(company));
  }
  const [chosenDocType, setDocType] = useState(VERIFICATION_DOC_TYPES[0]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState({ logo: false, doc: false, photos: false, submit: false, removingPhoto: null });

  const setBusyFlag = (key, value) => setBusy((prev) => ({ ...prev, [key]: value }));
  const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const setField = (key, value) => {
    if (locked) return;
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  // The picked type must still be free; otherwise fall back to the first free type.
  const freeDocTypes = VERIFICATION_DOC_TYPES.filter((type) => !docs.some((doc) => doc.docType === type));
  const docType = freeDocTypes.includes(chosenDocType) ? chosenDocType : freeDocTypes[0];

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return notify('Upload the logo as a JPG, PNG or WebP image.', 'warning');
    if (file.size > LOGO_MAX_BYTES) return notify('The logo must be 2MB or smaller.', 'warning');
    setBusyFlag('logo', true);
    try {
      setLogoUrl(await uploadFile({ token, file, fileType: 'image' }));
      notify('Logo uploaded. It is saved when you submit your profile.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyFlag('logo', false);
    }
  };

  const uploadDoc = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !docType) return;
    if (docs.length >= REQUIRED_DOCS) return notify(`Only ${REQUIRED_DOCS} documents are needed. Remove one to replace it.`, 'warning');
    if (file.type !== 'application/pdf') return notify('Upload legal documents as PDF files.', 'warning');
    if (file.size > DOC_MAX_BYTES) return notify('Each document must be 10MB or smaller.', 'warning');
    setBusyFlag('doc', true);
    try {
      const docUrl = await uploadFile({ token, file, fileType: 'doc' });
      setDocs((prev) => [...prev, { docType, docUrl, fileName: file.name }].slice(0, REQUIRED_DOCS));
      clearError('verification');
      notify(`${docType} uploaded.`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyFlag('doc', false);
    }
  };

  const removeDoc = (index) => {
    if (!locked) setDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const savePhotos = async (next) => {
    const res = await apiFetch('/recruiter/company/photos', { token, method: 'PUT', json: { photos: next } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not save your office photos.');
    setPhotos(Array.isArray(data.photos) ? data.photos : next);
  };

  const uploadPhotos = async (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    if (picked.length === 0) return;
    const slots = MAX_OFFICE_PHOTOS - photos.length;
    const valid = picked.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= PHOTO_MAX_BYTES);
    if (valid.length < picked.length) notify('Some files were skipped: use JPG, PNG or WebP images up to 10MB.', 'warning');
    if (valid.length > slots) notify(`Only ${slots} more photo${slots === 1 ? '' : 's'} fit in the gallery (maximum ${MAX_OFFICE_PHOTOS}).`, 'warning');
    const files = valid.slice(0, slots);
    if (files.length === 0) return;

    setBusyFlag('photos', true);
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadFile({ token, file, fileType: 'doc' }));
      await savePhotos([...photos, ...urls]);
      notify(urls.length === 1 ? 'Office photo added.' : `${urls.length} office photos added.`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyFlag('photos', false);
    }
  };

  const removePhoto = async (url) => {
    setBusyFlag('removingPhoto', url);
    try {
      await savePhotos(photos.filter((photo) => photo !== url));
      notify('Office photo removed.', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyFlag('removingPhoto', null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (locked) return;
    const found = validateProfile(values, docs);
    const keys = Object.keys(found);
    if (keys.length > 0) {
      setErrors(found);
      notify(found[keys[0]], 'warning');
      focusField(keys[0]);
      return;
    }

    setBusyFlag('submit', true);
    try {
      const saved = await handleUpdateCompany(
        {
          name: values.name.trim(),
          logoUrl: logoUrl || null,
          description: values.description.trim(),
          industry: values.industry,
          companySize: values.companySize,
          website: withProtocol(values.website),
          location: values.location.trim(),
          foundedYear: values.foundedYear || null,
          officialEmail: values.officialEmail.trim().toLowerCase(),
          recruiterName: values.recruiterName.trim(),
          recruiterDesignation: values.recruiterDesignation.trim(),
          socialLinks: { linkedin: withProtocol(values.linkedin) || null }
        },
        'Company profile saved. Submitting it for review…'
      );
      if (!saved) return;
      const submitted = await handleVerification(
        docs.map(({ docType: type, docUrl, fileName }) => ({ docType: type, docUrl, fileName })),
        true
      );
      if (submitted) {
        setErrors({});
        notify('Submitted for review. We will email you once the AlignGrad team has checked your profile.', 'success');
      }
    } finally {
      setBusyFlag('submit', false);
    }
  };

  return {
    values,
    setField,
    errors,
    logoUrl,
    docs,
    docType,
    setDocType,
    photos,
    busy,
    uploadLogo,
    uploadDoc,
    removeDoc,
    uploadPhotos,
    removePhoto,
    submit
  };
}
