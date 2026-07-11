import React, { useMemo } from 'react';
import './ListPagination.css';

/**
 * Pagination style: "Page X sur Y — N item(s) affichée(s) sur M trouvée(s)"
 * + Précédent / numéros / Suivant
 */
const ListPagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  itemLabel = 'élément'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const displayedCount = totalItems === 0
    ? 0
    : Math.min(itemsPerPage, totalItems - (safePage - 1) * itemsPerPage);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 12) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, totalPages, safePage]);
    for (let i = safePage - 2; i <= safePage + 2; i += 1) {
      if (i >= 1 && i <= totalPages) pages.add(i);
    }

    return Array.from(pages).sort((a, b) => a - b);
  }, [totalPages, safePage]);

  if (totalItems === 0) return null;

  const label = displayedCount > 1 ? `${itemLabel}s` : itemLabel;

  const goTo = (page) => {
    if (page < 1 || page > totalPages || page === safePage) return;
    onPageChange(page);
  };

  return (
    <div className="list-pagination">
      <p className="list-pagination-info">
        Page <strong>{safePage}</strong> sur <strong>{totalPages}</strong>
        {' — '}
        <strong>{displayedCount}</strong> {label} affiché{displayedCount > 1 ? 's' : ''}
        {' sur '}
        <strong>{totalItems}</strong> trouvé{totalItems > 1 ? 's' : ''}
      </p>

      <div className="list-pagination-controls" role="navigation" aria-label="Pagination">
        <button
          type="button"
          className="list-pagination-nav"
          onClick={() => goTo(safePage - 1)}
          disabled={safePage <= 1}
        >
          Précédent
        </button>

        {pageNumbers.map((page, index) => {
          const prev = pageNumbers[index - 1];
          const showEllipsis = prev && page - prev > 1;

          return (
            <React.Fragment key={page}>
              {showEllipsis && <span className="list-pagination-ellipsis">…</span>}
              <button
                type="button"
                className={`list-pagination-page${page === safePage ? ' is-active' : ''}`}
                onClick={() => goTo(page)}
                aria-current={page === safePage ? 'page' : undefined}
              >
                {page}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          className="list-pagination-nav"
          onClick={() => goTo(safePage + 1)}
          disabled={safePage >= totalPages}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default ListPagination;
