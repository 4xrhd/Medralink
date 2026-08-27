require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'medralink_bcolbd_jwt_secret_dev_2026',
  AES_MASTER_KEY: process.env.AES_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 256-bit hex
  CHANNEL_NAME: process.env.CHANNEL_NAME || 'medralink-main',
  CHAINCODE_NAME: process.env.CHAINCODE_NAME || 'medralink-cc',
  DEMO_MODE: process.env.DEMO_MODE !== 'false', // Default true for competition demonstration
};
