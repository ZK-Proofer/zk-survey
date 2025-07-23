#!/bin/bash

git pull origin main --force

yarn install --frozen-lockfile
yarn build

pm2 reload ecosystem.config.ts --env production
