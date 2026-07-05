# Team Tasks — Comprehensive Playwright Test Plan

This document covers every feature, user flow, edge case, and missing capability needing coverage for production-grade quality assurance.

## Test Environment

- **Production URL**: `https://todo.clossyan.com`
- **Playwright config**: `playwright.config.ts` (supports `PLAYWRIGHT_BASE_URL` env var)
- **Run command**: `$env:PLAYWRIGHT_BASE_URL="https://todo.clossyan.com"; pnpm exec playwright test`
- **Test credentials**: multiple user accounts with different team roles

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Critical path — must pass before any deploy |
| P1 | Core feature — should pass for release confidence |
| P2 | Nice to have — important but not blocking |

---

## 1) Authentication Flow

| ID | Test | Priority |
|----|------|----------|
| AUTH-01 | Valid signup creates user + team + welcome task | P0 |
| AUTH-02 | Welcome demo task appears in task list after signup | P0 |
| AUTH-03 | Session cookie set with 30-day maxAge after signup | P1 |
| AUTH-04 | Name validation: reject < 2 characters | P2 |
| AUTH-05 | Email validation: reject invalid formats (no `@`, empty) | P2 |
| AUTH-06 | Password validation: reject < 8 characters | P2 |
| AUTH-07 | Confirm password mismatch shows error | P2 |
| AUTH-08 | Duplicate email signup blocked with error | P1 |
| AUTH-09 | Email normalized to lowercase on storage | P2 |
| AUTH-10 | Redirect to home page after successful signup | P0 |
| AUTH-11 | Signup from invite link pre-fills email (`/signup?email=...`) | P1 |
| AUTH-12 | Valid credentials log in successfully | P0 |
| AUTH-13 | Invalid email shows generic error (no enumeration) | P1 |
| AUTH-14 | Wrong password shows generic error | P1 |
| AUTH-15 | Case-insensitive email login | P2 |
| AUTH-16 | Session persists across page navigations and refreshes | P0 |
| AUTH-17 | Redirect to home after login | P0 |
| AUTH-18 | Logout clears session cookie | P0 |
| AUTH-19 | Logout redirects to login page | P1 |
| AUTH-20 | Protected pages redirect to login after logout | P1 |
| AUTH-21 | Back button after logout shows login page | P2 |
| AUTH-22 | Unauthenticated access to `/` redirects to login | P0 |
| AUTH-23 | Unauthenticated access to `/dashboard` redirects to login | P0 |
| AUTH-25 | Session cookie is httpOnly | P2 |
| AUTH-26 | Session cookie has secure flag on HTTPS | P2 |

## 2) Team Management

| ID | Test | Priority |
|----|------|----------|
| TEAM-01 | Create team with valid name (≥ 2 chars) | P0 |
| TEAM-02 | Team name validation: reject < 2 characters | P2 |
| TEAM-03 | Creator becomes OWNER of new team | P0 |
| TEAM-04 | New team appears in team list after creation | P1 |
| TEAM-05 | Multiple teams per user work independently | P1 |
| TEAM-06 | Default features disabled for new team | P2 |
| TEAM-07 | Owner invites registered user → notification appears | P0 |
| TEAM-08 | Owner invites unregistered email → invite record created | P1 |
| TEAM-09 | Invite creates 7-day expiration window | P2 |
| TEAM-10 | Duplicate invite to same email rejected | P1 |
| TEAM-11 | Invite already-team-member blocked | P1 |
| TEAM-12 | Non-owner attempt to invite blocked | P1 |
| TEAM-13 | SMTP configured: email sent to invitee | P2 |
| TEAM-14 | Invite link format is correct and accessible | P1 |
| TEAM-15 | Valid token accepts invite → membership created | P0 |
| TEAM-16 | Membership role matches invite role | P1 |
| TEAM-17 | Expired invite rejected with clear message | P1 |
| TEAM-18 | Wrong email user rejects invite with error | P1 |
| TEAM-19 | Already-accepted member re-accepts (idempotent) | P2 |
| TEAM-20 | Notifications marked read on accept | P2 |
| TEAM-21 | Redirect to dashboard after accept | P1 |
| TEAM-22 | Owner removes member → membership deleted | P0 |
| TEAM-23 | Removed member's task assignments deleted | P1 |
| TEAM-24 | Notification sent to removed member | P1 |
| TEAM-25 | Cannot remove OWNER member | P1 |
| TEAM-26 | Member cannot remove self | P2 |
| TEAM-27 | Non-owner cannot remove members | P1 |
| TEAM-28 | Member leaves team → membership deleted | P0 |
| TEAM-29 | Leaving member's task assignments deleted | P1 |
| TEAM-30 | All owners notified when member leaves | P1 |
| TEAM-31 | Owner cannot leave own team | P1 |

