# Unused CSS Files - Backup

**Date:** October 8, 2025
**Phase:** M - CSS Optimization

## Files Moved to Backup (75.98 KB total)

These CSS files were not referenced by any HTML files in the project and have been moved to this backup folder to reduce bundle size.

| File | Size | Reason |
|------|------|--------|
| `lydian-iq.css` | 33.11 KB | Not referenced by any HTML file |
| `medical-expert.css` | 19.40 KB | Not referenced by any HTML file |
| `theme.css` | 9.36 KB | Not referenced by any HTML file |
| `i18n-rtl.css` | 8.56 KB | Not referenced by any HTML file |
| `claude-theme.css` | 5.55 KB | Not referenced by any HTML file |

## Verification

Confirmed via grep search across all HTML files:
```bash
grep -r "lydian-iq\.css" public/*.html        # No matches
grep -r "medical-expert\.css" public/*.html   # No matches
grep -r "theme\.css" public/*.html            # No matches
grep -r "i18n-rtl\.css" public/*.html         # No matches
grep -r "claude-theme\.css" public/*.html     # No matches
```

## Impact

- **Bundle Size Reduction:** 75.98 KB (23.7% of total CSS)
- **Before:** 321.21 KB
- **After removing these:** 245.23 KB
- **Still over budget:** 145.23 KB (budget is 100 KB)

## Recovery

If any of these files are needed in the future, they can be restored from this backup folder:

```bash
cp public/css/.unused-backup/[filename].css public/css/
```

Then add the appropriate `<link>` tag to the HTML file that needs it.

## Next Steps

- Implement route-based CSS loading for page-specific files
- Run PurgeCSS to remove unused selectors from remaining files
- Extract critical CSS for above-the-fold content
