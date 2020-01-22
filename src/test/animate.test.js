describe('Testing animate clause', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('basic animate test', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const o = {i:0};
				let j = 0;
				rafx
				.async(2)
				.animate(function(v,rest){
					++rest.i;
					j++;
					return 2;
				},o)
				.until(function(v,rest){
					return rest.i + v === 12;
				})
				.then(function(v){
					resolve([v,o.i,j]);
				});
          }); 
        });
		expect(result).toEqual([2,10,10]);
    });
	
	test('does "this" refer to the parent thenable and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const thenable = rafx
					.skipFrames(30)
					.then(function(){return 10;});
				thenable
					.animate(function(v,rest){return this === thenable && v === 10 && ++rest.i},{i:0})
					.until(function(v,rest){ return !!v === true && rest.i === 30})
					.then(function(){resolve(true);});
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
				.animate(function(v){ return v;},rest)
				.until(function(v,o){
					return v === "payload" && o === rest;
				})
				.then(function(v, o){
					resolve(v + " " + o.test);
				},rest);
          }); 
        });
		expect(result).toEqual("payload ok");
    });
	
	test('animations should take about a single frame?', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const ledger = {f:-1},
					start = performance.now();
				rafx
				.async(3)
				.animate(function(v,o){
					return ++o.f;
				},ledger)
				.until(function(v,o){ return v > 299;})
				.then((v)=>{resolve((performance.now() - start) / (v + 1))})
          }); 
        });
		expect(result).toBeGreaterThan(15.5);
		expect(result).toBeLessThan(17.5);
    });
	
	test(
		'unlike recurse/loop animate returns are shallow, you are not supposed to return a thenable', 
		async () => {
			expect.assertions(5);
			const result = await page.evaluate(function(){
			  return new Promise(function(resolve){
					const start = performance.now();
					let untilBlockStart = 0,
						thenable = null,
						untilCount = 0;
					rafx
					.async()
					.animate(function(v){
						return thenable = rafx
						.async()
						.skipFrames(30)
						.then(function(v){
							return performance.now() - start;
						});
					})
					.until(function(v){return ++untilCount && (v === thenable) && (untilBlockStart = performance.now() - start);})
					//until reflects the last return of animate, so the value is taken out until 'done:true'
					.then((v)=>{resolve([v,untilBlockStart,untilCount]);});
			  }); 
			});
			expect(result[0]).toBeGreaterThan(465); //min 30 * 15.5
			expect(result[0]).toBeLessThan(580); // max 33 * 17.5
			expect(result[1]).toBeGreaterThan(15.5); //min 1 * 15.5
			expect(result[1]).toBeLessThan(35); // max 2 * 17.5
			expect(result[2]).toEqual(1);
		}
	);
	
	test('animate throws whatever error was thrown within animate clouse', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async("some ")
				.skipFrames(10)
				.animate(function(v){
					throw new Error(v + "error message");
				})
				.until(function(v){return true;})
				.then(function(v){
					resolve("wrong resolve call");
				}).catch(function(e){
					resolve(e.message);
				});
          }); 
        });
		expect(result).toMatch("some error message");
    });
	
	test('animate does not throw by default, it silently fails', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async("some ")
				.skipFrames(10)
				.animate(function(v){
					throw new Error(v + "error message");
				})
				.until(function(v){return true;})
				.then(function(v){
					resolve("wrong resolve call");
				});
				
				rafx
				.async()
				.skipFrames(60)
				.then(function(v){
					resolve("right resolve call");
				});
          }); 
        });
		expect(result).toMatch("right resolve call");
    });
});