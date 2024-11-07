// analytics.model.ts
import mongoose, { Schema } from 'mongoose';
import { IAnalytics } from './analytics.interface';
import { ActionType } from './analytics.constant';

const analyticsSchema = new Schema<IAnalytics>(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',           
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',           
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: Object.values(ActionType),  
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,      
    },
  },
  { timestamps: true },      
);

// Export the Analytics model
export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);