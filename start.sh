
redis-server --daemonize yes

node src/server.js &
node worker.js &
node workercpp.js &

wait
