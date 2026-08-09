import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Make OpenCode commands available as Pi prompts.
 *
 * Pi discovers `.agents/skills` natively, so this extension only needs to
 * contribute the `.opencode/commands` directory. Claude-managed files are
 * intentionally ignored.
 */
export default function (pi: ExtensionAPI) {
	pi.on("resources_discover", (event) => {
		const commandsDir = join(event.cwd, ".opencode", "commands");

		return {
			promptPaths: existsSync(commandsDir) ? [commandsDir] : [],
		};
	});
}
