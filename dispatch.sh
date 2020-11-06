
num=$1
debug="true"

# bbuy="https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p"
bbuy="https://www.bestbuy.com/site/sony-playstation-5-dualsense-wireless-controller/6430163.p"

# target="https://www.target.com/p/playstation-5-console/-/A-81114595"
target="https://www.target.com/p/dualsense-wireless-controller-for-playstation-5/-/A-81114477"

walmart="https://www.walmart.com/ip/Apple-AirPods-with-Charging-Case-Latest-Model/604342441"

# for index in $(seq 0 $num)
# do
# 	screen -dm bash -c "./scripts/bestbuy.sh $index \"$bbuy\""
# done

# for index in $(seq 0 $num)
# do
# 	screen -dm bash -c "./scripts/target.sh $index \"$target\" $debug"
# done

for index in $(seq 0 $num)
do
	echo "walmart.$index"
	pm2 start bot.js --no-autorestart --name="walmart.$index" -- \
		--store=walmart --accountid=$index \
		--url=$walmart \
		--debug=$debug
done
