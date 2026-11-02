'use client';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Modal } from '@/components/ui/modal';
import { ApiError } from '@/lib/api/client';
import { useAssignmentCommand } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import { ErrorNotice, fieldClass, panelClass } from './assignment-ui';

export function toDateInput(value: string | null) {
  return value ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16) : '';
}
function iso(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value ? `${value}:00+07:00` : null;
}
function MetadataFields(props: { item?: dto.Assignment; type: string; disabled: boolean }) {
  const a = props.item;
  return (
    <fieldset disabled={props.disabled} className="grid min-w-0 gap-5">
      <label className={fieldClass}>
        Tên bài tập
        <Input name="title" required maxLength={250} defaultValue={a?.title} />
      </label>
      <label className={fieldClass}>
        Hướng dẫn
        <Textarea name="description" rows={4} maxLength={20000} defaultValue={a?.description} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={fieldClass}>
          Hạn nộp (giờ Việt Nam)
          <Input
            type="datetime-local"
            name="dueAt"
            required={props.type === 'ZIP'}
            defaultValue={toDateInput(a?.dueAt ?? null)}
          />
        </label>
        {props.type === 'QUIZ' && (
          <label className={fieldClass}>
            Thời gian (phút)
            <Input
              type="number"
              name="timeLimitMinutes"
              min={1}
              max={240}
              defaultValue={a?.timeLimitMinutes ?? ''}
              placeholder="Không giới hạn"
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
export function AssignmentCreate(props: { sessionId: string; onCreated: () => unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} />
        Tạo bài tập
      </Button>
      {open && (
        <Modal
          title="Tạo bài tập"
          onClose={() => setOpen(false)}
          contentClassName="assignment-workspace"
        >
          <CreateForm {...props} />
        </Modal>
      )}
    </>
  );
}
function CreateForm(props: { sessionId: string; onCreated: () => unknown }) {
  const [type, setType] = useState('QUIZ');
  const [error, setError] = useState<unknown>(null);
  const [mustCheck, setMustCheck] = useState(false);
  const command = useAssignmentCommand(dto.mentorAssignmentSchema);
  const router = useRouter();
  const lock = useRef(false);
  return (
    <form
      className="space-y-5 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current || mustCheck) return;
        lock.current = true;
        setError(null);
        const data = new FormData(e.currentTarget);
        try {
          const body = dto.createInputSchema.parse({
            type,
            purpose: data.get('purpose'),
            title: data.get('title'),
            description: data.get('description'),
            maxScore: data.get('maxScore'),
            dueAt: iso(data.get('dueAt')),
            timeLimitMinutes:
              type === 'QUIZ' && data.get('timeLimitMinutes')
                ? Number(data.get('timeLimitMinutes'))
                : null,
            maxAttempts: type === 'ZIP' ? Number(data.get('maxAttempts')) : 1,
          });
          if (body.dueAt && Date.parse(body.dueAt) <= Date.now())
            throw new ApiError(422, 'INVALID_DEADLINE', 'Hạn nộp phải ở tương lai.');
          const result = await command.mutateAsync({
            path: `mentor/class-sessions/${props.sessionId}/assignments`,
            body,
          });
          props.onCreated();
          router.push(`/mentor/assignments/${result.id}`);
        } catch (error) {
          setError(error);
          if (
            !(error instanceof z.ZodError) &&
            (!(error instanceof ApiError) || error.status >= 500)
          )
            setMustCheck(true);
        } finally {
          lock.current = false;
        }
      }}
    >
      <fieldset className="grid gap-5" disabled={command.isPending || mustCheck}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={fieldClass}>
            Loại bài
            <NativeSelect
              aria-label="Loại bài"
              wrapperClassName="w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="QUIZ">Trắc nghiệm ABCD</option>
              <option value="ZIP">Bài nộp ZIP</option>
            </NativeSelect>
          </label>
          <label className={fieldClass}>
            Mục đích
            <NativeSelect aria-label="Mục đích" wrapperClassName="w-full" name="purpose">
              <option value="HOMEWORK">Bài về nhà</option>
              <option value="TEST">Kiểm tra</option>
            </NativeSelect>
          </label>
        </div>
        <MetadataFields type={type} disabled={false} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={fieldClass}>
            Điểm tối đa
            <Input name="maxScore" inputMode="decimal" required defaultValue="10" />
          </label>
          {type === 'ZIP' && (
            <label className={fieldClass}>
              Số lượt tối đa
              <Input name="maxAttempts" type="number" min={1} max={10} defaultValue={1} required />
            </label>
          )}
        </div>
      </fieldset>
      <ErrorNotice error={error} />
      {mustCheck ? (
        <Button
          variant="outline"
          onClick={() => {
            props.onCreated();
            router.refresh();
          }}
        >
          Kiểm tra danh sách bài tập
        </Button>
      ) : (
        <Button type="submit" disabled={command.isPending}>
          {command.isPending ? 'Đang tạo…' : 'Tạo bản nháp'}
        </Button>
      )}
    </form>
  );
}
export function AssignmentMetadataEditor(props: {
  item: dto.Assignment;
  onSaved: (item: dto.Assignment) => void;
}) {
  const command = useAssignmentCommand(dto.mentorAssignmentSchema);
  const [error, setError] = useState<unknown>(null);
  const [blocked, setBlocked] = useState(false);
  const revision = useRef(props.item.revision);
  return (
    <form
      className={`${panelClass} space-y-5`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (command.isPending || blocked) return;
        const data = new FormData(e.currentTarget);
        try {
          const body = dto.patchInputSchema.parse({
            expectedRevision: revision.current,
            title: data.get('title'),
            description: data.get('description'),
            dueAt: iso(data.get('dueAt')),
            timeLimitMinutes:
              props.item.type === 'QUIZ' && data.get('timeLimitMinutes')
                ? Number(data.get('timeLimitMinutes'))
                : null,
          });
          const result = await command.mutateAsync({
            path: `mentor/assignments/${props.item.id}`,
            method: 'PATCH',
            body,
          });
          revision.current = result.revision;
          setError(null);
          props.onSaved(result);
        } catch (e) {
          setError(e);
          if (
            !(e instanceof z.ZodError) &&
            ((e instanceof ApiError && e.status === 409) || !(e instanceof ApiError))
          )
            setBlocked(true);
        }
      }}
    >
      <h2 className="text-xl font-extrabold">Thông tin bài tập</h2>
      <MetadataFields
        item={props.item}
        type={props.item.type}
        disabled={command.isPending || blocked}
      />
      <ErrorNotice error={error} />
      {blocked && (
        <p className="text-sm text-muted">
          Bản nhập được giữ tại đây. Đóng trình sửa và mở lại sau khi kiểm tra bản mới.
        </p>
      )}
      <Button type="submit" disabled={command.isPending || blocked}>
        {command.isPending ? 'Đang lưu…' : 'Lưu thông tin'}
      </Button>
    </form>
  );
}
