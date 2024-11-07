import { Types } from 'mongoose';

export interface ISave {
  blog: Types.ObjectId; 
  user: Types.ObjectId; 
  name:string,
  timestamp?: Date;     
}
