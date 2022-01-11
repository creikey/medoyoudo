@echo off
call npm run build
surge public medoyoudo.surge.sh

echo Success