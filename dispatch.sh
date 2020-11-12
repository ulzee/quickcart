
source ./urls.sh

# bestbuy 17
# target 15

# stores="bestbuy target walmart newegg adorama kohls"
stores="bestbuy target"

index=0
for store in $stores
do
	tag="$store.$index"
	url_var=$store
	url=${!url_var}
	echo $tag
	echo $url

	pm2 start bot.js --name=$tag -- \
		--store=$store --accountid=$index \
		--url=$url \
		--debug=$debug
done


