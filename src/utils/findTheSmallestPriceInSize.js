// Find the smallest price in sizes
exports.findTheSmallestPriceInSize = (sizes) => {
  if (sizes.length === 0) return {};

  // Filtering sizes with a quantity greater than 0.
  const availableSizes = sizes.filter((item) => item.quantity > 0);

  let theSmallestPriceSize;
  if (availableSizes.length > 0) {
    theSmallestPriceSize = availableSizes.reduce((min, size) =>
      size.price < min.price ? size : min
    );
  } else {
    theSmallestPriceSize = sizes.reduce((min, size) =>
      size.price < min.price ? size : min
    );
  }

  return theSmallestPriceSize;
};