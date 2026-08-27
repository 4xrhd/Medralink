require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'medralink_bcolbd_jwt_secret_dev_2026';
const AES_MASTER_KEY = process.env.AES_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

if (NODE_ENV === 'production') {
  if (JWT_SECRET === 'medralink_bcolbd_jwt_secret_dev_2026') {
    console.warn('[SECURITY WARNING] Production environment detected with default development JWT_SECRET. Set JWT_SECRET in environment variables.');
  }
  if (AES_MASTER_KEY === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    console.warn('[SECURITY WARNING] Production environment detected with default development AES_MASTER_KEY. Set AES_MASTER_KEY in environment variables.');
  }
}

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV,
  JWT_SECRET,
  AES_MASTER_KEY,
  CHANNEL_NAME: process.env.CHANNEL_NAME || 'medralink-main',
  CHAINCODE_NAME: process.env.CHAINCODE_NAME || 'medralink-cc',
  DEMO_MODE: process.env.DEMO_MODE !== 'false',
};
