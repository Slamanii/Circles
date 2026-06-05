#!/bin/bash

read -rsp "Enter Supabase DB connection string: " DB
echo

MIGRATIONS_DIR="$(dirname "$0")/migrations"

run() {
    echo "Running $1..."
    psql "$DB" -f "$MIGRATIONS_DIR/$1" && echo "✓ $1" || echo "✗ $1 failed"
}

run create_users.sql
run create_password_resets.sql
run create_groups.sql
run create_events.sql
run create_stories.sql
run create_subStories.sql
run create_story_tools.sql
run create_followers.sql
run create_messages.sql
run create_collectibles.sql
run create_event_likes.sql
run create_event_save.sql
run create_notifications.sql
run create_treasuryTx.sql

echo "Done."
