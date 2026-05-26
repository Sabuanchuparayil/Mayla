# Mayla — Manual Testing Guide

**Version:** May 2026 (includes Referral & Squad system)  
**App URL:** https://mayla.seeglob.com  
**Platform:** Progressive Web App (PWA) — test on mobile Safari/Chrome and desktop

---

## 1. Purpose

This document helps QA testers verify core Mayla flows: signup, discovery, chat, subscriptions, and the **word-of-mouth referral + squad** features aimed at expat/tourist women communities.

---

## 2. Test environment notes

| Item | Value |
|------|--------|
| Phone OTP (test) | `123456` |
| Password reset code (test) | `654321` |
| Selfie verification | Mock mode — verification may auto-pass |
| Stripe billing | Mock mode — upgrades apply instantly (no real payment) |
| Push notifications | May be disabled if VAPID keys not configured |

**Recommended devices:** iPhone (Safari), Android (Chrome), desktop Chrome.

**Recommended setup:** Use at least **2 test accounts** (User A = referrer, User B = invited friend) plus a **3rd account** for squad testing.

---

## 3. Demo accounts (if database seeded)

Email signup uses password `admin123!` unless changed. Phone login uses OTP `123456`.

| Email | Name | Tier | City |
|-------|------|------|------|
| sara@demo.mayla | Sara | Gold | Dubai |
| omar@demo.mayla | Omar | Free | Abu Dhabi |
| fatima@demo.mayla | Fatima | Gold | Ajman |
| ahmed@demo.mayla | Ahmed | Platinum | Dubai |
| dana@demo.mayla | Dana | Platinum | Kuwait City |

Admin: `admin@mayla.app`

---

## 4. Bug reporting template

When filing a bug, include:

- **Tester name & date**
- **Device / browser / OS**
- **Account used** (email or phone, not password)
- **Steps to reproduce** (numbered)
- **Expected result**
- **Actual result**
- **Screenshot or screen recording** (especially for UI/layout issues)
- **URL** at time of bug

---

## 5. Test cases

### A. Authentication & onboarding

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| A1 | Email signup | Go to `/signup` → create account with email, username, password | Account created; redirected to verify/onboarding |
| A2 | Phone login | Go to `/verify` → enter phone → OTP `123456` | Logged in successfully |
| A3 | Onboarding — full flow | Complete all 7 steps (Basics → Background → Work → Goal → Lifestyle → Photos → Personality) | Profile saved; lands on Dashboard |
| A4 | Onboarding — invite code field | On Step 1 (Basics), enter a valid friend invite code | Code accepted; no error blocking progress |
| A5 | Onboarding — invalid code | Enter nonsense code like `XXXX` | Onboarding still completes (invalid codes ignored silently) |
| A6 | Forgot password | `/forgot-password` → email → reset code `654321` → new password | Password updated; can log in |
| A7 | Logout | Settings → Session → Log out | Session cleared; redirected to login |

---

### B. Referral system

