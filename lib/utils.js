/**
 * @param {number} page
 */
export function getPagingOptions(page, perPage = 10) {
  return {
    limit: perPage,
    offset: (page - 1) * perPage,
  }
}
