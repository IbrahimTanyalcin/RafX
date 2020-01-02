describe('Testing toBool clause', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('is the value converted to boolean correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const values = [];
				//truthy number
				rafx
					.skipFrames(30)
					.then(function(){return -1;})
					.toBool()
					.then(function(v){values.push(v)});
				//falsey number
				rafx
					.skipFrames(30)
					.then(function(){return 0;})
					.toBool()
					.then(function(v){values.push(v)});
				//string
				rafx
					.skipFrames(30)
					.then(function(){return "some string";})
					.toBool()
					.then(function(v){values.push(v)});
				//object
				rafx
					.skipFrames(30)
					.then(function(){return {};})
					.toBool()
					.then(function(v){values.push(v)});
				//array
				rafx
					.skipFrames(30)
					.then(function(){return [];})
					.toBool()
					.then(function(v){values.push(v)});
				//undefined
				rafx
					.skipFrames(30)
					.then(function(){return undefined;})
					.toBool()
					.then(function(v){values.push(v)});
				//null
				rafx
					.skipFrames(30)
					.then(function(){return null;})
					.toBool()
					.then(function(v){values.push(v)});
				//NaN
				rafx
					.skipFrames(30)
					.then(function(){return NaN;})
					.toBool()
					.then(function(v){values.push(v)});
				rafx
					.skipFrames(60)
					.then(function(v){resolve(values)});
          }); 
        });
		expect(result).toEqual([true,false,true,true,true,false,false,false]);
    });
	
	test('does "this" refer to the parent thenable and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const thenable = rafx
					.skipFrames(30)
					.then(function(){return 10;});
				thenable
					.toBool(function(v){return this === thenable && v === true})
					.then(function(v){resolve(v)});
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
				.toBool(function(v,o){
					return v === true && o === rest;
				},rest)
				.then(function(v){
					resolve(v);
				});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('toBool conversion should take about a single frame?', async () => {
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
					.toBool(function(){return performance.now() - start;});
				},ledger)
				.until(function(v,o){o.t += v ;return o.f > 100;})
				.then(()=>{resolve(ledger.t/ledger.f)})
          }); 
        });
		expect(result).toBeGreaterThan(15.5);
		expect(result).toBeLessThan(17.5);
    });
	
	test(
		'toBool can receive a function as an argument and passes a boolean to it,'
		+ ' this function should be able to return a thenable', 
		async () => {
			expect.assertions(3);
			const result = await page.evaluate(function(){
			  return new Promise(function(resolve){
					const start = performance.now();
					rafx
					.async(3)
					.recurse(function(v,o){
						++o.f;
						return rafx
						.async(100)
						.skipFrames(30)
						.then(function(v){
							return rafx.skipFrames(30).then(function(){return v;});
						})
						.toBool(function(v){
							return rafx.skipFrames(30).then(function(){return v;})
						})
					},{f:-1})
					.until(function(v,o){return o.f > 3;})
					.then((v)=>{resolve([v,performance.now()-start])})
			  }); 
			});
			//check forceThen test, same situatiation where each call is a single frame
			expect(result[0]).toEqual(true);
			expect(result[1]).toBeGreaterThan(7250);
			expect(result[1]).toBeLessThan(8250);
		}
	);
	
	
	test(
		'you should even be able to return a thenable loop inside bool', 
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
						.toBool(function(v){
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
					.then((v)=>{resolve(v)})
			  }); 
			});
			expect(result).toEqual(true);
		}
	);
	
	test('toBool throws _nonBooleanCovertibleError', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(10)
				.then(function(v){
					return new Error("some error message");
				})
				.toBool()
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
		expect(result).toMatch("Boolean");
    });
	
	test('third argument can also control what to throw', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(10)
				.then(function(v){
					return new Error("some error message");
				})
				.toBool(function(v){
					return v;
				},null,{throw: new Error("right resolve call")})
				.then(function(v){
					resolve("wrong resolve call");
				}).catch(function(e){
					resolve(e.message);
				});
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual("right resolve call");
    });
	
});