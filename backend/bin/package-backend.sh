#!/bin/bash

# Tests backend module

set -e # fail script on any individual command failing

DIR=`dirname "${BASH_SOURCE[0]}"`
# build production backend
cd ${DIR}/..
cd get
npm run package 
cd ..
cd generate
npm run package 