import { useState, useRef } from 'react';
import { Upload, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function OnboardingModal({ isOpen, onUpload, onSkip, isUploading }) {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid PDF or DOCX file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || 'Failed to upload and parse resume. Please try again.');
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container border border-outline-variant w-full max-w-lg rounded-2xl shadow-2xl shadow-black/80 p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative Neumorphic background light */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-headline font-bold text-on-surface">Complete Your Profile Faster</h2>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            If you already have a resume, upload it and we'll automatically fill in the information we can identify. If you don't have one, you can skip this step and complete your profile manually.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="w-full p-3.5 bg-error-container border border-error/30 rounded-xl text-on-error-container text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-error" />
            <span className="text-left font-semibold">{error}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isUploading}
        />

        {/* Actions Button Grid */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="secondary"
            className="w-full order-2 sm:order-1 font-semibold text-xs py-3"
            onClick={onSkip}
            disabled={isUploading}
          >
            Skip & Fill Manually
          </Button>
          <Button
            variant="primary"
            className="w-full order-1 sm:order-2 font-bold text-xs py-3 flex items-center justify-center gap-2"
            onClick={triggerFileSelect}
            disabled={isUploading}
            icon={isUploading ? undefined : ArrowRight}
          >
            {isUploading ? 'Parsing Resume...' : 'I Have My Resume'}
          </Button>
        </div>

        {/* Help footer */}
        <p className="text-[10px] text-on-surface-variant font-mono">
          Supports PDF or DOCX (max 10MB)
        </p>

      </div>
    </div>
  );
}
