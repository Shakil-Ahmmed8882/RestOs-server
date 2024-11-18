const modelQueries = (searchTerm: string) => {
  // Define match and project queries as variables
  const searchRegex = new RegExp(searchTerm, "i");
  const blogQuery = {
    match: { title: { $regex: searchRegex }, isDeleted: false },
    project: { _id: 1, title: 1, category: 1, image: 1 },
  };

  const foodQuery = {
    match: {
      foodName: { $regex: searchRegex },
      status: { $ne: "unavailable" },
    },
    project: { _id: 1, foodName: 1, foodCategory: 1, foodImage: 1 },
  };

  const foodCategoryQuery = {
    match: { name: { $regex: searchRegex } },
    project: { _id: 1, name: 1, description: 1, image: 1 },
  };

  return { foodCategoryQuery, foodQuery, blogQuery };
};

export default modelQueries;
