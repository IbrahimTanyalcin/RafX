describe('Testing filter clause', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does "this" refer to the parent thenable and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const thenable = rafx
					.skipFrames(60)
					.then(function(){return 10;});
				thenable
					.filter(function(v){return this === thenable && v === 10})
					.then(function(v){resolve(v === 10)});
          }); 
        });
		expect(result).toBe(true);
    });
	
	
	test('did the function receive arguments?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var rest = {test:"ok"};
				rafx
				.async("payload")
				.skipFrames(5)
				.then(function(v){ return v;})
				.filter(function(v,o){
					return v === "payload" && o === rest;
				},rest)
				.then(function(v){
					resolve(v);
				});
          }); 
        });
		expect(result).toEqual("payload");
    });
	
	test('filter should not execute if previous thenable is not complete', async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const start = performance.now();
				rafx
				.async()
				.skipFrames(60)
				.then(function(){return "payload";})
				.skipFrames(60)
				.filter(function(v){
					return v === "payload";
				})
				.then(function(v){
					resolve([v,performance.now() - start]);
				});
          }); 
        });
		expect(result[0]).toEqual("payload");
		expect(result[1]).toBeGreaterThan(2000 - 7 * 17);
		expect(result[1]).toBeLessThan(2000 + 7 * 17);
    });
	
	test('third argument to filter can control when filter should execute', async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const start = performance.now(),
					anotherThenable = rafx
						.async()
						.skipFrames(180);
				rafx
				.async()
				.skipFrames(60)
				.then(function(){return "payload";})
				.skipFrames(60)
				.filter(function(v){
					return v === "payload";
				},null,{done:anotherThenable.status})
				.then(function(v){
					resolve([v,performance.now() - start]);
				});
          }); 
        });
		expect(result[0]).toEqual("payload");
		expect(result[1]).toBeGreaterThan(3000 - 7 * 17);
		expect(result[1]).toBeLessThan(3000 + 7 * 17);
    });
	
	test('filter does not throw by default', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(10)
				.then(function(v){return v;})
				.filter(function(v){
					return v > 10;
				})
				.then(function(v){
					resolve("wrong resolve call");
				});
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve("correct resolve call");
				});
          }); 
        });
		expect(result).toEqual("correct resolve call");
    });
	
	test('third argument can also control what to throw', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(10)
				.then(function(v){return v;})
				.filter(function(v){
					return v > 10;
				},null,{throw: new Error("right resolve call")})
				.then(function(v){
					resolve("wrong resolve call");
				}).catch(function(e){
					resolve(e.message);
				});
				
				rafx
				.skipFrames(60)
				.then(function(e){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual("right resolve call");
    });
	
});