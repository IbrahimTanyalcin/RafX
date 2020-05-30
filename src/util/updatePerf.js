
!function(){
	var VERSION = process.env.npm_package_version,
		LOCATION = process.env.CUSTOM_LOC,
		lRgx = /rafx\.v(?:[0-9]+\.){3}(?:dev|min)\.js/i,
		fs = require('fs'),
		path = require('path'),
		files = fs.readdirSync(LOCATION).filter(fName => fName === "rafx.html"),
		fileBase = files[0],
		file = path.join(LOCATION, fileBase),
		data = fs.readFileSync(file, 'utf8');
	data = data.replace(lRgx,function(m, o, s){return "rafx.v" + VERSION + ".dev.js"});
	fs.writeFileSync(file,data);
}();