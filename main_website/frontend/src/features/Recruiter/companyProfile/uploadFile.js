import { apiFetch } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';

/**
 * Server-proxied S3 upload (POST /upload/request-url, then PUT /upload/secure-put).
 * Throws with the server's message when either step fails; resolves to the public URL.
 * @param {{ token: string, file: File, fileType: 'image' | 'doc' }} options
 */
export async function uploadFile({ token, file, fileType }) {
  const urlRes = await apiFetch('/upload/request-url', {
    token,
    method: 'POST',
    json: { fileType, fileName: file.name, contentType: file.type }
  });
  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => ({}));
    throw new Error(data.error || 'Could not start the upload. Please try again.');
  }
  const { uploadUrl, publicUrl } = await urlRes.json();

  const putRes = await putFileToS3(uploadUrl, file, file.type, token);
  if (!putRes.ok) {
    const data = await putRes.json().catch(() => ({}));
    throw new Error(data.error || 'The upload failed. Please try again.');
  }
  return publicUrl;
}
