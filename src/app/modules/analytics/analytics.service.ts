
import { Analytics } from './analytics.model';
import QueryBuilder from '../../builder/QueryBuilder';

// Retrieve all analytics with query filters (pagination, sorting, etc.)
const getAllAnalytics = async (query: Record<string, unknown>) => {
  const analyticsQuery = new QueryBuilder(Analytics.find(), query)
    .search(['user.name', 'postId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await analyticsQuery.modelQuery.populate('user');
  const metaData = await analyticsQuery.countTotal();
  
  return {
    meta: metaData,
    data: result,
  };
};


// Aggregate analytics data by action type for admin dashboard
const getAnalyticsSummaryMatrix = async () => {

  
  const results = await Analytics.aggregate([
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id',  
        count: 1,
      },
    },
  ]);
  
  return results;  
};


import mongoose from 'mongoose';

const getUserActionCounts = async (userId: string) => {
  try {
    const results = await Analytics.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId), 
        },
      },
      {
        $group: {
          _id: '$actionType', 
          count: { $sum: 1 }, 
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id',  
          count: 1,      
        },
      },
    ]);

    return results; 
  } catch (error) {
    console.error('Error fetching user action counts:', error);
    throw new Error('Error fetching user action counts');
  }
};




// Export the service functions
export const analyticsServices = {
  getAllAnalytics,
  getAnalyticsSummaryMatrix,
  getUserActionCounts
};