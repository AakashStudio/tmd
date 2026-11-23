const https = require('https');

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TsEClVNy3FvpRk";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "oAhgPAVr9iaY15jV15pY3c8s";

console.log("Testing Razorpay Key ID:", keyId);

const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const data = JSON.stringify({
  amount: 50000,
  currency: "INR",
  receipt: `test_${Date.now()}`
});

const req = https.request('https://api.razorpay.com/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", body);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
