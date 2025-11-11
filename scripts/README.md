Ably USGS Publisher

This script polls the USGS GeoJSON API for earthquakes within a Myanmar bounding box and publishes new events to an Ably channel.

Quick start

1. Install dependencies (if not already installed in the repo):

   npm install ably

2. Run the publisher (PowerShell / bash):

   # Linux/macOS/WSL / PowerShell (example)
   $env:ABLY_API_KEY = "your.ably.rest.key"; node scripts/ably-publisher.js

Environment variables

- ABLY_API_KEY (required): your Ably REST API key (keep secret)
- ABLY_CHANNEL (optional): channel name, default: `earthquakes-myanmar`
- POLL_INTERVAL_MS (optional): poll interval in ms, default: 30000 (30s)
- LOOKBACK_DAYS (optional): how many days to look back on initial fetch, default: 7

Notes

- The script keeps an in-memory set of seen event ids to avoid re-publishing duplicates. If the script restarts the seen set is cleared.
- For production, run this script on a server (or as a small serverless cron job) with your Ably secret key.
- Clients should not use the REST key. Use Ably token auth or a client key (`NEXT_PUBLIC_ABLY_KEY`) to subscribe from browsers.
