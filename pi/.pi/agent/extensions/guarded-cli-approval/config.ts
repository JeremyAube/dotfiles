/**
 * Exact executable and argument words. A final "*" allows zero or more arguments.
 * These rules do not apply to executable name variants or wrapper scripts.
 */
export const ALLOWED_CLI_COMMANDS: string[][] = [
  ["gh", "pr", "view", "*"],
  ["gh", "pr", "list", "*"],
  ["gh", "pr", "diff", "*"],
  ["gh", "run", "view", "*"],
  ["gh", "run", "watch", "*"],
  ["gh", "run", "list", "*"],
  ["az", "boards", "work-item", "show", "*"],
  ["az", "account", "show", "*"],
];

export interface GuardedCliFamily {
  label: string;
  patterns: RegExp[];
}

/**
 * Add new guarded CLIs here.
 *
 * Long names can match anywhere in the executable basename.
 * Short names like tf or az should stay segment-based to avoid false positives.
 * Examples:
 *   /pulumi/i
 *   /(?:^|[-_.])gcloud(?:$|[-_.])/i
 */
export const GUARDED_CLI_FAMILIES: GuardedCliFamily[] = [
  {
    label: "Terraform",
    patterns: [/terraform/i, /(?:^|[-_.])tf(?:$|[-_.])/i],
  },
  {
    label: "AWS",
    patterns: [/aws/i],
  },
  {
    label: "Azure",
    patterns: [/(?:^|[-_.])az(?:$|[-_.])/i],
  },
  {
    label: "Heroku",
    patterns: [/heroku/i],
  },
  {
    label: "ssh",
    patterns: [/ssh/i],
  },
  {
    label: "kamal",
    patterns: [/kamal/i],
  },
  {
    label: "acli",
    patterns: [/(?:^|[-_.])acli(?:$|[-_.])/i],
  },
  {
    label: "GitHub CLI",
    patterns: [/(?:^|[-_.])gh(?:$|[-_.])/i],
  },
];
