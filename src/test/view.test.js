describe('Testing ifInView/ifNotInView clauses', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('ifInView - set a red div in the middle of the page, and start counting '
		+ 'the amount of times that it is in viewport and not', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var doc = document,
					body = doc.body,
					div = body.appendChild(doc.createElement("div")),
					obj = {i:0,j:0};
				body.style.height = "10000px";
				div
				.setAttribute(
					"style",
					"display:block;"
					+ "position:absolute;"
					+ "top:100px;"
					+ "left:0;"
					+ "right:0;"
					+ "margin:auto;"
					+ "width:100px;"
					+ "height:100px;"
					+ "background-color:Red;"
				);
				
				rafx
				.async()
				.recurse(
					function(v,o){
						var retVal = {value:obj,done:false};
						++o.i;
						rafx.ifInView(div,1)
							.then(function(){
								++o.j;
								if(o.j === 25) {
									document.body.scrollTop = 3000;
									document.documentElement.scrollTop = 3000;
								}
								retVal.done = true;
							}).catch(function(e){
								retVal.done = true;
							});
						return retVal;
					},
					obj
				)
				.until(function(v,o){
					return o.i >= 50;
				})
				.then(function(v){
					resolve([v.i,v.j]);
				});
          }); 
        });
		expect(result[0]).toEqual(50);
		expect(result[1]).toEqual(25);
    });
	
	test('ifInView - test the second "framesToKeep" argument', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				//reset the scrollTop from previous test
				document.body.scrollTop = 0;
				document.documentElement.scrollTop = 0;
			  
				var doc = document,
					body = doc.body,
					div = body.appendChild(doc.createElement("div")),
					obj = {i:0,j:0};
				body.style.height = "10000px";
				div
				.setAttribute(
					"style",
					"display:block;"
					+ "position:absolute;"
					+ "top:100px;"
					+ "left:0;"
					+ "right:0;"
					+ "margin:auto;"
					+ "width:100px;"
					+ "height:100px;"
					+ "background-color:Red;"
				);
				
				rafx
				.async()
				.recurse(
					function(v,o){
						var retVal = {value:obj,done:false};
						++o.i;
						rafx.ifInView(div,20)
							.then(function(){
								++o.j;
								if(o.j === 25) {
									document.body.scrollTop = 3000;
									document.documentElement.scrollTop = 3000;
								}
								retVal.done = true;
							}).catch(function(e){
								retVal.done = true;
							});
						return retVal;
					},
					obj
				)
				.until(function(v,o){
					return o.i >= 50;
				})
				.then(function(v){
					resolve([v.i,v.j]);
				});
          }); 
        });
		expect(result[0]).toEqual(50);
		expect(result[1]).toBeGreaterThan(25);
    });
	
	test('ifNotInView - set a red div in the middle of the page, and start counting '
		+ 'the amount of times that it is in viewport and not', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				//reset the scrollTop from previous test
				document.body.scrollTop = 0;
				document.documentElement.scrollTop = 0;
				
				var doc = document,
					body = doc.body,
					div = body.appendChild(doc.createElement("div")),
					obj = {i:0,j:0};
				body.style.height = "10000px";
				div
				.setAttribute(
					"style",
					"display:block;"
					+ "position:absolute;"
					+ "top:100px;"
					+ "left:0;"
					+ "right:0;"
					+ "margin:auto;"
					+ "width:100px;"
					+ "height:100px;"
					+ "background-color:Red;"
				);
				
				rafx
				.async()
				.recurse(
					function(v,o){
						var retVal = {value:obj,done:false};
						++o.i;
						rafx.ifNotInView(div,1)
							.then(function(){
								++o.j;
								retVal.done = true;
							}).catch(function(e){
								if(o.i === 25){
									document.body.scrollTop = 3000;
									document.documentElement.scrollTop = 3000;
								}
								retVal.done = true;
							});
						return retVal;
					},
					obj
				)
				.until(function(v,o){
					return o.i >= 50;
				})
				.then(function(v){
					resolve([v.i,v.j]);
				});
          }); 
        });
		expect(result[0]).toEqual(50);
		expect(result[1]).toEqual(25);
    });
	
	test('ifNotInView - test the second "framesToKeep" argument', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				//reset the scrollTop from previous test
				document.body.scrollTop = 0;
				document.documentElement.scrollTop = 0;
				
				var doc = document,
					body = doc.body,
					div = body.appendChild(doc.createElement("div")),
					obj = {i:0,j:0};
				body.style.height = "10000px";
				div
				.setAttribute(
					"style",
					"display:block;"
					+ "position:absolute;"
					+ "top:100px;"
					+ "left:0;"
					+ "right:0;"
					+ "margin:auto;"
					+ "width:100px;"
					+ "height:100px;"
					+ "background-color:Red;"
				);
				
				rafx
				.async()
				.recurse(
					function(v,o){
						var retVal = {value:obj,done:false};
						++o.i;
						rafx.ifNotInView(div,20)
							.then(function(){
								++o.j;
								retVal.done = true;
							}).catch(function(e){
								if(o.i === 25){
									document.body.scrollTop = 3000;
									document.documentElement.scrollTop = 3000;
								}
								retVal.done = true;
							});
						return retVal;
					},
					obj
				)
				.until(function(v,o){
					return o.i >= 50;
				})
				.then(function(v){
					resolve([v.i,v.j]);
				});
          }); 
        });
		expect(result[0]).toEqual(50);
		expect(result[1]).toBeLessThan(25);
    });
});