// 📊 HEALTH RING-BUFFER - localStorage Persistence
// Stores up to 300 health snapshots (~5 hours @ 60s intervals)

/**
 * Ring Buffer Configuration
 */
const RING_BUFFER_CONFIG = {
  KEY: 'lydian_health_history',
  MAX_SIZE: 300, // ~5 hours at 60s intervals
  VERSION: '1.0.0'
};

/**
 * Initialize or retrieve ring buffer from localStorage
 * @returns {Array} Array of health snapshots
 */
function getRingBuffer() {
  try {
    const raw = localStorage.getItem(RING_BUFFER_CONFIG.KEY);
    if (!raw) return [];

    const data = JSON.parse(raw);

    // Validate version and structure
    if (data.version !== RING_BUFFER_CONFIG.VERSION || !Array.isArray(data.snapshots)) {
      console.warn('Ring buffer version mismatch or invalid structure, resetting...');
      return [];
    }

    return data.snapshots;
  } catch (error) {
    console.error('Error reading ring buffer:', error);
    return [];
  }
}

/**
 * Save ring buffer to localStorage
 * @param {Array} snapshots - Array of health snapshots
 * @returns {boolean} Success status
 */
function saveRingBuffer(snapshots) {
  try {
    const data = {
      version: RING_BUFFER_CONFIG.VERSION,
      snapshots,
      lastUpdated: Date.now()
    };

    localStorage.setItem(RING_BUFFER_CONFIG.KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving ring buffer:', error);

    // If quota exceeded, clear old entries and retry
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old entries...');
      const halfSize = Math.floor(snapshots.length / 2);
      const trimmed = snapshots.slice(-halfSize);

      try {
        const data = {
          version: RING_BUFFER_CONFIG.VERSION,
          snapshots: trimmed,
          lastUpdated: Date.now()
        };
        localStorage.setItem(RING_BUFFER_CONFIG.KEY, JSON.stringify(data));
        return true;
      } catch (retryError) {
        console.error('Retry failed after quota error:', retryError);
        return false;
      }
    }

    return false;
  }
}

/**
 * Add a new health snapshot to the ring buffer
 * @param {Object} snapshot - Health snapshot data
 * @param {number} snapshot.timestamp - Timestamp in milliseconds
 * @param {Array} snapshot.items - Array of health check results
 * @returns {boolean} Success status
 */
function addSnapshot(snapshot) {
  if (!snapshot || !snapshot.timestamp || !Array.isArray(snapshot.items)) {
    console.error('Invalid snapshot format');
    return false;
  }

  let buffer = getRingBuffer();

  // Add new snapshot
  buffer.push(snapshot);

  // Enforce max size (FIFO)
  if (buffer.length > RING_BUFFER_CONFIG.MAX_SIZE) {
    buffer = buffer.slice(-RING_BUFFER_CONFIG.MAX_SIZE);
  }

  return saveRingBuffer(buffer);
}

/**
 * Get all snapshots from ring buffer
 * @returns {Array} Array of health snapshots
 */
function getAllSnapshots() {
  return getRingBuffer();
}

/**
 * Get snapshots within a time range
 * @param {number} startTime - Start timestamp in milliseconds
 * @param {number} endTime - End timestamp in milliseconds (defaults to now)
 * @returns {Array} Filtered array of snapshots
 */
function getSnapshotsInRange(startTime, endTime = Date.now()) {
  const buffer = getRingBuffer();
  return buffer.filter(snapshot =>
    snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
  );
}

/**
 * Get recent snapshots (last N entries)
 * @param {number} count - Number of recent snapshots to retrieve
 * @returns {Array} Array of recent snapshots
 */
function getRecentSnapshots(count = 60) {
  const buffer = getRingBuffer();
  return buffer.slice(-count);
}

/**
 * Calculate uptime percentage from snapshots
 * @param {Array} snapshots - Array of health snapshots
 * @param {string} targetName - Name of target to calculate uptime for (optional)
 * @returns {number} Uptime percentage (0-100)
 */
