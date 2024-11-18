import { PipelineStage } from "mongoose";

export const createPipeline = (
  match: Record<string, any>,
  project: Record<string, any>,
  query: Record<string, any>
): PipelineStage[] => {
  const { sortBy = "createdAt", sortOrder = "desc" } = query;

  const limit = Number(query.limit) || 10;
  const page = Number(query.page) || 1;
  const skip = (page - 1) * limit;

  return [
    { $match: match },
    { $project: { ...project } },
    { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } }, 
    { $skip: skip }, 
    { $limit: limit }, 
  ];
};
