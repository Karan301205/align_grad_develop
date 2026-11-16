import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, Square, Upload, Video } from 'lucide-react';
import { apiFetch, userMessage } from '../../../../services/apiClient';
import { BODY, DANGER_OUTLINE, INK, MUTED, PRIMARY, SECONDARY } from '../profileTheme';
import { ConfirmDialog, Dialog, ErrorBanner, Spinner } from '../ui';
import { INTRO_VIDEO, VIDEO_ACCEPT, VIDEO_TYPES, readVideoDuration, sizeText, uploadVideo } from '../uploads';

// Prompts shown while recording, so the candidate covers what recruiters look for.
const TOPICS = [
  { until: 15, text: 'Your name, college and degree' },
  { until: 30, text: 'The kind of job you want' },
  { until: 45, text: 'One thing you’ve built or done' },
  { until: 61, text: 'Why you’d be good at the job' }
];

const RECORDER_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function cameraMessage(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'Allow camera and microphone access, or upload a video.';
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'No camera found. Upload a video instead.';
  if (err?.name === 'NotReadableError') return 'Your camera is in use by another app.';
  return 'Your camera couldn’t start. Upload a video instead.';
}

/**
 * Intro video (design: Web — intro video dialog). Record with the webcam or upload
 * a file; 40 to 60 seconds, MP4/MOV/WebM, up to 50 MB. "Use this video" uploads it
 * and saves it to the profile; an existing video can be replaced or removed.
 */
