
num=$1

# bbuy="https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p"
bbuy="https://www.bestbuy.com/site/sony-playstation-5-dualsense-wireless-controller/6430163.p"

for index in $(seq 0 $num)
do
	screen -dm bash -c "./scripts/bestbuy.sh $index \"$bbuy\""
done

# for index in $(seq 0 $num)
# do
# 	screen -dm bash -c "./scripts/target.sh $index \"https://www.target.com/p/playstation-5-console/-/A-81114595\""
# done

# Walmart
# for index in $(seq 0 $num)
# do
# 	screen -dm bash -c "./scripts/target.sh $index \"https://www.target.com/p/playstation-5-console/-/A-81114595\""
# done
