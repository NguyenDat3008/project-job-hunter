// Map<billId, BillObject>
const bills = new Map();

/**
 * @typedef {Object} Bill
 * @property {string} billId
 * @property {string} orderId      - Order ID từ Business Backend
 * @property {number} amount       - Số tiền (VND)
 * @property {string} description  - Mô tả giao dịch
 * @property {string} callbackUrl  - URL callback về BE khi thanh toán xong
 * @property {string} qrUrl        - VietQR URL
 * @property {string} status       - PENDING | PAID | EXPIRED | FAILED
 * @property {Date}   createdAt
 * @property {Date}   expiredAt
 * @property {Date}   paidAt
 */

function createBill(bill) {
  bills.set(bill.billId, bill);
  return bill;
}

function getBill(billId) {
  return bills.get(billId) || null;
}

function updateBill(billId, updates) {
  const bill = bills.get(billId);
  if (!bill) return null;
  
  const updated = { ...bill, ...updates };
  bills.set(billId, updated);
  return updated;
}

function getAllBills() {
  return Array.from(bills.values());
}

module.exports = { createBill, getBill, updateBill, getAllBills };
