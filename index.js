/**
 * Module dependencies.
 */

const duplexer = require('duplexer2')
const { PassThrough, Readable } = require('stream')

/**
 * Duplexer options.
 */

const defaultOpts = {
  bubbleErrors: false,
  objectMode: true
}

/**
 * Pipe.
 *
 * @param streams Array[Stream,...]
 * @param opts [Object]
 * @param cb [Function]
 * @return {Stream}
 * @api public
 */

const pipe = (...streams) => {
  let opts, cb

  if (Array.isArray(streams[0])) {
    streams = streams[0]
  }
  if (typeof streams[streams.length - 1] === 'function') {
    cb = streams.pop()
  }
  if (
    typeof streams[streams.length - 1] === 'object' &&
    typeof streams[streams.length - 1].pipe !== 'function'
  ) {
    opts = streams.pop()
  }

  const first = streams[0]
  const last = streams[streams.length - 1]
  let ret
  opts = Object.assign({}, defaultOpts, opts)

  if (!first) {
    if (cb) process.nextTick(cb)
    return new PassThrough(opts)
  }

  if (first.writable && last.readable) ret = duplexer(opts, first, last)
  else if (streams.length === 1) ret = new Readable(opts).wrap(streams[0])
  else if (first.writable) ret = first
  else if (last.readable) ret = last
  else ret = new PassThrough(opts)

  for (const [i, stream] of streams.entries()) {
    const next = streams[i + 1]
    if (next) stream.pipe(next)
    if (stream !== ret) stream.on('error', err => ret.emit('error', err))
  }

  if (cb) {
    let ended = false
    const end = err => {
      if (ended) return
      ended = true
      cb(err)
    }
    ret.on('error', end)
    last.on('finish', () => end())
    last.on('close', () => end())
  }

  return ret
}

/**
 * Expose `pipe`.
 */

module.exports = pipe
