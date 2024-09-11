class ApiFeatures {
  constructor(mongooseQuery, reqQuery) {
    this.mongooseQuery = mongooseQuery;
    this.reqQuery = reqQuery;
  }
  filter() {
    const queryStringObject = { ...this.reqQuery };
    const excludesFields = [`page`, `sort`, `limit`, `fields`, `search`];

    // Exclude certain fields
    for (let i = 0; i < excludesFields.length; i++) {
      delete queryStringObject[excludesFields[i]];
    }

    // Modify query string for MongoDB operators like gt, gte, lt, lte, in
    let queryStr = JSON.stringify(queryStringObject);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}` // Add '$' for MongoDB operators
    );
    queryStr = JSON.parse(queryStr);

    // Initialize an empty sizesFilter to include size-related filters
    const sizesFilter = {};

    // Check if queryStr contains filters for sizes array
    if (queryStr.size) {
      sizesFilter["sizes.size"] = queryStr.size;
    }
    if (queryStr.quantity) {
      sizesFilter["sizes.quantity"] = queryStr.quantity;
    }
    if (queryStr.price) {
      sizesFilter["sizes.price"] = queryStr.price;
    }
    if (queryStr.priceAfterDiscount) {
      sizesFilter["sizes.priceAfterDiscount"] = queryStr.priceAfterDiscount;
    }

    // Apply query for products with or without sizes
    if (Object.keys(sizesFilter).length > 0) {
      this.mongooseQuery = this.mongooseQuery.find({
        $or: [
          sizesFilter, // Products with sizes array that match the query
          queryStr, // Products without sizes, applying the other filters
        ],
      });
    } else {
      this.mongooseQuery = this.mongooseQuery.find(queryStr);
    }
    return this;
  }
  sort() {
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort(`-createdAt`);
    }
    return this;
  }
  limitFields(mudelName) {
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else if (mudelName === `User`) {
      this.mongooseQuery = this.mongooseQuery.select(`
        -emailVerifyCode
        -emailVerifyCodeExpires
        -password
        -passwordChangedAt
        -passwordResetCode
        -passwordResetExpires
        -passwordResetVerified
      `);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }
  search(mudelName) {
    if (this.reqQuery.search) {
      let query = {};
      if (mudelName === `Product`) {
        query.$or = [
          { title: { $regex: this.reqQuery.search, $options: `i` } },
          { description: { $regex: this.reqQuery.search, $options: `i` } },
        ];
      } else if (mudelName === `User`) {
        query.$or = [
          {
            slug: {
              $regex: `${this.reqQuery.search}`.replaceAll(" ", "-"),
              $options: `i`,
            },
          },
        ];
      } else {
        query = { name: { $regex: this.reqQuery.search, $options: `i` } };
      }
      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }
  paginate(countDocuments) {
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination results
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    if (endIndex < countDocuments) {
      pagination.nextPage = page + 1;
    }
    if (page > 1) {
      pagination.prevPage = page - 1;
    }
    this.paginationResults = pagination;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
