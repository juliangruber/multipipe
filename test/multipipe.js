var assert = require('assert');
var pipe = require('..');
var Stream = require('stream');

describe('pipe(a)', function(){
  it('should return a', function(){
    var readable = Readable();
    var stream = pipe(readable);
    assert.equal(stream, readable);
  });
});

describe('pipe(a, b, c)', function(){
  it('should pipe internally', function(done){
    pipe(Readable(), Transform(), Writable(done));
  });
  
  it('should be writable', function(done){
    var stream = pipe(Transform(), Writable(done));
    assert(stream.writable);
    Readable().pipe(stream);
  });

  it('should be readable', function(done){
    var stream = pipe(Readable(), Transform());
    assert(stream.readable);
    stream.pipe(Writable(done));
  });
  
  it('should be readable and writable', function(done){
    var stream = pipe(Transform(), Transform());
    assert(stream.readable);
    assert(stream.writable);
    Readable()
    .pipe(stream)
    .pipe(Writable(done));
  });
  
  it('should aggregate errors', function(done){
    var readable = Readable();
    var transform = Transform();
    var writable = Writable();
    var stream = pipe(readable, transform, writable);
    var err = new Error;
    var i = 0;
    
    stream.on('error', function(_err){
      assert.equal(_err, err);
      if (++i == 3) done();
    });
    
    readable.emit('error', err);
    transform.emit('error', err);
    writable.emit('error', err);
  });
});

function Readable(){
  var readable = new Stream.Readable({ objectMode: true });
  readable._read = function(){
    this.push('a');
    this.push(null);
  };
  return readable;
}

function Transform(){
  var transform = new Stream.Transform({ objectMode: true });
  transform._transform = function(chunk, _, done){
    done(null, chunk.toUpperCase());
  };
  return transform;
}

function Writable(cb){
  var writable = new Stream.Writable({ objectMode: true });
  writable._write = function(chunk, _, done){
    assert.equal(chunk, 'A');
    done();
    cb();
  };
  return writable;
}
