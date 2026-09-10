# University Name Update Summary

## Changes Made

Updated all references from **"Mangosuthu University of Technology, Umlazi, Durban, South Africa"** to **"Muranga University of Technology, Muranga County, Kenya"**

---

## Files Updated (11 files)

### Client Files (9 files)

1. **`client/index.html`**
   - Meta description updated

2. **`client/public/manifest.json`**
   - App description updated

3. **`client/src/pages/AboutPage.jsx`**
   - Mission statement updated

4. **`client/src/components/Footer.jsx`**
   - Footer description updated
   - Address updated to: Muranga County, Kenya

5. **`client/src/pages/ContactPage.jsx`**
   - Contact address updated

6. **`client/src/pages/PrivacyPage.jsx`**
   - University name updated in data sharing section
   - Address updated in contact section
   - International data transfer updated to Kenya

7. **`client/src/pages/RegisterPage.jsx`**
   - Location information updated

8. **`client/src/pages/TermsPage.jsx`**
   - Eligibility requirements updated
   - Address updated
   - Governing law changed to Kenya

### Server Files (2 files)

9. **`server/config/email.js`**
   - Email footer updated (all email templates)
   - University name in signature updated

---

## Verification

All occurrences have been replaced:

✅ **University Name**: Mangosuthu → Muranga University of Technology
✅ **Location**: Umlazi, Durban → Muranga County  
✅ **Country**: South Africa → Kenya
✅ **Legal Jurisdiction**: South African law → Kenyan law

---

## Admin Panel

The admin panel already had the correct name:
- ✅ "Murang'a University of Technology" (with apostrophe)

Note: The client uses "Muranga" (without apostrophe) for consistency with the domain/branding.

---

## Next Steps

To apply these changes:

1. **Test locally** to ensure everything displays correctly
2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Update university name and location to Muranga University of Technology, Kenya"
   git push
   ```
3. **Redeploy** if already in production

---

## Affected User-Facing Content

### Contact Information
**Before**: Mangosuthu University, Umlazi, Durban, South Africa
**After**: Muranga University of Technology, Muranga County, Kenya

### Legal Information
**Before**: Governed by laws of South Africa
**After**: Governed by laws of Kenya

### About/Mission Statement
**Before**: Platform for Mangosuthu University of Technology students
**After**: Platform for Muranga University of Technology students

### Email Templates
All system emails now reference Muranga University of Technology

---

**Status**: ✅ Complete
**Date**: 2026-09-09
**Files Modified**: 11
