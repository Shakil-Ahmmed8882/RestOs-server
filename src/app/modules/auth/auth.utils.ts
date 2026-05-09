import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

export type JwtPayloadType = {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  photo: string;
};

export const createToken = (
  jwtPayload: JwtPayloadType,
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(
    {
      userId: jwtPayload.userId.toString(),
      name: jwtPayload.name,
      email: jwtPayload.email,
      role: jwtPayload.role,
      photo: jwtPayload.photo,
    },
    secret,
    {
      expiresIn,
    }
  );
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
