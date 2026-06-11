# UX research notes

## Target users

The product is for small businesses where the owner or team leader assigns work verbally, in chat, or in a notebook. The user may not know project-management vocabulary, and the tool must feel closer to a daily checklist than a kanban system.

## UX principles applied

1. Keep the main screen as the product.
   The first viewport is the actual task list, quick-add input, team selector, and progress view. There is no marketing landing page because the user needs utility immediately.

2. Use progressive disclosure.
   Common actions stay visible: add, assign, mark done, switch team, search. Less common actions, like changing people on an existing task, open only when the user asks for them.

3. Prefer recognition over recall.
   People are shown as named chips and initials, teams are shown as company names, due dates use plain labels, and status is visible without asking the user to remember what was assigned.

4. Match real-world language.
   The interface uses "Company or team", "People", "Today list", "Done", and "Monthly archive" instead of issue-tracker terms.

5. Make completion rewarding but quiet.
   Marking done instantly removes the task from the active list and places it into a month box. This makes the daily list lighter and gives the owner a visible record.

6. Reduce setup friction.
   The quick-add form remembers the last selected team, people, date, and priority. This supports owners who assign multiple similar tasks in a row.

7. Keep tap targets comfortable.
   Primary controls use rounded 40-48px heights so they work on phones, tablets, and counter-top laptops.

## Product decisions

- No kanban columns in the core workflow.
  The core user story is "what should I do today?", not "what stage is this card in?" A list is faster and more familiar.

- Teams behave like folders.
  One user can own many companies or teams. Switching teams filters the same one-screen experience instead of sending users into a new product area.

- Owner dashboard is secondary but always nearby.
  A right-side dashboard gives progress by person without forcing the owner into a report screen.

- Archive is automatic.
  Users should not learn a second filing workflow. Completion is the archive trigger.

- Invite by email stays visible.
  Small teams grow by adding real people. The invite action belongs in the header and daily memory panel.

## Sources used

- Nielsen Norman Group, "Progressive Disclosure": https://www.nngroup.com/articles/progressive-disclosure/
- Nielsen Norman Group, "10 Usability Heuristics for User Interface Design": https://www.nngroup.com/articles/ten-usability-heuristics/
- Apple Developer, "UI Design Dos and Don'ts": https://developer.apple.com/design/tips/
