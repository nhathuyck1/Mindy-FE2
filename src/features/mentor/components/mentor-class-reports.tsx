'use client';
import { useState } from 'react';
import { Info, CircleAlert, BookOpen, CheckCircle2 } from 'lucide-react';
import {
  MentorProgressBar,
  MentorReportAction,
  MentorReportHeading,
  MentorStudentIdentity,
} from './mentor-report-ui';
import type { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorQuery, useMentorUnitIndex } from '../api/mentor-queries';
import type { ContentUnit } from '../schemas/mentor-contracts';
import {
  attendanceHistorySchema,
  classAttendanceSummarySchema,
  classProgressSchema,
  studentAttendanceSummarySchema,
  studentProgressSchema,
} from '../schemas/workspace-contracts';
import { MentorDateFilter } from './mentor-class-timetable';
import { MentorPagination, MentorQueryState, mentorDate, mentorLabels } from './mentor-shared';

function AttendanceCounts(props: { data: z.infer<typeof studentAttendanceSummarySchema> }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[
        ['Có mặt', props.data.present],
        ['Vắng mặt', props.data.absent],
        ['Chưa điểm danh', props.data.unmarked],
        ['Không tính', props.data.excluded],
        ['Chờ học bù', props.data.makeupPending],
        ['Buổi được tính', props.data.finalizedEligibleCount],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl bg-soft p-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-2 text-lg font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
const applicabilityLabels: Record<string, string> = {
  ELIGIBLE: 'Được tính',
  NOT_STARTED: 'Chưa bắt đầu',
  NOT_ELIGIBLE: 'Không đủ điều kiện',
  PAYMENT_PENDING: 'Chờ thanh toán',
  LEGACY_NO_DATA: 'Chưa có dữ liệu lịch sử',
  MAKEUP_PENDING: 'Chờ học bù',
  MAKEUP_CREDITED: 'Đã tính từ buổi học bù',
};
function StudentAttendance(props: {
  classId: string;
  studentId: string;
  name: string;
  range: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const prefix = `mentor/classes/${props.classId}/students/${props.studentId}`;
  const summary = useMentorQuery(
    `${prefix}/attendance-summary${props.range ? `?${props.range.slice(1)}` : ''}`,
    studentAttendanceSummarySchema,
  );
  const history = useMentorQuery(
    `${prefix}/attendance?page=${page}&pageSize=20${props.range}`,
    attendanceHistorySchema,
  );
  return (
    <Modal
      title={`Chuyên cần · ${props.name}`}
      contentClassName="sm:max-w-2xl"
      onClose={props.onClose}
    >
      <div className="space-y-5 p-5">
        <MentorQueryState
          pending={summary.isPending || history.isPending}
          error={summary.error ?? history.error}
          retry={() => Promise.all([summary.refetch(), history.refetch()])}
        >
          {summary.data && (
            <>
              <MentorProgressBar
                label="Tỷ lệ chuyên cần"
                value={summary.data.rate}
                valueText={
                  summary.data.rate === null
                    ? 'Chưa có dữ liệu'
                    : `${summary.data.rate.toLocaleString('vi-VN')}%`
                }
                caption="Tính trên các buổi đã chốt đủ điều kiện."
              />
              <AttendanceCounts data={summary.data} />
              <p className="text-sm text-muted">
                Tổng hợp toàn bộ lịch sử đăng ký của học viên trong lớp.{' '}
                {summary.data.readonly && 'Lớp đã kết thúc, chỉ xem lịch sử.'}
              </p>
            </>
          )}
          <ul className="space-y-3">
            {history.data?.items.map((item) => (
              <li
                key={`${item.enrollmentId}-${item.sessionId}`}
                className="space-y-2 rounded-xl border border-line p-4"
              >
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-muted">{mentorDate(item.startsAt)}</p>
                <p>
                  Điểm danh thực tế:{' '}
                  {item.attendanceStatus ? mentorLabels[item.attendanceStatus] : 'Chưa có dữ liệu'}
                </p>
                <p>
                  Kết quả được tính:{' '}
                  {item.creditedAttendanceStatus
                    ? mentorLabels[item.creditedAttendanceStatus]
                    : 'Chưa có kết quả'}
                </p>
                <p className="text-sm text-muted">
                  {applicabilityLabels[item.attendanceApplicability]}
                  {item.excluded ? ' · Không tính chuyên cần' : ''} ·{' '}
                  {item.effectiveMentor?.displayName ?? 'Chưa xác định người dạy'}
                </p>
              </li>
            ))}
          </ul>
          {history.data?.total === 0 && <p>Chưa có lịch sử điểm danh.</p>}
          {history.data && (
            <MentorPagination page={page} total={history.data.total} onChange={setPage} />
          )}
        </MentorQueryState>
      </div>
    </Modal>
  );
}
export function MentorClassAttendance(props: { classId: string }) {
  const [range, setRange] = useState('');
  return (
    <>
      <MentorReportHeading
        title="Chuyên cần học viên"
        description="Theo dõi số buổi có mặt, vắng và kết quả học bù trong lớp."
      />
      <MentorDateFilter onApply={setRange} />
      <AttendanceList key={range} classId={props.classId} range={range} />
    </>
  );
}
function AttendanceList(props: { classId: string; range: string }) {
  const [page, setPage] = useState(1);
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const query = useMentorQuery(
    `mentor/classes/${props.classId}/attendance-summary?page=${page}&pageSize=20${props.range}`,
    classAttendanceSummarySchema,
  );
  return (
    <>
      <MentorQueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
        empty={query.data?.total === 0}
      >
        <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-soft/40 px-5 py-3 text-sm">
            <span className="font-bold">Danh sách chuyên cần</span>
            <span className="text-muted">{query.data?.total ?? 0} lần đăng ký</span>
          </div>
          <ul className="divide-y divide-line">
            {query.data?.items.map((item) => (
              <li
                key={item.enrollmentId}
                className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center"
              >
                <MentorStudentIdentity
                  name={item.student.displayName ?? 'Học viên'}
                  caption={`${item.finalizedEligibleCount} buổi đã chốt được tính`}
                />
                <div className="space-y-4">
                  <MentorProgressBar
                    label="Chuyên cần"
                    value={item.rate}
                    valueText={
                      item.rate === null
                        ? 'Chưa có dữ liệu chuyên cần'
                        : `${item.rate.toLocaleString('vi-VN')}%`
                    }
                  />
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <span>
                      <strong className="text-forest">{item.present}</strong> Có mặt
                    </span>
                    <span>
                      <strong className={item.absent > 0 ? 'text-headsup' : ''}>
                        {item.absent}
                      </strong>{' '}
                      Vắng
                    </span>
                    <span className="text-muted">{item.unmarked} Chưa điểm danh</span>
                  </div>
                  {(item.excluded > 0 || item.makeupPending > 0) && (
                    <p className="text-xs text-muted">
                      {item.excluded} buổi không tính · {item.makeupPending} buổi chờ học bù
                    </p>
                  )}
                </div>
                <MentorReportAction
                  label="Xem lịch sử chuyên cần"
                  onClick={() =>
                    setStudent({
                      id: item.student.id,
                      name: item.student.displayName ?? 'Học viên',
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </div>
        {query.data && <MentorPagination page={page} total={query.data.total} onChange={setPage} />}
      </MentorQueryState>
      {student && (
        <StudentAttendance
          classId={props.classId}
          studentId={student.id}
          name={student.name}
          range={props.range}
          onClose={() => setStudent(null)}
        />
      )}
    </>
  );
}
function StudentProgress(props: {
  units: ContentUnit[];
  classId: string;
  studentId: string;
  name: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const query = useMentorQuery(
    `mentor/classes/${props.classId}/students/${props.studentId}/progress?page=${page}&pageSize=20`,
    studentProgressSchema,
  );
  return (
    <Modal
      title={`Tiến độ · ${props.name}`}
      contentClassName="sm:max-w-2xl"
      onClose={props.onClose}
    >
      <div className="space-y-5 p-5">
        <div className="flex items-start gap-3 rounded-xl bg-soft/60 p-4 text-sm leading-6 text-muted">
          <BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
          <p>
            Tiến độ từng chương theo dữ liệu đã lưu. Chương chưa có dữ liệu được hiển thị riêng.
          </p>
        </div>
        <MentorQueryState
          pending={query.isPending}
          error={query.error}
          retry={query.refetch}
          empty={query.data?.total === 0}
        >
          <ul className="space-y-4">
            {query.data?.items.map((item) => {
              const unit = props.units.find((unit) => unit.id === item.classUnitId);
              const valid =
                item.trackingStatus === 'STORED' &&
                item.dataQuality === 'VALID' &&
                item.progressPercent !== null;
              const value = valid ? Number(item.progressPercent) : null;
              const invalid = item.dataQuality === 'INVALID_PERCENT';
              const label = valid
                ? `${value?.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`
                : invalid
                  ? 'Cần kiểm tra dữ liệu'
                  : 'Chưa có dữ liệu';
              return (
                <li
                  key={`${item.enrollmentId}-${item.classUnitId}`}
                  className="space-y-4 rounded-xl border border-line bg-canvas p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-sm font-extrabold text-mint">
                      {unit?.position ?? <BookOpen className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold break-words">
                        {unit?.title ?? 'Chương chưa xác định'}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {item.status === 'NOT_STARTED'
                          ? 'Chưa bắt đầu'
                          : item.status
                            ? (mentorLabels[item.status] ?? item.status)
                            : 'Chưa ghi nhận hoạt động'}
                      </p>
                    </div>
                    {valid && value === 100 && (
                      <CheckCircle2
                        aria-label="Đã lưu 100%"
                        className="size-5 shrink-0 text-mint"
                      />
                    )}
                  </div>
                  <MentorProgressBar
                    label={`Tiến độ chương ${unit?.position ?? ''}`}
                    value={value}
                    valueText={label}
                    attention={invalid}
                  />
                  {invalid && (
                    <p className="flex items-center gap-2 text-xs text-headsup">
                      <CircleAlert className="size-4 shrink-0" />
                      Giá trị đã lưu không hợp lệ, cần được kiểm tra lại.
                    </p>
                  )}
                  {item.completedAt && (
                    <p className="text-xs text-muted">
                      Mốc hoàn thành đã lưu: {mentorDate(item.completedAt)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <details className="text-xs leading-5 text-muted">
            <summary className="min-h-11 cursor-pointer content-center font-semibold">
              Cách đọc tiến độ
            </summary>
            <p className="pb-3">
              Thanh hiển thị phần trăm đã lưu cho từng chương. Chưa có dữ liệu khác với 0%. Hệ thống
              chưa xác định tiêu chí hoàn thành toàn khóa.
            </p>
          </details>
          {query.data && (
            <MentorPagination page={page} total={query.data.total} onChange={setPage} />
          )}
        </MentorQueryState>
      </div>
    </Modal>
  );
}
export function MentorClassProgress(props: { classId: string }) {
  const [unitId, setUnitId] = useState('');
  const units = useMentorUnitIndex(props.classId);
  return (
    <>
      <MentorReportHeading
        title="Tiến độ học tập"
        description="Chọn học viên để xem thanh tiến độ của từng chương."
      >
        <label className="block w-full space-y-2 text-sm font-semibold sm:w-64">
          Lọc chương
          <NativeSelect
            aria-label="Lọc chương"
            wrapperClassName="w-full"
            className="h-11 bg-canvas"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <NativeSelectOption value="">Tất cả chương</NativeSelectOption>
            {units.data?.map((item) => (
              <NativeSelectOption value={item.id} key={item.id}>
                {item.position}. {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </MentorReportHeading>
      {units.error && (
        <p role="alert" className="mb-3">
          Không tải được bộ lọc chương.{' '}
          <Button variant="outline" onClick={() => units.refetch()}>
            Thử lại
          </Button>
        </p>
      )}
      <ProgressList key={unitId} classId={props.classId} unitId={unitId} units={units.data ?? []} />
    </>
  );
}
function ProgressList(props: { classId: string; unitId: string; units: ContentUnit[] }) {
  const [page, setPage] = useState(1);
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const query = useMentorQuery(
    `mentor/classes/${props.classId}/progress?page=${page}&pageSize=20${props.unitId ? `&unitId=${props.unitId}` : ''}`,
    classProgressSchema,
  );
  return (
    <>
      <MentorQueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
        empty={query.data?.total === 0}
      >
        <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-soft/40 px-5 py-3 text-sm">
            <span className="font-bold">Theo dõi theo học viên</span>
            <span className="text-muted">{query.data?.total ?? 0} lần đăng ký</span>
          </div>
          <ul className="divide-y divide-line">
            {query.data?.items.map((item) => {
              const total = item.storedUnitCount + item.untrackedUnitCount;
              const coverage = total > 0 ? (item.storedUnitCount / total) * 100 : null;
              return (
                <li
                  key={item.enrollmentId}
                  className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-center"
                >
                  <MentorStudentIdentity
                    name={item.displayName}
                    caption={props.unitId ? 'Chương đang lọc' : 'Tất cả chương trong lớp'}
                  />
                  <div className="space-y-3">
                    <MentorProgressBar
                      label="Chương đã có dữ liệu"
                      value={coverage}
                      valueText={
                        total > 0 ? `${item.storedUnitCount}/${total} chương` : 'Chưa có chương'
                      }
                    />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <span className="text-muted">
                        {item.untrackedUnitCount} chương chưa có dữ liệu
                      </span>
                      {item.invalidStoredUnitCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-2.5 py-1 font-semibold text-headsup">
                          <CircleAlert className="size-3.5" />
                          {item.invalidStoredUnitCount} cần kiểm tra
                        </span>
                      )}
                    </div>
                  </div>
                  <MentorReportAction
                    label="Xem tiến độ học viên"
                    onClick={() => setStudent({ id: item.studentId, name: item.displayName })}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Thanh tổng quan thể hiện số chương đã có dữ liệu; phần trăm từng chương nằm trong chi tiết
          học viên.
        </p>
        {query.data && <MentorPagination page={page} total={query.data.total} onChange={setPage} />}
      </MentorQueryState>
      {student && (
        <StudentProgress
          units={props.units}
          classId={props.classId}
          studentId={student.id}
          name={student.name}
          onClose={() => setStudent(null)}
        />
      )}
    </>
  );
}
