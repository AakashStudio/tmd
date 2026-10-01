function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function getEnvOptional(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

export const env = {
  // Database
  databaseUrl: getEnv('DATABASE_URL'),
  
  // Auth
  jwtSecret: getEnv('JWT_SECRET', 'dev-secret-change-in-production-min-32-chars'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  nextauthSecret: getEnv('NEXTAUTH_SECRET', 'dev-nextauth-secret'),
  nextauthUrl: getEnv('NEXTAUTH_URL', 'http://localhost:3000'),
  
  // OTP
  otpLength: parseInt(getEnv('OTP_LENGTH', '6')),
  otpExpirySeconds: parseInt(getEnv('OTP_EXPIRY_SECONDS', '300')),
  otpMaxAttempts: parseInt(getEnv('OTP_MAX_ATTEMPTS', '3')),
  otpResendCooldownSeconds: parseInt(getEnv('OTP_RESEND_COOLDOWN_SECONDS', '60')),
  
  // SMS
  smsApiKey: getEnvOptional('SMS_PROVIDER_API_KEY'),
  smsSenderId: getEnvOptional('SMS_PROVIDER_SENDER_ID'),
  
  // Google OAuth
  googleClientId: getEnvOptional('GOOGLE_CLIENT_ID'),
  googleClientSecret: getEnvOptional('GOOGLE_CLIENT_SECRET'),
  
  // Apple OAuth
  appleClientId: getEnvOptional('APPLE_CLIENT_ID'),
  appleClientSecret: getEnvOptional('APPLE_CLIENT_SECRET'),
  appleTeamId: getEnvOptional('APPLE_TEAM_ID'),
  appleKeyId: getEnvOptional('APPLE_KEY_ID'),
  
  // Razorpay
  razorpayKeyId: getEnvOptional('RAZORPAY_KEY_ID'),
  razorpayKeySecret: getEnvOptional('RAZORPAY_KEY_SECRET'),
  razorpayWebhookSecret: getEnvOptional('RAZORPAY_WEBHOOK_SECRET'),
  
  // Storage
  storageProvider: getEnv('STORAGE_PROVIDER', 'local') as 'local' | 's3',
  storageBasePath: getEnv('STORAGE_BASE_PATH', './uploads'),
  s3Bucket: getEnvOptional('S3_BUCKET'),
  s3Region: getEnvOptional('S3_REGION'),
  s3AccessKey: getEnvOptional('S3_ACCESS_KEY'),
  s3SecretKey: getEnvOptional('S3_SECRET_KEY'),
  s3Endpoint: getEnvOptional('S3_ENDPOINT'),
  
  // Maps
  mapsApiKey: getEnvOptional('MAPS_API_KEY'),
  
  // Push
  fcmServerKey: getEnvOptional('FCM_SERVER_KEY'),
  apnsKeyId: getEnvOptional('APNS_KEY_ID'),
  apnsTeamId: getEnvOptional('APNS_TEAM_ID'),
  
  // App
  nodeEnv: getEnv('NODE_ENV', 'development'),
  appUrl: getEnv('APP_URL', 'http://localhost:3000'),
  appName: getEnv('APP_NAME', 'TMD'),
  
  // Computed
  get isDev() { return this.nodeEnv === 'development'; },
  get isProd() { return this.nodeEnv === 'production'; },
};
