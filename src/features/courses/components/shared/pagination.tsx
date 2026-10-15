export function Pagination(props: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  comfortable?: boolean;
}) {
  if (props.totalPages <= 1) return null;
  const pages = [...new Set([1, props.page - 1, props.page, props.page + 1, props.totalPages])]
    .filter((page) => page >= 1 && page <= props.totalPages)
    .sort((a, b) => a - b);
  return (
    <nav
      aria-label="Phân trang"
      className={`mt-8 flex flex-wrap items-center justify-center gap-2 font-bold ${props.comfortable ? 'text-sm' : 'text-xs'}`}
    >
      <button
        type="button"
        disabled={props.page <= 1}
        onClick={() => props.onChange(props.page - 1)}
        className="min-h-11 cursor-pointer rounded-lg border border-line bg-canvas px-3 disabled:cursor-default disabled:opacity-40"
      >
        Trước
      </button>
      {pages.map((page, index) => (
        <span key={page} className="flex items-center gap-2">
          {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <button
            type="button"
            aria-label={`Trang ${page}`}
            aria-current={props.page === page ? 'page' : undefined}
            onClick={() => props.onChange(page)}
            className={`size-11 cursor-pointer rounded-lg border ${props.page === page ? 'border-mint bg-mint text-canvas' : 'border-line bg-canvas hover:bg-soft'}`}
          >
            {page}
          </button>
        </span>
      ))}
      <button
        type="button"
        disabled={props.page >= props.totalPages}
        onClick={() => props.onChange(props.page + 1)}
        className="min-h-11 cursor-pointer rounded-lg border border-line bg-canvas px-3 disabled:cursor-default disabled:opacity-40"
      >
        Sau
      </button>
    </nav>
  );
}
