// Analytics Stub - User Journey Tracking
// White-hat compliant: anonymized journeys only

module.exports = (req, res) => {
  const { path, action, timestamp } = req.body || {};

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics/Journey]', path, action);
  }

  res.status(200).json({
    status: 'accepted',
    message: 'Journey event received (stub)'
  });
};
