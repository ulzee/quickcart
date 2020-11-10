
module.exports= {
	// visor: '164.67.232.193:8000',
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
		wd: 400, hd: 400,
		col: {
			bestbuy: 0,
			target: 1,
			walmart: 2,
			newegg: 3,
			adorama: 4,
			kohls: 5,
		}
	},
};
