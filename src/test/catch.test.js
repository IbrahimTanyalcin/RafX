describe('testing catchers', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('basic catch test - does it catch?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(60)
				.then((v)=>{throw new Error(v)})
				.skipFrames(60)
				.then(function(v){return v+1;})
				.then(function(v){return v+1;})
				.then(function(v){return v+1;})
				.then(function(v){throw new Error(v+1);})
				.catch(function(e){resolve(+e.message);})
          }); 
        });
		expect(result).toEqual(5);
    });
	
	test('can the catch be overridden?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async(5)
				.skipFrames(60)
				.then((v)=>{throw new Error(v)})
				.skipFrames(60)
				.catch(function(e){resolve(+e.message);})
				.then(function(v){return v+1;})
				.then(function(v){return v+1;})
				.then(function(v){return v+1;})
				.then(function(v){throw new Error(v+1);})
				.catch(function(e){resolve(+e.message + 1);})
          }); 
        });
		expect(result).toEqual(6);
    });
	
	test(
		'on nested recursions a single object is thrown'
		+ ' and reported on only user attached catch clauses;'
		+ ' catch clauses can still be overridden;'
		+ ' catch execution order should be innermost to outermost',
		async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
			const errors = [],
				catchExecutionOrder = [];
			rafx
			.async(3)
			.skipFrames(30)
			.catch(function(e){ //should be overridden
				errors.push(e);
				catchExecutionOrder.push(NaN);
			})
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
									.skipFrames(10)
									.toBool(function(v){return v - 1;})
									.toBool()
									.filter(function(v){
										return typeof v !== "boolean" && v === false;
									})
									.then(function(){
										return v;
									}).catch(function(e){
										errors.push(e);
										catchExecutionOrder.push(1);
									});
							}).catch(function(e){
								errors.push(e);
								catchExecutionOrder.push(2);
							});
						}).catch(function(e){
							errors.push(e);
							catchExecutionOrder.push(3);
						});
			},{i:-1})
			.until(function(v){
				return v > 5;
			}).then(function(v){
				return v;
			}).catch(function(e){ //last catch to execute
				errors.push(e);
				catchExecutionOrder.push(4);
				resolve(
					errors.length === 4
					&& errors.every((d,i)=> d === errors[Math.min(i+1,errors.length - 1)])
					&& catchExecutionOrder.every((d,i,a)=> d <= (a[i+1] || d))
				);
			})
          }); 
        });
		expect(result).toBe(true);
    });
	
	
	
});