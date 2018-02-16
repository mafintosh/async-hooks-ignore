var hooksIgnore = require('./')
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
