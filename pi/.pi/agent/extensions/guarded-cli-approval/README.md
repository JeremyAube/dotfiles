# guarded-cli-approval

Pi package/extension that asks for approval before running guarded CLIs.

## Guarded by default

- Terraform (`terraform`, `tf`, wrappers containing `terraform`)
- AWS (`aws`, wrappers containing `aws`)
- Azure (`az` as a name segment)
- Heroku (`heroku`, wrappers containing `heroku`)

## Customize

Edit `config.ts` and add another entry to `GUARDED_CLI_FAMILIES`.

```ts
{
  label: "Pulumi",
  patterns: [/pulumi/i],
}
```

Use broad patterns for long names and segment-style patterns for short names:

```ts
/pulumi/i
/(?:^|[-_.])tf(?:$|[-_.])/i
```

## Load it

Local package:

```bash
pi install ./extensions/guarded-cli-approval
```

Or add it to settings:

```json
{
  "packages": ["./extensions/guarded-cli-approval"]
}
```
