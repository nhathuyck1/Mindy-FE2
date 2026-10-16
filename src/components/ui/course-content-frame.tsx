export function CourseContentFrame(props: {
  sidebarLabel: string;
  sidebarTitle: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="course-content-frame"
      className="grid h-[min(800px,calc(100dvh-2rem))] min-w-0 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] overflow-hidden rounded-2xl border border-line bg-canvas xl:grid-cols-[280px_minmax(0,1fr)] xl:grid-rows-1 [&_*]:scrollbar-hidden"
    >
      <aside
        aria-label={props.sidebarLabel}
        className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-line bg-soft/30 xl:border-r xl:border-b-0"
      >
        <h2 className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-6 font-bold">
          {props.sidebarTitle}
        </h2>
        <div
          role="region"
          aria-label={`${props.sidebarLabel} - vùng cuộn`}
          tabIndex={0}
          className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-inset"
        >
          {props.sidebar}
        </div>
      </aside>
      {props.children}
    </div>
  );
}

export function CourseContentPanel(props: {
  label: string;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={props.label} className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-8">
        {props.header}
      </header>
      <div
        role="region"
        aria-label={`${props.label} - vùng cuộn`}
        tabIndex={0}
        className="scrollbar-hidden min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-inset sm:p-8"
      >
        {props.children}
      </div>
    </section>
  );
}
