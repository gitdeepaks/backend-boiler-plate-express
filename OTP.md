# OTP login with Twilio (Verify API)

This guide matches the **chai-cohort backend** layout (`src/modules/auth/`, `src/common/`) and shows how to add **SMS (or WhatsApp) OTP** for logging users in using [Twilio Verify](https://www.twilio.com/docs/verify).

Twilio **Verify** is the right product for OTP: it creates the code, sends it, handles expiry and rate limits, and checks the code—you do **not** store OTPs in MongoDB.

---

## How it fits your codebase today

| Piece | Role |
| ----- | ---- |
| `src/modules/auth/auth.routes.js` | Add new routes (e.g. request OTP, verify OTP). |
| `src/modules/auth/auth.controller.js` | New handlers: call service, set cookies like existing `login`. |
| `src/modules/auth/auth.service.js` | Look up user by phone, call Twilio, issue JWT after successful verification. |
| `src/modules/auth/auth.model.js` | Add a `phone` field (E.164) if users log in with phone. |
| `src/modules/auth/dto/*.dto.js` | New DTOs for `phone` + `code` (same pattern as `LogInDTO` / `BaseDto`). |
| `src/common/middleware/validate.middleware.js` | Reuse `validate(SomeDto)` on new routes. |
| `src/common/config/twilio.js` | **New file**: Twilio client + Verify Service SID (same idea as `email.js` for third-party config). |

Your existing `POST /api/auth/login` (email + password) can stay. OTP login is usually **additional** routes, for example under `/api/auth/login/otp/...`.

---

## Prerequisites (Twilio Console)

1. Create a [Twilio account](https://www.twilio.com/) and note **Account SID** and **Auth Token** (keep the token secret).
2. In the Console, open **Verify → Services → Create**. Give it a name (e.g. `chai-cohort-login`) and copy the **Service SID** (`VA...`).
3. Under that Verify Service, configure:
   - **SMS** (and optionally **WhatsApp**) as channels.
   - For development, use a [verified caller ID / trial limitations](https://www.twilio.com/docs/verify/api) as Twilio documents (trial accounts can only send to verified numbers).

---

## Environment variables

Add to `.env` (and document in `.env.example` without real secrets):

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Optional: if you use a [subaccount](https://www.twilio.com/docs/iam/api/account) or API key instead of the primary token, follow Twilio’s docs and map the same three values your app needs (`AC...`, secret, `VA...`).

---

## Install the SDK

From the project root:

```bash
npm install twilio
```

---

## Step 1 — Shared Twilio helper

**Create** `src/common/config/twilio.js`:

- Import `twilio` and create a client with `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.
- Export a small helper that uses `TWILIO_VERIFY_SERVICE_SID`, for example:
  - `startVerification(toPhoneE164, channel)` → `client.verify.v2.services(sid).verifications.create({ to, channel: 'sms' })`
  - `checkVerification(toPhoneE164, code)` → `client.verify.v2.services(sid).verificationChecks.create({ to, code })`

Use **E.164** phone strings everywhere (e.g. `+14155552671`). Validate format in your DTO (Joi).

---

## Step 2 — User model: phone number

**Edit** `src/modules/auth/auth.model.js`:

- Add `phone`:
  - `type: String`, `trim: true`, `unique: true`, `sparse: true` (so existing users without phone are allowed).
  - Optionally `match` a loose E.164 pattern or rely on Joi + Twilio errors.
- Decide whether OTP login is **only** for users who already have `phone` set (e.g. at registration) or whether you allow binding phone on first OTP login—document that rule in your product.

If you keep email/password login and add OTP as **2FA**, you might skip a public “login by phone only” flow and instead tie OTP to an already authenticated step; the same Twilio helpers still apply.

---

## Step 3 — DTOs (Joi + `BaseDto`)

**Create** under `src/modules/auth/dto/`:

| File | Purpose |
| ---- | ------- |
| `request-login-otp.dto.js` | `phone` — required, E.164-style string. |
| `verify-login-otp.dto.js` | `phone` + `code` — required (code length can match Twilio’s, often 4–6 digits). |

Follow the same pattern as `login.dto.js`: extend `BaseDto`, `static scheme = Joi.object({ ... })`, import `base.dto.js` with the `.js` extension.

---

## Step 4 — Service layer

**Edit** `src/modules/auth/auth.service.js`:

1. **`requestLoginOtp({ phone })`**
   - Normalize `phone` to E.164 if needed.
   - `User.findOne({ phone })`. If no user → `ApiError` (choose **404** or **401** depending on whether you want to hide account existence).
   - Call `startVerification(phone)` via `twilio.js`.
   - Return a simple success payload (no tokens yet). Twilio may return `status` like `pending`.

2. **`verifyLoginOtp({ phone, code })`**
   - `User.findOne({ phone })` again.
   - Call `checkVerification(phone, code)`. If Twilio says invalid/expired → `ApiError.unauthorized` (or `badRequest`).
   - On success, reuse the **same logic as your current `login`** after password check: `generateAccessToken`, `generateRefreshToken`, hash refresh token, save on user, return `{ user, accessToken, refreshToken }` (strip password).

This keeps JWT and refresh-token behavior **one place**—ideally extract “issue session for user” from both `login` and `verifyLoginOtp` to avoid duplication.

---

## Step 5 — Controller

**Edit** `src/modules/auth/auth.controller.js`:

- **`requestLoginOtp`**: `await authService.requestLoginOtp(req.body)`, then `ApiRespose.ok` (or `created`) with a short message (“OTP sent”).
- **`verifyLoginOtp`**: mirror `login`: call service, then `res.cookie` for `refreshToken` and `accessToken` like your existing `login`, then `ApiRespose.ok` with `user` + `accessToken`.

Fix any existing typos (e.g. `getMe` using `req` vs `user`) when you touch this file.

---

## Step 6 — Routes

**Edit** `src/modules/auth/auth.routes.js`:

```text
POST /login/otp/request   → validate(RequestLoginOtpDto) → requestLoginOtp
POST /login/otp/verify    → validate(VerifyLoginOtpDto)  → verifyLoginOtp
```

Full paths (with your current mount) will be:

- `POST /api/auth/login/otp/request`
- `POST /api/auth/login/otp/verify`

Import new DTOs and controller methods with `.js` extensions in imports (ESM).

---

## Step 7 — App wiring

No change is **required** in `server.js` if auth is already mounted in `src/app.js` as `/api/auth`. If you add global rate limiting or IP checks for OTP, add that in `app.js` or a new middleware under `src/common/middleware/`.

---

## Security and UX notes

- **Rate limiting**: Protect `/login/otp/request` (per IP and per phone) to reduce abuse; Twilio also enforces limits.
- **Same response time**: For `request`, consider similar response duration whether the user exists or not, if you want to avoid user enumeration (product tradeoff).
- **HTTPS + cookies**: Your `login` sets `secure: true` on cookies—fine in production with HTTPS; for local HTTP you may need `secure: false` in dev (often via `NODE_ENV`).
- **Cost**: Each verification and SMS has a cost on Twilio; monitor usage in the Twilio Console.

---

## Optional: 2FA after password

If the goal is **password first, then SMS OTP**:

1. `POST /login` validates password only and returns a **temporary session id** or marks a short-lived server-side “pending 2FA” state (Redis or signed cookie), **or** use Twilio Verify **after** you know `user.id` and send OTP to `user.phone`.
2. `POST /login/otp/verify` accepts that session + `code`, completes Twilio check, then issues JWT.

Same Twilio helpers and DTOs apply; routing and service state are slightly different.

---

## Quick checklist

- [ ] Twilio Verify Service created; SID in `.env`
- [ ] `npm install twilio`
- [ ] `src/common/config/twilio.js` with Verify create + check
- [ ] `phone` on `auth.model.js` if logging in by phone
- [ ] New DTOs + `auth.service.js` + `auth.controller.js` + `auth.routes.js`
- [ ] Manual test with a **verified** number on a trial account, then production numbers

This completes an OTP login flow aligned with your existing **auth module** and **common** config pattern.
