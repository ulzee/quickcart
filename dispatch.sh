
num=$1
debug="true"

stores="bestbuy target walmart newegg adorama kohls"

if [[ $debug -eq "true" ]]
then
	bestbuy="https://www.bestbuy.com/site/apple-tv-4k-32gb-black/5901530.p"
	target="https://www.target.com/p/apple-airpods-with-charging-case/-/A-54191097#lnk=sametab"
	walmart="https://www.walmart.com/ip/Apple-AirPods-with-Charging-Case-Latest-Model/604342441"
	newegg="https://www.newegg.com/white-phanteks-eclipse-p360a-atx-mid-tower/p/N82E16811854104"
	adorama="https://www.adorama.com/ctc1000p1ssd.html"
	kohls="https://www.kohls.com/product/prd-3957140/microsoft-xbox-one-wireless-controller-red.jsp"
fi

for store in $stores
do
	for index in $(seq 0 $num)
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
done


