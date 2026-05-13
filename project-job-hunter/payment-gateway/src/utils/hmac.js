const crypto = require('crypto');

function sign(secret, data) {
  return crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('hex');
}

function verify(secret, data, signature) {
  const expected = sign(secret, data);

  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

module.exports = { sign, verify };
