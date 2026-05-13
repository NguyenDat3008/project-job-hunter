const { verify } = require('../utils/hmac');

function hmacVerify(req, res, next) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const sharedSecret = process.env.SHARED_SECRET;

  // 1. Kiểm tra header
  if (!signature) {
    return res.status(401).json({
      success: false,
      error: 'Missing X-Signature header'
    });
  }

  if (!timestamp) {
    return res.status(401).json({
      success: false,
      error: 'Missing X-Timestamp header'
    });
  }

  // 2. Kiểm tra timestamp (chống replay attack - cho phép lệch 5 phút)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  const MAX_AGE_MS = 5 * 60 * 1000; // 5 phút

  if (isNaN(requestTime) || Math.abs(now - requestTime) > MAX_AGE_MS) {
    return res.status(401).json({
      success: false,
      error: 'Request timestamp expired or invalid'
    });
  }

  // 3. Verify HMAC signature
  // Body đã được parse bởi express.json(), cần stringify lại
  const bodyString = JSON.stringify(req.body);

  try {
    const isValid = verify(sharedSecret, bodyString, signature);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid HMAC signature'
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Signature verification failed: ' + err.message
    });
  }

  // HMAC hợp lệ → cho phép đi tiếp
  next();
}

module.exports = hmacVerify;
