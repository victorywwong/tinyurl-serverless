#!/bin/bash

# Tests backend module

set -e # fail script on any individual command failing

DIR=`dirname "${BASH_SOURCE[0]}"`
# build production backend
cd ${DIR}/..
find ./* -maxdepth 1 -iname 'package.json' -not -path '*/node_modules/*' -execdir npm run package \; ; 
