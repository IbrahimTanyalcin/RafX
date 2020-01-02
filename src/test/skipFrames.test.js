describe('Testing skipFrames', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does it return a thenable', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				resolve([
					rafx.skipFrames(60) instanceof rafx.Thenable,
					rafx.async().then((v)=>v) instanceof rafx.Thenable
				]);
          }); 
        });
		expect(result).toEqual([true,true]);
    });
	
	test('how long does it take for 60 frames', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(async function(resolve){
				let start = performance.now();
				let end = await new Promise(function(res){
					rafx
					.skipFrames(60)
					.then(function(){res(performance.now())});
				});
				resolve(end - start);
          }); 
        });
		expect(result).toBeGreaterThan(1000 - 2 * 17);
		expect(result).toBeLessThan(1000 + 2 * 17);
    });
	
	test('passing negative frame count should be same as passing 1 or 0', async () => {
		expect.assertions(6);
		const result = await page.evaluate(function(){
          return new Promise(async function(resolve){
				let negative = await new Promise(function(res){
					const start = performance.now();
					rafx
					.skipFrames(-1)
					.then(function(){res(performance.now() - start)});
				});;
				let zero = await new Promise(function(res){
					const start = performance.now();
					rafx
					.skipFrames(0)
					.then(function(){res(performance.now() - start)});
				});
				let positive = await new Promise(function(res){
					const start = performance.now();
					rafx
					.skipFrames(1)
					.then(function(){res(performance.now() - start)});
				});
				resolve([negative - zero, zero - positive, positive - negative]);
          }); 
        }),
		between = function(min,max){
			const between = function(v){
				expect(v).toBeGreaterThan(min);
				expect(v).toBeLessThan(max);
				return between;
			}
			return between;
		},
		step = 17/3;
		between(-step,step)(result[0])(result[1])(result[2]);
    });
});