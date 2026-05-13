const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { sign } = require('../utils/hmac');
const { generateQrUrl } = require('../services/vietqrService');
const { createBill, getBill, updateBill } = require('../data/bills');

async function handleCreateBill(req, res) {
  try {
    const { orderId, amount, description, callbackUrl } = req.body;

    // Validate
    if (!orderId || !amount || !callbackUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, amount, callbackUrl'
      });
    }

    // Tạo bill ID
    const billId = 'BILL-' + uuidv4().substring(0, 8).toUpperCase();

    // Tạo VietQR URL
    const qrUrl = generateQrUrl({
      bankId: process.env.BANK_ID,
      accountNo: process.env.ACCOUNT_NO,
      accountName: process.env.ACCOUNT_NAME,
      amount: amount,
      addInfo: billId  // Dùng billId làm nội dung chuyển khoản để dễ đối soát
    });

    // Tính thời gian hết hạn
    const expiryMinutes = parseInt(process.env.BILL_EXPIRY_MINUTES) || 15;
    const expiredAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Lưu bill
    const bill = createBill({
      billId,
      orderId,
      amount,
      description: description || '',
      callbackUrl,
      qrUrl,
      status: 'PENDING',
      createdAt: new Date(),
      expiredAt,
      paidAt: null
    });

    console.log(`[GW] Created bill ${billId} for order ${orderId} - ${amount.toLocaleString()}đ`);

    return res.status(201).json({
      success: true,
      data: {
        billId: bill.billId,
        qrUrl: bill.qrUrl,
        amount: bill.amount,
        status: bill.status,
        expiredAt: bill.expiredAt.toISOString()
      }
    });

  } catch (error) {
    console.error('[GW] ❌ Error creating bill:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function handleConfirmPayment(req, res) {
  try {
    const { billId } = req.body;

    if (!billId) {
      return res.status(400).json({
        success: false,
        error: 'Missing billId'
      });
    }

    // Tìm bill
    const bill = getBill(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    // Kiểm tra trạng thái
    if (bill.status === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Bill already paid'
      });
    }

    if (bill.status === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'Bill expired'
      });
    }

    // Kiểm tra hết hạn
    if (new Date() > new Date(bill.expiredAt)) {
      updateBill(billId, { status: 'EXPIRED' });
      return res.status(400).json({
        success: false,
        error: 'Bill expired'
      });
    }

    // Đánh dấu PAID
    const updatedBill = updateBill(billId, {
      status: 'PAID',
      paidAt: new Date()
    });

    console.log(`[GW] 💰 Bill ${billId} marked as PAID`);

    // Gọi callback về Business Backend (có HMAC)
    const callbackBody = {
      billId: updatedBill.billId,
      orderId: updatedBill.orderId,
      amount: updatedBill.amount,
      status: 'PAID',
      paidAt: updatedBill.paidAt.toISOString()
    };

    const bodyString = JSON.stringify(callbackBody);
    const signature = sign(process.env.SHARED_SECRET, bodyString);

    try {
      const callbackResponse = await axios.post(updatedBill.callbackUrl, callbackBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': Date.now().toString()
        },
        timeout: 10000 // 10s timeout
      });

      console.log(`[GW] 📞 Callback to BE success:`, callbackResponse.data);
    } catch (callbackError) {
      // Callback thất bại không ảnh hưởng đến trạng thái bill
      console.error(`[GW] ⚠️ Callback failed:`, callbackError.message);
      // Trong production: sẽ retry hoặc lưu vào queue
    }

    return res.json({
      success: true,
      message: 'Payment confirmed',
      data: {
        billId: updatedBill.billId,
        status: updatedBill.status,
        paidAt: updatedBill.paidAt.toISOString()
      }
    });

  } catch (error) {
    console.error('[GW] ❌ Error confirming payment:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function handleGetBill(req, res) {
  const { billId } = req.params;

  const bill = getBill(billId);
  if (!bill) {
    return res.status(404).json({
      success: false,
      error: 'Bill not found'
    });
  }

  // Auto-expire nếu quá hạn
  if (bill.status === 'PENDING' && new Date() > new Date(bill.expiredAt)) {
    updateBill(billId, { status: 'EXPIRED' });
    bill.status = 'EXPIRED';
  }

  return res.json({
    success: true,
    data: {
      billId: bill.billId,
      orderId: bill.orderId,
      amount: bill.amount,
      status: bill.status,
      qrUrl: bill.qrUrl,
      createdAt: bill.createdAt,
      expiredAt: bill.expiredAt,
      paidAt: bill.paidAt
    }
  });
}

module.exports = { handleCreateBill, handleConfirmPayment, handleGetBill };
