import { Types } from "mongoose";

export interface IAnalytics {
  blog: Types.ObjectId;        
  user: Types.ObjectId;        
  actionType: 'view' | 'upvote' | 'downvote' | 'comment' | "blog"; 
  timestamp?: Date;       
  metadata?: any;        
}
