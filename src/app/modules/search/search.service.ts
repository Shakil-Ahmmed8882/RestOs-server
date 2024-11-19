import { BlogModel, FoodModel, FoodCategoryModel } from "./models";
import { createPipeline } from "./pipeline";
import { createMeta } from "./meta";
import modelQueries from "./modelQueries";




export const getGlobalSearchResults = async (query: Record<string, any>) => {

  // Extracting the query parameters such as search term, sorting options, and pagination details.
  // These values are set to defaults if not provided by the user.
  const { searchTerm = "", sortBy = "createdAt", sortOrder = "desc" } = query;

  // Set the pagination options: how many results to return per 
  //page and which page of results.
  // If not provided, default to 10 results per page and page 1.
  const limit = Number(query.limit) || 10;
  const page = Number(query.page) || 1;

  // Generate the queries for each collection (Blog, Food, FoodCategory) 
  // using the search term.
  // `modelQueries` prepares specific search conditions for each model based on the search term.
  const { foodCategoryQuery, foodQuery, blogQuery } = modelQueries(searchTerm);

  // Construct the aggregation pipelines for each model using the queries generated above.
  // The pipelines define the steps for how to retrieve and process the data from each model.
  const pipelines = {
    blogs: createPipeline(blogQuery.match, blogQuery.project, query),
    foods: createPipeline(foodQuery.match, foodQuery.project, query),
    foodCategories: createPipeline(foodCategoryQuery.match, foodCategoryQuery.project, query),
  };

  // Execute all the aggregation pipelines concurrently using Promise.all.
  // This fetches the results from all models in parallel, improving performance.
  const [blogs, foods, foodCategories] = await Promise.all([
    BlogModel.aggregate(pipelines.blogs), 
    FoodModel.aggregate(pipelines.foods), 
    FoodCategoryModel.aggregate(pipelines.foodCategories),
  ]);

  // Prepare the final output:
  // - If results are found for each model (blog, food, food category), it includes the results.
  // - The source of the data (blog, food, food category) is returned for each model.
  // - If no results are found for a model, it will not appear in the output.
  // This keeps the results clean and only includes models that have data matching the search.

  return {
    // if result found sourch woudld indicate else source: null
    results: [
      { source: blogs.length > 0 ? "blogs" : null, data: blogs }, 
      { source: foods.length > 0 ? "foods" : null, data: foods }, 
      { source: foodCategories.length > 0 ? "foodCategories" : null, data: foodCategories }, 
    ],
    
    // The metadata contains pagination details:
    // - `page` is the current page number.
    // - `limit` is the number of results per page.
    // - `total` is the total number of results found across all models.
    // This information is used by the client to manage pagination in the UI.
    meta: createMeta(
      page, // Current page
      limit, // Results per page
      blogs.length + foods.length + foodCategories.length // Total count across all sources
    ),
  };
};


export const globalSearchServices = {
  getGlobalSearchResults,
};
