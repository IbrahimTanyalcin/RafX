
!function(){
	var VERSION = process.env.npm_package_version,
		LOCATION = process.env.CUSTOM_LOC,
		DESTINATION = process.env.CUSTOM_DEST,
		fRgx = /^rafx\.v(?:[0-9]+\.){3}(?:dev|min)\.js/i,
		fs = require('fs'),
		fsPromises = fs.promises,
		refPromise = {v: Promise.resolve()},
		path = require('path'),
		files = fs.readdirSync(LOCATION)
			.forEach(fName => {
				if(fRgx.test(fName)) {
					var source = path.join(LOCATION, fName),
						destination = path.join(DESTINATION, fName);
					refPromise.v = refPromise.v.then(function(){
						return fsPromises.copyFile(source, destination);
					});
				}
			},refPromise);
}();