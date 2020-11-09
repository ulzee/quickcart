
num=$1
debug="true"

# FIXME: add bnh
# stores="bestbuy target walmart newegg adorama kohls"
stores="bestbuy target newegg"

# ps5
# bestbuy="https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p"
# target="https://www.target.com/p/playstation-5-console/-/A-81114595"
# walmart="https://www.walmart.com/ip/PlayStation-5-Console/363472942"
# newegg="https://www.newegg.com/white-phanteks-eclipse-p360a-atx-mid-tower/p/N82E16811854104"
# adorama="https://www.adorama.com/ctc1000p1ssd.html"
# kohls="https://www.kohls.com/product/prd-3957140/microsoft-xbox-one-wireless-controller-red.jsp"

# xsx
bestbuy="https://www.bestbuy.com/site/microsoft-xbox-series-x-1tb-console-black/6428324.p"
target="https://www.target.com/p/playstation-5-console/-/A-81114595"
walmart="https://www.walmart.com/ip/Xbox-Series-S/606518560"
newegg="https://www.newegg.com/p/N82E16868105273"
adorama="https://www.adorama.com/xbrrt00001b.html"
# kohls="https://www.kohls.com/product/prd-3957140/microsoft-xbox-one-wireless-controller-red.jsp"

if [[ $debug -eq "true" ]]
then
	echo "DEBUG MODE"
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


