#!/bin/bash

source ./urls.sh

store=$1
item=$2
index=0
sync=""

tag="watch.$store.$item"
url_var="${store}_${item}"
url=${!url_var}
echo $tag
echo $url_var
echo $url
echo $item # target
echo $sync
# echo "Debug: $debug"

pm2 start watcher.js --watch --name=$tag -- \
	--store=$store --instance=$index \
	--url=$url \
	--item=$item \
	--sync=$sync