export default function IntroVideoDialog({ token, currentUrl, onSaved, onClose }) {
  const [mode, setMode] = useState('idle'); // idle | camera | review
  const [error, setError] = useState('');
  const [take, setTake] = useState(null); // { blob, url, seconds, name, size }
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);

  const liveRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  const fileRef = useRef(null);
  const takeUrlRef = useRef('');
  const mountedRef = useRef(true);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const setTakeSafely = (next) => {
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = next?.url || '';
    setTake(next);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.onstop = null;
        try {
          recorderRef.current.stop();
        } catch {
          /* already stopped */
        }
      }
      stopStream();
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    };
  }, []);

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Recording isn’t available here. Upload a video instead.');
      return;
    }
    if (typeof window.MediaRecorder === 'undefined') {
      setError('Recording isn’t available here. Upload a video instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setTakeSafely(null);
      setSeconds(0);
      setMode('camera');
    } catch (err) {
      console.error('[intro video] Camera access failed:', err);
      setError(cameraMessage(err));
    }
  };

  // Attach the live stream once the camera view is on screen.
  useEffect(() => {
    if (mode === 'camera' && liveRef.current && streamRef.current) liveRef.current.srcObject = streamRef.current;
  }, [mode]);

  const tick = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= INTRO_VIDEO.maxSeconds) stopRecording();
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setError('');
    const type = RECORDER_TYPES.find((item) => window.MediaRecorder.isTypeSupported?.(item));
    let recorder;
    try {
      recorder = type ? new window.MediaRecorder(streamRef.current, { mimeType: type }) : new window.MediaRecorder(streamRef.current);
    } catch (err) {
      console.error('[intro video] MediaRecorder failed to start:', err);
      setError('Recording couldn’t start. Upload a video instead.');
      return;
    }
    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      setRecording(false);
      setPaused(false);
      stopStream();
      const length = secondsRef.current;
      if (length < INTRO_VIDEO.minSeconds) {
        setError('Record at least 40 seconds.');
        setMode('idle');
        return;
      }
      const baseType = (recorder.mimeType || type || 'video/webm').split(';')[0];
      const blob = new Blob(chunksRef.current, { type: baseType });
      if (blob.size > INTRO_VIDEO.maxBytes) {
        setError('This recording is over 50 MB. Record a shorter one.');
        setMode('idle');
        return;
      }
      setTakeSafely({ blob, url: URL.createObjectURL(blob), seconds: length, name: `intro.${baseType.includes('mp4') ? 'mp4' : 'webm'}`, size: blob.size });
      setMode('review');
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    setRecording(true);
    setPaused(false);
    tick();
  };

  const pauseRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.pause();
    clearInterval(timerRef.current);
    setPaused(true);
  };

  const resumeRecording = () => {
    if (recorderRef.current?.state === 'paused') recorderRef.current.resume();
    setPaused(false);
    tick();
  };

  function stopRecording() {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }

  const finishRecording = () => {
    if (secondsRef.current < INTRO_VIDEO.minSeconds) {
      setError('Record at least 40 seconds.');
      return;
    }
    stopRecording();
  };

  const cancelCamera = () => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    stopStream();
    setRecording(false);
    setPaused(false);
    setSeconds(0);
    setMode('idle');
  };

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!VIDEO_TYPES.includes(file.type)) {
      setError('Upload an MP4, MOV or WebM video.');
      return;
    }
    if (file.size > INTRO_VIDEO.maxBytes) {
      setError('Upload a video under 50 MB.');
      return;
    }
    setCheckingFile(true);
    try {
      const duration = await readVideoDuration(file);
      if (duration === null) throw new Error('This video couldn’t be read. Try an MP4 or MOV file.');
      if (duration < INTRO_VIDEO.minSeconds - 0.5 || duration > INTRO_VIDEO.maxSeconds + 1) throw new Error('The video must be 40 to 60 seconds long.');
      if (!mountedRef.current) return;
      setTakeSafely({ blob: file, url: URL.createObjectURL(file), seconds: Math.round(duration), name: file.name, size: file.size });
      setMode('review');
    } catch (err) {
      setError(userMessage(err, 'This video couldn’t be used. Try another one.'));
    } finally {
      if (mountedRef.current) setCheckingFile(false);
    }
  };

  const useVideo = async () => {
    if (!take) return;
    setBusy(true);
    setError('');
    setProgress(2);
    try {
      const url = await uploadVideo(take.blob, { token, onProgress: setProgress });
      const res = await apiFetch('/student/intro-video', { token, method: 'POST', json: { introVideoUrl: url } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your video couldn’t be saved. Try again.');
      onSaved(url, 'Your intro video is saved. Recruiters will see it when they open your application.');
    } catch (err) {
      if (!mountedRef.current) return;
      setError(userMessage(err, 'Your video didn’t upload. Try again.'));
      setBusy(false);
      setProgress(0);
    }
  };

  const removeVideo = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch('/student/intro-video', { token, method: 'POST', json: { introVideoUrl: null } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your video couldn’t be removed. Try again.');
      onSaved(null, 'Your intro video was removed.');
    } catch (err) {
      if (!mountedRef.current) return;
      setError(userMessage(err, 'Your video couldn’t be removed. Try again.'));
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  const topic = TOPICS.find((item) => seconds < item.until) || TOPICS[TOPICS.length - 1];
  const longEnough = seconds >= INTRO_VIDEO.minSeconds;

  return (
    <Dialog
      title="Intro video"
      subtitle="Introduce yourself in 40 to 60 seconds. Recruiters see it when they open your application."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={`${SECONDARY} h-11 px-4`}>
            Cancel
          </button>
          <button type="button" onClick={useVideo} disabled={busy || mode !== 'review' || !take} className={`${PRIMARY} h-11 px-5`}>
            {busy && <Spinner />}
            {busy ? `Uploading ${progress}%` : 'Use this video'}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <input ref={fileRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={pickFile} tabIndex={-1} />

      {mode === 'idle' && !currentUrl && (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3.5 rounded-[14px] border border-dashed border-[#9AA6C8] bg-[linear-gradient(160deg,#F4F6FE_0%,#FBF5FF_100%)] px-4 py-8 text-center">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[14px] bg-[#E8EEFF] text-[#0167F6]">
            <Video className="size-7" />
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={startCamera} className={`${PRIMARY} h-11 px-[18px]`} data-autofocus>
              Record with webcam
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={checkingFile} className={`${SECONDARY} h-11 px-[18px]`}>
              {checkingFile ? <Spinner /> : <Upload aria-hidden="true" className="size-4" />}
              {checkingFile ? 'Checking video…' : 'Upload a video'}
            </button>
          </div>
          <span className={`text-[13.5px] ${MUTED}`}>40 seconds to 1 minute · MP4, MOV or WebM · up to 50 MB</span>
        </div>
      )}

      {mode === 'idle' && currentUrl && (
        <div className="flex flex-col gap-3">
          <video src={currentUrl} controls playsInline preload="metadata" className="aspect-video w-full rounded-[14px] bg-[#0E1B3D] object-contain" aria-label="Your current intro video" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto inline-flex items-center gap-1.5 font-semibold text-[#0F7A55]">
              <CheckCircle2 aria-hidden="true" className="size-4" /> On your profile
            </span>
            <button type="button" onClick={startCamera} className={`${SECONDARY} h-10 px-3.5`}>
              Record again
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={checkingFile} className={`${SECONDARY} h-10 px-3.5`}>
              {checkingFile && <Spinner />}
              Upload another
            </button>
            <button type="button" onClick={() => setConfirmRemove(true)} className={`${DANGER_OUTLINE} h-10 px-3.5`}>
              Remove
            </button>
          </div>
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-[14px] bg-[#0E1B3D]">
            <video ref={liveRef} autoPlay playsInline muted className="aspect-video w-full -scale-x-100 object-cover" aria-label="Your camera" />
            <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold text-white ${recording && !paused ? 'bg-[#C8281C]' : 'bg-[#0E1B3D]/75'}`}>
              {recording && !paused && <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden="true" />}
              {recording ? (paused ? 'Paused' : 'Recording') : 'Camera ready'} · {clock(seconds)} / 1:00
            </span>
            {recording && (
              <div className="absolute inset-x-3 bottom-3 rounded-[10px] bg-[#0E1B3D]/80 px-3 py-2 text-[14px] text-white">
                <span className="font-semibold">Now:</span> {topic.text}
              </div>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8EEFF]" aria-hidden="true">
            <div className={`h-full rounded-full transition-[width] ${longEnough ? 'bg-[#0F7A55]' : 'bg-[linear-gradient(90deg,#0167F6,#6378F9)]'}`} style={{ width: `${Math.min(100, (seconds / INTRO_VIDEO.maxSeconds) * 100)}%` }} />
          </div>
          <p className={`m-0 text-[14px] ${BODY}`} aria-live="polite">
            {!recording ? 'Press Start when you’re ready. Recording stops by itself at 1 minute.' : longEnough ? 'That’s long enough. Finish whenever you’re ready.' : `Keep going: ${INTRO_VIDEO.minSeconds - seconds} more seconds to reach 40.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {!recording && (
              <button type="button" onClick={startRecording} className={`${PRIMARY} h-11 px-5`}>
                <span className="size-2.5 rounded-full bg-white" aria-hidden="true" /> Start recording
              </button>
            )}
            {recording && !paused && (
              <button type="button" onClick={pauseRecording} className={`${SECONDARY} h-11 px-4`}>
                <Pause aria-hidden="true" className="size-4" /> Pause
              </button>
            )}
            {recording && paused && (
              <button type="button" onClick={resumeRecording} className={`${SECONDARY} h-11 px-4`}>
                <Play aria-hidden="true" className="size-4" /> Resume
              </button>
            )}
            {recording && (
              <button type="button" onClick={finishRecording} className={`${PRIMARY} h-11 px-4`} aria-disabled={!longEnough}>
                <Square aria-hidden="true" className="size-4" /> Finish
              </button>
            )}
            <button type="button" onClick={cancelCamera} className={`${DANGER_OUTLINE} h-11 px-4`}>
              Discard
            </button>
          </div>
        </div>
      )}

      {mode === 'review' && take && (
        <div className="flex flex-col gap-2.5">
          <video src={take.url} controls playsInline className="aspect-video w-full rounded-[14px] bg-[#0E1B3D] object-contain" aria-label={`Your video, ${take.seconds} seconds`} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F7A55]">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {take.seconds} seconds · the right length · {sizeText(take.size)}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={startCamera} disabled={busy} className={`${SECONDARY} h-10 px-3.5`}>
                Record again
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || checkingFile} className={`${SECONDARY} h-10 px-3.5`}>
                Choose another
              </button>
            </div>
          </div>
          {busy && (
            <div className="h-2 overflow-hidden rounded-full bg-[#E8EEFF]" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#0167F6,#6378F9,#B386F9)] transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-[12px] bg-[#F4F6FE] p-4">
          <h3 className="m-0 text-[15px]">
            <span className={`font-bold ${INK}`}>What to say</span>
          </h3>
          <ol className={`m-0 flex list-decimal flex-col gap-1 pl-[20px] ${BODY}`}>
            {TOPICS.map((item) => (
              <li key={item.text}>{item.text}</li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col gap-2 rounded-[12px] bg-[#FBF5FF] p-4">
          <h3 className="m-0 text-[15px]">
            <span className={`font-bold ${INK}`}>Quick tips</span>
          </h3>
          <ul className={`m-0 flex list-disc flex-col gap-1 pl-[20px] ${BODY}`}>
            <li>Face a window so you’re well lit</li>
            <li>Pick a quiet room, speak slowly</li>
            <li>Look at the camera, not the screen</li>
          </ul>
        </section>
      </div>

      {confirmRemove && (
        <ConfirmDialog title="Remove your intro video?" tone="danger" confirmLabel="Remove video" busyLabel="Removing…" busy={busy} onConfirm={removeVideo} onClose={() => setConfirmRemove(false)}>
          You need an intro video to apply to jobs and gigs. You can add a new one any time.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
