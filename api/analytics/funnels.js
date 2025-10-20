// Analytics Stub - Conversion Funnels
// White-hat compliant: aggregated funnel data only

module.exports = (req, res) => {
  const { funnel, step, timestamp } = req.body || {};

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics/Funnels]', funnel, step);
  }

  res.status(200).json({
    status: 'accepted',
    message: 'Funnel event received (stub)'
  });
};
