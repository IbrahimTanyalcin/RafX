describe('Testing thenables', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does "this" refer to the parent thenable?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const thenable = rafx.skipFrames(5);
				thenable.then(function(){resolve(this === thenable)});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('did the function receive arguments?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async("payload")
				.skipFrames(5)
				.then(function(v){ return v;})
				.then(function(v){resolve(v === "payload")});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('does nesting return correct results under reasonable time?', async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var start = performance.now();
				rafx
				.async(3)
				.skipFrames(60)
				.skipFrames(60)
				.then(function(v){
					return rafx
						.async(v+1)
						.skipFrames(60)
						.skipFrames(60)
						.then(function(v){
							return rafx
								.async(v+1)
								.skipFrames(60)
								.skipFrames(60)
								.then(function(v){
									return v+1;
								})
								.skipFrames(60);
						})
				}).then(function(v){
					resolve([v,performance.now()-start]);
				}).catch(function(v){console.log("err caught");})
          }); 
        });
		expect(result[0]).toEqual(6);
		//somehow chrome is always within 1 frame error
		//12 thenables, 1 frame error margin for each?
		expect(result[1]).toBeGreaterThan(7000 - 12 * 17);
		expect(result[1]).toBeLessThan(7000 + 12 * 17);
    });
	
	test('You can return an object with done and value property. '
		+ 'Thenable will not be executed until done is observed to be truthy' , async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var payload = {done:false, value: null},
					start = performance.now();
				rafx
				.async("payload")
				.skipFrames(5)
				.then(function(v){ payload.value = v; return payload;})
				.then(function(v){resolve([v === "payload", performance.now() - start])});
				
				rafx.async().skipFrames(120).then(function(){payload.done = true;});
          }); 
        });
		expect(result[0]).toEqual(true);
		expect(result[1]).toBeGreaterThan(115 * 17);
		expect(result[1]).toBeLessThan(125 * 17);
    });
});