# Optional Collaboration UX Architecture

## Product intent

Team Tasks succeeds because the default experience is a single, obvious list. Comments and files are valuable only when work needs clarification or supporting material, so they are optional capabilities owned by each team instead of permanent controls on every task.

The design follows progressive disclosure: primary work stays visible; advanced collaboration appears only after an owner enables it and only at the moment a person opens a task.

## Research translated into rules

### Progressive disclosure and navigation

Apple's Human Interface Guidelines recommend sidebars for stable top-level destinations and clear selection state. The dashboard therefore owns administration and history while the home page remains the execution surface.

- Desktop: persistent left sidebar and a broad content area.
- Mobile: the same destinations become a compact horizontal scroller so content never sits beside an unusably narrow rail.
- `Files` and `Discussions` are capability-driven destinations. They are absent until at least one joined team enables the corresponding feature.

### Mention interaction

The W3C ARIA combobox pattern defines a text input with a filtered list popup, arrow-key movement, Enter selection, and Escape dismissal. The comment composer follows this model.

- Typing `@` opens team-member suggestions immediately.
- Additional characters filter by name or email.
- Arrow keys move through results; Enter inserts; Escape closes.
- Only selected, still-present mentions are submitted.
- The server verifies every mentioned person is still a member of the task's team.

### Files and security

OWASP recommends allowlisting types, validating size and authorization, generating server-side filenames, storing files outside the public web root, and protecting retrieval with access checks.

- Files are stored in a private persistent volume, never in `/public`.
- Downloads use an authenticated route and require current team membership.
- Stored names are random; original names exist only as metadata and download labels.
- Executables, scripts, archives, and unknown content types are rejected.
- The per-file limit is 5 MB by default and owner-configurable from 5 to 25 MB.
- Upload authorization, feature status, and size are checked again on the server.

## User flows

### Enable a capability

1. Open profile, then Dashboard.
2. Choose Features.
3. Select a team owned by the user.
4. Enable Comments and mentions and/or File attachments.
5. If files are enabled, choose a 5-25 MB per-file limit.
6. Save once. Team members receive a quiet notification and realtime refresh.

### Clarify a task

1. A small discussion indicator appears only for teams with comments enabled.
2. Open the task panel and write a comment.
3. Type `@` and choose a teammate.
4. Posting creates the comment, a notification, and a linked reply task for that teammate.
5. The reply task is a normal task and can be completed without introducing a second task model.

### Attach supporting work

1. Open the same task panel.
2. Choose Add file and select one file.
3. The interface checks the configured limit before uploading.
4. The server validates and stores the file, then refreshes every relevant member in realtime.
5. Files remain visible in the task panel and in Dashboard > Files.

### Membership exits

- Owners can remove members but cannot remove themselves through the member control.
- Members can leave a team from Teams Board.
- Open assignments for the departing member are removed.
- Both actions generate notifications and realtime updates.

## Simplicity safeguards

- No comments or files on the task creation form.
- No empty collaboration toolbar when both features are off.
- One task panel contains both optional features; there are no nested cards or separate modal chains.
- Counts communicate activity without adding explanatory text.
- Destructive membership actions require explicit confirmation.
- Feature switches use plain language and show their team scope next to the control.

## Future extension model

New optional modules should follow the same contract:

1. Team-scoped setting with an off-by-default migration.
2. No home-screen footprint while disabled.
3. A small contextual affordance when enabled.
4. A dashboard destination only when the module needs management or history.
5. Server-side authorization independent of UI visibility.
6. Notification and realtime events for changes that affect another person.

## Sources

- Apple Human Interface Guidelines, Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars
- W3C WAI-ARIA Authoring Practices, Combobox Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Slack Help, Mentions: https://slack.com/help/articles/205240127-Use-mentions-in-Slack
