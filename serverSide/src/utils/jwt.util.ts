


import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export interface TokenPayload {
  uid: string;
  phoneNumber: string;
  email?: string;
}

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = getJWTSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { 
    expiresIn 
  } as jwt.SignOptions);
};

export const generateRefreshToken = (): string => {
  return randomBytes(40).toString('hex');
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = getJWTSecret();
  
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired. Please refresh your token.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token. Please login again.');
    }
    throw new Error('Authentication failed. Please try again.');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token);
    return decoded as TokenPayload | null;
  } catch {
    return null;
  }
};