const https = require('https');

const keyId = "rzp_test_TsEClVNy3FvpRk";
const keySecret = "oAhgPAVr9iaY15jV15pY3c8s";

const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const data = JSON.stringify({
  type: 'upi_qr',
  name: 'TMD VIP Plan',
  usage: 'single_use',
  fixed_amount: true,
  payment_amount: 49900,
  description: 'TMD VIP Subscription'
});

const req = https.request('https://api.razorpay.com/v1/payments/qr_codes', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', b);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
