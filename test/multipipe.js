/* global describe, it */

const assert = require('assert')
const pipe = require('..')
const Stream = require('stream')
const through = require('through2')

const Readable = () => {
  const readable = new Stream.Readable({ objectMode: true })
  readable._read = function () {
    this.push('a')
    this.push(null)
  }
  return readable
}

const Transform = () => {
  const transform = new Stream.Transform({ objectMode: true })
  transform._transform = (chunk, _, done) => {
    done(null, chunk.toUpperCase())
  }
  return transform
}

const Writable = cb => {
  const writable = new Stream.Writable({ objectMode: true })
  writable._write = (chunk, _, done) => {
    assert.equal(chunk, 'A')
    done()
    cb && cb()
  }
  return writable
}

describe('pipe()', () => {
  it('should return a stream', done => {
    assert(pipe(done))
  })
  it('should accept options', () => {
    assert.equal(pipe({ objectMode: false })._readableState.objectMode, false)
  })
})

describe('pipe(a)', () => {
  it('should pass through to a', done => {
    Readable()
      .pipe(pipe(Transform()))
      .pipe(Writable(done))
  })
  it('should accept options', () => {
    const readable = Readable({ objectMode: true })
    assert.equal(
      pipe(readable, { objectMode: false })._readableState.objectMode,
      false
    )
  })
})

describe('pipe(a, b, c)', () => {
  it('should pipe internally', done => {
    pipe(Readable(), Transform(), Writable(done))
  })

  it('should be writable', done => {
    const stream = pipe(Transform(), Writable(done))
    assert(stream.writable)
    Readable().pipe(stream)
  })

  it('should be readable', done => {
    const stream = pipe(Readable(), Transform())
    assert(stream.readable)
    stream.pipe(Writable(done))
  })

  it('should be readable and writable', done => {
    const stream = pipe(Transform(), Transform())
    assert(stream.readable)
    assert(stream.writable)
    Readable()
      .pipe(stream)
      .pipe(Writable(done))
  })

  describe('errors', () => {
    it('should reemit', done => {
      const a = Transform()
      const b = Transform()
      const c = Transform()
      const stream = pipe(a, b, c)
      const err = new Error()
      let i = 0

      stream.on('error', _err => {
        i++
        assert.equal(_err, err)
        assert(i <= 3)
        if (i === 3) done()
      })

      a.emit('error', err)
      b.emit('error', err)
      c.emit('error', err)
    })

    it('should not reemit endlessly', done => {
      const a = Transform()
      const b = Transform()
      const c = Transform()
      c.readable = false
      const stream = pipe(a, b, c)
      const err = new Error()
      let i = 0

      stream.on('error', function (_err) {
        i++
        assert.equal(_err, err)
        assert(i <= 3)
        if (i === 3) done()
      })

      a.emit('error', err)
      b.emit('error', err)
      c.emit('error', err)
    })
  })
  it('should accept options', () => {
    const a = Readable()
    const b = Transform()
    const c = Writable()
    assert.equal(
      pipe(a, b, c, { objectMode: false })._readableState.objectMode,
      false
    )
  })
})

describe('pipe(a, b, c, fn)', () => {
  it('should call on finish', done => {
    let finished = false
    const a = Readable()
    const b = Transform()
    const c = Writable(function () {
      finished = true
    })

    pipe(a, b, c, err => {
      assert(!err)
      assert(finished)
      done()
    })
  })

  it('should call with error once', done => {
    const a = Readable()
    const b = Transform()
    const c = Writable()
    const err = new Error()

    pipe(a, b, c, err => {
      assert(err)
      done()
    })

    a.emit('error', err)
    b.emit('error', err)
    c.emit('error', err)
  })

  it('should call on destroy', done => {
    const a = Readable()
    const b = Transform()
    const c = through()

    pipe(a, b, c, err => {
      assert(!err)
      done()
    })

    c.destroy()
  })

  it('should call on destroy with error', done => {
    const a = Readable()
    const b = Transform()
    const c = through()
    const err = new Error()

    pipe(a, b, c, _err => {
      assert.equal(_err, err)
      done()
    })

    c.destroy(err)
  })

  it('should accept options', done => {
    const a = Readable()
    const b = Transform()
    const c = Writable()
    assert.equal(
      pipe(a, b, c, { objectMode: false }, done)._readableState.objectMode,
      false
    )
  })

  it('should ignore parameters on non error events', done => {
    const a = Readable()
    const b = Transform()
    const c = Writable()
    pipe(a, b, c, done)
    c.emit('finish', true)
  })
})
