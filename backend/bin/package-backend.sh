#!/bin/bash

# Tests backend module

set -e # fail script on any individual command failing

DIR=`dirname "${BASH_SOURCE[0]}"`
# build production static website
cd ${DIR}/../generate
npm install
npm run test

cd ${DIR}/../get
npm install
npm run test
