var hooks = require('async_hooks')

module.exports = IgnoreHook

function IgnoreHook (fn) {
  if (!(this instanceof IgnoreHook)) return new IgnoreHook(fn)

  this.ignores = new Set()
  this._skipNext = false

  if (fn) this.run(fn)
}

IgnoreHook.prototype.run = function (fn) {
  this._skipNext = true
  process.nextTick(() => {
    this.ignores.add(hooks.executionAsyncId())
    fn()
  })
  this._skipNext = false
}

IgnoreHook.prototype.init = function (asyncId, triggerId) {
  if (this.has(triggerId)) {
    this.ignores.add(asyncId)
    return true
  }
  return false
}

IgnoreHook.prototype.has = function (asyncId) {
  return this._skipNext || this.ignores.has(asyncId)
}

IgnoreHook.prototype.destroy = function (asyncId) {
  return this.ignores.delete(asyncId)
}
