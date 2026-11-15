# Duplicate admin controls audit — 2026-11-14

| Field | Previous locations | Authoritative location | Change |
|---|---|---|---|
| home_sections.partners_heading | Homepage Sections → Partners; Trusted Partners | Trusted Partners | Replaced homepage field with editor shortcut |
| home_sections.partners_subheading | Homepage Sections → Partners; Trusted Partners | Trusted Partners | Replaced homepage field with editor shortcut |

The Homepage Sections partners background remains editable there. Trusted Partners retains both heading fields, partner-logo management and its original save operation. Original shared settings keys and database values are unchanged. The shortcut invokes the existing dashboard navigation setter, preserving the dashboard's draft state.

The audit used the captured published client bundle (/tmp/opus-admin-live.js), pinned to the original Pages deployment preserved by release checks. A guarded source transformation applies only when the exact audited duplicate controls and navigation signature match. The source is left untouched if a later publication changes those markers. Admin HTML versions only its same-origin admin bundle URL and disables stale HTML revalidation for this update. Authentication headers and Access redirects remain intact. The signed-in production admin UI requires the owner's login; tests cover the published bundle, navigation callback and Worker integration rather than bypassing that login.

Other similarly named controls with separate purposes (home/full FAQ, favicon/app icon, payment logos/transactions, page-specific CTA text) are retained. Multiple navigation shortcuts to a single settings dialog are not duplicate editors.

Inbox cleanup removes the obsolete hidden quick-reply/formatting rows and their event handlers. The shared selection menu owns formatting for both staff and visitor chat. No settings rows or customer data were deleted.

Validation: check-admin-duplicates.mjs and check-admin-duplicates-worker.mjs. Worker backups: worker-before-keyboard-desktop-v6.bin, worker-before-logo-alignment-v7.bin, worker-before-admin-dedupe-v8.bin.

## Follow-up: conversations moved to the app
The Customer Conversations group is removed from the main navigation. One Inbox app link is added to the sidebar footer. Old Website Inbox and Feedback URLs open the app; the legacy WhatsApp tool remains available through its app channel link. Unread-summary polling on ordinary admin pages is disabled. Feedback management now has a single implementation shared by the app's mobile and desktop layouts. No conversation/feedback records were deleted.
