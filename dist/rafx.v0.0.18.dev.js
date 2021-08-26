(function(root,factory) {
	if (typeof define === "function" && define.amd) {
	define([], factory);
	} else if (typeof exports === "object") {
		module.exports = factory();
	} else {
		root.rafx = factory();
	}
}(this, function(){
	/*
	###############################
	###########INTERNALS###########
	###############################
	*/
	function Rafx(){
		this._processes = {};
		Object.defineProperty(
			this,
			"gcChance",
			{
				enumerable: false,
				configurable: false,
				set: function(v){gcChance = v;}
			}
		);
	};
	var window = this,
		prt = Rafx.prototype,
		rAF = window.requestAnimationFrame || function(f){return setTimeout(f, 17);},
		generateRandomString = function(){
			return (Math.random()*1e9 | 0).toString(16);
		},
		generateRandomID = function(){
			return generateRandomString() + generateRandomString();
		},
		randomSeed = generateRandomID(),
		noOP = function(){},
		fDel = function(prop){delete this[prop];},
		identity = function(v){return v;},
		boolRev = function(v){return !v;},
		empO = {},
		breaker = null,
		gcChance = 0.01,
		max = Math.max,
		getDonePointer = function(thenable,options){
			var status = options && options.done !== undefined 
					? options.done 
					: thenable.status,
				thenable = status.thenable;
			if(!thenable._child){
				thenable.then(noOP);
			}
			return status;
		},
		checkErrorTree = function(thenable){
			var lastError = null;
			while(thenable){
				if(thenable._isErrored){
					lastError = thenable._lastError;
					if(lastError){
						return lastError;
					} else {
						throw (prt._missingErrorError);
					}
				}
				thenable = thenable && thenable._child;
			}
			return null;
		},
		poke = function(thenable){
			thenable.isCompleted || thenable.then(noOP).catch(noOP);
			return thenable;
		},
		assign = function(target,sources){
			sources = Array.prototype.slice.call(arguments).slice(1);
			var d,
				i,
				l = sources.length,
				a,
				lA,
				j,
				k;
			for (i = 0; i < l; ++i){
				d = Object(sources[i]);
				a = Object.getOwnPropertyNames(d);
				lA = a.length;
				for (j = 0; j < lA; ++j) {
					k = a[j];
					target[k] = d[k];
				}
			}
			return target;
		},
		cancelTask = function(task){
			task.processed = true;
		},
		garbage = function(ngin){
			if(Math.random() > gcChance) {
				return;
			}
			var tasks = ngin.tasks,
				oLength = tasks.length,
				nTasks = Array(oLength),
				i = -1,
				j = 0,
				task = null;
			while (++i !== oLength) {
				task = tasks[i];
				if(!task.processed){
					nTasks[j++] = task;
				}
			}
			nTasks.length = j;
			ngin.tasks = nTasks;
		},
		Controller = function(id,instance){
			this.id = id;
			this.instance = instance;
		},
		Status = function(thenable,instance){
			this.thenable = thenable;
			this.instance = instance;
			this.isCompleted = false;
		},
		Duration = function(str){
			str += "";
			var match;
			this.unit = "f";
			this.val = 1;
			if(match = str && str.match(this.rgx)){
				this.set.unit(match[2] || "").val(match[1]);
			}
		},
		Ngin = function(){
			var that = this;
			this.tasks = [];
			this.frame = null;
			this.stroke = function(t){
				that.process(t);
			};
			this.cancelFrame = function(){
				window.cancelAnimationFrame(that.frame);
			};
		},
	/*
	###############################
	#############WATCH#############
	###############################
	*/
	//copied from Mutaframe.com - modified
		watch = function(obj,test,action,options){
			ngin.push({
				obj: obj,
				test: test,
				action: action,
				options: options,
				processed: false
			});
		},
		watchImmediate = function(obj,test,action,options){
			var task = {
				obj: obj,
				test: test,
				action: action,
				options: options,
				processed: false
			};
			if(test.call(obj,options,task)) {
				action.call(obj,options);
				return;
			}
			ngin.push(task);
		};
	/*
	###############################
	############WATCH##############
	###############################
	*/
	Object.defineProperties(
		Controller.prototype,
		{
			kill: {
				enumerable: false,
				configurable: false,
				get: function(){delete this.instance._processes[this.id];}
			},
			pause: {
				enumerable: false,
				configurable: false,
				get: function(){this.instance._processes[this.id] = false;}
			},
			resume: {
				enumerable: false,
				configurable: false,
				get: function(){this.instance._processes[this.id] = true;}
			}
		}
	);
	Object.defineProperties(
		Status.prototype,
		{
			code: {
				enumerable: false,
				configurable: false,
				get: function(){return this.isCompleted ? 1 : 0;}
			},
			string: {
				enumerable: false,
				configurable: false,
				get: function(){return this.text;}
			},
			text: {
				enumerable: false,
				configurable: false,
				get: function(){return this.isCompleted ? "completed" : this.thenable._invoked ? "pending" : "idle";}
			},
			valueOf: {
				enumerable: false,
				configurable: false,
				writable:false,
				value: function(){return this.code;}
			}
		}
	);
	Object.defineProperty(
		Duration.prototype,
		"set",
		{
			configurable:false,
			enumerable:false,
			get: function(){
				var that = this,
					value = function(v){return that.setVal.call(that,v);},
					unit = function(v){return that.setUnit.call(that,v);},
					valueOf = function(){return +that;}
				return {
					value: value,
					val: value,
					setVal: value,
					v: value,
					unit: unit,
					setUnit: unit,
					u: unit,
					back: that,
					b: that,
					parent: that,
					p: that,
					self: that,
					s:that,
					valueOf: valueOf
				};
			}
		}
	);
	Duration.prototype.rgx = /\s*([0-9]+|Infinity)\s*([a-z]+)?\s*/;
	Duration.prototype.trimRgx = /^\s*|\s*$/gi;
	Duration.prototype.keywords = {
		"": "f",
		f: "f",
		frames : "f",
		frame: "f",
		ms: "ms",
		milliseconds: "ms",
		millisecond: "ms",
		s: "s",
		second: "s",
		seconds: "s",
		min : "min",
		mins : "min",
		minute: "min",
		minutes: "min"		
	};
	Duration.prototype.unitToFrames = {
		f: 1,
		ms: 1/16.67,
		s: 60,
		min: 3600
	};
	Duration.prototype.setVal = function(v){
		this.val = max(+v,1) || 1;
		return this.set;
	};
	Duration.prototype.setUnit = function(v){
		v = ("" + v.replace(this.trimRgx,"")).toLowerCase();
		if(~Object.keys(this.keywords).indexOf(v)){
			return this.setVal(+this/this.unitToFrames[this.keywords[this.unit = v]]);
		} else {
			throw new SyntaxError(
				"Unit is not one of allowed keywords. "
				+ "For a list of allowed keywords, " 
				+ "inspect 'rafx.Duration.prototype.keywords'. "
			)
		}
	};
	Duration.prototype.step = function(v,step){
		var unit = this.unit,
			diff = +this + step * +(new Duration(v));
		return this.set.unit("frame").val(diff).unit(unit).self;
	};
	Duration.prototype.decrement = function(v){
		return this.step(v, -1);
	};
	Duration.prototype.increment = function(v){
		return this.step(v, 1);
	};
	Duration.prototype.valueOf = function(){
		return this.unitToFrames[this.keywords[this.unit]] * this.val;
	};
	Object.defineProperties(
		Ngin.prototype,
		{
			push: {
				enumerable: false,
				configurable: false,
				writable: false,
				value: function(taskObj){
					var tasks = this.tasks,
						length = tasks.length;
					tasks[length] = taskObj;
					if (!length) {
						rAF(this.stroke);
					} 
				}
			},
			process: {
				enumerable: false,
				configurable: false,
				writable: false,
				value: function(timestamp){
					var i = -1,
						processed = 0,
						isEmpty = true,
						task = null,
						tasks = this.tasks,
						obj = null,
						options = null,
						oLength = tasks.length;
					while (++i !== oLength) {
						task = tasks[i];
						isEmpty && (isEmpty = false);
						if (task.processed) {
							processed++;
							continue;
						}
						obj = task.obj;
						options = task.options;
						if (task.test.call(obj,options,task)) {
							task.action.call(obj,options);
							task.processed = true;
							processed++;
						}
					}
					if(!isEmpty){
						if(processed < i || tasks.length !== oLength) {
							this.frame = rAF(this.stroke);
							garbage(this);
						} else {
							this.tasks = [];
						}
					}
				}
			}
		}
	);
	/*
	###############################
	###########ENGINES#############
	###############################
	*/
	var ngin = new Ngin;
	/*
	###############################
	############ASYNC##############
	###############################
	*/
	prt.version = "0.0.18";
	prt.skipFrames = function(nFrames,argObj,parent,catcher,_breaker){
		_breaker = breaker || _breaker || {value:false};
		nFrames = nFrames instanceof this.skipFrames.Timer ? nFrames : new this.skipFrames.Timer(nFrames);
		var that = this,
			argObj = typeof argObj !== "object" 
				? {value:argObj,done:true} 
				: that.skipFrames.isExtractable(argObj)
					? argObj
					: {value:argObj,done:true};
					
		return new this.Thenable(this,nFrames,argObj,catcher,_breaker);
	};
	prt.Thenable = function(instance,nFrames,argObj,catcher,_breaker){
		this._breaker = _breaker;
		this._that = instance;
		this._nFrames = nFrames;
		this._argObj = argObj;
		this._instance = instance.skipFrames;
		this._invoked = false;
		this._child = null;
		this._isErrored = false;
		this._catch = catcher || null;
		this._lastError = null;
		this.status = new Status(this,instance);
	};
	prt.Thenable.prototype.valueOf = function(){
		return +this._invoked * +!this._isErrored * this.status.code;
	};
	prt.Thenable.prototype.then = function(f, rest){
		this._invoked = true;
		var _breaker = this._breaker,
			that = this._that,
			retVal = this._retVal = {value:undefined,done:false};
		watch(
			that,
			watchTest,
			watchAction,
			{
				f: f,
				rest: rest,
				nFrames: this._nFrames,
				_breaker: _breaker,
				argObj: this._argObj,
				that: that,
				thenable: this,
				retVal: retVal
			}
		);
		return this._child = that.skipFrames(new that.skipFrames.Timer(1),retVal,this,this._catch,_breaker);
	};
	prt.Thenable.prototype.break = function(){
		this._breaker.value = true;
		return this;
	};
	prt.Thenable.prototype.fThen 
	= prt.Thenable.prototype.forceThen
	= prt.Thenable.prototype.force
	= function(f, rest, options){
		var thenable = this,
			that = this._that,
			argObj = this._argObj,
			_breaker = this._breaker;
		poke(thenable);
		return that.async(
			{
				value:argObj,
				done:getDonePointer(thenable,options)
			},
			null,
			null,
			_breaker
		).then(function(v){
			var isError = v.value instanceof Error,
				result = {value: null, done: false};
			if(!isError){
				thenable.then(function(v){
					return (f || identity).call(this,v,rest);
				}).then(function(v){
					result.value = {value:v};
					result.done = true;
				}).catch(function(e){
					result.value = {value:e};
					result.done = true;
				});
			} else {
				result.value = {value: (options && options.throw) || v.value};
				result.done = true;
			}
			return result;
		}).catch(this._catch);
	};
	prt.Thenable.prototype.skipFrames = function(_nFrames){
		var that = this._that,
			argObj = this._argObj,
			_breaker = this._breaker;
		return this.then(function(){return that.skipFrames(new that.skipFrames.Timer(_nFrames),argObj,this,this._catch,_breaker);});
	};
	prt.Thenable.prototype.toBool = function(f, rest, options){
		var thenable = this,
			that = this._that,
			argObj = this._argObj,
			_breaker = this._breaker;
		poke(thenable);
		return that
		.async(
			{
				value:argObj,
				done:getDonePointer(thenable,options)
			},
			null,
			null,
			_breaker
		).then(function(v){
			var isError = v.value instanceof Error,
				error = null;
			if(!isError){
				return thenable.then(function(v){return (f || identity).call(this,!!v,rest);});
			} else {
				error = (options && options.throw) || that._nonBooleanCovertibleError;
				options && (options.error = error);
				throw(error);
			}
		}).catch(this._catch); 
	};
	
	prt.Thenable.prototype.filter = function(f, rest, options){
		var thenable = this,
			that = this._that,
			argObj = this._argObj,
			_breaker = this._breaker;
		poke(thenable);
		return that
		.async(
			{
				value:argObj,
				done: getDonePointer(thenable,options)
			},
			null,
			null,
			_breaker
		).then(function(v){
			if(v.value && v.value._instance === that.skipFrames) {
				return v.value.then(function(v){return {value:v};});
			} else {
				return {value:v,done:true};
			}
		}).then(function(v){
			var isError = v.value instanceof Error,
				error = isError ? v.value : null;
			if(!isError && (f || identity).call(thenable,v.value,rest)){
				return that.async(v.value,null,null,_breaker);
			} else {
				error = (options && options.throw) || error || that._validityError;
				options && (options.error = error);
				throw(error);
			}
		}).catch(noOP);
	};
	
	prt.Thenable.prototype.ifTruthy = function(f, rest, options){
		return this.filter(
				identity,
				null,
				assign(
					{throw:this._that._nonTruthyError},
					options
				)
			).then(f || identity, rest);
	};
	prt.Thenable.prototype.ifFalsey = function(f, rest, options){
		return this.filter(
				boolRev,
				null,
				assign(
					{throw:this._that._nonFalseyError},
					options
				)
			).then(f || identity, rest);
	};
	
	function thenableRecurse(f,rest,validator,_finally){
		var that = this._that,
			thenable = this,
			error = null,
			options = {};
		if(error = checkErrorTree(thenable)){
			_finally && _finally.call(thenable,"__fail",rest,{error:error}); 
			return;
		}
		thenable
			.then(function(v){return f.call(this,v,rest);})
			.filter(validator,rest,options)
			.then(function(v){_finally && _finally.call(thenable,v,rest);})
			.catch(function(v){
				if(v instanceof Error && v !== options.error){
					thenable._isErrored = true;
					thenable._lastError = v;
				}
				thenableRecurse.call(thenable,f,rest,validator,_finally);
			});
	};
	prt.Thenable.prototype.Untillable = function(that,thenable,state,f,rest){
		this.that = that;
		this.thenable = thenable;
		this.state = state;
		this.f = f;
		this.rest = rest;
		this._breaker = thenable._breaker;
	};
	prt.Thenable.prototype.Untillable.prototype.until = function(validator){
		var that = this.that,
			state = this.state,
			_breaker = this._breaker,
			error;
		thenableRecurse.call(this.thenable,this.f,this.rest,validator,function(v,rest,options){error = options && options.error; state.value = v; state.done = true;});
		return that.async(state,null,null,_breaker).then(function(v){if(v === "__fail"){throw error || that._recursionError;}else{return v;}});
	};
	prt.Thenable.prototype.Untillable.prototype.while = function(validator){
		var negValidator = function(v, rest){return !(validator || identity).call(this,v,rest);};
		return this.until(negValidator);
	};			
	prt.Thenable.prototype.recurse = prt.Thenable.prototype.loop = prt.Thenable.prototype.do = function(f, rest){
		var that = this._that,
			thenable = this,
			o = {value:undefined,done:false};
		return new thenable.Untillable(that,thenable,o,f,rest);
	};
	prt.Thenable.prototype.animateUntillable = function(that,thenable,state,f,rest){
		this.that = that;
		this.thenable = thenable;
		this.state = state;
		this.f = f;
		this.rest = rest;
		this._breaker = thenable._breaker;
	};
	prt.Thenable.prototype.animateUntillable.prototype.until = function(validator){
		return this.thenable.then(function(v, untillable){
			watch(
				this,
				untillable.test,
				untillable.action,
				{
					fFrame: untillable.f,
					v: v,
					rest: untillable.rest,
					validator: validator,
					state: untillable.state
				}
			);
			return untillable.state;
		}, this)
		.catch(noOP); 
	};
	prt.Thenable.prototype.animateUntillable.prototype.while = prt.Thenable.prototype.Untillable.prototype.while;
	prt.Thenable.prototype.animateUntillable.prototype.test  = function(opts){
		var state = opts.state,
			rest  = opts.rest;
		try {
			state.value = opts.fFrame.call(this, opts.v, rest);
			return this._breaker.value || opts.validator.call(this, state.value, rest);
		} catch (e) {
			return state.value = e;
		}
	};
	prt.Thenable.prototype.animateUntillable.prototype.action = function(opts){
		opts.state.done = true;
	};
	prt.Thenable.prototype.animate = prt.Thenable.prototype.recurseShallow = function(f, rest){
		var that = this._that,
			thenable = this,
			state = {value: void(0),done: false};
		return new thenable.animateUntillable(that,thenable,state,f,rest);
	};
	prt.ifInView = function(node, framesToKeep){
		return this.async(this.isInView(node, framesToKeep)).ifTruthy();
	};
	prt.ifNotInView = function(node, framesToKeep){
		return this.async(this.isInView(node, framesToKeep)).ifFalsey();
	};
	prt.Thenable.prototype.catch = function(f){
		if (typeof f === "function") {
			this._catch = f;
		}
		return this;
	};
	prt.skipFrames.Catcher = function(e){throw e;};
	prt.skipFrames.PerformCatch = function(instance,thenable,retVal){
		var child = thenable._child,
			value = retVal.value,
			isError = value instanceof Error,
			isHandled = isError && value._isHandled,
			defaultCatcher = prt.skipFrames.Catcher,
			catcher = (child && child._catch) || thenable._catch || defaultCatcher,
			mustCall = catcher !== defaultCatcher;
		if (!(child && child._invoked) && thenable._isErrored){
			if((isError && !isHandled) || !isError || mustCall) {
				value._isHandled = true;
				catcher.call(thenable,value);
			}
		}
	};
	prt.skipFrames.Extractor = function(instance,thenable,retVal,placeholder){
		retVal.value = placeholder.value; 
		retVal.done = placeholder.done;
		if (retVal.value instanceof Error) {
			thenable._isErrored = true;
			thenable._lastError = retVal.value;
		}
		return instance.skipFrames;
	};
	prt.skipFrames.isExtractable = function(o){
		return o 
			&& typeof o === "object" 
			&& o.hasOwnProperty("done") 
			&& o.hasOwnProperty("value");
	};
	prt.skipFrames.Timer = function (counter){
		this.counter = +counter || 1;
	};
	prt.skipFrames.Timer.prototype.valueOf = function(){
		return this.counter;
	};
	prt.skipFrames.Timer.prototype.decrement = function(){
		--this.counter;
		return this;
	};
	prt.async = function(o, rest, thisArg, _breaker){
		return this.skipFrames(1,typeof o === "function" ? o.call(thisArg || null, rest) : o,undefined,undefined,_breaker);
	};
	prt.repeat = function(f, rest, options){
		var that = this._that,
			id = generateRandomID(),
			controller = new Controller(id,this),
			thisArg = (options && options.thisArg) || null,
			handler = typeof (options && options.handler) === "function" 
				? options.handler
				: null,
			fR = function(){
				return f.call(
					thisArg,
					rest,
					controller
				);
			},
			fC = function(errorArg){
				controller.kill;
				if(errorArg){
					var error = (options && options.throw) 
						|| errorArg
						|| that._repetitionError;
					options && (options.error = errorArg);
					if(handler){
						handler.call(thisArg,error,rest);
					} else {
						throw(error);
					}
				} else if (handler) {
					handler.call(thisArg,null,rest);
				}
			};
		this._repeat(
			fR,
			rest,
			options,
			id,
			randomSeed,
			controller,
			fC
		);
		this._processes[id] = true;
		return id;
	};
	prt._repeat = function(fR,rest,options,id,seed,controller,fC){
		if(seed !== randomSeed){
			throw ( new Error("Cannot be manually called."));
		}
		this.async()
		.then(function(){return fR();})
		.catch(fC)
		.then(function(){
			var res = {value:true,done:false},
				thenable = this,
				that = this._that;
			if(that._processes.hasOwnProperty(id)) {
				if(that._processes[id]){
					res.done = true;
				} else {
					watch(
						that,
						function(options,task){
							if (this._processes[id] === undefined){
								cancelTask(task);
								res.value = false;
								res.done = true;
								fC.call(thenable);
							}
							return this._processes[id];
						},
						function(){res.done = true;},
						null
					);
				}
			} else {
				res.value = false;
				res.done = true;
				fC.call(thenable);
			}
			return res;
		}).then(function(value){
			value && this._that._repeat(fR,rest,options,id,seed,controller,fC);
		});
	};
	/*
	###############################
	############ASYNC##############
	###############################
	*/
	/*
	###############################
	###########UTILITY#############
	###############################
	*/
	prt.isInView = function(node,framesToKeep) {
		if(!!node){
			if(node.nodeType !== 1){
				return false;
			} else if (node.hasOwnProperty("_isInView")) {
				return node._isInView;
			}
		} else {
			return false;
		};
		var rect = node.getBoundingClientRect(),
			clH = Math.max(document.documentElement.clientHeight,window.innerHeight);
		this.skipFrames(+framesToKeep || 3).then(function(){delete node._isInView;});
		return node._isInView = !(rect.top > clH || rect.bottom < 0);
	};
	prt.throttle = function(f, rest, nFrames){
		nFrames = +nFrames || 0;
		var that = this,
			recurse = function(rest, args){f.call(this,args[0],rest,args);recurse.busy = false;};
		recurse.busy = false;
		return function(){
			if(recurse.busy){return}
			recurse.busy = true;
			that.skipFrames(+nFrames,rest).then(recurse, arguments);
		}
	};
	prt.duration = function(str){return new Duration(str);};
	/*
	###############################
	###########UTILITY#############
	###############################
	*/
	/*
	###############################
	###########INLINES#############
	###############################
	*/
	var watchTest = function(opts,task){
		var that = opts.that,
			thenable = opts.thenable,
			nFrames = opts.nFrames,
			_breaker = opts._breaker,
			argObj = opts.argObj,
			value = argObj.value;
		if(_breaker.value) {
			cancelTask(task);
			return false;
		}
		if(value && value._instance === that.skipFrames) {
			if(!value._invoked) {
				value.then(function(x){
					argObj.value = x;
				});
			} else if (value._isErrored){
				argObj.value = value._lastError;
				return true && (thenable.status.isCompleted = true);
			}
			return false;
		}
		return +argObj.done && nFrames.decrement() <= 0 && (thenable.status.isCompleted = true);
	},
	watchAction = function(opts){
		var that = opts.that,
			thenable = opts.thenable,
			_breaker = opts._breaker,
			argObj = opts.argObj,
			value = argObj.value,
			retVal = opts.retVal,
			placeholder = null,
			isExtractable = false;
		if(value instanceof Error){
			retVal.value = thenable._lastError = value;
			thenable._isErrored = true;
		} else {
			try {
				breaker = _breaker;
				placeholder = opts.f.call(thenable, value, opts.rest);
				if(!(isExtractable = that.skipFrames.isExtractable(placeholder))) {
					if ((retVal.value = placeholder) instanceof Error ){
						throw retVal.value;
					};
				}
			} catch (e) {
				retVal.value = thenable._lastError = e;
				thenable._isErrored = true;
			} finally {
				breaker = null;
			}
		}
		opts.placeholder = placeholder;
		if(isExtractable) {
			watchImmediate(
				null,
				watchImmediateTest,
				watchImmediateAction,
				opts
			);
		} else {
			retVal.done = true;
			that.skipFrames.PerformCatch(that,thenable,retVal);
		}
	},
	watchImmediateTest = function(opts,task){
		if(opts._breaker.value){
			cancelTask(task);
			return false;
		}
		return opts.placeholder.done;
	},
	watchImmediateAction = function(opts){
		var that = opts.that,
			thenable = opts.thenable,
			retVal = opts.retVal;
		that
		.skipFrames
		.Extractor(that,thenable,retVal,opts.placeholder)
		.PerformCatch(that,thenable,retVal);
	};
	/*
	###############################
	###########INLINES#############
	###############################
	*/
	/*
	################################
	############ERRORS##############
	################################
	*/
	Object.defineProperties(
		prt,
		{
			_recursionError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("An error has occured during recursion");}
			},
			_validityError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Value Is Not Validated By Specified Function");}
			},
			_visibilityError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Not In View Of Viewport");}
			},
			_nonTruthyError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Value Cannot Be Converted To Truthy");}
			},
			_nonFalseyError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Value Cannot Be Converted To Falsey");}
			},
			_nonBooleanCovertibleError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Value Cannot Be Converted To Boolean");}
			},
			_missingErrorError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("Thenable marked as errored, but there is no error object attached");}
			},
			_repetitionError: {
				enumerable: false,
				configurable: false,
				get: function(){return new Error("An error has occured during repetition");}
			}
		}
	);
	/*
	################################
	############ERRORS##############
	################################
	*/
	return new Rafx();
}));