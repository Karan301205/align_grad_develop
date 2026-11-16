// List helpers shared by the directory pages: search, counting and paging.

/** True when any of the values contains the query (case-insensitive). An empty query matches everything. */
export function matchesQuery(values, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value ?? '').toLowerCase().includes(needle));
}

/** How many items satisfy each named predicate, e.g. { all: 10, pending: 2 }. */
export function countBy(items, predicates) {
  return Object.fromEntries(
    Object.entries(predicates).map(([name, test]) => [name, items.filter(test).length])
  );
}

/** One page of a list plus the numbers the pager shows. `page` is clamped into range. */
export function paginate(items, page, pageSize) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const from = (current - 1) * pageSize;
  return {
    rows: items.slice(from, from + pageSize),
    page: current,
    pages,
    total,
    from: total === 0 ? 0 : from + 1,
    to: Math.min(from + pageSize, total)
  };
}

/** Page numbers for the pager, with "…" gaps: [1, '…', 4, 5, 6, '…', 12]. */
export function pageWindow(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const keep = new Set([1, pages, current - 1, current, current + 1]);
  const numbers = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return numbers.flatMap((n, index) => (index > 0 && n - numbers[index - 1] > 1 ? ['…', n] : [n]));
}
