
module.exports= {
	// visor: '164.67.232.193:8000',
	exe:'/Applications/Google Chrome.app/Contents/MacOS/Google\ Chrome',
	visor: 'localhost:8000',
	key: 'endgame',

	stealthMode: {
		adorama: true,
		kohls: true,
		bnh: true,
	},
	proxyChoice: {
		bestbuy: 'lumi-excl.txt',
		target: 'lumi-excl.txt',
		walmart: 'lumi-excl.txt',
		// adorama: 'lumi-excl.txt',
	},
	monitor: {
		w: 1024, h: 800 ,
		wd: 400, hd: 100,
		col: {
			bestbuy: 0,
			target: 1,
			walmart: 2,
			newegg: 3,
			adorama: 4,
			kohls: 5,
		}
	},
	userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36',
	msMode: false,
};
