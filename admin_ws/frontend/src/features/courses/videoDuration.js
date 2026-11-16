// The length of a lecture video, read from the file the admin picked (no server needed).

/** 18.4 s → "0:18", 1125 → "18:45", 11001 → "3:03:21". null for anything that is not a positive length. */
export function formatDuration(totalSeconds) {
  const seconds = Math.round(Number(totalSeconds));
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}` : `${minutes}:${pad(seconds % 60)}`;
}

/**
 * Resolves to the video's length in seconds, or null when the browser can't tell (an unsupported format,
 * a broken file, a stream with no length). It only reads the file's header, so it is quick even for a
 * very large video.
 */
export function readVideoDuration(file, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const finish = (seconds) => {
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.preload = 'metadata';
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(null);
    video.src = url;
  });
}
