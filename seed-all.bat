@echo off
chcp 65001 > nul
echo ==================================================
echo 🚀 ECOMMERCE MICROSERVICES - SEED DATA RUNNER
echo ==================================================
python "%~dp0src\scripts\seed-all.py"
pause
