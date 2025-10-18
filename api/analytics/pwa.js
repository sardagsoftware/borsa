// Analytics Stub - PWA Install Events
// White-hat compliant: anonymized PWA metrics only

module.exports = (req, res) => {
  const { event, timestamp, source } = req.body || {};

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics/PWA]', event, source);
  }

  res.status(200).json({
    status: 'accepted',
    message: 'PWA event received (stub)'
  });
};
