// @ts-nocheck
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Override provider baseUrl values from environment variables.
 *
 * models.json baseUrl fields do not support $ENV_VAR interpolation (only
 * apiKey and headers do). This extension fills that gap: when
 * <PROVIDER>_BASE_URL is set, it overrides the baseUrl for every model of
 * that provider.
 */

const OVERRIDES: Record<string, string | undefined> = {
  forra: process.env.FORRA_BASE_URL,
  gilfoyle: process.env.GILFOYLE_BASE_URL,
};

export default function(pi: ExtensionAPI) {
  for (const [provider, baseUrl] of Object.entries(OVERRIDES)) {
    if (!baseUrl) continue;
    pi.registerProvider(provider, { baseUrl });
  }
}
