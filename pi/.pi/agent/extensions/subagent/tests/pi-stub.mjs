export const CONFIG_DIR_NAME = ".pi";
export const getAgentDir = () => process.env.SUBAGENT_TEST_DIR;
export const getMarkdownTheme = () => ({});
export const formatReadLineRange = () => "";
export const withFileMutationQueue = async (_path, action) => action();
export function parseFrontmatter(text) {
	const [, header, body] = text.split("---");
	const frontmatter = Object.fromEntries(header.trim().split("\n").map((line) => {
		const colon = line.indexOf(":");
		return [line.slice(0, colon), line.slice(colon + 1).trim()];
	}));
	return { frontmatter, body };
}
