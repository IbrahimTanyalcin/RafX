
!function(){
	var VERSION = process.env.npm_package_version,
		LOCATION = process.env.CUSTOM_LOC,
		lRgx = /rafx\.v(?:[0-9]+\.){3}(dev|min)\.js/gi,
		jsdelivrRgx = /rafx@(?:[0-9]+\.){2}[0-9]+/gi,
		lRgxDev = /rafx\.v(?:[0-9]+\.){3}dev\.js/i,
		linkRgx = /\[\\?<(.+?)\\?>\]\s*?\((https:[^#)]*?)(?:#L[0-9]+\-L[0-9]+)?\)/gi,
		fs = require('fs'),
		path = require('path'),
		files = fs.readdirSync(LOCATION).filter(fName => fName.toLowerCase() === "readme.md"),
		fileBase = files[0],
		file = path.join(LOCATION, fileBase),
		data = fs.readFileSync(file, 'utf8'),
		fileDist = path
			.join(
				"./dist",
				fs.readdirSync("./dist")
					.filter(fName => lRgxDev.test(fName))[0]
			),
		dataDistLines = fs.readFileSync(fileDist, 'utf8').split(/\n/),
		getLines = function(search){
			for(
				var i = 0,
					j = 0,
					line = null,
					rgxStart = new RegExp("^(\\s*?)" + search + "[^A-Z]+", "i"),
					rgxEnd = null,
					l = dataDistLines.length,
					result = ""; 
				i < l;
				++i
			){
				line = dataDistLines[i];
				if(rgxStart.test(line)){
					result += "#L" + (i + 1) + "-";
					rgxEnd = new RegExp("^" + line.match(rgxStart)[1] + "\\}", "i");
					for (j = i + 1; j < l; ++j) {
						line = dataDistLines[j];
						if (rgxEnd.test(line)) {
							result += "L" + (j + 1);
							break;
						}
					}
					break;
				}
			}
			return result;
		};
	data = data.replace(lRgx,function(m, g1, o, s){return "rafx.v" + VERSION + "." + g1 + ".js"})
	.replace(jsdelivrRgx,function(m, o, s){return "rafx@" + VERSION})
	.replace(linkRgx,function(m, search, link, o, s){
		/*
			search === prt.async
			link === https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v1.1.1.dev.js
		*/
		var hash = getLines(search);
		return "[\\<" + search + "\\>](" + link + hash + ")";
	});
	fs.writeFileSync(file,data);
}();