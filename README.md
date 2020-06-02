# RafX

[![Build Status](https://travis-ci.org/IbrahimTanyalcin/RafX.svg?branch=master)](https://travis-ci.org/IbrahimTanyalcin/RafX)
[![NPM](https://nodei.co/npm/rafx.png)](https://nodei.co/npm/rafx/)
[![DOI](https://zenodo.org/badge/212623332.svg)](https://zenodo.org/badge/latestdoi/212623332)
![David](https://img.shields.io/david/IbrahimTanyalcin/rafx.svg)

Rafx is a *promise-like* implementation solely based on `window.requestAnimationFrame` (rAF)

<img width="150" alt="Gif" style="border-radius:10px; display:block; margin:auto;" src="./src/util/rafx.gif">

## Supported Browsers

Anything equal to or above Internet Explorer 9.

## Installation
<hr>

### Server Side

You cannot use RafX directly on nodeJS, but you can install as a dependency:

```
npm install rafx
```
 ### Client Side

#### jsDelivr

##### latest minified version

```
<script src="https://cdn.jsdelivr.net/npm/rafx"></script>
```

##### specific version

```
<script src="https://cdn.jsdelivr.net/npm/rafx@0.0.9/dist/rafx.v0.0.10.dev.js"></script>
```

#### Distreau
```
<script src="https://distreau.com/rafx/js/rafx.v0.0.10.min.js"></script>
```

## Usage

You can mix and match below patterns, in any way you want.

### Thenable Pattern:

```
    rafx.async("mixedVariable")

    .then(function(mixed,args){
        
        //do something..

        //return a 'thenable' if you like

        return rafx
                .async()
                .then(..);

    },"passAdditionalArgs")

    .skipFrames(30) //wait half a second if you like

    .then(..) //continue
```

### Observer Pattern:

```
    rafx.async("mixedVariable")

    .then(function(mixed,args){
        
        //do something..

        //when done: true is observed, execution continues
        return {
            value:"whatever",
            done: false
        };
    
    },"passAdditionalArgs")

    .skipFrames(30) //wait half a second if you like

    .then(..) //continue
```
## Advantages

- Unites all `requestAnimationFrame` calls, under a single engine object.
- Ability to catch errors without disturbing other items/animations.
- Aggressive break function allowing any nested thenables to terminate.

## Why don't you just..

Most animations consist of:
 1. layout calculation
 2. remapping a value "t" between 0 - 1
 3. moving the pieces according to the layout based the value of t
 4. Rinse & repeat

Many other tasks that have nothing to do with animations also require steps similar to 3 and 4. Tasks that need to follow each other usually don't require micro second level execution.

All above can be combined under a **single** `requestAnimationFrame` (`rAF`)call.

RafX is an attempt to unify animations and general purpose scheduled tasks.

## Testing
<hr>

After installing rafx, install dev dependencies:
```
npm install rafx --dev
```

To run the tests sequentially:
```
npm run testDevBand && npm run testMinBand
```

To run them parallel:
```
npm run testDev && npm run testMin
```

### Covarage

Unfortunately it was not possible to get coverage reports when using puppeteer with jest. Almost all exposed methods are [tested](./src/test)

## Examples
<hr>

Follow below examples in order

- Move an HTML element to left: [\<fiddle\>](https://jsfiddle.net/ibowankenobi/rj1y82f0/)
- Move an HTML element to left,  wait 250ms, then move it down: [\<fiddle\>](https://jsfiddle.net/ibowankenobi/hqg8jkbf/)
- Move an HTML element around a rectangle, and do it infinitely: [\<fiddle\>](https://jsfiddle.net/ibowankenobi/6tk0qepb/)
- Move an HTML element infinitely, with an ability to pause: [\<fiddle\>](https://jsfiddle.net/ibowankenobi/9q3rxLny/)
- Move an HTML element infinitely, with an ability to break: [\<fiddle\>](https://jsfiddle.net/ibowankenobi/kcfLhobt/)

## Methods

### *rafx.skipFrames(frameCount[, args])* [<prt.skipFrames>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L376-L387)
<hr>
Waits a certain amount of frames. If a number is passed, it is assumed to be frame count. For instance a frame count of 15 is approximately 250 ms (1 second ~= 60 frames)

An additional argument can be given to be passed to the next thenable:

```
    rafx
    .skipFrames(20,{value:"whatever", done: false})
    .then(function(v){ //v === "whatever"
        ..
    })
```

If the passed argument does not have `value` or `done` properties, it is automatically wrapped with an object `{value: "your argument", done: true}` and passed on to the next thenable.

If no arguments are given, `undefined` is passed.

#### Returns

`Thenable`

### *rafx.async(mixed[, args[, thisArg]])* [<prt.async>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L702-L704)
<hr>

Passes a mixed variable to be used within a `thenable` immediately. If the mixed variable is a function, then that function is executed with `args` and with this pointing to `thisArg`:

```
mixed.call(thisArg || null, rest)
```

If the mixed is not a function, it is passed directly:

```
rafx.async("whatever")
    .then(function(v){
        //v is "whatever"
    });
```

#### Returns

`Thenable`

### *thenable.then(function[, args])* [<prt.Thenable.prototype.then>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L404-L425)
<hr>

Executes the passed function with the arguments given, if any and `this` pointing out to the current thenable. You can return another `thenable` instance, use the observer pattern, or use any other mixed variable (refer to Usage section):

```
rafx.async() //returns a thenable, let's call it thenable 1 
    .then(function(){
        //here 'this' refers to thenable 1
        return "mixed";
    }) // returns a new thenable, let's call it thenable 2
    .then(function(v){
        //here 'this' refers to thenable 2
        //v === "mixed"
    })
```

You can inspect `thenable.status` to receive information about its state which fluctuates between "completed", "pending" and "idle".

#### Returns

`Thenable`

### *thenable.forceThen(function[, args[, options]])* 
### *thenable.force(function[, args[, options]])* 
### *thenable.fThen(function[, args[, options]])* 
### [<prt.Thenable.prototype.fThen>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L430-L466)
<hr>

Executes the passed function with the arguments given, if any and `this` pointing out to the current thenable (the thenable that `force` is called from). You can return another `thenable` instance, use the observer pattern, or use any other mixed variable (refer to Usage section).

The difference between `force` and `then` is that `Error` objects thrown or returned from upstream or inside the `force` does not cause `catch` to trigger (if any catch is registered). The following `then` receives what is returned from `force` or the thrown `Error` encapsulated in an object of form `{value: ..}`

```
rafx.async(1)
    .then(function(v){
        return ++v;
    })
    .force(function(v){
        //v === 2
    })
```

```
rafx.async(1)
    .then(function(v){
        throw new Error("this will not trigger catch, if any");
    })
    .force(function(v){
        //bypassed and upstream Error is encapsulated {value: Error}
    })
    .then(function(v){
        v.value.message; //"this will not trigger catch, if any"
    })
```

The options objects accepts  `throw` property. This property, referring to another `Error`object, can override what is thrown by default:

```
rafx
    .async(5)
    .then(function(v){
        throw new Error("wrong error");
    })
    .filter(function(v){
        return v > 10;
    }, null, {throw: new Error("right error")})
    .then(function(v){
        //not executed
    }).catch(function(e){
        e.message; //"right error" 
    });
```

#### Returns

`Thenable`

### *thenable.filter(function[, args[, options]])* [<prt.Thenable.prototype.filter>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L501-L533)
<hr>

Executes the passed function with the arguments given, if any and `this` pointing out to the current thenable (the thenable that `filter` is called from). You can return another `thenable` instance, use the observer pattern, or use any other mixed variable (refer to Usage section). If the function returns truthy, then rest of the `thenable` chain is executed, being passed the last return value immediately upstream of the filter clause, otherwise silently fails.

```
rafx.async()
    .then(function(){
        return 0;
    })
    .filter(function(v){
        return v; //v === 0, not truthy, so next thenable is NOT executed
    })
    .then(function(v){
        ..
    })
```

The options objects accepts 2 properties, `throw` and `done`. Normally the filter executes when the upstream thenable is complete (including all the nested thenables within), but the `done` property can point to another `thenable`'s status property, allowing the filter clause to execute when that thenable is complete:

```
const = anotherThenable = rafx
    .async()
    .skipFrames(180);

rafx
    .async()
    .then(function(){
        return "payload";
    })
    .filter(function(v){ //this will execute after 180 frames (3 secs)
        return v === "payload"; //truthy, so remaining chain will execute
    },null,{done:anotherThenable.status})
    .then(function(v){
        //v is "payload"
    });
```

You can also override what to be thrown:

```
rafx
    .async(5)
    .then(function(v){return v;})
    .filter(function(v){
        return v > 10;
    },null,{throw: new Error("right error")})
    .then(function(v){
        //not executed
    }).catch(function(e){
        e.message; //"right error" instead of default "Value Is Not Validated By Specified Function"
    });
```

Filter does not throw by default, but if you attach a catch clause as shown above, if any `options` argument is present, it will be populated with an `error` property. [<>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L529)

#### Returns

`Thenable`

### *thenable.toBool(function[, args[, options]])* [<prt.Thenable.prototype.toBool>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L473-L499)
<hr>

Executes the passed function with the arguments given, if any and `this` pointing out to the current thenable (the thenable that `toBool` is called from). You can return another `thenable` instance, use the observer pattern, or use any other mixed variable (refer to Usage section):

```
rafx.async(5)
    .then(function(v){
        return v + 1; //v === 6
    })
    .toBool(function(v){ //v === true
        return v && "whatever";
    }) 
    ..
```

If `toBool` is not passed a function, then identity function is assumed.

Similar to `filter`, `force` or other clauses, it can receive an options object with a `throw` property pointing to a custom `Error` to be thrown


#### Returns

`Thenable`

### *thenable.ifTruthy(function[, args[, options]])* [<prt.Thenable.prototype.ifTruthy>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L535-L544)
### *thenable.ifFalsey(function[, args[, options]])* [<prt.Thenable.prototype.ifFalsey>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L545-L554)
<hr>

Similar to `filter`. Recevies the same arguments.

`ifFalsey`:

```
//falsey
rafx
    .async(0)
    .then(function(v){ return v;})
    .ifFalsey(function(v, rest){
        //v === 0
        return "whatever";
    }, "rest")
    .then(function(v){ 
        //v === "whatever"
    });
```

`ifFalsey`:

```
rafx
    .async("payload")
    .then(function(v){ return v;})
    .ifTruthy(function(v, rest){
       //v === "payload"
       return "whatever";
    }, "rest")
    .then(function(v){
        //v === "whatever"
    });
```

You can control what to throw and the timing of the clause as in `filter`. These clauses do not throw by default, if you want to catch it, attach a `catch` handler:

```
rafx
    .async(0) //not truthy
    .ifTruthy(function(v, rest){
       return "whatever";
    }, "rest")
    .then(function(v){
        //not executed
    })
    .catch(function(e){
        console.log(e.message); //Value Cannot Be Converted To Truthy
    });
```

#### Returns

`Thenable`

### *thenable.recurse(function[, args])* 
### *thenable.loop(function[, args])* 
### *thenable.do(function[, args])* 
### [<prt.Thenable.prototype.recurse>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L597-L602)
<hr>

Executues the following function and the arguments if any, with `this` pointing out to the current thenable (the thenable that `recurse` is called from)

The function is executed until the `until` block returns true, or the `while` block return false. The thenable following the until clause will receive the latest return value from the recurse loop:

```
rafx
    .async(2)
    .recurse((v,o) => {o.i += v; return o.i;}, {i:0}) //v === 2
    .until((r,o) => r > 10)
    .then(function(r){
        //r === 12
    });
```
You can also use `while` instead of `until`

```
rafx
    .async(2)
    .recurse((v,o) => {o.i += v; return o.i;}, {i:0}) //v === 2
    .while((r,o) => r < 10)
    .then(function(r){
        //r === 10
    });
```

Do not use `recurse` with animations, because `recurse` is aware of what is returned inside the function, meaning if it is a `thenable` or series of nested thenables, `recurse` will wait for them to complete. Use `animate` instead

#### Returns

`Untillable`

### *thenable.animate(function[, args])* 
### *thenable.recurseShallow(function[, args])*  
### [<prt.Thenable.prototype.animate>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L603-L610)
<hr>

Executues the following function and the arguments if any, with `this` pointing out to the current thenable (the thenable that `animate` is called from)

The function is executed until the `until` block returns true, or the `while` block return false. The thenable following the until clause will receive the latest return value from the recurse loop:

```
const o = {i:0};
let j = 0;
rafx
    .async(2)
    .animate(function(v, rest){
        ++rest.i;
        j++;
        return v;
    }, o)
    .until(function(v, rest){
        return rest.i + v === 12;
    })
    .then(function(v){
        //v === 2
        //o.i === 10
        //j === 10
    });
```

Do not return a `thenable` inside an `animate` clause, only use ordinary objects or variables because `animate` will not wait for the thenable's completion. Use `recurse` instead.

#### Returns

`Untillable`

### *rafx.repeat(function[, args[, options]])* [<prt.repeat>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L705-L747)
<hr>

Creates a repeating function that can be controlled via a `controller`. The options argument can contain 3 fields, `throw`, `handler` and `thisArg`. All are optional.


```
rafx
    .repeat(
        function(arg, ctrl){
            // 'this' refers to "whatever"
            arg.c++;
            if(arg.c > 20){
                // your options below
                throw new Error("wrong error message"); // option 1
                ctrl.kill //option 2
                ctrl.resume //option 3
                ctrl.pause // option 4
            }
        },
        {
            c:0
        },
        {
            /*if you throw, e will be the error, if handler is specified and ctrl.kill is invoked, e will be null*/

            handler:function(e,arg){ 
                /*
                    e is either null or error object
                    arg is '{c: 0}'
                */
            },

            //you can specify what to throw
            throw: new Error("right error message"), 

            //optional this argument
            thisArg: "whatever"
        }
    );
```

`rafx.repeat` returns an id string. This id internally stored inside rafx._processes:

```
delete rafx._processes[id];
```

Above has the same effect as calling `ctrl.kill`, if no handler is specified, the repeat will cease, otherwise the handler will be called.

#### Returns

An id `string`

### *rafx.throttle(function[, args[, numberFrames]])* [<prt.throttle>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L813-L823)
<hr>

Creates a throttled function that fires maximum once every `numberFrames`:

```
const f = rafx.throttle(function(a, b, c){
    console.log(a, b, c);
}, 2, 5);

f(1, 10); //1, 2, Arguments[1, 10, callee: f, ..]
```

Above function can fire at most once every 5 frames, which is about 83ms.

#### Returns

`function`

### *rafx.isInView(node[, numberFrames])* [<prt.isInView>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L798-L812)
<hr>

Returns whether a node with `nodeType` === 1 (HTMLElement) is visible once every `numberFrames`:

```
rafx.isInView(node, 5)
```

Above will return `boolean` at most once every 5 frames, which is about 83ms.

#### Returns

`boolean`

### *rafx.ifInView(node[, numberFrames])* [<prt.ifInView>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L649-L651)
<hr>

Built on top of `isInView`, returns a `thenable` that will execute based on whether a node with `nodeType` === 1 (HTMLElement) is visible. The result will be refreshed after `numberFrames`:

```
rafx.ifInView(div,20)
    .then(function(){
        /*
            do something if the element is in view,
            otherwise silently fail,
            if you attach a catch clause, you will receive 'Value Cannot Be Converted To Truthy' Error
        */
    }
```

Above `thenable` will execute if the element is in view. Calling `rafx.ifInView(div,20)` again will return a new `thenable`, but whether the element is out of view or not will be refreshed after 20 frames (~0.33 secs)

#### Returns

`Thenable`

### *rafx.ifNotInView(node[, numberFrames])* [<prt.ifNotInView>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L652-L654)
<hr>

Built on top of `isInView`, returns a `thenable` that will execute based on whether a node with `nodeType` === 1 (HTMLElement) is NOT visible. The result will be refreshed after `numberFrames`:

```
rafx.ifNotInView(div,20)
    .then(function(){
        /*
            do something if the element is NOT in view,
            otherwise silently fail,
            if you attach a catch clause, you will receive 'Value Cannot Be Converted To Falsey' Error
        */
    }
```

Above `thenable` will execute if the element is NOT in view. Calling `rafx.ifNotInView(div,20)` again will return a new `thenable`, but whether the element is out of view or not will be refreshed after 20 frames (~0.33 secs)

#### Returns

`Thenable`

### *thenable.break()* [<prt.Thenable.prototype.break>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L426-L429)
<hr>

Breaks the  current thenable and all upstream/parent thenables. Use this if you want to cancel execution.

Breaking behavior in RafX is aggressive, nested thenables will inherit the same `breaker` from parent thenables, if you do not want the parent `thenable` to be affected, use `setTimeout`:

```
const outer = rafx
    .skipFrames(600, "payload") //wait 10 seconds and pass "payload"
    .then(function(payload){
        setTimeut(function(){
            rafx.async()

            //breaking below won't terminate outer

            .then(function(){this.break();}) 
            .then(..); //not executed due to break
        }, 0);
    })
    .then(function(){
        //do something
    });
```

#### Returns

`Thenable`

### *thenable.catch(function)* [<prt.Thenable.prototype.catch>](https://github.com/IbrahimTanyalcin/RafX/blob/master/dist/rafx.v0.0.10.dev.js#L655-L660)
<hr>

Many clauses in RafX do not throw by default and silently fail when their conditions are not met.

Similarly, errors might be thrown within ordinary thenables. For all these cases you can attach a `catch` to the thenable. It does not matter where you attach the `catch`, the last one overwrites the previous:

```
rafx.async()
    .then(function(){
        this._identifier = "thenable 1";
        var err = new Error("Custom Error");
        err._this = this;
        throw err;
    })
    .catch(function(e){
        console.log("catch-1", e._this._identifier);
    })
    .then(function(){
        this._identifier = "thenable 2";
        var err = new Error("Custom Error");
        err._this = this;
        throw err;
    })
    .catch(function(e){
        console.log("catch-2", e._this._identifier);
    })
    .then(function(){
        this._identifier = "thenable 3";
        var err = new Error("Custom Error");
        err._this = this;
        throw err;
    });

/*
    OUTPUT
    catch-2 thenable 1
*/
```

