#!/usr/bin/env bash

echo "Starting Node-RED server..."
nohup bash -c "npm start 2>&1 &" && sleep 5
echo "Checking '/' page..."
response1=$(curl --write-out '%{http_code}' --silent --output /dev/null "http://localhost:1880/")
echo "HTTP Response: $response1"
if [[ $response1 = 200 ]]; then echo "Success"; else echo "Failed" && exit 1; fi
echo "Checking '/health' page..."
response2=$(curl --write-out '%{http_code}' --silent --output /dev/null "http://localhost:1880/health")
echo "HTTP Response: $response2"
if [[ $response2 = 200 ]]; then echo "Success"; else echo "Failed" && exit 1; fi