**Setup:** User A completes onboarding and gets an invite code in Settings.

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| R1 | View invite dashboard | Settings → scroll to **Invite friends** | Personal code shown; progress bar; milestone list visible |
| R2 | Copy invite code | Tap **Copy code** | Code copied to clipboard |
| R3 | Copy invite link | Tap **Copy link** | Link format: `…/join/{CODE}` |
| R4 | WhatsApp share | Tap **WhatsApp** | Opens WhatsApp with pre-filled message + link |
| R5 | Native share (mobile) | Tap **Share** | OS share sheet opens (or falls back to copy link) |
| R6 | Customize code (once) | Enter custom code (4–16 chars, e.g. `SARADXB`) → Save | Code updates; cannot customize again |
| R7 | Join landing page | Open User A's link in incognito: `/join/{CODE}` | Page shows inviter name, value props, Sign up / Login CTAs |
| R8 | OG preview (WhatsApp) | Paste invite link in WhatsApp chat (don't send) | Link preview shows title + description (not blank) |
| R9 | Auto-fill from join link | Open join link → Sign up → start onboarding | Step 1 invite code field pre-filled |
| R10 | Successful referral | User B signs up via User A's code → completes onboarding | User B gets 1 day Gold; User A's count increases by 1 |
| R11 | Referrer reward — 1 friend | After R10, check User A Settings | Progress shows 1 completed; **Connector** badge; plan shows Gold extension |
| R12 | Self-referral blocked | Try to use your own code on another account you control | Should not credit yourself (code resolves to same user) |
| R13 | Duplicate referral | User B tries another invite code after already referred | Should fail or be ignored (one referral per user) |
| R14 | Post-match share prompt | User A gets a match on Discover | Match celebration shows "Share your invite link" + copy link |
| R15 | Invite to reveal likes | User A (Free, no referrals) has likes → open Discover **Likes You** | Shows "Invite 1 friend to reveal" button |
| R16 | Reveal after 1 referral | After R10, User A checks Likes You again | First like is unblurred (name/photo visible) |
| R17 | Referral streak (advanced) | User A refers 3 friends within 7 days | User A receives bonus Platinum day + push (if push enabled) |

**Referral milestones (referrer rewards):**

| Friends joined | Reward |
|----------------|--------|
| 1 | 3 days Gold + Connector badge |
| 3 | 7 days Gold + Social Butterfly + 24h priority boost |
| 5 | 14 days Platinum + Inner Circle + permanent priority |
| 10 | 30 days Platinum + Mayla Ambassador |

---

### C. Squad system

**Setup:** User A creates a squad in Settings.

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| S1 | Create squad | Settings → **Your squad** → name e.g. "Dubai Brunch Girls" → Create | Squad created; User A is owner; squad code shown |
| S2 | Copy squad invite link | Copy squad invite link from squad panel | Link opens join page with squad messaging |
| S3 | Join squad | User B → Settings → Join with code → enter squad code | User B appears in member list |
| S4 | Squad unlock threshold | Add 3rd member (User C) | Squad shows "unlocked"; Squad Discover section appears |
| S5 | Squad Discover — empty | Before any likes/vouches | Message: no vouched profiles yet |
| S6 | Squad Discover — with activity | Squad members like profiles on Discover | Liked profiles appear in Squad Discover feed |
| S7 | Squad boost (5+ members) | Squad reaches 5 members | "Squad boost active" badge shown |
| S8 | Join via onboarding | User opens squad join link → completes onboarding with squad code stored | Auto-joins squad after onboarding |
| S9 | Squad challenge copy | Squad has 1–2 members | Shows "invite X more friends to unlock Squad Discover" |

---

### D. Discover & matching

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| D1 | Discover feed loads | Go to `/discover` | Profile cards load with photos, badges, compatibility |
| D2 | Swipe like | Tap heart / swipe right | Card advances; no error |
| D3 | Swipe pass | Tap X / swipe left | Card advances |
| D4 | Undo swipe | Pass on someone → tap **Undo** within 60 seconds | Profile returns to feed |
| D5 | Mutual match | User A likes User B; User B likes User A | Match celebration modal with compatibility % |
| D6 | Daily swipe limit (Free) | Free user swipes 5+ times | Limit message or upgrade prompt |
| D7 | More for you panels | Expand **More for you** on Discover | Daily Picks, Likes You, Date Requests load |
| D8 | Likes You — Gold+ | Gold/Platinum user opens Likes You | All likes revealed (not blurred) |
| D9 | Empty discover | Adjust filters to exclude everyone | Empty state with filter/refresh options |
| D10 | Touch swipe (mobile) | Swipe left/right on card | Same as button actions |

---

### E. Chat & messaging

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| E1 | Chat inbox | Go to `/chat` | Match list with last message preview + timestamp |
| E2 | Open conversation | Tap a match | Full chat opens; messages load |
| E3 | Send message | Type and send | Message appears; delivered to other user in real time |
| E4 | Typing indicator | User A types while User B has chat open | User B sees typing indicator |
| E5 | Read receipts | User B reads User A's message | Read status updates (Platinum feature where applicable) |
| E6 | Mobile full-height chat | Open chat on phone | Chat fills screen; back button returns to list |
| E7 | Block/report | Open block/report from chat | Modal opens; can submit report |
| E8 | Unread badge | Receive message while elsewhere | Notification bell / chat badge updates |

---

### F. Profile & settings

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| F1 | Profile editor tabs | `/profile` → switch Photos / About / Lifestyle / Prompts / Preview | Each tab loads; changes persist on save |
| F2 | Photo upload | Add/reorder photos in profile or onboarding | Photos upload and display in Discover |
| F3 | Bio character limit | Enter 300+ char bio | Counter stops at max |
| F4 | Preferences | Settings → Preferences → change age/distance/gender | Discover feed reflects filters |
| F5 | Privacy — incognito | Gold+ user toggles incognito | Profile hidden from Discover except to people who liked them |
| F6 | Photo blur (Gold+) | Blur specific photos | Blurred until match for other users |
| F7 | Gentleman score | Dashboard → Gentleman Score card | Score, stars, tips display (male users) |
| F8 | Profile completeness | Incomplete profile | Banner shows on Dashboard/Discover with hints |
| F9 | Travel mode | Settings → enable travel mode + city | Discover shows profiles near travel city |
| F10 | Language | Settings → change app language | UI strings update |
| F11 | Export data | Settings → Export my data | JSON/file download starts |
| F12 | Delete account | Settings → Delete account → confirm | Account removed; cannot log in |

---

### G. Subscription & billing

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| G1 | View current plan | Settings → Subscription section | Shows FREE / GOLD / PLATINUM |
| G2 | Upgrade to Gold | Tap Upgrade Gold | Mock upgrade succeeds; unlimited swipes |
| G3 | Upgrade to Platinum | Tap Upgrade Platinum | Mock upgrade succeeds; Platinum features unlock |
| G4 | Cancel subscription | Cancel while on paid plan | Reverts to Free tier |
| G5 | Referral + subscription stack | User has referral Gold days, then upgrades | No crash; tier displays correctly |

---

### H. Verification & trust

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| H1 | Selfie verification | `/verify/selfie` → upload selfie | Verification completes (mock mode) |
| H2 | Verified badge | View verified user on Discover | Verified badge displays consistently |
| H3 | Safety center | Settings → Safety Center | Safety tips and guidance visible |
| H4 | Block user | Block someone from chat | They disappear from feed/chat |

---

### I. PWA & accessibility

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| I1 | Install PWA (Android) | Chrome → Add to Home Screen | App installs; opens standalone |
| I2 | Install hint (iOS) | Open in Safari on iPhone | iOS install banner/guidance appears |
| I3 | Offline fallback | Turn off network → navigate | Offline page or graceful error (not blank crash) |
| I4 | Skip link (desktop) | Tab to first focusable element | "Skip to main content" works |
| I5 | Keyboard navigation | Tab through header, buttons, forms | Focus visible; modals closable with Escape |

---

### J. Admin (optional)

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| J1 | Admin login | Log in as `admin@mayla.app` → `/admin` | Admin dashboard loads |
| J2 | Review reports | Admin → Reports | Pending reports list loads |

---

## 6. Referral + squad end-to-end scenario (recommended smoke test)

Use this as a **15-minute happy path** before deeper testing:

1. **User A** — Sign up, complete onboarding, go to Settings → copy invite link.
2. **User B** — Open invite link in private window → sign up → complete onboarding (code auto-filled).
3. **User A** — Confirm referral count = 1, Connector badge, 1 like revealed in Likes You (if applicable).
4. **User A** — Create squad "Test Squad" → copy squad code.
5. **User B & C** — Join squad via code.
6. **All three** — Like profiles on Discover.
7. **User A** — Open Squad Discover → confirm liked profiles appear.
8. **User A & B** — Match each other → confirm post-match invite prompt.

---

## 7. Known limitations (not bugs)

- OTP and billing are in **test/mock mode** on the staging/production test server.
- Push notifications may not fire if VAPID keys are not configured.
- QR code generation for salon/gym placement is **not yet implemented** (planned Phase 3).
- Squad group chat is **not implemented** (future phase).
- Squad leaderboard is **not implemented** (future phase).

---

## 8. Priority severity guide

| Severity | Definition | Example |
|----------|------------|---------|
| **P0 — Blocker** | Cannot sign up, pay, or match at all | App crash on login |
| **P1 — Critical** | Core feature broken | Referral not crediting after onboarding |
| **P2 — Major** | Feature works but wrong/missing data | Squad Discover empty when members have likes |
| **P3 — Minor** | UI/copy/layout issues | Misaligned button on mobile |
| **P4 — Trivial** | Cosmetic only | Typo in helper text |