## 3) Task CRUD

| ID | Test | Priority |
|----|------|----------|
| TASK-01 | Create task self-assigned → appears in "My tasks" | P0 |
| TASK-02 | Task due "Today" computed at 17:00 local time | P1 |
| TASK-03 | Task due "Tomorrow" computed correctly | P1 |
| TASK-04 | Task due "Next week" computed correctly | P1 |
| TASK-05 | Task due "No date" has no dueAt | P2 |
| TASK-06 | Priority HIGH task shows important badge | P1 |
| TASK-07 | Priority NORMAL task no badge | P2 |
| TASK-08 | Assign task to other team member (with permission) | P0 |
| TASK-09 | Cannot assign to non-team-member | P1 |
| TASK-10 | Cannot assign other without memberTaskView enabled | P1 |
| TASK-11 | Notification sent when assigning to other user | P1 |
| TASK-12 | Realtime event fires for assignor and assignee | P1 |
| TASK-13 | Owner creates task with multiple assignees | P0 |
| TASK-14 | Non-owner blocked from creating team task | P1 |
| TASK-15 | All valid assignees get task in their list | P0 |
| TASK-16 | Invalid assignees silently filtered | P2 |
| TASK-17 | All assignees except creator get notification | P1 |
| TASK-18 | Realtime event fires for all assignees | P1 |
| TASK-19 | Complete task marks status DONE | P0 |
| TASK-20 | Completed task moves out of active task list | P0 |
| TASK-21 | Completed task appears in archive | P1 |
| TASK-22 | Task creator notified on completion | P1 |
| TASK-23 | Cannot complete task not assigned to user | P1 |
| TASK-25 | Reopen task marks status OPEN | P0 |
| TASK-26 | Reopened task appears back in active list | P1 |
| TASK-29 | Realtime event fires on reopen | P1 |
| TASK-30 | Click task opens detail panel | P0 |
| TASK-31 | Close panel removes from view | P1 |
| TASK-32 | URL updates with `?task=<id>` on open | P2 |
| TASK-33 | URL cleans on close | P2 |
| TASK-34 | Direct URL with task id opens panel on load | P1 |

## 4) Comments & Discussions

| ID | Test | Priority |
|----|------|----------|
| COMM-01 | Add comment to task → appears in task detail | P0 |
| COMM-02 | Comment body validation: empty rejected | P1 |
| COMM-03 | Comment body validation: > 2000 chars rejected | P1 |
| COMM-04 | `@all` mention includes all team members | P1 |
| COMM-05 | Individual `@mention` adds specific user | P1 |
| COMM-06 | `@mention` of non-member ignored | P2 |
| COMM-07 | Comment receipts created for all participants | P1 |
| COMM-08 | `requiresAttention` flag set for mentioned users | P2 |
| COMM-09 | Comments disabled feature gate blocks comment | P1 |
| COMM-10 | User who left team since page load blocked | P2 |
| COMM-11 | Mark read clears unread indicators | P1 |
| COMM-12 | Already-read comments unchanged | P2 |
| COMM-13 | Comment authors receive realtime event | P2 |
| COMM-14 | Discussions page lists recent comments | P1 |
| COMM-15 | Shows author, task title, and excerpt | P2 |
| COMM-16 | Redirects to features page if no team has comments enabled | P1 |

