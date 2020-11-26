
source ./urls.sh

store=$1
item=$4
sync=$5

for index in $(seq $2 $3)
do
	tag="$store.$item.$index"
	url_var="${store}_${item}"
	url=${!url_var}
	echo ""
	echo "Name : $tag"
	echo "URL  : $url"
	echo "Debug: $debug"
	echo "Sync : $sync"

	pm2 start bot.js --no-autorestart --name=$tag -- \
		--store=$store --accountid=$index \
		--url=$url \
		--item=$item \
		--sync=$sync
done


