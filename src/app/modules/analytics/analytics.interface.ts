import { Types } from "mongoose";

// Define the type for actionType
export type ActionType = 
  | 'view' 
  | 'upvote' 
  | 'downvote' 
  | 'comment' 
  | 'blog' 
  | 'save-blog' 
  | 'unsave-blog';

export interface IAnalytics {
  blog: Types.ObjectId;        
  user: Types.ObjectId;        
  actionType: ActionType
  timestamp?: Date;       
  metadata?: any;        
}
