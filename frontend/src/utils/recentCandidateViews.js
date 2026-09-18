const STORAGE_PREFIX = 'aligngrade_recently_viewed_';

function resolveRecruiterId(recruiterId) {
  if (recruiterId) return String(recruiterId);
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id || u?._id) return String(u.id || u._id);
    }
  } catch (e) {
    // ignore parsing failure
  }
  return 'default';
}

/**
 * Retrieves the last N viewed candidates for the given recruiter.
 * @param {string} [recruiterId]
 * @param {number} [limit=5]
 * @returns {Array} List of candidate profiles
 */
export function getRecentlyViewedCandidates(recruiterId, limit = 5) {
  try {
    const activeId = resolveRecruiterId(recruiterId);
    const key = `${STORAGE_PREFIX}${activeId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.slice(0, limit);
  } catch (err) {
    console.error('Error reading recently viewed candidates:', err);
    return [];
  }
}

/**
 * Records a viewed candidate profile for the given recruiter.
 * Moves the candidate to the top if already present.
 * @param {object} candidate
 * @param {string} [recruiterId]
 */
export function recordViewedCandidate(candidate, recruiterId) {
  if (!candidate) return;
  const candId = candidate.id || candidate._id || candidate.userId;
  if (!candId) return;

  try {
    const activeId = resolveRecruiterId(recruiterId);
    const key = `${STORAGE_PREFIX}${activeId}`;
    const existingRaw = localStorage.getItem(key);
    let list = existingRaw ? JSON.parse(existingRaw) : [];
    if (!Array.isArray(list)) list = [];

    if (list.length > 0) {
      const firstId = list[0].id || list[0]._id || list[0].userId;
      if (String(firstId) === String(candId)) {
        const lastTime = new Date(list[0].viewedAt || 0).getTime();
        if (Date.now() - lastTime < 30000) {
          return;
        }
      }
    }

    // Filter out existing entry to deduplicate and move to top
    list = list.filter(item => {
      const itemId = item.id || item._id || item.userId;
      return String(itemId) !== String(candId);
    });

    const entry = {
      ...candidate,
      id: candId,
      viewedAt: new Date().toISOString()
    };

    list.unshift(entry);
    // Retain up to 20 recent views
    list = list.slice(0, 20);

    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent('recently_viewed_candidates_changed', {
        detail: { recruiterId: activeId, list }
      })
    );
  } catch (err) {
    console.error('Error recording recently viewed candidate:', err);
  }
}

/**
 * Formats an ISO date into relative time (e.g., 'Just now', '5m ago', '2h ago', '1d ago').
 * @param {string} isoString
 * @returns {string}
 */
export function formatViewedTime(isoString) {
  if (!isoString) return 'Recently';
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (diffMs < 0) return 'Just now';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
