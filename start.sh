#!/bin/sh
set -e

# Start redis in background
redis-server --daemonize yes

# Start server in background
node server.js &

# Start worker in foreground (keeps container alive)
node worker.js &

node workercpp.js

