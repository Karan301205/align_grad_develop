import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Trash2, 
  Upload, 
  Play, 
  Pause,
  StopCircle, 
  Camera, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle,
  FileVideo,
  Sparkles,
  X,
  Clock,
  Info
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import PageHeader from '../../../components/ui/PageHeader';

export default function StudentShowcase({ profile, token, onVideoSaved }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [stream, setStream] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [activeMode, setActiveMode] = useState('choose'); // 'choose', 'record', 'upload'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const videoPreviewRef = useRef(null);
  const liveStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingSecondsRef = useRef(0);

  // Cleanup stream and timers on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      clearInterval(timerIntervalRef.current);
    };
  }, [stream]);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Start webcam access for recording
  const startCamera = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setRecordedBlob(null);
    setRecordedUrl('');
    chunksRef.current = [];
    recordingSecondsRef.current = 0;
    setRecordingSeconds(0);
    setIsPaused(false);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, // 720p ideal aspect
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      setStream(mediaStream);
      setActiveMode('record');
      
      // Bind live stream to video element
      setTimeout(() => {
        if (liveStreamRef.current) {
          liveStreamRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Failed to access camera/microphone. Please ensure permissions are granted.');
    }
  };

  // Start recording video
  const startRecording = () => {
    if (!stream) return;
    
    setIsRecording(true);
    setIsPaused(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    chunksRef.current = [];
    setErrorMsg('');

    // Choose preferred MIME type
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const duration = recordingSecondsRef.current;
        if (duration < 40) {
          setErrorMsg(`Video recording must be at least 40 seconds long. You recorded ${duration} second${duration === 1 ? '' : 's'}. Please record for at least 40 seconds.`);
          setRecordedBlob(null);
          setRecordedUrl('');
        } else {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
        }
        setIsRecording(false);
        setIsPaused(false);
        stopCameraStream();
      };

      // Start recording with slices of 1000ms
      mediaRecorder.start(1000);

      // Start 60-second countdown timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const nextSec = prev + 1;
          recordingSecondsRef.current = nextSec;
          if (nextSec >= 60) {
            stopRecording();
            return 60;
          }
          return nextSec;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording initialization failed:', err);
      setErrorMsg('Failed to initialize recording with your browser.');
      setIsRecording(false);
      setIsPaused(false);
      stopCameraStream();
    }
  };

  // Pause recording video
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {
        console.error('Pause recording error:', e);
      }
    }
    clearInterval(timerIntervalRef.current);
    setIsPaused(true);
  };

  // Resume recording video
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (e) {
        console.error('Resume recording error:', e);
      }
    }
    setIsPaused(false);

    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        const nextSec = prev + 1;
        recordingSecondsRef.current = nextSec;
        if (nextSec >= 60) {
          stopRecording();
          return 60;
        }
        return nextSec;
      });
    }, 1000);
  };

  // Publish directly from pause state (if duration >= 40s)
  const publishFromPause = () => {
    if (recordingSecondsRef.current < 40) {
      setErrorMsg(`Video recording must be at least 40 seconds long. You recorded ${recordingSecondsRef.current} seconds.`);
      return;
    }
    stopRecording();
  };

  // Stop recording video
  const stopRecording = () => {
    clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Stop recording error:', e);
      }
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Handle uploaded file validation
  const handleFileSelect = (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMsg('Invalid file format. Please upload a video file (.mp4, .webm, or .mov).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File is too large. Maximum allowed size is 50MB.');
      return;
    }

    // Load file metadata to validate duration
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = URL.createObjectURL(file);
    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(videoElement.src);
      if (videoElement.duration < 39.5) { // 0.5 second rounding tolerance
        setErrorMsg(`Video must be at least 40 seconds long. Selected video duration: ${Math.round(videoElement.duration)} seconds.`);
        return;
      }
      if (videoElement.duration > 61) { // 1 second buffer
        setErrorMsg('Video exceeds 1 minute limit. Please select a video between 40 and 60 seconds.');
        return;
      }
      setRecordedBlob(file);
      setRecordedUrl(URL.createObjectURL(file));
    };
  };

  // Save/Upload video blob to Supabase Storage
  const handleUpload = async () => {
    if (!recordedBlob) {
      setErrorMsg('No video recorded or selected.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress(5);

    try {
      const fileExt = recordedBlob.name ? recordedBlob.name.split('.').pop() : 'webm';
      const fileName = `showcase.${fileExt}`;

      // 1. Request secure signed upload URL from backend
      const urlRes = await apiFetch('/student/video-upload-url', {
        token,
        method: 'POST',
        json: {
          fileName,
          contentType: recordedBlob.type || `video/${fileExt}`
        }
      });

      if (!urlRes.ok) {
        const d = await urlRes.json();
        throw new Error(d.error || 'Failed to request secure signed upload URL.');
      }

      const { signedUrl, publicUrl } = await urlRes.json();
      setUploadProgress(15);

      // 2. Upload video file to Supabase using the signed URL and XMLHttpRequest (for progress reporting)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', recordedBlob.type || `video/${fileExt}`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            // Map 0-100% to progress bar 15-90% range
            setUploadProgress(15 + Math.round((percent / 100) * 75));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during file upload to S3 storage.'));
        };

        xhr.send(recordedBlob);
      });

      setUploadProgress(90);

      // 3. Save the public URL reference to candidate profile in MongoDB
      const res = await apiFetch('/student/intro-video', {
        token,
        method: 'POST',
        json: { introVideoUrl: publicUrl }
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save video reference on AlignGrade server.');
      }

      setUploadProgress(100);
      setSuccessMsg('Your video showcase is online! Recruiters can now play it on your profile.');
      onVideoSaved(publicUrl);
      setActiveMode('choose');
      setRecordedBlob(null);
      setRecordedUrl('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during video upload. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Delete current video showcase
  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to delete your video showcase intro?')) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch('/student/intro-video', {
        token,
        method: 'POST',
        json: { introVideoUrl: null }
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete video showcase.');
      }

      setSuccessMsg('Your video showcase was deleted successfully.');
      onVideoSaved(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete showcase video.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRecording = () => {
    stopRecording();
    stopCameraStream();
    setActiveMode('choose');
    setRecordedBlob(null);
    setRecordedUrl('');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* <div className="space-y-1 mb-2">
        <h3 className="text-xl font-headline font-bold text-on-surface">Showcase Yourself</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Make a striking first impression. Record or upload a short video (between 40 and 60 seconds) explaining your skills, experience, and why you are a great fit for opportunities.
        </p>
      </div> */}

      {errorMsg && (
        <div className="p-4 bg-error-container border border-error/30 text-on-error-container rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-success-container border border-success/20 text-on-success-container rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recording and Upload zone */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-6 flex flex-col justify-between min-h-[480px]">
          
          {/* Choose Mode screen */}
          {activeMode === 'choose' && !recordedUrl && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Video className="w-8 h-8" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-on-surface">Choose how to add your video</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Record directly using your webcam, or select a pre-recorded video file. Videos must be <strong className="text-primary font-semibold">at least 40 seconds</strong> and up to 1 minute long (under 50MB, ideal resolution is 720p).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(true)}
                  className="px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Record Video
                </button>
                <label
                  className="px-6 py-3 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-secondary" />
                  Upload File
                  <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/quicktime" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          )}

          {/* Webcam Recording Mode screen */}
          {activeMode === 'record' && !recordedUrl && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                {/* <h3 className="text-sm font-headline font-medium text-primary tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Camera Stream (720p)
                </h3> */}
                {isRecording && (
                  <span className={`px-3 py-1 border rounded-lg text-xs font-sans font-normal flex items-center gap-1.5 ${
                    isPaused
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 font-bold'
                      : recordingSeconds >= 40 
                      ? 'bg-success-container/20 text-success border-success/30 animate-pulse' 
                      : 'bg-error-container/20 text-error border-error/30 animate-pulse'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : recordingSeconds >= 40 ? 'bg-success' : 'bg-error'}`}></span>
                    {isPaused ? `Paused at ${recordingSeconds}s` : `${recordingSeconds}s / 60s`} {recordingSeconds < 40 ? `(Min 40s - ${40 - recordingSeconds}s left)` : '(Min length reached!)'}
                  </span>
                )}
              </div>

              {/* Dynamic Interview Prompt Guide & Segmented Progress Bar */}
              {isRecording && (
                <div className="space-y-3 bg-surface-container-low/50 border border-outline-variant p-4 rounded-xl animate-fade-in">
                  {/* Segmented Progress Bars */}
                  <div className="grid grid-cols-6 gap-2 h-2 w-full">
                    {/* Segment 1: Self & Education (20s - 2/6 width) */}
                    <div className="col-span-2 bg-surface-container-highest rounded-full h-full relative overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 20 ? 100 : (recordingSeconds / 20) * 100}%` }}
                      />
                    </div>
                    {/* Segment 2: Skills (10s - 1/6 width) */}
                    <div className="col-span-1 bg-surface-container-highest rounded-full h-full relative overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 30 ? 100 : (recordingSeconds < 20 ? 0 : ((recordingSeconds - 20) / 10) * 100)}%` }}
                      />
                    </div>
                    {/* Segment 3: Experience & Projects (10s - 1/6 width - reaches 40s min requirement) */}
                    <div className="col-span-1 bg-surface-container-highest rounded-full h-full relative overflow-hidden border-r-2 border-dashed border-primary/60">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 40 ? 100 : (recordingSeconds < 30 ? 0 : ((recordingSeconds - 30) / 10) * 100)}%` }}
                      />
                    </div>
                    {/* Segment 4: Why Hire You (20s - 2/6 width) */}
                    <div className="col-span-2 bg-surface-container-highest rounded-full h-full relative overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 60 ? 100 : (recordingSeconds < 40 ? 0 : ((recordingSeconds - 40) / 20) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Segment Titles & Custom Timers */}
                  <div className="grid grid-cols-6 gap-2 text-xs font-sans font-normal text-on-surface-variant text-center select-none">
                    <span className={`col-span-2 truncate ${recordingSeconds < 20 ? 'text-primary font-bold' : ''}`}>Self & Edu (20s)</span>
                    <span className={`col-span-1 truncate ${recordingSeconds >= 20 && recordingSeconds < 30 ? 'text-primary font-bold' : ''}`}>Skills (10s)</span>
                    <span className={`col-span-1 truncate ${recordingSeconds >= 30 && recordingSeconds < 40 ? 'text-primary font-bold' : ''}`}>Exp (10s) <span className="text-amber-500 font-bold">*40s Min</span></span>
                    <span className={`col-span-2 truncate ${recordingSeconds >= 40 ? 'text-primary font-bold' : ''}`}>Why Hire (20s)</span>
                  </div>

                  {/* Current Active Guide prompt card */}
                  <div className="bg-surface-container-high/80 p-3 rounded-lg border border-outline-variant flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-headline font-medium text-secondary">Active Topic</span>
                      <p className="text-xs font-semibold text-on-surface leading-relaxed">
                        {recordingSeconds < 20 && "🎓 Tell us about yourself and your educational background"}
                        {recordingSeconds >= 20 && recordingSeconds < 30 && "⚡ Talk about the skills and technologies you know"}
                        {recordingSeconds >= 30 && recordingSeconds < 40 && "💼 Describe your work experience or projects you have worked on (Reaching 40s Min)"}
                        {recordingSeconds >= 40 && "🚀 Explain why we should hire you"}
                      </p>
                    </div>
                    <div className="shrink-0 text-center bg-secondary/15 border border-secondary/20 px-3 py-1 rounded-lg min-w-[70px]">
                      <span className="text-xs font-headline font-medium text-secondary block">Next in</span>
                      <span className="text-xs font-headline font-medium text-on-surface">
                        {recordingSeconds < 20 && `${20 - recordingSeconds}s`}
                        {recordingSeconds >= 20 && recordingSeconds < 30 && `${30 - recordingSeconds}s`}
                        {recordingSeconds >= 30 && recordingSeconds < 40 && `${40 - recordingSeconds}s`}
                        {recordingSeconds >= 40 && `${60 - recordingSeconds}s`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-outline-variant shadow-inner flex items-center justify-center">
                <video 
                  ref={liveStreamRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" // Mirror for natural look
                />
                {!isRecording && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6">
                    <p className="text-xs text-white max-w-sm">Press the Record button below. Recording must be <strong>at least 40 seconds</strong> (max 60 seconds). It will stop automatically after 60 seconds.</p>
                  </div>
                )}
              </div>

              {/* Dynamic Recording Action Controls */}
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                {!isRecording ? (
                  <>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-6 py-2.5 bg-error text-on-error rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                      Start Recording
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : isPaused ? (
                  <>
                    {/* Paused State Controls */}
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Resume Recording ({recordingSeconds}s)
                    </button>

                    {recordingSeconds >= 40 && (
                      <button
                        type="button"
                        onClick={publishFromPause}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Publish Video
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                      Cancel Recording
                    </button>
                  </>
                ) : (
                  <>
                    {/* Active Recording Controls */}
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="px-6 py-2.5 bg-amber-500 text-zinc-950 rounded-xl text-sm font-bold hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      Pause Recording
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                      Cancel Recording
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview Captured Video screen */}
          {recordedUrl && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                <h3 className="text-sm font-headline font-medium text-secondary tracking-wider">
                  Review Your Showcase
                </h3>
                <span className="px-2.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-xs font-sans font-normal text-on-surface-variant">
                  Ready to Publish
                </span>
              </div>

              <div className="aspect-video rounded-xl bg-black overflow-hidden border border-outline-variant flex items-center justify-center relative">
                <video 
                  ref={videoPreviewRef} 
                  src={recordedUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-1.5 w-full">
                  <div className="flex justify-between text-xs font-sans font-normal text-on-surface-variant">
                    <span>Uploading to Cloud...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Uploading...' : 'Publish Video'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordedBlob(null);
                    setRecordedUrl('');
                    if (activeMode === 'record') {
                      startCamera();
                    } else {
                      setActiveMode('choose');
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Record/Select Again
                </button>
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  disabled={loading}
                  className="px-4 py-2.5 bg-transparent border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Status & Current published Video showcase */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4">
            <h4 className="text-md font-bold text-on-surface border-b border-outline-variant pb-2">Showcase Status</h4>
            
            {profile?.introVideoUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-success-container border border-success/20 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span className="text-xs font-semibold text-on-success-container">Your video showcase is active!</span>
                </div>
                
                <div className="aspect-video rounded-xl bg-black overflow-hidden border border-outline-variant">
                  <video 
                    src={profile.introVideoUrl} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  disabled={loading}
                  className="w-full py-2.5 bg-error-container text-on-error-container hover:brightness-105 border border-error/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Video
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-on-surface">No active video showcase</p>
                  <p className="text-xs text-on-surface-variant max-w-[200px] mx-auto leading-relaxed">
                    Upload your self-introduction to stand out to verified recruiters.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-3.5">
            <h4 className="text-xs font-headline font-medium text-on-surface-variant tracking-wider">Tips for an Excellent Intro</h4>
            <ul className="text-xs text-on-surface-variant space-y-2.5 list-disc list-inside">
              <li><strong>Duration:</strong> 40 to 60 seconds is mandatory.</li>
              <li>State your name, key stacks, and recent achievements.</li>
              <li>Ensure good lighting on your face.</li>
              <li>Check your microphone volume and minimize background noise.</li>
              <li>Record in <strong>720p (1280x720)</strong> resolution for optimal loading times.</li>
            </ul>
          </div> */}
        </div>

      </div>

      {/* Video Duration Guidelines Pop-up Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in relative">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-headline font-medium text-on-surface">Video Showcase Guidelines</h3>
                <p className="text-xs font-sans font-normal text-on-surface-variant">Please review before recording</p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/25 rounded-xl space-y-2">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-sans font-normal text-on-surface leading-snug">
                  Videos must be <strong className="font-semibold text-primary">at least 40 seconds</strong> and up to <strong className="font-semibold text-primary">1 minute long</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans font-normal text-on-surface-variant leading-relaxed">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Minimum recording duration is 40 seconds.
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Maximum recording duration is 60 seconds (1 minute).
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Ensure good lighting and clear audio before recording.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2.5 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest rounded-xl text-xs font-semibold text-on-surface-variant transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRecordModal(false);
                  startCamera();
                }}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Continue to Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
