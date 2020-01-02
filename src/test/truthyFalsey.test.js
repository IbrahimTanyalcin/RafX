describe('Testing ifTruthy/ifFalsey clauses', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does "this" refer to the parent thenable and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const collection = [];
				const thenableTruthy = rafx
						.skipFrames(10)
						.then(function(){return 10;}),
					thenableFalsey = rafx
						.skipFrames(10)
						.then(function(){return 0;});
				thenableTruthy
					.ifTruthy(function(v){
						return this === thenableTruthy && v === 10
					})
					.then(function(v){collection.push(true)});
				thenableFalsey
					.ifFalsey(function(v){
						return this === thenableFalsey && v === 0
					})
					.then(function(v){collection.push(true)});
				rafx
					.skipFrames(60)
					.then(function(){resolve(collection)});
          }); 
        });
		expect(result).toEqual([true,true]);
    });
	
	
	test('did the function receive arguments?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var rest = {test:"ok"},
					collection = [];
				//truthy
				rafx
					.async("payload")
					.skipFrames(5)
					.then(function(v){ return v;})
					.ifTruthy(function(v,o){
						return v === "payload" && o === rest;
					},rest)
					.then(function(v){
						collection.push(true);
					});
				//falsey
				rafx
					.async(0)
					.skipFrames(5)
					.then(function(v){ return v;})
					.ifFalsey(function(v,o){
						return v === 0 && o === rest;
					},rest)
					.then(function(v){
						collection.push(true);
					});
				
				rafx
					.skipFrames(60)
					.then(function(){resolve(collection)});
          }); 
        });
		expect(result).toEqual([true,true]);
    });
	
	test('ifTruthy/ifFalsey should not execute if previous thenable is not complete', async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const start = performance.now();
				rafx
				.async()
				.skipFrames(60)
				.then(function(){return false;})
				.skipFrames(60)
				.ifFalsey(function(v){
					return !v;
				})
				.skipFrames(60)
				.ifTruthy(function(v){
					return !v;
				})
				.then(function(v){
					resolve([v,performance.now() - start]);
				});
          }); 
        });
		// 8 thenables,1 frame error margin for each 
		expect(result[0]).toEqual(false);
		expect(result[1]).toBeGreaterThan(3000 - 8 * 17);
		expect(result[1]).toBeLessThan(3000 + 8 * 17);
    });
	
	test('ifTruthy/ifFalsey does not throw by default', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async()
				.skipFrames(10)
				.then(function(){return true;})
				.skipFrames(10)
				.ifFalsey(function(v){
					resolve("wrong resolve call");
				})
				.skipFrames(10)
				.ifTruthy(function(v){
					resolve("wrong resolve call");
				});
				
				rafx
				.skipFrames(45)
				.then(function(){
					resolve("correct resolve call");
				});
          }); 
        });
		expect(result).toEqual("correct resolve call");
    });
	
	test('if a custom catcher is attached the error can be caught', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async()
				.skipFrames(10)
				.then(function(){return true;})
				.skipFrames(10)
				.ifFalsey(function(v){
					resolve("wrong resolve call");
				})
				.skipFrames(10)
				.ifTruthy(function(v){
					resolve("wrong resolve call");
				})
				.catch(function(e){
					resolve("correct resolve call - " + e.message);
				});
				
				rafx
				.skipFrames(45)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toMatch("correct resolve call");
    });
	
});