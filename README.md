# async-hooks-ignore

Filter to easily ignore async code in an async hook

```
npm install async-hooks-ignore
```

## Usage

``` js
var hooksIgnore = require('async-hooks-ignore')
var hooks = require('async_hooks')

// create an ignore instance
var ignore = hooksIgnore()

// create an async_hook
var hook = hooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    // add asyncId and triggerAsyncId to the ignore filter. If true ignore it.
    if (ignore.init(asyncId, triggerAsyncId)) return
    process._rawDebug(`init ${asyncId} ${type} ${triggerAsyncId}`)
  },
  before (asyncId) {
    // check if we are ignoring it
    if (ignore.has(asyncId)) return
    process._rawDebug(`before ${asyncId}`)
  },
  after (asyncId) {
    // check if we are ignoring it
    if (ignore.has(asyncId)) return
    process._rawDebug(`after ${asyncId}`)
  },
  destroy (asyncId) {
    // remove the asyncId when we destroy it
    if (ignore.destroy(asyncId)) return
    process._rawDebug(`destroy ${asyncId}`)
  }
})

hook.enable()

// run some async code that is ignored by the above hook
ignore.run(function () {
  setInterval(function () {
    console.log('I do not show up in the above hook')
  }, 1000)
})

console.log('But I do ...')
```

## API

#### `var ignore = hooksIgnore([fn])`

Create a new ignore instance. If `fn` is passed the constructor will run `ignore.run(fn)`.

#### `var skip = ignore.init(asyncId, triggerAsyncId)`

Init an `asyncId`. If it returns true, the hook should be skipped.

Note, that only ids that are skipped are tracked internally, and therefore the overhead is minimal.

Run this in the init `async_hook` method.

#### `var skip = ignore.has(asyncId)`

Check if an `asyncId` should be skipped.

#### `var skip = ignore.destroy(asyncId)`

Destroy an `asyncId`. If it returns true, the hook should be skipped.

Run this in the destroy `async_hook` method.

#### `ignore.run(fn)`

Run a function whose async operations are ignored in your hook.

Safe to call multiple times.

## License

MIT
