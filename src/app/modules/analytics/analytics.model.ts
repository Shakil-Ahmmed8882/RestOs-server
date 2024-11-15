// analytics.model.ts
import mongoose, { Schema } from 'mongoose';
import { IAnalytics } from './analytics.interface';
import { ActionType } from './analytics.constant';

const analyticsSchema = new Schema<IAnalytics>(
  {
    resourceName: { 
      type: String, 
      required: true, 
      index: true 
    },
    userName: { 
      type: String, 
      required: true, 
      index: true 
    },
    description: { 
      type: String,
      default: '',
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',           
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',           
      required: true,
    },
    actionType: {
      type: String,
      enum: Object.values(ActionType),  
      required: true,
    },
    date: String,
    timestamp: {
      type: Date,
      default: Date.now,      
    },
  },
  { timestamps: true },      
);

// Export the Analytics model
export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);