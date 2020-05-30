
!function(){
	var VERSION = process.env.npm_package_version,
		LOCATION = process.env.CUSTOM_LOC,
		fRgx = /^rafx\.v(?:[0-9]+\.){3}dev\.js/i,
		lRgx = /^(\s*prt\.version\s*=\s*).*?;/im,
		fs = require('fs'),
		path = require('path'),
		files = fs.readdirSync(LOCATION).filter(fName => fRgx.test(fName)),
		fileBase = files[0],
		file = path.join(LOCATION, fileBase),
		data = fs.readFileSync(file, 'utf8');
	data = data.replace(lRgx,function(m, g1, o, s){return g1 + '"' + VERSION + '";'});
	fs.writeFileSync(file,data);
    fs.renameSync(file,path.join(LOCATION, "rafx.v" + VERSION + ".dev.js"));
}();