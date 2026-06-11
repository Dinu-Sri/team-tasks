# Product blueprint

## Core loop

1. Owner opens the app.
2. Owner picks a company or team.
3. Owner types a task, picks people chips, and presses Enter.
4. Team member opens the app and sees that task in their personal list.
5. Team member marks it done.
6. The task leaves the active list and appears in the monthly archive.
7. Owner sees each person's progress in the dashboard.

## MVP roles

- Owner: create teams, invite people, assign tasks, see progress, view archive.
- Member: see assigned tasks, add their own tasks, mark done, view archive.

## Future backend milestones

1. Authentication
   Add email/password or magic-link auth, then replace the temporary deployment password with real user login.

2. Persistent task storage
   Wire `prisma/schema.prisma` to server actions so task changes save to PostgreSQL.

3. Invitations
   Send invite emails, track pending invites, and accept invitations into a team.

4. Notifications
   Add daily email or WhatsApp-style summaries for due-today tasks.

5. International SaaS layer
   Add billing, organizations, localization, role permissions, audit logs, and export tools.
