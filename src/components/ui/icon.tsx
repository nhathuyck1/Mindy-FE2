const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  book: 'M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1m0-15c3-2 6-2 9-1v15c-3-1-6-1-9 1V5Z',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  logout: 'M9 4H4v16h5M14 8l4 4-4 4M8 12h12',
  check: 'm5 12 4 4L19 6',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'm21 21-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  list: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
  filter: 'M4 5h16M7 12h10M10 19h4',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
  chevron: 'm9 5 7 7-7 7',
  location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  monitor: 'M3 3h18v13H3zM8 21h8M12 16v5',
} as const;

export function Icon(props: { name: keyof typeof paths; className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      <path d={paths[props.name]} />
    </svg>
  );
}