## 5) File Attachments

| ID | Test | Priority |
|----|------|----------|
| FILE-01 | Upload valid file (.pdf, .png, .jpg, .txt, .csv) | P0 |
| FILE-02 | File size limit enforced (5-25 MB per team setting) | P1 |
| FILE-03 | Invalid extension rejected | P1 |
| FILE-04 | Magic bytes validation: .exe renamed to .pdf blocked | P1 |
| FILE-05 | Magic bytes validation: image passed as .png accepted | P2 |
| FILE-06 | Attachments disabled feature gate blocks upload | P1 |
| FILE-07 | Notification sent to task team on upload | P1 |
| FILE-08 | Realtime event fires on upload | P1 |
| FILE-09 | Download returns correct MIME type | P1 |
| FILE-10 | Preview param works for images (`?preview=1`) | P2 |
| FILE-11 | Non-team-member blocked from download | P1 |
| FILE-12 | Deleted or missing file returns 404 | P2 |
| FILE-13 | Uploader can delete own file | P0 |
| FILE-14 | Team owner can delete any file | P1 |
| FILE-15 | Non-owner/non-uploader blocked | P1 |
| FILE-16 | File removed from disk and DB | P2 |
| FILE-17 | Files page lists team attachments (newest first) | P1 |
| FILE-18 | Redirects to features page if no team has attachments enabled | P1 |

## 6) Notifications

| ID | Test | Priority |
|----|------|----------|
| NOTIF-01 | Task assignment notification appears | P0 |
| NOTIF-02 | Task completion notification sent to creator | P1 |
| NOTIF-03 | Invite notification appears for registered user | P1 |
| NOTIF-08 | Feature change notification to team members | P2 |
| NOTIF-09 | Mark all notifications read clears counter | P0 |
| NOTIF-10 | Notification bell shows correct unread count | P0 |
| NOTIF-11 | Notification dropdown shows recent items | P1 |
| NOTIF-12 | Due/overdue tasks appear as live notifications | P1 |
| NOTIF-13 | Deduplication prevents duplicate notification display | P2 |

## 7) Realtime Updates

| ID | Test | Priority |
|----|------|----------|
| RT-01 | SSE connection established on authenticated page | P1 |
| RT-02 | Task creation event received by team members | P1 |
| RT-03 | Task completion event received by assignees | P1 |
| RT-04 | Invite accepted event received by inviter | P1 |
| RT-05 | Comment added event received by task participants | P2 |
| RT-06 | Attachment uploaded event received by team | P2 |
| RT-07 | Heartbeat keeps connection alive | P2 |
| RT-08 | Connection closes on page unload | P2 |

## 8) Onboarding

| ID | Test | Priority |
|----|------|----------|
| ONB-01 | New user sees personal onboarding tour on first visit | P0 |
| ONB-02 | Tour steps: Welcome → Add Task → Task List → Notifications | P1 |
| ONB-03 | "Done" marks tour complete; tour does not reappear | P0 |
| ONB-04 | Completed tour not shown on subsequent logins | P0 |
| ONB-05 | Completed tour not shown on different device (DB-backed) | P1 |
| ONB-06 | "Add Task" step opens the add-task form when clicked | P1 |
| ONB-07 | User sees team tour on first dashboard visit | P0 |
| ONB-08 | Tour steps include workspace, board, analytics, features | P1 |
| ONB-09 | "Done" marks team tour complete | P0 |
| ONB-10 | Completed team tour not shown on subsequent visits | P0 |

## 9) Theme / Dark Mode

