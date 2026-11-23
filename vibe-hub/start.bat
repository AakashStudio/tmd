@echo off
title VibeHub Portal
echo Starting VibeHub...
cd /d "%~dp0"
python serve.py
pause
