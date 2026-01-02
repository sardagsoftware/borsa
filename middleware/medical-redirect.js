/**
 * 🏥 MEDICAL EXPERT REDIRECT MIDDLEWARE
 * ========================================
 * Redirects /medical-expert requests to medical.ailydian.com subdomain
 *
 * Created: December 21, 2025
 * Purpose: Clean separation of medical platform to dedicated subdomain
 * Status: White-Hat Compliant ✅
 */

function medicalRedirectMiddleware(req, res, next) {
  const path = req.path

  // Check if request is for medical-expert
  if (path === '/medical-expert' || path.startsWith('/medical-expert/')) {
    const subdomain = 'medical.ailydian.com'

    // Extract any additional path after /medical-expert
    const remainingPath = path.replace('/medical-expert', '')

    // Build redirect URL
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
    const redirectUrl = `${protocol}://${subdomain}${remainingPath}`

    // Add query parameters if any
    const queryString = Object.keys(req.query).length > 0
      ? '?' + new URLSearchParams(req.query).toString()
      : ''

    const finalUrl = redirectUrl + queryString

    console.log(`🏥 Medical Redirect: ${req.path} → ${finalUrl}`)

    // 301 Permanent Redirect (SEO-friendly)
    return res.redirect(301, finalUrl)
  }

  // Not a medical-expert request, continue to next middleware
  next()
}

module.exports = { medicalRedirectMiddleware }
