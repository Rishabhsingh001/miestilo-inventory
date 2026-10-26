# Security, Privacy, and Operational Controls

## 1. Authentication
- Use a maintained authentication library/provider; do not roll a custom password system without a strong reason.
- If credentials are used, hash passwords using a modern password hashing algorithm supported by the chosen library.
- Protect sessions with secure, HTTP-only cookies and appropriate SameSite settings.
- Enforce login rate limits and safe account recovery.
- Disable accounts promptly when staff leave.

## 2. Authorization
- Deny by default.
- Define permissions centrally and test them.
- Enforce authorization in every server route and service, not only by hiding UI buttons.
- Restrict cost price, user management, audit logs, stock adjustment, and exports to authorized roles.
- Never trust a role or user ID submitted by the client.

## 3. Secrets and environment
- Keep `MONGODB_URI`, auth secrets, API keys, and storage credentials server-only.
- Never prefix secrets with `NEXT_PUBLIC_`.
- Never commit `.env.local`.
- Use separate credentials and databases for development, preview, and production.
- Rotate credentials if they are exposed.

## 4. Data validation
- Validate all body, path, and query inputs on the server.
- Use allowlists for enums and sort fields.
- Limit request sizes, page sizes, file sizes, and accepted file types.
- Sanitize rendered user-provided text where needed; avoid unsafe HTML rendering.
- Escape CSV values that could trigger spreadsheet formulas.

## 5. Inventory integrity
- Stock changes must be server-side, audited, and linked to a reference.
- Use database transactions or a documented consistency strategy.
- Use conditional updates and idempotency keys to prevent duplicate stock posting.
- No UI-only stock arithmetic.
- Reconcile balance projections against the ledger.
- Do not allow normal users to edit or delete posted ledger events.

## 6. Privacy and audit
- Collect only business data needed for operations.
- Avoid storing unnecessary personal information.
- Redact sensitive fields from logs and audit snapshots.
- Restrict audit log access.
- Define retention and backup policies with the business owner.
- Protect customer contact details and tax identifiers by role where appropriate.

## 7. Web security
- Use HTTPS in production.
- Configure secure headers and an appropriate Content Security Policy after checking app requirements.
- Protect state-changing requests against CSRF according to the chosen auth/session architecture.
- Use safe redirects and prevent open redirect vulnerabilities.
- Avoid exposing internal stack traces.
- Keep dependencies updated and run dependency/security checks.

## 8. Deployment and backup
- Use separate Vercel environments and environment variables.
- Restrict MongoDB Atlas database user permissions to the required database and actions.
- Configure Atlas network access according to current platform guidance and the selected Vercel plan.
- Enable and test backups appropriate to business risk.
- Document a restore test; a backup that has never been restored is unverified.
- Do not use real customer data in development seed scripts.

## 9. Incident checklist
1. Disable affected account or rotate exposed credential.
2. Preserve relevant logs without exposing secrets.
3. Determine whether stock or order data was altered.
4. Reconcile ledger and balance projections.
5. Restore/correct using audited reversal events, not silent edits.
6. Document the incident and preventive action.
