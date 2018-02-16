var ignoreHooks = require('./')
var hooks = require('async_hooks')
var tape = require('tape')

tape('ignores async code in ignore hook', function (t) {
  var ignore = ignoreHooks(function () {
    process.nextTick(function () {
      t.same(done(), [])
      t.end()
    })
  })

  var done = capture(ignore)
})

tape('ignores async code in ignore hook (recursive)', function (t) {
  var ignore = ignoreHooks(function () {
    process.nextTick(function () {
      var missing = 2

      process.nextTick(run)
      process.nextTick(run)

      function run () {
        if (--missing) return
        t.same(done(), [])
        t.end()
      }
    })
  })

  var done = capture(ignore)
})

tape('does not ignore other async code', function (t) {
  var ignore = ignoreHooks(function () {
    process.nextTick(function () {
      setImmediate(function () {
        var list = done()
        t.ok(ticked)
        t.same(list.length, 4)
        t.same(list[0].type, 'init')
        t.same(list[1].type, 'before')
        t.same(list[2].type, 'after')
        t.same(list[3].type, 'destroy')
        t.end()
      })
    })
  })

  var ticked = false
  var done = capture(ignore)

  process.nextTick(function () {
    ticked = true
  })
})

tape('does not ignore other async code (register after hook)', function (t) {
  var ignore = ignoreHooks()

  var ticked = false
  var done = capture(ignore)

  ignore.run(function () {
    process.nextTick(function () {
      setImmediate(function () {
        var list = done()
        t.ok(ticked)
        t.same(list.length, 4)
        t.same(list[0].type, 'init')
        t.same(list[1].type, 'before')
        t.same(list[2].type, 'after')
        t.same(list[3].type, 'destroy')
        t.end()
      })
    })
  })

  process.nextTick(function () {
    ticked = true
  })
})

tape('does not ignore other async code (register after hook) (recursive)', function (t) {
  var ignore = ignoreHooks()

  var ticked = false
  var done = capture(ignore)

  ignore.run(function () {
    process.nextTick(function () {
      setImmediate(function () {
        var list = done()
        t.ok(ticked)
        t.same(list.length, 8)
        t.same(list[0].type, 'init')
        t.same(list[1].type, 'before')
        t.same(list[2].type, 'init')
        t.same(list[3].type, 'after')
        t.same(list[4].type, 'before')
        t.same(list[5].type, 'after')
        t.same(list[6].type, 'destroy')
        t.same(list[7].type, 'destroy')
        t.end()
      })
    })
  })

  process.nextTick(function () {
    process.nextTick(function () {
      ticked = true
    })
  })
})

function capture (ignore) {
  var list = []
  var inited = new Set() // since we start the hook deferred, track active handles here

  var hook = hooks.createHook({
    init (asyncId, type, triggerId) {
      if (ignore.init(asyncId, triggerId)) return
      inited.add(asyncId)
      list.push({type: 'init', asyncId, triggerId})
    },
    before (asyncId) {
      if (ignore.has(asyncId)) return
      if (inited.has(asyncId)) list.push({type: 'before', asyncId})
    },
    after (asyncId) {
      if (ignore.has(asyncId)) return
      if (inited.has(asyncId)) list.push({type: 'after', asyncId})
    },
    destroy (asyncId) {
      if (ignore.destroy(asyncId)) return
      if (inited.delete(asyncId)) list.push({type: 'destroy', asyncId})
    }
  })

  hook.enable()

  return function () {
    hook.disable()
    return list
  }
}
