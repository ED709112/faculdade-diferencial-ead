const paginate = (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    query: `${query} LIMIT ? OFFSET ?`,
    page: Math.max(1, parseInt(page)),
    limit: Math.min(100, Math.max(1, parseInt(limit))),
    offset
  };
};

const paginateResult = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

module.exports = { paginate, paginateResult };
