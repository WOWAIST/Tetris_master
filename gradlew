#!/bin/sh

cd "$(dirname "$0")/backend" || exit 1
exec ./gradlew "$@"
