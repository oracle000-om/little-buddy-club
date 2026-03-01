import Link from 'next/link';

interface PaginationProps {
    page: number;
    totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    function buildHref(p: number) {
        // Preserve all current search params and just update page
        return `/?page=${p}`;
    }

    return (
        <div className="pagination">
            {page > 1 && (
                <Link href={buildHref(page - 1)} className="pagination__btn" id="pagination-prev">
                    ← Prev
                </Link>
            )}
            {pages.map((p) => (
                <Link
                    key={p}
                    href={buildHref(p)}
                    className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
                    id={`pagination-page-${p}`}
                >
                    {p}
                </Link>
            ))}
            {page < totalPages && (
                <Link href={buildHref(page + 1)} className="pagination__btn" id="pagination-next">
                    Next →
                </Link>
            )}
        </div>
    );
}
