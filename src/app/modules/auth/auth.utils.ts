import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

export const createToken = (
  
   jwtPayload:{
    userId: mongoose.Types.ObjectId,
    name: string,
    email: string,
    role: string,
    photo:string
  },
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
