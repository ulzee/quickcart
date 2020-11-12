
source ./urls.sh

store=$1
num=$2

for index in $(seq 1 $num)
do
	tag="$store.$index"
	url_var=$store
	url=${!url_var}
	echo ""
	echo "Name : $tag"
	echo "URL  : $url"
	echo "Debug: $debug"

	pm2 start bot.js --name=$tag -- \
		--store=$store --accountid=$index \
		--url=$url \
		--debug=$debug
done


