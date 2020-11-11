
source ./urls.sh

# stores="bestbuy target walmart newegg adorama kohls"
stores="walmart"

index=0
for store in $stores
do
	tag="$store.$index"
	url_var=$store
	url=${!url_var}
	echo $tag
	echo $url

	pm2 start bot.js --no-autorestart --name=$tag -- \
		--store=$store --accountid=$index \
		--url=$url \
		--debug=$debug
done


