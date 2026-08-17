/**
 * Pagination utilities
 * Helper functions for pagination logic
 */

/**
 * Calculate pagination parameters
 * @param {number} [page=1] - Page number
 * @param {number} [pageSize=10] - Items per page
 * @returns {Object} Pagination parameters
 */
function calculatePagination(page = 1, pageSize = 10) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10))); // Max 100 items per page
  const offset = (pageNum - 1) * size;

  return {
    offset,
    limit: size,
    page: pageNum,
    pageSize: size
  };
}

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination metadata
 */
function calculatePaginationMeta(total, page, pageSize) {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;
  const hasPrevious = page > 1;

  return {
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    total,
    totalPages,
    hasMore,
    hasPrevious
  };
}

/**
 * Extract pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
function extractPaginationParams(query) {
  const page = parseInt(query.page, 10) || 1;
  const pageSize = parseInt(query.pageSize || query.limit, 10) || 10;

  return calculatePagination(page, pageSize);
}

/**
 * Create pagination links
 * @param {string} baseUrl - Base URL for links
 * @param {number} page - Current page
 * @param {number} totalPages - Total pages
 * @param {Object} [queryParams] - Additional query parameters
 * @returns {Object} Pagination links
 */
function createPaginationLinks(baseUrl, page, totalPages, queryParams = {}) {
  const buildUrl = (pageNum) => {
    const params = new URLSearchParams({
      ...queryParams,
      page: pageNum
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const links = {
    self: buildUrl(page)
  };

  if (page > 1) {
    links.first = buildUrl(1);
    links.prev = buildUrl(page - 1);
  }

  if (page < totalPages) {
    links.next = buildUrl(page + 1);
    links.last = buildUrl(totalPages);
  }

  return links;
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Object} Validation result
 */
function validatePaginationParams(page, pageSize) {
  const errors = [];

  if (page < 1) {
    errors.push('Page must be greater than 0');
  }

  if (pageSize < 1) {
    errors.push('Page size must be greater than 0');
  }

  if (pageSize > 100) {
    errors.push('Page size cannot exceed 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get page range for pagination UI
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {number} [maxPages=5] - Maximum pages to show
 * @returns {Array<number>} Array of page numbers
 */
function getPageRange(currentPage, totalPages, maxPages = 5) {
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxPages / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxPages - 1);

  if (end - start < maxPages - 1) {
    start = Math.max(1, end - maxPages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

module.exports = {
  calculatePagination,
  calculatePaginationMeta,
  extractPaginationParams,
  createPaginationLinks,
  validatePaginationParams,
  getPageRange
};
