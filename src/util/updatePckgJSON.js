
!function(){
	var VERSION = process.env.npm_package_version,
		LOCATION = process.env.CUSTOM_LOC,
		fs = require('fs'),
		path = require('path'),
		files = fs.readdirSync(LOCATION).filter(fName => fName === "package.json"),
		file = path.join(LOCATION, files[0]);
	fs.readFile(file, 'utf8', function (err,data) {
	  if (err) {
		console.log(err);
		return;
	  }
	  var obj = JSON.parse(data);
	  obj.main = "./dist/rafx.v" + VERSION + ".min.js";
	  obj = JSON.stringify(obj,null,"  ");
	  fs.writeFile(file, obj, 'utf8', function (err) {
		 if (err) {
			console.log(err);
		 }
	  });
	});
}();