# jira-root-cause

Adds a `/jira-rca <TICKET>` command to pi.

After adding or changing the extension, run `/reload` in pi (or restart pi).

## What it does

1. Runs `acli jira workitem view <TICKET> --json`
2. Saves the JSON to a temp file
3. Starts a read-only root cause analysis turn for that ticket
4. Keeps the ticket active for follow-up implementation work
5. Instructs pi to produce a dense, explanatory commit message that links the ticket after the fix is done

## Usage

```bash
/jira-rca ABC-123
```

After the RCA completes, ask pi to fix the issue normally.

When pi finishes the fix for the active ticket, it should include a proposed commit message that:

- references the Jira ticket
- explains the root cause and failure mode
- explains why the change is necessary
- avoids narrating file-by-file code edits unless they matter to the root cause

## Notes

- The RCA turn blocks `edit` and `write` tool calls.
- The RCA turn also blocks obviously mutating shell commands.
- The active ticket context persists in the session so follow-up prompts keep the Jira reference and commit message policy.
- Running `/jira-rca` again replaces the active ticket context with the new ticket.
