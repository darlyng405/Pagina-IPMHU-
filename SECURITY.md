# Security Policy

## Supported Versions

Only the current production version of SIA-IPMHU receives security updates.

| Version | Supported |
|---|---|
| v1.2.x (current) | ✅ |
| v1.1.x and below | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public GitHub issue.**

Report it privately by emailing:

**mateodarlyng5@gmail.com**

Include in your report:
- A clear description of the vulnerability
- Steps to reproduce it
- Potential impact
- If possible, a suggested fix

You can expect a response within **72 hours**. We will keep you informed throughout the process and credit you in the fix if you wish.

---

## Security Measures in Place

### Authentication
- All protected routes require a signed JWT token (8h expiry)
- The user ID is always extracted from the token — never trusted from the request body
- Login is rate-limited to **5 attempts per IP every 15 minutes**

### Authorization
- Every route validates that the authenticated user has the required role
- Docentes can only write to courses assigned to them — cross-course writes are rejected with 403
- Student existence and course membership are verified before any INSERT

### Input Validation
- Note values are validated to be within `[0, maximum]` range
- Text fields are capped at 500 characters on both frontend and backend
- Date fields are validated before database writes

### Frontend Security
- All data from the backend is HTML-escaped before being injected into the DOM (XSS prevention)
- No sensitive data is stored in `localStorage` or `sessionStorage` — session lives in memory only
- CORS is restricted to the production GitHub Pages origin and localhost

### HTTP Security
- Helmet.js is applied globally on the backend, setting secure HTTP headers
- HTTPS is enforced by both GitHub Pages (frontend) and Render.com (backend)

---

## Known Limitations

The following are acknowledged limitations, not active vulnerabilities:

- **No token revocation** — JWTs cannot be invalidated before expiry. Logout is client-side only. A compromised token remains valid for up to 8 hours.
- **Render.com cold starts** — The backend may be temporarily unresponsive after inactivity. This is an infrastructure limitation, not a security issue.
- **No 2FA** — Multi-factor authentication is not implemented in the current version.

---

## Out of Scope

The following are not considered security vulnerabilities for this project:

- Bugs that require physical access to a logged-in device
- Issues in third-party services (Supabase, Render.com, GitHub Pages)
- Denial of service via legitimate high-volume usage
- Self-XSS (injecting scripts into your own session)

---

*This policy applies to the SIA-IPMHU frontend repository. For backend-specific concerns, the same contact applies.*
