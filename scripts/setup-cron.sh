#!/bin/bash
# Setup daily wine hunt cron job

echo "Setting up daily wine hunt cron job..."

# Create the cron entry
CRON_LINE="0 5 * * * /usr/bin/node /data/workspace/scripts/wine-hunt-v2.mjs >> /data/workspace/logs/cron-output.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -F "$CRON_LINE") || {
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo "✅ Cron job added: Daily at 5:00 AM"
}

echo "Current crontab:"
crontab -l | grep wine-hunt || echo "  (none found)"

