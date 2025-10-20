// Analytics Stub - Core Web Vitals
// White-hat compliant: performance metrics only (no PII)

module.exports = (req, res) => {
  const { metric, value, page, timestamp } = req.body || {};

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics/Vitals]', metric, value, 'ms');
  }

  res.status(200).json({
    status: 'accepted',
    message: 'Web Vitals metric received (stub)'
  });
};
