'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { useCourseCatalog, useCourseCategories } from '../../api/course-queries';
import { filterCourses, type CourseSort } from '../../lib/course-format';
import { CourseCard } from '../shared/course-card';
import { QueryState } from '../shared/query-state';
import { Pagination } from '../shared/pagination';
import {
  CourseFilters,
  deliveryOptions,
  priceOptions,
  type CatalogFilters,
} from './course-filters';

const emptyFilters: CatalogFilters = { categoryId: '', deliveryMode: '', price: '' };
const pageSize = 9;

export function CourseCatalog() {
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CourseSort>('default');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const categories = useCourseCategories();
  const courses = useCourseCatalog({
    categoryId: filters.categoryId,
    deliveryMode: filters.deliveryMode || undefined,
  });
  const filtered = filterCourses(courses.data ?? [], search, filters.price, sort);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const activePage = Math.min(page, Math.max(totalPages, 1));
  const visible = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const updateFilters = (value: CatalogFilters) => {
    setFilters(value);
    setPage(1);
  };
  const reset = () => {
    updateFilters(emptyFilters);
    setSearch('');
  };
  const chips = [
    {
      key: 'categoryId' as const,
      label: categories.data?.find((category) => category.id === filters.categoryId)?.name,
      active: filters.categoryId,
    },
    {
      key: 'deliveryMode' as const,
      label: deliveryOptions.find((option) => option.value === filters.deliveryMode)?.label,
      active: filters.deliveryMode,
    },
    {
      key: 'price' as const,
      label: priceOptions.find((option) => option.value === filters.price)?.label,
      active: filters.price,
    },
  ].filter((chip) => chip.active);

  return (
    <div className="page-container py-7 lg:py-9">
      <nav
        aria-label="Đường dẫn"
        className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted"
      >
        <Link href="/" className="hover:text-mint">
          Trang chủ
        </Link>
        <Icon name="chevron" className="size-3" />
        <span aria-current="page" className="font-bold text-mint">
          Khóa học
        </span>
      </nav>
      <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-[40px]">
        Khám phá tất cả khóa học
      </h1>
      <p className="mt-2 text-base font-semibold text-muted">
        Tìm điều bạn muốn học, chọn lớp phù hợp và bắt đầu cùng Mindy.
      </p>
      <div className="my-6 flex flex-col gap-4 rounded-xl border border-line bg-canvas p-3.5 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Icon
            name="search"
            className="pointer-events-none absolute top-3.5 left-3 size-4 text-mint"
          />
          <label htmlFor="course-search" className="sr-only">
            Tìm khóa học
          </label>
          <input
            id="course-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên khóa học, công nghệ…"
            className="min-h-11 w-full rounded-lg border border-line bg-soft pr-3 pl-9 text-base font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="course-sort" className="text-sm font-semibold text-muted">
            Sắp xếp:
          </label>
          <select
            id="course-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as CourseSort);
              setPage(1);
            }}
            className="min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg border border-line bg-soft px-3 text-sm font-bold"
          >
            <option value="default">Mặc định</option>
            <option value="title">Tên A – Z</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
          </select>
          <div
            role="group"
            aria-label="Cách hiển thị khóa học"
            className="flex rounded-lg border border-line bg-soft p-0.5"
          >
            {(['grid', 'list'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-label={item === 'grid' ? 'Chế độ lưới' : 'Chế độ danh sách'}
                aria-pressed={view === item}
                onClick={() => setView(item)}
                className={`grid size-11 cursor-pointer place-items-center rounded-md ${view === item ? 'bg-canvas text-mint shadow-sm' : 'font-semibold text-muted'}`}
              >
                <Icon name={item} className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 font-semibold text-muted">Đang lọc:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateFilters({ ...filters, [chip.key]: '' })}
              aria-label={`Xóa bộ lọc ${chip.label}`}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-mint/10 px-3 font-bold"
            >
              {chip.label}
              <Icon name="close" className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="min-h-11 cursor-pointer px-2 font-bold text-mint"
          >
            Xóa tất cả
          </button>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div>
          <details className="mb-4 rounded-xl border border-line bg-canvas p-4 lg:hidden">
            <summary className="cursor-pointer text-base font-extrabold">Lọc khóa học</summary>
            <div className="mt-4">
              <CourseFilters
                filters={filters}
                categories={categories.data ?? []}
                categoriesError={categories.isError}
                retryCategories={() => void categories.refetch()}
                onChange={updateFilters}
                onReset={reset}
              />
            </div>
          </details>
          <div className="hidden lg:block">
            <CourseFilters
              filters={filters}
              categories={categories.data ?? []}
              categoriesError={categories.isError}
              retryCategories={() => void categories.refetch()}
              onChange={updateFilters}
              onReset={reset}
            />
          </div>
        </div>
        <div className="min-w-0">
          {courses.isPending ? (
            <QueryState title="Đang tải khóa học…" loading />
          ) : courses.isError ? (
            <QueryState
              title="Chưa thể tải khóa học"
              description="Vui lòng thử lại sau ít phút."
              retry={() => void courses.refetch()}
            />
          ) : (
            <>
              <p role="status" className="mb-4 text-sm font-semibold text-muted">
                <strong className="text-mint">{filtered.length} khóa học</strong>
                {filtered.length > 0 &&
                  ` · Hiển thị ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, filtered.length)}`}
              </p>
              {visible.length ? (
                <div
                  className={
                    view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-4'
                  }
                >
                  {visible.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      list={view === 'list'}
                      comfortable
                    />
                  ))}
                </div>
              ) : (
                <QueryState
                  title="Chưa tìm thấy khóa học phù hợp"
                  description="Thử từ khóa khác hoặc giảm bớt bộ lọc để khám phá thêm khóa học."
                />
              )}
              <Pagination
                comfortable
                page={activePage}
                totalPages={totalPages}
                onChange={(value) => {
                  setPage(value);
                  document.getElementById('main-content')?.scrollIntoView({ behavior: 'instant' });
                }}
              />
            </>
          )}
        </div>
      </div>
      <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border border-line bg-canvas p-6 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft text-mint">
          <Icon name="calendar" />
        </span>
        <div>
          <h2 className="text-base font-extrabold">Học theo lịch phù hợp với bạn</h2>
          <p className="mt-1 text-sm leading-relaxed font-semibold text-muted">
            Mở chi tiết khóa học để xem giáo trình, mentor và lịch của từng lớp đang mở.
          </p>
        </div>
      </div>
    </div>
  );
}
