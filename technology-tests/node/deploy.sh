git pull
killall node
export NODE_PATH=`pwd`

# running on port 8000
cd 03SynchronizedCircles
nohup node app.js &
cd ../

# running on port 8080
cd 05ASHAttempt_02
nohup node app.js &
cd ../

# running on port 8002
cd 06ASHAttempt_03
nohup node app.js &
cd ../

echo Updated servers running!
