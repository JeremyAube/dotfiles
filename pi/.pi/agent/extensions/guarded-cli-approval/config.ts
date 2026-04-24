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
];
