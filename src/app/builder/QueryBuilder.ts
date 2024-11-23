import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  // model.find() [....]
  // url https/....?searchTerm=value&page=3&limt=1
  // const x = new QueryBuilder(model.find(),req.query)

  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // name: ali 
  // searchTerm=a
  // result [1data, 2data, 3data]

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query }; // copy

    // Filtering
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];


        // Handle price range filtering
        if (queryObj.minPrice || queryObj.maxPrice) {
          const priceFilter: Record<string, unknown> = {};
          if (queryObj.minPrice) priceFilter.$gte = Number(queryObj.minPrice);
          if (queryObj.maxPrice) priceFilter.$lte = Number(queryObj.maxPrice);
  
          queryObj.price = priceFilter;
          delete queryObj.minPrice;
          delete queryObj.maxPrice;
      }
  


    excludeFields.forEach((el) => delete queryObj[el]);
    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    
    return {total,page,limit};
  }
}

export default QueryBuilder;
