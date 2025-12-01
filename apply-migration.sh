#!/bin/bash

# Script to apply Supabase migrations
# Usage: ./apply-migration.sh

echo "Applying Supabase migration..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it from: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if we're linked to a project
if supabase status &> /dev/null; then
    echo "Applying migration to local Supabase instance..."
    supabase db reset
else
    echo "No local Supabase instance found."
    echo "To link to a cloud project, run:"
    echo "  supabase link --project-ref <your-project-ref>"
    echo ""
    echo "Then apply migrations with:"
    echo "  supabase db push"
    exit 1
fi

echo "Migration applied successfully!"


