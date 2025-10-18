// Analytics Stub - Client-Side Error Tracking
// White-hat compliant: error patterns only (no sensitive data)

module.exports = (req, res) => {
  const { error, stack, page, timestamp } = req.body || {};

  if (process.env.NODE_ENV !== 'production') {
    // Log error type only, not full stack (security)
    console.log('[Analytics/Errors]', error?.message || 'Unknown error', page);
  }

  res.status(200).json({
    status: 'accepted',
    message: 'Error report received (stub)'
  });
};
