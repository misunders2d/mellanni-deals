# Mellanni Influencer Portal - Agent System Dev Log

Overview of the build process, architectural decisions, and debugging history between the User and the Agent System.

## 1. Prototype Phase
- **Goal**: Build a branded, clean, lightweight portal for Mellanni Amazon associates to view upcoming Lightning Deals, Promo Codes, and Prime Exclusive sales.
- **Tech Stack**: Next.js 15+ (App Router), React, Tailwind CSS, Local JSON database (`data.json`).
- **Features Delivered**: 
  - Dynamic interactive Calendar Heatmap mapping promo intensity by discount percentage. 
  - Cross-component state filtering (clicking calendar auto-scrolls and filters the active product list below).
  - Copy-to-clipboard functionality for promo codes and direct Amazon links.

## 2. Production Architecture Update
- **Goal**: Full deployment readiness with Authentication, Role-Based Access Control, and strict EU/California compliance.
- **Backend Shift**: Replaced `data.json` with a live **Supabase PostgreSQL** database.
- **Authentication**: Integrated `@supabase/ssr` (Next.js server-side auth chunking) ensuring HTTP-only secure cookie sessions.
- **Role-Based Access Control (RBAC)**: Added a database trigger to automatically map new Auth users to a `profiles` table. Handled three strict tiers via Row-Level Security (RLS):
  - `influencer`: Can view active promos.
  - `superuser`: Can view and edit promos in the `/admin` portal.
  - `admin`: God-tier. Has access to the `/admin/users` dashboard to elevate roles and manage identities.
- **Compliance (GDPR / CCPA / a11y)**:
  - Built an intercepting Cookie Consent banner preventing non-essential tracking logic.
  - Built a Data Privacy center `/settings` equipped with 1-click JSON Data Export (Right to Access) and a guided Account Deletion (Right to be Forgotten) system.
  - Upgraded semantic landmarks with ARIA roles and keyboard `focus-visible` styling for compliant accessibility.

## 3. Deployment & Debugging (Vercel & Next 16)
- **Next 16 Breakage Fix**: Vercel threw a compiler warning regarding the `src/middleware.ts` file convention being deprecated. The system read the new Next.js docs and successfully refactored the router security gate to `src/proxy.ts` using the new `export function proxy()` convention.
- **Git Remote Syncing**: Resolved a Git mismatch where the local pushes were going to `mellanni-deals` while the Vercel app was hooked to `mellanni-deals-portal`. Updated local remotes and forcefully pushed history.
- **Vercel Build Crashing**: Vercel's prerender engine crashed completely during deployment because the `NEXT_PUBLIC_SUPABASE` environment variables were absent in Vercel's settings. 
  - **Resolution**: Patched the Supabase `createClient()` endpoints to elegantly fall back to safe placeholders (`https://placeholder.supabase.co`) at build-time. This entirely patched the Next.js compiler panic, ensuring deploy stability regardless of cloud environment configurations, while keeping the runtime reliant on real keys for security.

## 4. Final Database Debugging
- **Supabase Silent Failures**: The Supabase SDK was silently rejecting saves because the `NOT NULL` payload constraints were missing. Added strict error boundaries that throw clear `alert()` notifications containing the exact DB error string.
- **PostgreSQL Infinite Recursion**: Saving promotions triggered a `infinite recursion detected` Postgres RLS loop, because `profiles` checked itself while authorizing `promotions`.
  - **Resolution**: Rebuilt `schema.sql` to pipe all role checks through a `SECURITY DEFINER` helper function (`get_user_role()`). This completely bypasses the recursive RLS evaluation loop and clears the system lock natively.

## 5. Promo Scheduling & Timezone Synchronization
- **Goal**: Support specific start/end times for deals (e.g., Lightning Deals) and ensure all scheduling is consistent with Amazon's Pacific Time (PT).
- **Timezone Mapping**: 
  - Implemented a custom `date-utils.ts` to map all database interactions and frontend displays to `America/Los_Angeles`.
  - Added explicit "PT" labels to all time displays across the portal and admin dashboard.
  - Fixed a critical "Timezone Drift" bug where editing a promotion would revert its time to the admin's local timezone. Now, the admin enters and edits times strictly in PT.
- **Database Schema**: Upgraded `promotions` table columns `start_date` and `end_date` from `date` to `timestamptz` to support precise scheduling.
- **UI/UX Enhancements**:
  - Added `datetime-local` pickers to the Admin Dashboard.
  - Enhanced the Calendar Heatmap tooltips to display starting times for deals.
  - Fixed a browser warning caused by empty image `src` attributes in the promotion list.
