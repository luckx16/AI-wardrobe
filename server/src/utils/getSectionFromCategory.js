const { CATEGORY_TO_SECTION } = require('../db/utlis/category');
const getSectionFromCategory = (category) => {
  return CATEGORY_TO_SECTION[category] ?? 'other';
};

module.exports = { getSectionFromCategory };
