import { Types, Document } from "mongoose";

// Define the Vote Types as String Literals
export type VoteType = 'upvote' | 'downvote';

// Interface for the Vote Document
export interface IVote extends Document {
  user: Types.ObjectId;    
  blog: Types.ObjectId;    
  voteType: VoteType;      
  createdAt: Date;
}
