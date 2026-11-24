// Uploads used by the candidate profile. The server checks type, size and the
// file's magic bytes (PUT /upload/secure-put for photos; POST /upload/verify after a
// video goes straight to storage); these client checks only give a quicker, clearer
// message. Limits must match backend src/config/upload.config.js.
import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';

export const MB = 1024 * 1024;
export const INTRO_VIDEO = { maxBytes: 50 * MB, minSeconds: 40, maxSeconds: 60 };
export const PROJECT_VIDEO = { maxBytes: 100 * MB, maxSeconds: 90 };
export const PHOTO = { maxBytes: 5 * MB, types: ['image/jpeg', 'image/png'] };
export const CERTIFICATE_FILE = { maxBytes: 100 * 1024, types: ['application/pdf', 'image/jpeg', 'image/png'] };
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';

export const sizeText = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Length of a video file in seconds (rejects files the browser can't read). */
export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      // Recorded WebM files can report Infinity until fully read.
      resolve(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This video could not be read. Try an MP4, MOV or WebM file.'));
    };
    video.src = url;
  });
}

/** S3's own error text (an XML <Message>), for the console. */
const storageMessage = (xml) => (String(xml || '').match(/<Message>([^<]*)<\/Message>/) || [])[1] || String(xml || '').slice(0, 300);

/**
 * Uploads a video (category 'project' → project demo, otherwise the intro video) straight
 * to storage with progress, then has the server check it. Resolves to the public URL.
 * Steps: POST /student/video-upload-url (a presigned form) → POST the file to S3 →
 * POST /upload/verify (size, type and file signature; the server deletes a bad file).
 */
export async function uploadVideo(file, { token, category, onProgress = () => {} }) {
  const contentType = file.type || 'video/webm';
  const extension = (file.name && file.name.includes('.') ? file.name.split('.').pop() : contentType.split('/')[1] || 'webm').toLowerCase();
  const fileType = category === 'project' ? 'projectVideo' : 'video';
  const res = await apiFetch('/student/video-upload-url', {
    token,
    method: 'POST',
    json: { fileName: `${category === 'project' ? 'project' : 'intro'}_${Date.now()}.${extension}`, contentType, ...(category ? { category } : {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'We couldn’t start the upload. Please try again.');
  onProgress(5);

  const form = new FormData();
  Object.entries(data.upload.fields).forEach(([name, value]) => form.append(name, value));
  form.append('file', file); // S3 needs the file last

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', data.upload.url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(5 + Math.round((event.loaded / event.total) * 85));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      console.error(`[upload] Storage refused the video (HTTP ${xhr.status}):`, storageMessage(xhr.responseText));
      reject(new Error(/EntityTooLarge/.test(xhr.responseText) ? `The video must be ${Math.round(data.maxBytes / MB)} MB or smaller.` : 'The upload didn’t finish. Please try again.'));
    };
    xhr.onerror = () => {
      // Also what a missing CORS rule on the bucket looks like from the browser.
      console.error('[upload] Could not reach storage while uploading a video (network, or the bucket\'s CORS rules).');
      reject(new Error('The upload stopped because the connection dropped. Check your internet and try again.'));
    };
    xhr.send(form);
  });
  onProgress(92);

  const check = await apiFetch('/upload/verify', { token, method: 'POST', json: { key: data.key, fileType } });
  const checked = await check.json().catch(() => ({}));
  if (!check.ok) throw new Error(checked.error || 'We couldn’t check the uploaded video. Please try again.');
  onProgress(100);
  return checked.publicUrl;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image could not be opened. Try another JPG or PNG.'));
    };
    image.src = url;
  });
}

/** Square-ish 300px JPEG under ~100 KB, like the old profile photo flow. */
async function compressPhoto(file) {
  const image = await loadImage(file);
  const scale = Math.min(1, 300 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && (blob.size <= 100 * 1024 || quality <= 0.35)) return blob;
  }
  throw new Error('This image could not be prepared. Try another JPG or PNG.');
}

/** Compresses and uploads a profile photo; resolves to its public URL. */
export async function uploadProfilePhoto(file, token) {
  const blob = await compressPhoto(file);
  const res = await apiFetch('/upload/request-url', {
    token,
    method: 'POST',
    json: { fileType: 'image', fileName: 'profile_photo.jpg', contentType: 'image/jpeg' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'We couldn’t start the photo upload. Please try again.');
  const put = await putFileToS3(data.uploadUrl, blob, 'image/jpeg', token);
  if (!put.ok) {
    const body = await put.json().catch(() => ({}));
    console.error(`[upload] Photo upload failed with status ${put.status}:`, body);
    throw new Error(put.status < 500 && body.error ? body.error : 'The photo didn’t upload. Please try again.');
  }
  return data.publicUrl;
}

export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('This file could not be read. Try again.'));
    reader.readAsDataURL(file);
  });
}