| ID | Test | Priority |
|----|------|----------|
| THEME-01 | System dark mode: page renders dark on first load (no flash) | P0 |
| THEME-02 | Saved theme="dark": page renders dark on reload (no flash) | P0 |
| THEME-03 | Saved theme="light": page renders light on reload | P0 |
| THEME-04 | Toggle theme button switches dark ↔ light | P1 |
| THEME-05 | Theme persists across page navigations | P1 |
| THEME-06 | Theme persists across browser sessions (localStorage) | P2 |
| THEME-07 | System theme change reflects when no explicit theme saved | P2 |

## 10) Analytics

| ID | Test | Priority |
|----|------|----------|
| ANAL-01 | Total team count correct | P1 |
| ANAL-02 | Total open/done task counts correct | P1 |
| ANAL-03 | Per-team member workload bars correct | P2 |
| ANAL-04 | Multiple teams display independently | P2 |

## 11) Feature Settings

| ID | Test | Priority |
|----|------|----------|
| FEAT-01 | Owner enables comments → discussions page accessible | P0 |
| FEAT-02 | Owner disables comments → discussions page redirects | P1 |
| FEAT-03 | Owner enables attachments → file upload works | P1 |
| FEAT-04 | Owner disables attachments → file upload blocked | P1 |
| FEAT-05 | Attachment limit adjustment (5-25 MB) enforced | P2 |
| FEAT-06 | Member task view toggle enables assigning to others | P1 |
| FEAT-07 | Non-owner blocked from changing features | P1 |
| FEAT-08 | Team members notified on feature changes | P2 |

## 12) Super Admin

| ID | Test | Priority |
|----|------|----------|
| ADMIN-01 | Super admin dashboard accessible only to configured email | P0 |
| ADMIN-02 | Non-admin users get 404 on admin route | P0 |
| ADMIN-03 | Admin sees list of all users | P0 |
| ADMIN-04 | Admin can suspend a user account | P0 |
| ADMIN-05 | Suspended user cannot login | P0 |
| ADMIN-06 | Admin can delete a user account | P0 |
| ADMIN-07 | Deleted user's tasks, comments, files, memberships all removed | P0 |
| ADMIN-08 | Deleted user's uploaded files removed from disk | P0 |
| ADMIN-09 | Admin can view user details (teams, tasks count, last active) | P1 |
| ADMIN-10 | Admin operations are logged (ProductEvent) | P2 |

## 13) Cross-Cutting

| ID | Test | Priority |
|----|------|----------|
| UX-01 | Mobile layout stacks vertically, no overflow | P1 |
| UX-02 | Desktop layout with full sidebars | P1 |
| UX-03 | Add task form responsive on all sizes | P1 |
| UX-04 | Task detail panel works on mobile | P1 |
| UX-05 | Onboarding cards fit on small screens | P1 |
| ERR-01 | Network failure during form submission shows error | P2 |
| ERR-02 | Server errors show user-friendly message | P2 |
| ERR-03 | Invalid data in forms shows field-level errors | P1 |
| ERR-04 | Session expiry during action → redirect to login | P2 |

## 14) Missing Capabilities (Future)

| ID | Missing Feature |
|----|-----------------|
| GAP-01 | Edit task title after creation |
| GAP-02 | Change task due date |
| GAP-03 | Reassign task to different user |
| GAP-04 | Delete task entirely |
| GAP-05 | Bulk task operations |
| GAP-06 | Task search/filter |
| GAP-07 | Task tags or categories |
| GAP-08 | Transfer team ownership |
| GAP-09 | Team rename / delete |
| GAP-10 | Password reset flow |
| GAP-11 | Account deletion (self-service) |
| GAP-12 | Edit/delete comments |
| GAP-13 | @mention autocomplete |
| GAP-14 | Time-based analytics charts |
| GAP-15 | Export reports (CSV/PDF) |
| GAP-16 | Undo after task completion |
| GAP-17 | Loading skeletons / spinners |
| GAP-18 | Keyboard shortcuts |
| GAP-19 | Rate limiting on actions |
| GAP-20 | Confirmation dialogs for destructive actions |
