import React, { useState, useRef } from 'react';
import { Image, Video, FileText, Send, X, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';

export default function PostComposer({ token, communityId, onPostCreated, userProfile }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('TEXT');
  const [mediaItems, setMediaItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const handleFileUpload = async (e, category) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg('');
    setUploading(true);

    try {
      const newMedia = [];
      for (const file of files) {
        // Request presigned URL from backend
        const res = await apiFetch('/community/media/upload-url', {
          token,
          method: 'POST',
          json: {
            mediaCategory: category,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size
          }
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to request S3 upload URL.');
        }

        // Upload binary file directly to S3
        const s3Res = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });

        if (!s3Res.ok) {
          throw new Error(`Failed to upload ${file.name} to S3.`);
        }

        newMedia.push({
          s3Key: data.s3Key,
          url: data.publicUrl,
          mediaType: category === 'IMAGE' ? 'IMAGE' : category === 'VIDEO' ? 'VIDEO' : 'PDF',
          mimeType: file.type,
          sizeBytes: file.size,
          fileName: file.name
        });
      }

      const updated = [...mediaItems, ...newMedia];
      setMediaItems(updated);

      if (category === 'IMAGE') {
        setPostType(updated.length > 1 ? 'MULTI_IMAGE' : 'IMAGE');
      } else if (category === 'VIDEO') {
        setPostType('VIDEO');
      } else if (category === 'PDF') {
        setPostType('PDF');
      }
    } catch (err) {
      console.error('Media upload error:', err);
      setErrorMsg(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeMedia = (index) => {
    const updated = mediaItems.filter((_, i) => i !== index);
    setMediaItems(updated);
    if (updated.length === 0) {
      setPostType('TEXT');
    } else if (updated.length === 1 && updated[0].mediaType === 'IMAGE') {
      setPostType('IMAGE');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiFetch(`/community/${communityId}/posts`, {
        token,
        method: 'POST',
        json: {
          content: content.trim(),
          postType,
          mediaItems
        }
      });

      const data = await res.json();
      if (res.ok) {
        setContent('');
        setMediaItems([]);
        setPostType('TEXT');
        if (onPostCreated) onPostCreated(data);
      } else {
        setErrorMsg(data.error || 'Failed to submit post.');
      }
    } catch (err) {
      console.error('Submit post error:', err);
      setErrorMsg('Error publishing post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
      {/* Author Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-outline-variant flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
          {userProfile?.profilePic ? (
            <img src={userProfile.profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            userProfile?.name?.charAt(0) || 'U'
          )}
        </div>
        <div>
          <h4 className="font-bold text-xs text-on-surface">{userProfile?.name || 'Share your insights'}</h4>
          <p className="text-[10px] font-sans font-normal text-on-surface-variant">Post to Community Feed</p>
        </div>
      </div>

      {/* Post Textarea */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          placeholder="What's on your mind? Share industry insights, technical challenges, or code proficiencies..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-all resize-none font-sans"
        />

        {/* Media Preview Grid */}
        {mediaItems.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {mediaItems.map((item, idx) => (
              <div key={idx} className="relative group rounded-xl border border-outline-variant overflow-hidden bg-surface-container-high max-w-[140px] max-h-[140px]">
                {item.mediaType === 'IMAGE' && (
                  <img src={item.url} alt="Uploaded" className="w-full h-24 object-cover" />
                )}
                {item.mediaType === 'VIDEO' && (
                  <div className="p-3 text-center text-xs font-sans font-normal">
                    <Video className="w-6 h-6 text-primary mx-auto mb-1" />
                    <span className="truncate block max-w-[100px] text-[10px]">{item.fileName || 'Video'}</span>
                  </div>
                )}
                {item.mediaType === 'PDF' && (
                  <div className="p-3 text-center text-xs font-sans font-normal">
                    <FileText className="w-6 h-6 text-secondary mx-auto mb-1" />
                    <span className="truncate block max-w-[100px] text-[10px]">{item.fileName || 'Document.pdf'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 bg-error-container/20 border border-error-container text-error rounded-xl text-xs flex items-center gap-2 font-sans font-normal">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleFileUpload(e, 'IMAGE')} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => handleFileUpload(e, 'VIDEO')} className="hidden" />
        <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'PDF')} className="hidden" />

        {/* Toolbar & Submit */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-primary transition-all flex items-center gap-1 text-xs font-sans font-normal cursor-pointer"
              title="Add Images (max 9, 5MB)"
            >
              <Image className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Image</span>
            </button>

            <button
              type="button"
              disabled={uploading}
              onClick={() => videoInputRef.current?.click()}
              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-primary transition-all flex items-center gap-1 text-xs font-sans font-normal cursor-pointer"
              title="Add Video (max 100MB, 90s)"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Video</span>
            </button>

            <button
              type="button"
              disabled={uploading}
              onClick={() => pdfInputRef.current?.click()}
              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-primary transition-all flex items-center gap-1 text-xs font-sans font-normal cursor-pointer"
              title="Add PDF Document (max 20MB)"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || uploading || submitting}
            className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold font-sans font-normal transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {submitting || uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
