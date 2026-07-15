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
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import PageHeader from '../../../components/ui/PageHeader';

export default function StudentShowcase({ profile, token, onVideoSaved }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [stream, setStream] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [activeMode, setActiveMode] = useState('choose'); // 'choose', 'record', 'upload'
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoPreviewRef = useRef(null);
  const liveStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const chunksRef = useRef([]);

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
    setRecordingSeconds(0);
    chunksRef.current = [];

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
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        stopCameraStream();
      };

      // Start recording with slices of 1000ms
      mediaRecorder.start(1000);

      // Start 60-second countdown timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording initialization failed:', err);
      setErrorMsg('Failed to initialize recording with your browser.');
      setIsRecording(false);
      stopCameraStream();
    }
  };

  // Stop recording video
  const stopRecording = () => {
    clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
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
      if (videoElement.duration > 61) { // 1 second buffer
        setErrorMsg('Video exceeds 1 minute limit. Please shorten your video intro.');
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Showcase Yourself"
        subtitle="Make a striking first impression. Record or upload a short 1-minute video explaining your skills, experience, and why you are a great fit for opportunities."
      />

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recording and Upload zone */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-6 flex flex-col justify-between min-h-[480px]">
          
          {/* Choose Mode screen */}
          {activeMode === 'choose' && !recordedUrl && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Video className="w-8 h-8" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-on-surface">Choose how to add your video</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Record directly using your webcam, or select a pre-recorded video file. Videos must be at most 1 minute long (under 50MB, ideal resolution is 720p).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
                <button
                  onClick={startCamera}
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
                <h3 className="text-sm font-mono uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Camera Stream (720p)
                </h3>
                {isRecording && (
                  <span className="px-3 py-1 bg-error-container/20 text-error border border-error/30 rounded-lg text-xs font-mono flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    {recordingSeconds}s / 60s
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
                    {/* Segment 3: Experience & Projects (20s - 2/6 width) */}
                    <div className="col-span-2 bg-surface-container-highest rounded-full h-full relative overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 50 ? 100 : (recordingSeconds < 30 ? 0 : ((recordingSeconds - 30) / 20) * 100)}%` }}
                      />
                    </div>
                    {/* Segment 4: Why Hire You (10s - 1/6 width) */}
                    <div className="col-span-1 bg-surface-container-highest rounded-full h-full relative overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${recordingSeconds >= 60 ? 100 : (recordingSeconds < 50 ? 0 : ((recordingSeconds - 50) / 10) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Segment Titles & Custom Timers */}
                  <div className="grid grid-cols-6 gap-2 text-[10px] font-mono text-on-surface-variant text-center select-none">
                    <span className={`col-span-2 truncate ${recordingSeconds < 20 ? 'text-primary font-bold' : ''}`}>Self & Edu (20s)</span>
                    <span className={`col-span-1 truncate ${recordingSeconds >= 20 && recordingSeconds < 30 ? 'text-primary font-bold' : ''}`}>Skills (10s)</span>
                    <span className={`col-span-2 truncate ${recordingSeconds >= 30 && recordingSeconds < 50 ? 'text-primary font-bold' : ''}`}>Experience (20s)</span>
                    <span className={`col-span-1 truncate ${recordingSeconds >= 50 ? 'text-primary font-bold' : ''}`}>Why Hire (10s)</span>
                  </div>

                  {/* Current Active Guide prompt card */}
                  <div className="bg-surface-container-high/80 p-3 rounded-lg border border-outline-variant flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase text-secondary tracking-widest">Active Topic</span>
                      <p className="text-xs font-semibold text-on-surface leading-relaxed">
                        {recordingSeconds < 20 && "🎓 Tell us about yourself and your educational background"}
                        {recordingSeconds >= 20 && recordingSeconds < 30 && "⚡ Talk about the skills and technologies you know"}
                        {recordingSeconds >= 30 && recordingSeconds < 50 && "💼 Describe your work experience or projects you have worked on"}
                        {recordingSeconds >= 50 && "🚀 Explain why we should hire you"}
                      </p>
                    </div>
                    <div className="shrink-0 text-center bg-secondary/15 border border-secondary/20 px-3 py-1 rounded-lg min-w-[70px]">
                      <span className="text-[9px] font-mono text-secondary uppercase block tracking-wider">Next in</span>
                      <span className="text-xs font-bold font-mono text-on-surface">
                        {recordingSeconds < 20 && `${20 - recordingSeconds}s`}
                        {recordingSeconds >= 20 && recordingSeconds < 30 && `${30 - recordingSeconds}s`}
                        {recordingSeconds >= 30 && recordingSeconds < 50 && `${50 - recordingSeconds}s`}
                        {recordingSeconds >= 50 && `${60 - recordingSeconds}s`}
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
                    <p className="text-xs text-white max-w-sm">Press the Record button below. The recording will stop automatically after 60 seconds.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-6 py-2.5 bg-error text-on-error rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2.5 bg-white text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-4 h-4 text-error" />
                    Stop Recording
                  </button>
                )}
                
                <button
                  onClick={handleCancelRecording}
                  disabled={isRecording}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview Captured Video screen */}
          {recordedUrl && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                <h3 className="text-sm font-mono uppercase text-secondary tracking-wider">
                  Review Your Showcase
                </h3>
                <span className="px-2.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[10px] font-mono text-on-surface-variant">
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
                  <div className="flex justify-between text-xs font-mono text-on-surface-variant">
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
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Uploading...' : 'Publish Video'}
                </button>
                <button
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
        <div className="space-y-6">
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

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-3.5">
            <h4 className="text-xs font-mono uppercase text-on-surface-variant tracking-wider">Tips for an Excellent Intro</h4>
            <ul className="text-xs text-on-surface-variant space-y-2.5 list-disc list-inside">
              <li>Keep it brief (30 to 60 seconds is the sweet spot).</li>
              <li>State your name, key stacks, and recent achievements.</li>
              <li>Ensure good lighting on your face.</li>
              <li>Check your microphone volume and minimize background noise.</li>
              <li>Record in <strong>720p (1280x720)</strong> resolution for optimal loading times.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