function calculateUptime(snapshots, targetName = null) {
  if (!snapshots || snapshots.length === 0) return 0;

  let totalChecks = 0;
  let successfulChecks = 0;

  snapshots.forEach(snapshot => {
    if (!snapshot.items) return;

    snapshot.items.forEach(item => {
      // If targetName specified, only count that target
      if (targetName && item.name !== targetName) return;

      totalChecks++;
      if (item.status === 'up') {
        successfulChecks++;
      }
    });
  });

  if (totalChecks === 0) return 0;

  return Math.round((successfulChecks / totalChecks) * 1000) / 10; // 1 decimal precision
}

/**
 * Calculate P95 latency from snapshots
 * @param {Array} snapshots - Array of health snapshots
 * @param {string} targetName - Name of target to calculate latency for (optional)
 * @returns {number} P95 latency in milliseconds
 */
function calculateP95Latency(snapshots, targetName = null) {
  if (!snapshots || snapshots.length === 0) return 0;

  const latencies = [];

  snapshots.forEach(snapshot => {
    if (!snapshot.items) return;

    snapshot.items.forEach(item => {
      // If targetName specified, only count that target
      if (targetName && item.name !== targetName) return;

      // Only include successful responses
      if (item.status === 'up' && typeof item.ms === 'number') {
        latencies.push(item.ms);
      }
    });
  });

  if (latencies.length === 0) return 0;

  // Sort and get P95
  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  return Math.round(latencies[p95Index] || 0);
}

/**
 * Calculate average latency from snapshots
 * @param {Array} snapshots - Array of health snapshots
 * @param {string} targetName - Name of target to calculate latency for (optional)
 * @returns {number} Average latency in milliseconds
 */
function calculateAvgLatency(snapshots, targetName = null) {
  if (!snapshots || snapshots.length === 0) return 0;

  const latencies = [];

  snapshots.forEach(snapshot => {
    if (!snapshot.items) return;

    snapshot.items.forEach(item => {
      // If targetName specified, only count that target
      if (targetName && item.name !== targetName) return;

      // Only include successful responses
      if (item.status === 'up' && typeof item.ms === 'number') {
        latencies.push(item.ms);
      }
    });
  });

  if (latencies.length === 0) return 0;

  const sum = latencies.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / latencies.length);
}

/**
 * Get current status for a specific target
 * @param {string} targetName - Name of target
 * @returns {Object|null} Latest status object or null
 */
function getCurrentStatus(targetName) {
  const buffer = getRingBuffer();
  if (buffer.length === 0) return null;

  const latestSnapshot = buffer[buffer.length - 1];
  if (!latestSnapshot || !latestSnapshot.items) return null;

  const item = latestSnapshot.items.find(i => i.name === targetName);
  return item || null;
}

/**
 * Get data for spark chart (time-series latency)
 * @param {string} targetName - Name of target
 * @param {number} count - Number of recent snapshots to include
 * @returns {Array} Array of latency values [ms1, ms2, ...]
 */
function getSparkData(targetName, count = 60) {
  const buffer = getRingBuffer();
  const recent = buffer.slice(-count);

  return recent.map(snapshot => {
    if (!snapshot.items) return 0;

    const item = snapshot.items.find(i => i.name === targetName);
    return item && item.status === 'up' ? item.ms : 0;
  });
}

/**
 * Clear all ring buffer data
 * @returns {boolean} Success status
 */
function clearRingBuffer() {
  try {
    localStorage.removeItem(RING_BUFFER_CONFIG.KEY);
    return true;
  } catch (error) {
    console.error('Error clearing ring buffer:', error);
    return false;
  }
}

/**
 * Get ring buffer statistics
 * @returns {Object} Statistics object
 */
function getRingBufferStats() {
  const buffer = getRingBuffer();

  if (buffer.length === 0) {
    return {
      count: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
      sizeBytes: 0
    };
  }

  const raw = localStorage.getItem(RING_BUFFER_CONFIG.KEY);
  const sizeBytes = raw ? new Blob([raw]).size : 0;

  return {
    count: buffer.length,
    oldestTimestamp: buffer[0].timestamp,
    newestTimestamp: buffer[buffer.length - 1].timestamp,
    sizeBytes,
    maxSize: RING_BUFFER_CONFIG.MAX_SIZE
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addSnapshot,
    getAllSnapshots,
    getSnapshotsInRange,
    getRecentSnapshots,
    calculateUptime,
    calculateP95Latency,
    calculateAvgLatency,
    getCurrentStatus,
    getSparkData,
    clearRingBuffer,
    getRingBufferStats
  };
}
