# Subagent recovery

Each child run saves a Pi session in:

```text
~/.pi/agent/subagent-sessions/run-*/session.jsonl
```

The result includes the session path. Each run directory is private (mode `0700`).
Sessions can contain source code, tool arguments, output, and secrets. They are not
deleted automatically. Remove old run directories when you no longer need them.
If the child cannot start, a session path can be assigned without a session file.

## Failed or cancelled runs

The tool keeps completed messages and reported usage. Its error report includes:

- The provider or process error.
- The last recorded tool action.
- The last non-empty assistant text, marked as partial and unverified.
- The saved session path and a resume command.

Usage from a response interrupted before completion can be missing. File changes
are not rolled back. A successful tool call is not proof that the task is complete.

Before you retry:

1. Inspect the saved session and the current file changes.
2. Check which tests passed and which work is still incomplete.
3. Resume only the remaining work. Do not restart the full task automatically.

Open a saved session with:

```sh
pi --session '/absolute/path/to/session.jsonl'
```

Use the original working directory. Pi restores the saved conversation. Check the
active model, tools, and instructions before you continue. If the provider rejected
a response, inspect the cause before you make another paid request.

On cancellation, the wrapper sends `SIGTERM`. If the child does not exit within
5 seconds, it sends `SIGKILL`. Completed messages stay in the result. A response
that was still streaming can be incomplete or absent.

These changes preserve future runs. They cannot recover child sessions from older
runs that used `--no-session`.

## Tests

From this directory, run:

```sh
node --test tests/recovery.test.mjs
```

The tests use fake child processes, not model requests. They use the installed Pi
runtime dependencies. Set `PI_PACKAGE_DIR` if Pi is not installed with its standard
`dist/bundle/cli.js` layout.

Run `/reload` in Pi to load extension changes.
