#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
echo 'Open http://127.0.0.1:8000'
php -S 127.0.0.1:8000 -t 'ADU Hackathon' backend/router.php
