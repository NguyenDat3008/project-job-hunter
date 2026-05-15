const express = require('express');
const router = express.Router();
const hmacVerify = require('../middleware/hmacVerify');
const {
  handleCreateBill,
  handleConfirmPayment,
  handleGetBill
} = require('../controllers/billController');

// Routes có HMAC protection (chỉ BE mới gọi được)
router.post('/create-bill', hmacVerify, handleCreateBill);

// Routes public (FE gọi trực tiếp - giả lập)
router.post('/confirm-payment', handleConfirmPayment);
router.get('/bill/:billId', handleGetBill);

module.exports = router;
