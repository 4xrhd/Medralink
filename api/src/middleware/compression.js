const zlib = require('zlib');

/**
 * Lightweight Zero-Dependency Native HTTP Compression Middleware
 * Automatically compresses JSON and text responses >= 1024 bytes with Gzip / Deflate
 * Bypasses SSE event streams (text/event-stream) and small payloads.
 */
function compressionMiddleware(req, res, next) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Skip compression for SSE streams or clients that don't accept gzip/deflate
  if (!acceptEncoding.match(/\b(gzip|deflate)\b/)) {
    return next();
  }

  const originalSend = res.send;

  res.send = function (body) {
    // If response is SSE or already has Content-Encoding, use standard send
    const contentType = res.getHeader('Content-Type') || '';
    if (contentType.includes('text/event-stream') || res.getHeader('Content-Encoding')) {
      return originalSend.call(this, body);
    }

    let buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (typeof body === 'string') {
      buffer = Buffer.from(body, 'utf8');
    } else if (body && typeof body === 'object') {
      buffer = Buffer.from(JSON.stringify(body), 'utf8');
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      return originalSend.call(this, body);
    }

    // Only compress payloads >= 1024 bytes (1KB threshold prevents negative compression ratio)
    if (buffer.length < 1024) {
      return originalSend.call(this, buffer);
    }

    if (acceptEncoding.includes('gzip')) {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) return originalSend.call(this, buffer);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('ETag'); // remove weak etag if length changed
        originalSend.call(this, compressed);
      });
    } else if (acceptEncoding.includes('deflate')) {
      zlib.deflate(buffer, (err, compressed) => {
        if (err) return originalSend.call(this, buffer);
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('ETag');
        originalSend.call(this, compressed);
      });
    } else {
      return originalSend.call(this, buffer);
    }
  };

  next();
}

module.exports = { compressionMiddleware };
