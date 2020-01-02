describe('testing recursions and triggers', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('basic recursion test - until', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(2)
				.skipFrames(180)
				.recurse((v,o) => {o.i += v; return o.i;},{i:0})
				.until((r,o) => r > 10)
				.then(function(v){resolve(v)});
          }); 
        });
		expect(result).toEqual(12);
    });
	
	test('basic recursion test - while', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(2)
				.skipFrames(180)
				.recurse((v,o) => {o.i += v; return o.i;},{i:0})
				.while((r,o) => r < 10)
				.then(function(v){resolve(v)});
          }); 
        });
		expect(result).toEqual(10);
    });
	
	test('recursions should execute about 60fps - until', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(3)
				.recurse(function(v,o){
					++o.f;
					o.s = o.s || performance.now();
					o.n = performance.now();
					return o;
				},{f:-1,n:0,t:0})
				.until(function(v,o){o.t = (o.n - o.s)/(o.f);return o.f > 99;})
				.then((o)=>{resolve(o.t > 16 && o.t < 17);})
          }); 
        });
		expect(result).toBe(true);
    });
	
	test('recursions should execute about 60fps - while', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(3)
				.recurse(function(v,o){
					++o.f;
					o.s = o.s || performance.now();
					o.n = performance.now();
					return o;
				},{f:-1,n:0,t:0})
				.while(function(v,o){o.t = (o.n - o.s)/(o.f);return o.f <= 99;})
				.then((o)=>{resolve(o.t > 16 && o.t < 17);})
          }); 
        });
		expect(result).toBe(true);
    });
	
	test('can we handle nested recursions?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
			rafx
			.async(3)
			.skipFrames(30)
			.recurse(function(v,o){
				++o.i;
				return rafx
						.async(o.i)
						.skipFrames(5)
						.recurse(function(v,o){
							--o.i;
							return v;
						},{i:5})
						.until(function(v,o){
							return o.i <= 0;
						})
						.then(function(v){
							return rafx
							.async(v)
							.recurse(function(v,o){
								--o.x;
								return v;
							},{x:5})
							.until(function(v,o){
								return o.x <= 0;
							})
							.filter(function(v){
								return typeof v === "number";
							})
							.then(function(v){
								return rafx
									.async(5)
									.skipFrames(5)
									.filter(function(v){
										return v > 3;
									})
									.then(function(){
										return v;
									});
							});
						})
			},{i:-1})
			.until(function(v){
				return v > 10;
			}).then(function(v){
				resolve(v);
			})
          }); 
        });
		expect(result).toEqual(11);
    });
	
	test('you should be able to return a thenable within loops', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
					.async(5)
					.skipFrames(30)
					.loop(function(v,o){
						return rafx
							.async(o.c)
							.skipFrames(30)
							.then(function(){
								o.c += v;
								return o.c;
							})
					},{c:0}).until(function(v,o){
						return v > 50;
					}).then(function(v){
						resolve(v);
					})
          }); 
        });
		expect(result).toBe(55);
    });
	
});