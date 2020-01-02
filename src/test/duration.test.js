describe('Testing duration generator', () => {
    
	var VERSION = process.env.npm_package_version;
	var TYPE = process.env.RAFX_TYPE;
	
	beforeAll(async () => {
		await page.addScriptTag({path:'./dist/rafx.v' + VERSION + '.' + TYPE + '.js'})
	});
	
	test('rafx.duration returns a callable that returns an instanceof Duration', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur = rafx.duration();
				resolve([dur.unit,dur.val]);
          }); 
        });
		expect(result[0]).toEqual("f");
		expect(result[1]).toEqual(1);
    });
	
	test('duration value and units are adjustable and chainable through .set getter', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur = rafx.duration();
				dur
				.set
				.unit("f")
				.u("frames")
				.setUnit("frame")
				.unit("ms")
				.u("milliseconds")
				.setUnit("millisecond")
				.u("s")
				.setUnit("second")
				.unit("seconds")
				.u("min")
				.setUnit("mins")
				.unit("minutes")
				.u("minute")
				.v(2)
				.value(2)
				.setVal(2)
				.val(2);
				
				resolve([dur.unit,dur.val]);
          }); 
        });
		expect(result[0]).toEqual("minute");
		expect(result[1]).toEqual(2);
    });
	
	test('setting unknown unit throws an error', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur = rafx.duration();
				try {
					dur
					.set
					.unit("fx")
					.val(2);
				} catch {
					resolve(true)
				}
          }); 
        });
		expect(result).toEqual(true);
    });
	
	test('minimum value to set is 1, floats bigger than 1 can be set', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur1 = rafx.duration(),
					dur2 = rafx.duration();
				dur1.set.val(0.123);
				dur2.set.val(10.123);
				resolve([dur1.val,dur2.val]);
          }); 
        });
		expect(result[0]).toEqual(1);
		expect(result[1]).toEqual(10.123);
    });
	
	test('setting a new unit converts the value automatically, '
		+ 'if the new value is smaller than 1, sets back to 1', async () => {
		expect.assertions(2);
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur1 = rafx.duration(),
					dur2 = rafx.duration();
				dur1.set.unit("min").val(1);
				dur1.set.u("f");
				dur2.set.unit("f").val(1);
				dur2.set.unit("second");
				resolve([dur1.val,dur2.val]);
          }); 
        });
		expect(result[0]).toEqual(3600);
		expect(result[1]).toEqual(1);
    });
	
	test('inbuilt valueOf automatically converts duration to value in frames', async () => {
		const result = await page.evaluate(function(){
          return new Promise(function(resolve){
				var dur = rafx.duration();
				dur.set.u("s").v(10);
				resolve(+dur);
          }); 
        });
		expect(result).toEqual(600);
    });
});