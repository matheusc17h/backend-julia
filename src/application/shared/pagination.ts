import { Pagination } from '../../domain/catalog/catalog.repository'

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

export function clampPagination(page?: number, perPage?: number): Pagination {
  const safePage = Number.isFinite(page) && (page as number) >= 1 ? Math.floor(page as number) : 1
  const rawPerPage =
    Number.isFinite(perPage) && (perPage as number) >= 1
      ? Math.floor(perPage as number)
      : DEFAULT_PER_PAGE
  return { page: safePage, perPage: Math.min(rawPerPage, MAX_PER_PAGE) }
}
