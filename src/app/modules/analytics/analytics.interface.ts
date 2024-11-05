import { Types } from "mongoose";

export interface IAnalytics {
  post: Types.ObjectId;        
  user: Types.ObjectId;        
  actionType: 'view' | 'upvote' | 'downvote' | 'comment' | "post"; 
  timestamp?: Date;       
  metadata?: any;        
}
