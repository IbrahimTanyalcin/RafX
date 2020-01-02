(function umdOuter(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.rafx = factory();
  }
}(this, function umdInner() {
  /*
	###############################
	###########INTERNALS###########
	###############################
  */
  function Rafx() {
    this._processes = {};
  }
  var prt = Rafx.prototype;
  var generateRandomString = function generateRandomString() {
    return (Math.random() * 1e9 | 0).toString(16);
  };
  var generateRandomID = function generateRandomID() {
    return generateRandomString() + generateRandomString();
  };
  var randomSeed = generateRandomID();
  var objProHasOwnProp = Object.prototype.hasOwnProperty;
  var noOP = function noOP() {};
  var identity = function identity(v) {return v;};
  var boolRev = function boolRev(v) {return !v;};
  var breaker = null;
  var max = Math.max;
  var getDonePointer = function getDonePointer(thenable, options) {
    var status = options && typeof options.done !== 'undefined'
      ? options.done
      : thenable.status;
    var _thenable = status.thenable;
    if (!_thenable._child) {
      _thenable.then(noOP);
    }
    return status;
  };
  var checkErrorTree = function checkErrorTree(thenable) {
    var lastError = null;
    var _thenable = thenable;
    while (_thenable) {
      if (_thenable._isErrored) {
        lastError = _thenable._lastError;
        if (lastError) {
          return lastError;
        }
        throw (prt._missingErrorError);
      }
      _thenable = _thenable && _thenable._child;
    }
    return null;
  };
  var poke = function poke(thenable) {
    thenable.isCompleted || thenable.then(noOP).catch(noOP);
    return thenable;
  };
  var assign = function assign(target) {
    var sources = Array.prototype.slice.call(arguments).slice(1);
    var d;
    var i;
    var l = sources.length;
    var a;
    var lA;
    var j;
    var k;
    for (i = 0; i < l; ++i) {
      d = Object(sources[i]);
      a = Object.getOwnPropertyNames(d);
      lA = a.length;
      for (j = 0; j < lA; ++j) {
        k = a[j];
        target[k] = d[k];
      }
    }
    return target;
  };
  var cancelTask = function cancelTask(ngin, id) {
    var tasks = ngin.tasks;
    if (tasks[id]) {
      delete tasks[id];
      --tasks.keys;
    }
  };
  function Controller(id, instance) {
    this.id = id;
    this.instance = instance;
  }
  function Status(thenable, instance) {
    this.thenable = thenable;
    this.instance = instance;
    this.isCompleted = false;
  }
  function Duration(str) {
    var _str = str + '';
    var match = _str && _str.match(this.rgx);
    this.unit = 'f';
    this.val = 1;
    if (match) {
      this.set.unit(match[2] || '').val(match[1]);
    }
  }
  function Ngin() {
    var that = this;
    this.tasks = Object.defineProperty(
      {},
      'keys',
      {
        enumerable: false,
        configurable: false,
        writable: true,
        value: 0
      }
    );
    this.frame = null;
    this.stroke = function stroke(t) {
      // console.log("fire up");
      that.process(t);
    };
    this.cancelFrame = function cancelFrame() {
      window.cancelAnimationFrame(that.frame);
    };
  }
  function ImmediateNgin() {
    var that = this;
    this.tasks = Object.defineProperty(
      {},
      'keys',
      {
        enumerable: false,
        configurable: false,
        writable: true,
        value: 0
      }
    );
    this.frame = null;
    this.stroke = function stroke(t) {
      // console.log("fire up immediate");
      that.process(t);
    };
    this.cancelFrame = function cancelFrame() {
      window.cancelAnimationFrame(that.frame);
    };
  }
  /*
	###############################
	#############WATCH#############
	###############################
	*/
  // copied from Mutaframe.com - modified
  var watch = function watch(obj, test, action, options) {
    var id = generateRandomID();
    ngin.push({
      obj: obj,
      test: test,
      action: action,
      options: options,
      id: id
    });
    return id;
  };
  var watchImmediate = function watchImmediate(obj, test, action, options) {
    var id = generateRandomID();
    immediateNgin.push({
      obj: obj,
      test: test,
      action: action,
      options: options,
      id: id,
      processed: -1
    });
    return id;
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
        get: function kill() {delete this.instance._processes[this.id];}
      },
      pause: {
        enumerable: false,
        configurable: false,
        get: function pause() {this.instance._processes[this.id] = false;}
      },
      resume: {
        enumerable: false,
        configurable: false,
        get: function resume() {this.instance._processes[this.id] = true;}
      }
    }
  );
  Object.defineProperties(
    Status.prototype,
    {
      code: {
        enumerable: false,
        configurable: false,
        get: function code() {return this.isCompleted ? 1 : 0;}
      },
      string: {
        enumerable: false,
        configurable: false,
        get: function string() {return this.text;}
      },
      text: {
        enumerable: false,
        configurable: false,
        get: function text() {
          var retVal;
          if (this.isCompleted) {
            retVal = 'completed';
          } else if (this._invoked) {
            retVal = 'pending';
          } else {
            retVal = 'idle';
          }
          return retVal;
        }
      },
      valueOf: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function valueOf() {return this.code;}
      }
    }
  );
  Object.defineProperty(
    Duration.prototype,
    'set',
    {
      configurable: false,
      enumerable: false,
      get: function set() {
        var that = this;
        function value(v) {return that.setVal.call(that, v);}
        function unit(v) {return that.setUnit.call(that, v);}
        function valueOf() {return +that;}
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
          s: that,
          valueOf: valueOf
        };
      }
    }
  );
  Duration.prototype.rgx = /\s*([0-9]+|Infinity)\s*([a-z]+)?\s*/;
  Duration.prototype.trimRgx = /^\s*|\s*$/gi;
  Duration.prototype.keywords = {
    '': 'f',
    f: 'f',
    frames: 'f',
    frame: 'f',
    ms: 'ms',
    milliseconds: 'ms',
    millisecond: 'ms',
    s: 's',
    second: 's',
    seconds: 's',
    min: 'min',
    mins: 'min',
    minute: 'min',
    minutes: 'min'
  };
  Duration.prototype.unitToFrames = {
    f: 1,
    ms: 1 / 16.67,
    s: 60,
    min: 3600
  };
  Duration.prototype.setVal = function setVal(v) {
    this.val = max(+v, 1) || 1;
    return this.set;
  };
  Duration.prototype.setUnit = function setUnit(v) {
    var _v = ('' + v.replace(this.trimRgx, '')).toLowerCase();
    var retVal;
    if (~Object.keys(this.keywords).indexOf(_v)) {
      retVal = this.setVal(+this / this.unitToFrames[this.keywords[this.unit = _v]]);
      return retVal;
    }
    throw new SyntaxError(
      'Unit is not one of allowed keywords. '
				+ 'For a list of allowed keywords, '
				+ "inspect 'rafx.Duration.prototype.keywords'. "
    );
  };
  Duration.prototype.step = function step(v, _step) {
    var unit = this.unit;
    var diff = +this + _step * +(new Duration(v));
    return this.set.unit('frame').val(diff).unit(unit).self;
  };
  Duration.prototype.decrement = function decrement(v) {
    return this.step(v, -1);
  };
  Duration.prototype.increment = function increment(v) {
    return this.step(v, 1);
  };
  Duration.prototype.valueOf = function valueOf() {
    return this.unitToFrames[this.keywords[this.unit]] * this.val;
  };
  Object.defineProperties(
    Ngin.prototype,
    {
      push: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function value(taskObj) {
          var tasks = this.tasks;
          var length = tasks.keys;
          tasks[taskObj.id] = taskObj;
          ++tasks.keys;
          if (!length) {
            window.requestAnimationFrame(this.stroke);
          }
        }
      },
      process: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function value() {
          var isEmpty = true;
          var id = null;
          var task = null;
          var tasks = this.tasks;
          var obj = null;
          var test = null;
          var action = null;
          var options = null;
          for (id in tasks) {
            if (objProHasOwnProp.call(tasks, id)) {
              isEmpty && (isEmpty = false);
              task = tasks[id];
              obj = task.obj;
              test = task.test;
              action = task.action;
              options = task.options;
              if (test.call(obj, options, id)) {
                action.call(obj, options);
                cancelTask(this, id);
              }
            }
          }
          if (!isEmpty && tasks.keys) {
            this.frame = window.requestAnimationFrame(this.stroke);
          }
        }
      }
    }
  );
  Object.defineProperties(
    ImmediateNgin.prototype = Object.create(Ngin.prototype),
    {
      push: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function value(taskObj) {
          var tasks = this.tasks;
          tasks[taskObj.id] = taskObj;
          ++tasks.keys;
          this.cancelFrame();
          this.stroke();
        }
      },
      process: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function value(timestamp) {
          var isEmpty = true;
          var id = null;
          var task = null;
          var tasks = this.tasks;
          var obj = null;
          var test = null;
          var action = null;
          var options = null;
          var processed = null;
          var manCall = typeof timestamp === 'undefined' ? true : false;
          for (id in tasks) {
            if (objProHasOwnProp.call(tasks, id)) {
              isEmpty && (isEmpty = false);
              task = tasks[id];
              processed = ~task.processed;
              if (manCall) {
                if (processed) {
                  continue;
                } else {
                  task.processed = processed;
                }
              }
              obj = task.obj;
              test = task.test;
              action = task.action;
              options = task.options;
              if (test.call(obj, options, id)) {
                action.call(obj, options);
                cancelTask(this, id);
              }
            }
          }
          if (!isEmpty && tasks.keys) {
            this.frame = window.requestAnimationFrame(this.stroke);
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
  var ngin = new Ngin();
  var immediateNgin = new ImmediateNgin();
  /*
	###############################
	############ASYNC##############
	###############################
	*/
  prt.version = '0.0.0';
  prt.skipFrames = function skipFrames(nFrames, argObj, parent, catcher, _breaker) {
    var __breaker = breaker || _breaker || {value: false};
    var _nFrames = nFrames instanceof this.skipFrames.Timer ? nFrames : new this.skipFrames.Timer(nFrames);
    var that = this;
    var _argObj = argObj;

    if (typeof argObj !== 'object') {
      _argObj = {value: argObj, done: true};
    } else if (that.skipFrames.isExtractable(argObj)) {
      void (0);
    } else {
      _argObj = {value: argObj, done: true};
    }

    return new this.Thenable(this, _nFrames, _argObj, catcher, __breaker);
  };
  prt.Thenable = function Thenable(instance, nFrames, argObj, catcher, _breaker) {
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
    this.status = new Status(this, instance);
  };
  prt.Thenable.prototype.valueOf = function valueOf() {
    return +this._invoked * +!this._isErrored * this.status.code;
  };
  prt.Thenable.prototype.then = function then(f, rest) {
    this._invoked = true;
    var _breaker = this._breaker;
    var that = this._that;
    var nFrames = this._nFrames;
    var argObj = this._argObj;
    var thenable = this;
    var retVal = this._retVal = {value: void (0), done: false};
    var placeholder = null;
    var isExtractable = false;
    watch(
      that,
      function test(_nFrames, id) {
        if (_breaker.value) {
          cancelTask(ngin, id);
          return false;
        }
        if (argObj.value && argObj.value._instance === that.skipFrames) {
          if (!argObj.value._invoked) {
            argObj.value.then(function test1(x) {
              argObj.value = x;
            });
          } else if (argObj.value._isErrored) {
            argObj.value = argObj.value._lastError;
            return true && (thenable.status.isCompleted = true);
          }
          return false;
        }
        return +argObj.done && _nFrames.decrement() <= 0 && (thenable.status.isCompleted = true);
      },
      function action() {
        if (argObj.value instanceof Error) {
          retVal.value = thenable._lastError = argObj.value;
          thenable._isErrored = true;
        } else {
          try {
            breaker = _breaker;
            placeholder = f.call(thenable, argObj.value, rest);
            isExtractable = that.skipFrames.isExtractable(placeholder);
            if (!isExtractable) {
              retVal.value = placeholder;
              if (placeholder instanceof Error ) {
                throw retVal.value;
              }
            }
          } catch (e) {
            retVal.value = thenable._lastError = e;
            thenable._isErrored = true;
          } finally {
            breaker = null;
          }
        }
        if (isExtractable) {
          watchImmediate(
            null,
            function immediateTest(empty, id) {
              if (_breaker.value) {
                cancelTask(immediateNgin, id);
                return false;
              }
              return placeholder.done;
            },
            function immediateAction() {that.skipFrames.extractor(that, thenable, retVal, placeholder).performCatch(that, thenable, retVal);},
            null
          );
        } else {
          retVal.done = true;
          that.skipFrames.performCatch(that, thenable, retVal);
        }
      },
      nFrames
    );
    this._child = that.skipFrames(new that.skipFrames.Timer(1), retVal, this, this._catch, _breaker);
    return this._child;
  };
  prt.Thenable.prototype.break = function thenablePrototypeBreak() {
    this._breaker.value = true;
    return this;
  };
  prt.Thenable.prototype.fThen
	= prt.Thenable.prototype.forceThen
	= prt.Thenable.prototype.force
	= function fThen(f, rest, options) {
          var thenable = this;
          var that = this._that;
          var argObj = this._argObj;
          var _breaker = this._breaker;
          poke(thenable);
          return that.async(
            {
              value: argObj,
              done: getDonePointer(thenable, options)
            },
            null,
            null,
            _breaker
          ).then(function fThen1(v) {
            var isError = v.value instanceof Error;
            var result = {value: null, done: false};
            if (!isError) {
              thenable.then(function fThen2(_v) {
                return (f || identity).call(this, _v, rest);
              }).then(function fThen3(_v) {
                result.value = {value: _v};
                result.done = true;
              }).catch(function fThenCatch(e) {
                result.value = {value: e};
                result.done = true;
              });
            } else {
              result.value = {value: (options && options.throw) || v.value};
              result.done = true;
            }
            return result;
          }).catch(this._catch);
        };
  prt.Thenable.prototype.skipFrames = function skipFrames(_nFrames) {
    var that = this._that;
    var argObj = this._argObj;
    var _breaker = this._breaker;
    return this.then(function skipFrames1() {return that.skipFrames(new that.skipFrames.Timer(_nFrames), argObj, this, this._catch, _breaker);});
  };
  prt.Thenable.prototype.toBool = function toBool(f, rest, options) {
    var thenable = this;
    var that = this._that;
    var argObj = this._argObj;
    var _breaker = this._breaker;
    poke(thenable);
    return that
      .async(
        {
          value: argObj,
          done: getDonePointer(thenable, options)
        },
        null,
        null,
        _breaker
      ).then(function toBool1(v) {
        var isError = v.value instanceof Error;
        var error = null;
        if (!isError) {
          return thenable.then(function toBool2(_v) {return (f || identity).call(this, !!_v, rest);});
        }
        error = (options && options.throw) || that._nonBooleanCovertibleError;
        options && (options.error = error);
        throw (error);
      }).catch(this._catch);
  };

  prt.Thenable.prototype.filter = function filter(f, rest, options) {
    var thenable = this;
    var that = this._that;
    var argObj = this._argObj;
    var _breaker = this._breaker;
    poke(thenable);
    return that
      .async(
        {
          value: argObj,
          done: getDonePointer(thenable, options)
        },
        null,
        null,
        _breaker
      ).then(function filter1(v) {
        if (v.value && v.value._instance === that.skipFrames) {
          return v.value.then(function filter2(_v) {return {value: _v};});
        }
        return {value: v, done: true};
      }).then(function filter3(v) {
        var isError = v.value instanceof Error;
        var error = isError ? v.value : null;
        if (!isError && (f || identity).call(thenable, v.value, rest)) {
          return that.async(v.value, null, null, _breaker);
        }
        error = (options && options.throw) || error || that._validityError;
        options && (options.error = error);
        throw (error);
      }).catch(noOP);
  };

  prt.Thenable.prototype.ifTruthy = function ifTruthy(f, rest, options) {
    return this.filter(
      identity,
      null,
      assign(
        {throw: this._that._nonTruthyError},
        options
      )
    ).then(f || identity, rest);
  };
  prt.Thenable.prototype.ifFalsey = function ifFalsey(f, rest, options) {
    return this.filter(
      boolRev,
      null,
      assign(
        {throw: this._that._nonFalseyError},
        options
      )
    ).then(f || identity, rest);
  };

  function thenableRecurse(f, rest, validator, _finally) {
    var thenable = this;
    var error = checkErrorTree(thenable);
    var options = {};
    if (error) {
      _finally && _finally.call(thenable, '__fail', rest, {error: error});
      return;
    }
    thenable
      .then(function thenableRecurse1(v) {return f.call(this, v, rest);})
      .filter(validator, rest, options)
      .then(function thenableRecurse2(v) {_finally && _finally.call(thenable, v, rest);})
      .catch(function thenableRecurseCatch(v) {
        if (v instanceof Error && v !== options.error) {
          thenable._isErrored = true;
          thenable._lastError = v;
        }
        thenableRecurse.call(thenable, f, rest, validator, _finally);
      });
  }
  prt.Thenable.prototype.Untillable = function Untillable(that, thenable, state, f, rest) {
    this.that = that;
    this.thenable = thenable;
    this.state = state;
    this.f = f;
    this.rest = rest;
    this._breaker = thenable._breaker;
  };
  prt.Thenable.prototype.Untillable.prototype.until = function until(validator) {
    var that = this.that;
    var state = this.state;
    var _breaker = this._breaker;
    var error;
    thenableRecurse.call(this.thenable, this.f, this.rest, validator, function until1(v, rest, options) {error = options && options.error; state.value = v; state.done = true;});
    return that.async(state, null, null, _breaker).then(function until2(v) {if (v === '__fail') {throw error || that._recursionError;} else {return v;}});
  };
  prt.Thenable.prototype.Untillable.prototype.while = function untillableWhile(validator) {
    var that = this.that;
    var state = this.state;
    var negValidator = function negValidator(v, rest) {return !(validator || identity).call(this, v, rest);};
    var _breaker = this._breaker;
    var error;
    thenableRecurse.call(this.thenable, this.f, this.rest, negValidator, function while1(v, rest, options) {error = options && options.error; state.value = v; state.done = true;});
    return that.async(state, null, null, _breaker).then(function while2(v) {if (v === '__fail') {throw error || that._recursionError;} else {return v;}});
  };
  prt.Thenable.prototype.recurse = prt.Thenable.prototype.loop = prt.Thenable.prototype.do = function recurse(f, rest) {
    var that = this._that;
    var thenable = this;
    var o = {value: void (0), done: false};
    return new thenable.Untillable(that, thenable, o, f, rest);
  };
  prt.ifInView = function ifInView(node, framesToKeep) {
    return this.async(this.isInView(node, framesToKeep)).ifTruthy();
  };
  prt.ifNotInView = function ifNotInView(node, framesToKeep) {
    return this.async(this.isInView(node, framesToKeep)).ifFalsey();
  };
  prt.Thenable.prototype.catch = function thenableCatch(f) {
    if (typeof f === 'function') {
      this._catch = f;
    }
    return this;
  };
  prt.skipFrames.catcher = function skipFramesCatcher(e) {throw e;};
  prt.skipFrames.performCatch = function skipFramesPerformCatch(instance, thenable, retVal) {
    var child = thenable._child;
    var value = retVal.value;
    var isError = value instanceof Error;
    var isHandled = isError && value._isHandled;
    var defaultCatcher = prt.skipFrames.catcher;
    var catcher = (child && child._catch) || thenable._catch || defaultCatcher;
    var mustCall = catcher !== defaultCatcher;
    if (!(child && child._invoked) && thenable._isErrored) {
      if ((isError && !isHandled) || !isError || mustCall) {
        value._isHandled = true;
        catcher.call(thenable, value);
      }
    }
  };
  prt.skipFrames.extractor = function skipFramesExtractor(instance, thenable, retVal, placeholder) {
    retVal.value = placeholder.value;
    retVal.done = placeholder.done;
    if (retVal.value instanceof Error) {
      thenable._isErrored = true;
      thenable._lastError = retVal.value;
    }
    return instance.skipFrames;
  };
  prt.skipFrames.isExtractable = function isExtractable(o) {
    return o
			&& typeof o === 'object'
			&& o.hasOwnProperty('done')
			&& o.hasOwnProperty('value');
  };
  prt.skipFrames.Timer = function skipFramesTimer(counter) {
    this.counter = +counter || 1;
  };
  prt.skipFrames.Timer.prototype.valueOf = function skipFramesValueOf() {
    return this.counter;
  };
  prt.skipFrames.Timer.prototype.decrement = function skipFramesDecrement() {
    --this.counter;
    return this;
  };
  prt.async = function rafxAsync(o, rest, thisArg, _breaker) {
    return this.skipFrames(1, typeof o === 'function' ? o.call(thisArg || null, rest) : o, void (0), void (0), _breaker);
  };
  prt.repeat = function rafxRepeat(f, rest, options) {
    var that = this._that;
    var id = generateRandomID();
    var controller = new Controller(id, this);
    var thisArg = (options && options.thisArg) || null;
    var handler = typeof (options && options.handler) === 'function'
      ? options.handler
      : null;
    var fR = function fR() {
      return f.call(
        thisArg,
        rest,
        controller
      );
    };
    var fC = function fC(errorArg) {
      controller.kill;
      if (errorArg) {
        var error = (options && options.throw)
						|| errorArg
						|| that._repetitionError;
        options && (options.error = errorArg);
        if (handler) {
          handler.call(thisArg, error, rest);
        } else {
          throw (error);
        }
      } else if (handler) {
        handler.call(thisArg, null, rest);
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
  prt._repeat = function _rafxRepeat(fR, rest, options, id, seed, controller, fC) {
    if (seed !== randomSeed) {
      throw ( new Error('Cannot be manually called.'));
    }
    this.async()
      .then(function _rafxRepeat1() {return fR();})
      .catch(fC)
      .then(function _rafxRepeat2() {
        var res = {value: true, done: false};
        var thenable = this;
        var that = this._that;
        if (that._processes.hasOwnProperty(id)) {
          if (that._processes[id]) {
            res.done = true;
          } else {
            watch(
              that,
              function _rafxRepeatTest(_options, ID) {
                if (this._processes[id] === void (0)) {
                  cancelTask(ngin, ID);
                  res.value = false;
                  res.done = true;
                  fC.call(thenable);
                }
                return this._processes[id];
              },
              function _rafxRepeatAction() {res.done = true;},
              null
            );
          }
        } else {
          res.value = false;
          res.done = true;
          fC.call(thenable);
        }
        return res;
      }).then(function _rafxRepeat3(value) {
        value && this._that._repeat(fR, rest, options, id, seed, controller, fC);
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
  prt.isInView = function isInView(node, framesToKeep) {
    if (!!node) {
      if (node.nodeType !== 1) {
        return false;
      } else if (node.hasOwnProperty('_isInView')) {
        return node._isInView;
      }
    } else {
      return false;
    }
    var rect = node.getBoundingClientRect();
    var clH = Math.max(document.documentElement.clientHeight, window.innerHeight);
    this.skipFrames(+framesToKeep || 3).then(function isInView1() {delete node._isInView;});
    node._isInView = !(rect.top > clH || rect.bottom < 0);
    return node._isInView;
  };
  prt.throttle = function throttle(f, rest, nFrames) {
    var _nFrames = +nFrames || 0;
    var that = this;
    var recurse = function throttleRecurse(_rest, args) {f.call(this, args[0], _rest, args); recurse.busy = false;};
    recurse.busy = false;
    return function throttleInner() {
      if (recurse.busy) {return;}
      recurse.busy = true;
      that.skipFrames(+_nFrames, rest).then(recurse, arguments);
    };
  };
  prt.duration = function duration(str) {return new Duration(str);};
  /*
	###############################
	###########UTILITY#############
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
        get: function _recursionError() {return new Error('An error has occured during recursion');}
      },
      _validityError: {
        enumerable: false,
        configurable: false,
        get: function _validityError() {return new Error('Value Is Not Validated By Specified Function');}
      },
      _visibilityError: {
        enumerable: false,
        configurable: false,
        get: function _visibilityError() {return new Error('Not In View Of Viewport');}
      },
      _nonTruthyError: {
        enumerable: false,
        configurable: false,
        get: function _nonTruthyError() {return new Error('Value Cannot Be Converted To Truthy');}
      },
      _nonFalseyError: {
        enumerable: false,
        configurable: false,
        get: function _nonFalseyError() {return new Error('Value Cannot Be Converted To Falsey');}
      },
      _nonBooleanCovertibleError: {
        enumerable: false,
        configurable: false,
        get: function _nonBooleanCovertibleError() {return new Error('Value Cannot Be Converted To Boolean');}
      },
      _missingErrorError: {
        enumerable: false,
        configurable: false,
        get: function _missingErrorError() {return new Error('Thenable marked as errored, but there is no error object attached');}
      },
      _repetitionError: {
        enumerable: false,
        configurable: false,
        get: function _repetitionError() {return new Error('An error has occured during repetition');}
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