- **Authentication**: Implemented a complete **Password Reset Flow** with "Forgot Password" and "Reset Password" pages, integrated with Supabase Auth recovery emails.
- **Git**: Successfully pushed all architectural and feature updates to the `mellanni-deals-portal` repository.

## 6. Deployment & Auth Troubleshooting
- **Vercel Build Re-trigger**: Successfully resolved a "stuck" Vercel deployment where latest GitHub pushes weren't being picked up by the build engine.
  - **Resolution**: Implemented a "manual trigger" strategy by pushing a minor `README.md` comment to re-engage the GitHub-Vercel webhook.
- **Supabase Email Rate Limiting**: Diagnosed a "Failed to invite user: email rate limit exceeded" error during Admin testing.
  - **Findings**: Confirmed this is a limitation of the Supabase built-in SMTP (3 emails/hour on Free Tier).
  - **Mitigation**: Researched external SMTP providers (Resend/Brevo/Gmail) and documented how to disable "Email Confirmation" for rapid development without a custom domain.
- **Next.js 16 Middleware**: Documented the Next.js 16 breaking change from `middleware.ts` to `src/proxy.ts`. Verified implementation is compliant with native `node_modules` documentation.

## 7. Admin User Provisioning
- **Manual User Creation**: Implemented a "Create User" feature in the `/admin/users` dashboard to bypass email rate limits and support an invite-only strategy.
  - **Infrastructure**: Created `src/utils/supabase/admin.ts` using the `SUPABASE_SERVICE_ROLE_KEY` to access the Admin Auth API with auto-confirmation.
  - **Server Action**: Developed `createUserAction` to handle backend user creation and profile initialization in a single atomic step.
  - **UI**: Added a sliding "Identity Provisioning" form to the admin dashboard for seamless user management.

## 8. Date Range Validation
- **Promotion Integrity**: Implemented a client-side validation check in the Admin Dashboard (`src/app/admin/page.tsx`) to prevent saving deals where the "End Date" is earlier than or equal to the "Start Date".
- **UX**: Added an active alert to notify the administrator of invalid date ranges, ensuring data consistency across the portal.

## 9. Multi-Day Promo Start Time Accuracy
- **Interface Bug**: The Calendar Heatmap popover incorrectly displayed "Starts: [Time]" for promotions that had already begun on a previous day, causing confusion for multi-day deals.
- **Resolution**: Updated `src/components/CalendarHeatmap.tsx` to dynamically distinguish between promotions starting on the current day versus those that started previously.
- **Improved UX**: Tooltips now accurately show "Started: [Date], [Time] PT" for ongoing deals, providing clear context within the calendar view.
- **Git**: Successfully pushed the fix to the `main` branch.

## 10. Click-to-Copy Promo Codes
- **Goal**: Allow influencers to copy specific promo codes with a single click, providing immediate feedback.
- **Implementation**:
  - Updated `src/components/PromotionList.tsx` to make the promo code display box interactive.
  - Added a "Copied!" feedback tooltip that appears directly above the code upon successful copy.
  - Improved UX with hover states and a "Click to copy code" tooltip.
- **Git**: Committed and pushed the changes to the `main` branch.

## 11. Influencer Portal Enhancements
- **Goal**: Significantly upgrade the influencer experience and admin efficiency through modern web features and bulk management tools.
- **Influencer Experience**:
  - **Keyword Search**: Implemented real-time product filtering in `PromotionList`.
  - **"Expiring Soon" Highlights**: Added pulsing red badges for deals ending within 24 hours.
  - **Image Optimization**: Migrated all product images to `next/image` for performance and CLS stability.
  - **PWA Support**: Configured `manifest.json` for home screen installation.
  - **Favorites System**: Built a "Shortlist" feature with a dedicated `favorites` table and RLS policies for private, persistent user saves.
- **Admin Efficiency**:
  - **CSV Import/Export**: Developed an UPSERT-capable CSV import system with downloadable PT-aware templates.
  - **Bulk Actions**: Added multi-select checkboxes for batch archiving/deletion.
  - **Image Management**: Integrated **Supabase Storage** for direct file uploads and added image thumbnails to the admin table.
- **Deal Archiving**: Implemented a Live/Archive toggle in both the Portal and Admin dashboard, while maintaining full historical continuity on the Calendar Heatmap.
- **Git**: Successfully pushed all features and follow-up fixes (Calendar/Archive sync, PT formatting) to the `main` branch across both `origin` and `portal` remotes.

## TODO
- [ ] **Communication & Engagement**:
  - [ ] **Email Alerts**: Sync with Resend or SendGrid for weekly summaries to influencers.
  - [ ] **Browser Notifications**: Optional "push" notifications for Lightning Deal starts.
- [ ] **Developer Experience**:
  - [ ] **Automated Testing Suite**: Add Playwright or Cypress tests for critical flows.
