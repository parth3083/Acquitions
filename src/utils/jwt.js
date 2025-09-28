import jwt from 'jsonwebtoken';
import 'dotenv/config';
import logger from '#src/config/logger.js';

const jwt_secret = process.env.JWT_SECRET;
const JWT_EXPIRE_TIME = '1d';

export const jwtToken = {
  sign: async (payload) => {
    try {
      return jwt.sign(payload, jwt_secret, { expiresIn: JWT_EXPIRE_TIME });
    } catch (error) {
      logger.error('Error in authenticating the jwt token', error);
      throw new Error('Fail to authenticate error');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, jwt_secret);
    } catch (error) {
      logger.error('Error in verifying the token', error);
      throw new Error('Failed to verify the token');
    }
  },
};
