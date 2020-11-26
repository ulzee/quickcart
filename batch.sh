
source ./urls.sh

store=$1
item=$4
sync=$5
manual=$6

for index in $(seq $2 $3)
do
	tag="$store.$item.$index"
	url_var="${store}_${item}"
	url=${!url_var}
	echo ""
	echo "Name  : $tag"
	echo "URL   : $url"
	echo "Debug : $debug"
	echo "Sync  : $sync"
	echo "Manual: $manual"

	pm2 start bot.js --no-autorestart --name=$tag -- \
		--store=$store --accountid=$index \
		--url=$url \
		--item=$item \
		--sync=$sync \
		--manual=$manual
done


