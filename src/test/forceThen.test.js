describe('Testing fThen/forceThen/force clauses', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does "this" refer to the parent thenable and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const thenable = rafx
					.skipFrames(30)
					.then(function(){return 10;});
				thenable
					.forceThen(function(v){return this === thenable && v === 10})
					.then(function(v){resolve(v.value)});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	
	test('did the function receive arguments?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var rest = {test:"ok"};
				rafx
				.async("payload")
				.skipFrames(30)
				.then(function(v){ return v;})
				.forceThen(function(v,o){
					return v === "payload" && o === rest;
				},rest)
				.then(function(v){
					resolve(v.value);
				});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('forceThen will not throw, whatever returned/thrown from the'
		+ ' upstream/argument function is encapsulated with {value:..}', async () => {
		expect.assertions(3);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				let case1 = null,
					case2 = null,
					case3 = null;
				//value returned upstream
				rafx
				.skipFrames(30)
				.then(function(){return 5})
				.fThen(function(v){ 
					return v + 1;
				})
				.then(function(v){
					case1 = v.value;
				});
				
				//value thrown upstream
				rafx
				.skipFrames(30)
				.then(function(){
					throw new Error("upstream error");
				})
				.fThen(function(v){ 
					return v + 1;
				})
				.then(function(v){
					case2 = v.value.message;
				});
				
				//value thrown from argument
				rafx
				.skipFrames(30)
				.then(function(){return 5})
				.fThen(function(v){ 
					throw new Error("argument function error");
				})
				.then(function(v){
					case3 = v.value.message;
				});
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve([case1, case2, case3]);
				});
          }); 
        });
		expect(result[0]).toEqual(6);
		expect(result[1]).toMatch("upstream");
		expect(result[2]).toMatch("argument");
    });
	
	test('forceThen/fThen/force clauses should take about a single frame', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const ledger = {f:-1,t:0};
				rafx
				.async(3)
				.recurse(function(v,o){
					++o.f;
					var start;
					return rafx
					.async(100)
					.then((v)=>{start = performance.now(); return v})
					.forceThen(function(){return performance.now() - start;});
				},ledger)
				.until(function(v,o){o.t += v.value ;return o.f > 100;})
				.then(()=>{resolve(ledger.t/ledger.f)})
          }); 
        });
		expect(result).toBeGreaterThan(15.5);
		expect(result).toBeLessThan(17.5);
    });
	
	test(
		'forceThen/fThen/force can receive a function as an argument,'
		+ ' this function should be able to return a thenable', 
		async () => {
			expect.assertions(3);
			const result = await page.evaluate(function(){
			  return new Promise(function(resolve){
					const start = performance.now();
					rafx
					.async(3) //1 frame
					.recurse(function(v,o){ //each recursion 1 frame
						++o.f;
						return rafx
						.async(100) // 1 frame
						.skipFrames(30) //30 frames
						.then(function(v){ //1 frame 
							return rafx.skipFrames(30).then(function(){return v;}); //31 frames
						})
						.forceThen(function(v){ //1 frame
							return rafx.skipFrames(30).then(function(){return v;}) //31 frames
						})
					},{f:-1})
					.until(function(v,o){return o.f > 3;}) //1 frame
					.then((v)=>{resolve([v.value,performance.now()-start])}) //1 frame
			  }); 
			});
			//total of 1 + 95 * 5 (inside recursion) + 5 (recursion itself) + 1 + 1 = 483 frames
			//483 * 17 = 8211
			expect(result[0]).toEqual(100);
			expect(result[1]).toBeGreaterThan(7250);
			expect(result[1]).toBeLessThan(8250);
		}
	);
	
	
	test(
		'you should even be able to return a thenable loop inside forceThen/fThen/force', 
		async () => {
			const result = await page.evaluate(function(){
			  return new Promise(function(resolve){
					rafx
					.async(3)
					.recurse(function(v,o){
						++o.f;
						return rafx
						.async(100)
						.skipFrames(30)
						.then(function(v){return rafx.skipFrames(30).then(function(){return v;})})
						.forceThen(function(v){
							return rafx
								.skipFrames(30)
								.loop(function(x,o){
									++o.f;
									return v;
								},{f:-1})
								.until(function(v,o){
									return o.f > 30
								})
								.then(function(w){
									return w;
								})
						})

					},{f:-1})
					.until(function(v,o){return o.f > 2;})
					.then((v)=>{resolve(v.value)})
			  }); 
			});
			expect(result).toEqual(100);
		}
	);
	
	test('third argument can also control what to throw', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(10)
				.then(function(v){
					return new Error("wrong error message");
				})
				.forceThen(function(v){
					return v;
				},null,{throw: new Error("right error message")})
				.then(function(v){
					resolve(v.value.message);
				});
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual("right error message");
    });
	
});