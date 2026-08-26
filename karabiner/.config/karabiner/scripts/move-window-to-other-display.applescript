tell application "System Events"
    set frontmostProcess to first application process whose frontmost is true

    tell frontmostProcess
        try
            set windowMenu to menu 1 of menu bar item "Window" of menu bar 1
            set moveMenuItems to menu items of windowMenu whose name starts with "Move to "

            if (count of moveMenuItems) > 0 then
                set moveMenuItem to item 1 of moveMenuItems
                if enabled of moveMenuItem then click moveMenuItem
            end if
        end try
    end tell
end tell
