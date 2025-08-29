ai() {
    if [[ "$PWD" == ~/Developer/mirego* ]]; then
        CLAUDE_CONFIG_DIR=~/Developer/mirego mise exec node@lts -- command /Users/jeremy/.claude/local/claude "$@"
        # opencode "$@"
    else
        mise exec node@lts -- command /Users/jeremy/.claude/local/claude "$@"
    fi
}
