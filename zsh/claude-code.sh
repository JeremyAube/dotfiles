claude() {
    if [[ "$PWD" == ~/Developer/mirego* ]]; then
        CLAUDE_CONFIG_DIR=~/Developer/mirego command claude "$@"
    else
        command claude "$@"
    fi
}
