/**
 * LiveOps Current Season Endpoint
 * GET /liveops/season/current
 * Returns current active season information
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Load Season 1 config from LiveOps directory
    const seasonPath = path.join(process.cwd(), 'LiveOps/seasons/season1/season.json');

    let seasonData;
    try {
      const fileContent = await fs.readFile(seasonPath, 'utf-8');
      seasonData = JSON.parse(fileContent);
    } catch (fileError) {
      // If file doesn't exist, return default Season 1 data
      seasonData = {
        id: 'S1',
        name: 'Echo of Sardis: First Chronicle',
        start: '2025-10-20T00:00:00Z',
        end: '2025-12-01T00:00:00Z',
        status: 'scheduled',
      };
    }

    // Check if season is active
    const now = new Date();
    const startDate = new Date(seasonData.start);
    const endDate = new Date(seasonData.end);

    if (now < startDate) {
      seasonData.status = 'scheduled';
      seasonData.days_until_start = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    } else if (now >= startDate && now <= endDate) {
      seasonData.status = 'active';
      seasonData.days_remaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      seasonData.progress_percent = Math.round(((now - startDate) / (endDate - startDate)) * 100);
    } else {
      seasonData.status = 'ended';
      seasonData.days_since_end = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
    }

    // Add current week info if season is active
    if (seasonData.status === 'active') {
      const weeksSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 7));
      seasonData.current_week = Math.min(weeksSinceStart + 1, 6);
    }

    // Add Season 1 specific info
    const seasonInfo = {
      ...seasonData,
      theme: 'Ancient Ruins & Chordstone Mysteries',
      cosmetics_available: 7,
      mini_bosses: ['Colossus', 'Warden'],
      events: {
        week_1: ['trials-daily', 'canyon-night-open'],
        week_2: ['mini-boss-colossus', 'trials-weekly'],
        week_3: ['photomode-contest'],
        week_4: ['vendor-sale'],
        week_5: ['mini-boss-warden', 'trials-daily'],
        week_6: ['season-finale', 'bonus-xp-1.5x'],
      },
    };

    res.json(seasonInfo);
  } catch (error) {
    console.error('[LiveOps Season Error]', error);
    res.status(500).json({
      error: 'Failed to fetch current season',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
};
