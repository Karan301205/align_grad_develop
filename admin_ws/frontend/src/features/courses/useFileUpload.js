import { useCallback, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { unwrap } from './courseModel.js';

/**
 * Uploads a file straight to S3 through a presigned URL from the admin API.
 * `upload(file)` resolves to { key, url } or null when it failed (the reason is in `error`).
 */
export default function useFileUpload({ folder, fallbackType }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = useCallback(
    async (file) => {
      setUploading(true);
      setError('');
      try {
        const contentType = file.type || fallbackType;
        const presigned = unwrap(
          await adminApi.getUploadUrl({ fileName: file.name, contentType, folder }),
          'Uploads are not available right now.'
        );
        const res = await fetch(presigned.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
        if (!res.ok) {
          console.error(`[admin courses] S3 upload refused: HTTP ${res.status}`, await res.text().catch(() => ''));
          throw new Error('The storage service refused the file. Please try again.');
        }
        return { key: presigned.key, url: presigned.uploadUrl.split('?')[0] };
      } catch (err) {
        console.error('[admin courses] upload failed:', err);
        // The browser's own "Failed to fetch" is replaced with a plain sentence.
        setError(err instanceof TypeError ? 'Check your connection and try again.' : err.message || 'Please try again.');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [folder, fallbackType]
  );

  return { upload, uploading, error };
}
