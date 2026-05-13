require('dotenv').config();

const express = require('express');
const cors = require('cors');
const gatewayRoutes = require('./routes/gateway');

const app = express();
const PORT = process.env.PORT || 9090;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/gw', gatewayRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Payment Gateway',
    timestamp: new Date().toISOString(),
    config: {
      bankId: process.env.BANK_ID,
      accountName: process.env.ACCOUNT_NAME,
      billExpiryMinutes: process.env.BILL_EXPIRY_MINUTES
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[GW] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {

  console.log('      Payment Gateway Started!          ');
  console.log(`      http://localhost:${PORT}             `);
  console.log('      HMAC-SHA256 enabled               ');
  console.log('      VietQR integration ready           ');
  console.log(`[Config] Bank: ${process.env.BANK_ID} | Account: ${process.env.ACCOUNT_NO}`);
});
