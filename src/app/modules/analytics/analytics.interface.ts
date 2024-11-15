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
  resourceName: string;        
  userName: string;        
  blog: Types.ObjectId;        
  user: Types.ObjectId;        
  description: string;        
  actionType: ActionType
  date?: string,
  timestamp?: Date;       
  metadata?: any;        
}
