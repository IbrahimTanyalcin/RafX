describe('Testing repeat clause', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('does "this" refer to null or optional thisArg argument'
		+ ' and are values passed correctly?', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const arg1 = {c:0,correct:0,incorrect:0},
					arg2 = {c:0,correct:0,incorrect:0},
					someObj = Object();
				rafx
				.skipFrames(30)
				.then(function(){
					rafx
					.repeat(
						function(rest,controller){
							rest.c++;
							//specification from MDN, if thisArg is null/undefined, it replaced with global object(window)
							if(this === null || this === window){ 
								rest.correct++;
							} else {
								rest.incorrect++;
							}
							if(rest.c > 60){
								controller.kill;
							}
						},
						arg1
					);
				});
				
				rafx
				.skipFrames(30)
				.then(function(){
					rafx
					.repeat(
						function(rest,controller){
							rest.c++;
							if(this === someObj){
								rest.correct++;
							} else {
								rest.incorrect++;
							}
							if(rest.c > 60){
								controller.kill;
							}
						},
						arg2,
						{thisArg:someObj}
					);
				});
				
					
				rafx
				.skipFrames(120)
				.then(function(){
					resolve(
						[
							arg1.correct,
							arg1.incorrect,
							arg2.correct,
							arg2.incorrect
						]
					)
				});
				
          }); 
        });
		expect(result).toEqual([61,0,61,0]);
    });
	
	test('repeat cannot be chained, instead it returns an "id" of the process to be repeated', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const id = rafx
				.repeat(function(arg,ctrl){
					arg.c++;
					if(arg.c > 20){
						ctrl.kill;
					}
				},{c:0});
				
				rafx
				.skipFrames(45)
				.then(function(){
					resolve(typeof id);
				});
          }); 
        });
		expect(result).toEqual("string");
    });
	
	test('repeat throws error thrown within repeating function,'
		+ 'a handler function specified via "handler" key in options argument is invoked', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async()
				.then(function(){
					var result = {value:true,done:false};
					rafx
					.repeat(
						function(arg,ctrl){
							arg.c++;
							if(arg.c > 20){
								throw new Error("right error message");
							}
						},
						{
							c:0
						},
						{
							handler:function(e,arg){
								result.value = e;
								result.done = true;
							}
						}
					);
					return result;
				})
				.catch(function(e){
					resolve(e.message);
				})
				
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual("right error message");
    });
	
	test('repeat clause can be paused', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const collection = {
					beforePause:0,
					afterPause:0,
					afterResume:0
				};
				let didPause = false;
				const id = rafx
				.repeat(
					function(arg,ctrl){
						arg.c++;
						if(!didPause && arg.c > 20){
							didPause = true;
							collection.beforePause = arg.c;
							ctrl.pause;
							rafx
							.skipFrames(60)
							.then(function(){
								collection.afterPause = arg.c;
								ctrl.resume;
							})
						} else if (arg.c > 99){
							collection.afterResume = arg.c;
							ctrl.kill;
							resolve(collection);
						}
					},
					{c:0}
				);
          }); 
        });
		expect(result).toEqual({
			beforePause:21,
			afterPause:21,
			afterResume:100
		});
    });
	
	
	test('repeat can be terminated from its controller (2nd argument), if no errors are thrown,'
		+ ' handler function will be called with null as first argument'
		+ ' and rest as the second', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async()
				.then(function(){
					var result = {value:true,done:false};
					rafx
					.repeat(
						function(arg,ctrl){
							arg.c++;
							if(arg.c > 60){
								ctrl.kill;
							}
						},
						{
							c:0
						},
						{
							handler:function(e,arg){
								result.value = e;
								result.done = true;
							}
						}
					);
					return result;
				}).then(function(v){
					resolve(v);			
				}).catch(function(e){
					resolve("wrong resolve call");
				})
				
				
				rafx
				.skipFrames(120)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual(null);
    });
	
	test('optional throw key of the third argument controls what to be thrown',
	async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				rafx
				.async()
				.then(function(){
					var result = {value:true,done:false};
					rafx
					.repeat(
						function(arg,ctrl){
							arg.c++;
							if(arg.c > 20){
								throw new Error("wrong error message");
							}
						},
						{
							c:0
						},
						{
							handler:function(e,arg){
								result.value = e;
								result.done = true;
							},
							throw: new Error("right error message")
						}
					);
					return result;
				})
				.catch(function(e){
					resolve(e.message);
				})
				
				
				rafx
				.skipFrames(60)
				.then(function(){
					resolve("wrong resolve call");
				});
          }); 
        });
		expect(result).toEqual("right error message");
    });
	
	test('manually deleting returned process id, terminates repeat clause and triggers the handler with error as null',
	async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				let id = "",
					arg = {c:0},
					received = null;
				rafx
				.async()
				.then(function(){
					var result = {value:true,done:false};
					id = rafx
					.repeat(
						function(arg,ctrl){
							arg.c++;
						},
						arg,
						{
							handler:function(e,arg){
								result.value = [e,arg.c];
								result.done = true;
							},
							throw: new Error("wrong message")
						}
					);
					return result;
				}).then(function(v){
					received = v;
				}).catch(function(e){
					resolve(e.message);
				});
				
				
				rafx
				.skipFrames(60)
				.then(function(){
					delete rafx._processes[id];
				})
				.skipFrames(60)
				.then(function(){
					resolve(received[0] === null && arg.c === received[1]);
				});
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('each repeat cycle should take about a single frame', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				const ledger = {
					frameCount:-1,
					total:0,
					previousFrame:0
				};
				
				rafx
				.repeat(
					function(ledger,ctrl){
						var now = performance.now();
						++ledger.frameCount;
						ledger.previousFrame = ledger.previousFrame || now;
						ledger.total += now - ledger.previousFrame;
						ledger.previousFrame = now;
						if(ledger.frameCount > 300){
							ctrl.kill;
						}
					},
					ledger,
					{
						handler: function(e,ledger){
							resolve(ledger.total/ledger.frameCount);
						}
					}
				);
          }); 
        });
		expect(result).toBeGreaterThan(15.5);
		expect(result).toBeLessThan(17.5);
    });
});