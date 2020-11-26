
source ./urls.sh

store=$1
item=$2
index=0
sync=$3

tag="$store.$item.$index"
url_var="${store}_${item}"
url=${!url_var}
echo $tag
echo $url_var
echo $url
echo $item # target
echo $sync
# echo "Debug: $debug"

pm2 start bot.js --no-autorestart --name=$tag -- \
	--store=$store --accountid=$index \
	--url=$url \
	--item=$item \
	--sync=$sync
