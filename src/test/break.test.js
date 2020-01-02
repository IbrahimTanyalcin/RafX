describe('testing recursions and triggers', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('basic break test', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var obj = {i:0},
					thenable1 = rafx
						.async(2)
						.skipFrames(30)
						.recurse((v,o) => {o.i += v; return o.i;}, obj)
						.until((r,o) => r > 10)
						.then(function(v){resolve(v)});
				
				rafx
				.async(2) //the 2 has no meaning
				.skipFrames(32)
				.then(function(){
					thenable1.break();
				})
				.then(function(){
					resolve(obj.i);
				})
          }); 
        });
		expect(result).toBeGreaterThan(2);
		expect(result).toBeLessThan(8);
    });
	
	
	test('breaking inside nested', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var obj = {i:0},
					thenable = null;
				rafx
					.async(2)
					.skipFrames(30)
					.recurse((v,o) => {
						o.i += v; 
						if(o.i === 4) {
							thenable.break();
						}
						return thenable = rafx
							.skipFrames(5)
							.then(function(){return o.i});
					}, obj)
					.until((r,o) => r > 10)
					.then(function(v){resolve(v)});
				
				rafx
					.async(2) //the 2 has no meaning
					.skipFrames(120)
					.then(function(){
						resolve(obj.i);
					})
          }); 
        });
		expect(result).toBeGreaterThan(2);
		expect(result).toBeLessThan(8);
    });
	
	test('can we handle when breaking from multiple nested recursions?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
			var obj = {i:-1};
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
										if (v === 3){
											this.break(); //here we break
										}
										return v;
									});
							});
						})
			},obj)
			.until(function(v){
				return v > 10;
			}).then(function(v){
				resolve(v);
			});
			
			rafx //this thenable shouldn't be breaking and continue to resolve
			.skipFrames(540)
			.then(function(){resolve(obj.i)});
          }); 
        });
		expect(result).toEqual(3);
    });
});