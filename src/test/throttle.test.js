describe('Testing throttling', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does throttle receive the arguments correctly?', async () => {
		expect.assertions(1);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var obj = "objectPlaceholder",
					step = 5,
					results = [],
					x = rafx.throttle(function(obj,step){
						console.log(obj,step);
						results.push(obj,step);
					},5);
				rafx
				.async()
				.then(function(){
					x(obj);
				})
				.skipFrames() //skip a frame in between
				.then(function(){
					x();
				})
				.skipFrames()
				.then(function(){
					resolve(
						results[0] === "objectPlaceholder"
						&& results[1] === 5
						&& results[2] === undefined
						&& results[3] === 5
					);
				});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('Saturation test. Default throttling is 1 frame, should not '
		+ 'be called multiple times in a for loop', async () => {
		expect.assertions(1);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var f = rafx.throttle(function(obj,step){obj.v += step;},1),
					o = {v:0},
					i = 0;
				for (; i <= 1000; ++i){
					f(o);
				}
				rafx
				.skipFrames(30)
				.then(function(){
					resolve(o.v);
				})
          }); 
        });
		expect(result).toEqual(1);
    });
	
	test('Default throttling should take about 1 frame per call', async () => {
		expect.assertions(1);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var fThrottle = rafx.throttle(function(obj,step){obj.v += step;},1),
					o = {v:0},
					i = 0,
					ngin = function(){
						fThrottle(o);
						++i;
						if(i === 60) {return};
						window.requestAnimationFrame(ngin);
					};
				ngin();
				rafx
				.skipFrames(61)
				.then(function(){
					resolve(o.v);
				});
          }); 
        });
		expect(result).toEqual(60);
    });
	
	test('Optional framesToKeep argument controls how often the function can fire - 1', async () => {
		expect.assertions(1);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var fThrottle = rafx.throttle(function(obj,step){obj.v += step;},1,2),
					o = {v:0},
					i = 0,
					ngin = function(){
						fThrottle(o);
						++i;
						if(i === 60) {return};
						window.requestAnimationFrame(ngin);
					};
				ngin();
				rafx
				.skipFrames(61)
				.then(function(){
					resolve(o.v);
				});
          }); 
        });
		expect(result).toEqual(30);
    });
	
	test('Optional framesToKeep argument controls how often the function can fire - 2', async () => {
		expect.assertions(1);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var fThrottle = rafx.throttle(function(obj,step){obj.v += step;},1,3),
					o = {v:0},
					i = 0,
					ngin = function(){
						fThrottle(o);
						++i;
						if(i === 60) {return};
						window.requestAnimationFrame(ngin);
					};
				ngin();
				rafx
				.skipFrames(61)
				.then(function(){
					resolve(o.v);
				});
          }); 
        });
		expect(result).toEqual(20);
    });
});