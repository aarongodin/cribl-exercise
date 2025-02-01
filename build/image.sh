#!/usr/bin/env bash

rm -rf ./dist
npm run build
docker build . -t cribl-exercise
