import type { Socket } from 'socket.io-client';
import { createRealtimeSocket } from '@/lib/realtime/client';
import * as Y from 'yjs';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import {
  boardResponseSchema,
  boardSyncSchema,
  type BoardSync,
  type BoardShape,
} from '../schemas/whiteboard-contracts';
import { LOCAL_BOARD_ORIGIN, fromBase64, readShapes, toBase64 } from './board-shapes';

const REMOTE = Symbol('remote-board');
const ackSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), data: z.unknown() }),
  z.object({ ok: z.literal(false), error: z.object({ statusCode: z.number(), code: z.string() }) }),
]);
const awarenessSchema = z.object({
  connectionId: z.string(),
  identity: z.object({ id: z.uuidv4(), name: z.string() }),
  x: z.number().finite(),
  y: z.number().finite(),
});
export interface BoardPeer {
  connectionId: string;
  id: string;
  name: string;
  x: number;
  y: number;
  seenAt: number;
}
export interface BoardConnectionState {
  status: 'connecting' | 'online' | 'offline' | 'denied';
  shapes: BoardShape[];
  pending: number;
  state: BoardSync | null;
  notice: string;
  peers: BoardPeer[];
}
interface Pending {
  updateId: string;
  epoch: string;
  binary: string;
}

/** One user, one board and one editing lifetime. No shared storage or cross-tab transport. */
export class BoardConnection {
  doc = new Y.Doc();
  undo = new Y.UndoManager(this.doc.getMap('shapes'), {
    trackedOrigins: new Set([LOCAL_BOARD_ORIGIN]),
    captureTimeout: 0,
  });
  private socket?: Socket;
  private connectionAttempt = 0;
  private pending: Pending[] = [];
  private sending = false;
  private stopped = false;
  private retries = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private presenceTimer?: ReturnType<typeof setInterval>;
  private epoch?: string;
  private lastAwareness = 0;
  private signal = sessionSignal();
  private listeners = new Set<() => void>();
  private snapshot: BoardConnectionState = {
    status: 'connecting',
    shapes: [],
    pending: 0,
    state: null,
    notice: '',
    peers: [],
  };
  constructor(readonly boardId: string) {
    this.doc.on('update', this.changed);
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private publish(update: Partial<BoardConnectionState>) {
    this.snapshot = { ...this.snapshot, ...update, pending: this.pending.length };
    this.listeners.forEach((l) => l());
  }
  editable() {
    return (
      this.snapshot.status === 'online' &&
      !!this.snapshot.state?.capabilities.canEdit &&
      this.pending.length < 32
    );
  }
  start() {
    if (this.stopped) {
      this.replaceDocument();
      this.epoch = undefined;
      this.snapshot = {
        status: 'connecting',
        shapes: [],
        pending: 0,
        state: null,
        notice: '',
        peers: [],
      };
    }
    this.stopped = false;
    this.signal.addEventListener('abort', this.abort, { once: true });
    void this.connect();
    this.presenceTimer = setInterval(
      () =>
        this.publish({ peers: this.snapshot.peers.filter((p) => Date.now() - p.seenAt < 6000) }),
      2000,
    );
  }
  private abort = () => {
    this.stop();
  };
  stop() {
    this.stopped = true;
    this.connectionAttempt++;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.presenceTimer);
    this.signal.removeEventListener('abort', this.abort);
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.pending = [];
    this.doc.off('update', this.changed);
    this.undo.destroy();
    this.doc.destroy();
    this.publish({ status: 'denied', shapes: [], state: null, peers: [] });
  }
  private changed = (bytes: Uint8Array, origin: unknown) => {
    if (origin !== REMOTE) {
      if (!this.epoch || !this.editable()) return;
      if (bytes.length > 262144) {
        this.resync('Thao tác quá lớn. Hãy chia nội dung thành phần nhỏ hơn.');
        return;
      }
      this.pending.push({
        updateId: crypto.randomUUID(),
        epoch: this.epoch,
        binary: toBase64(bytes),
      });
    }
    this.publish({ shapes: readShapes(this.doc) });
    if (origin !== REMOTE) void this.flush();
  };
  private async connect() {
    if (this.stopped || this.signal.aborted) return;
    clearTimeout(this.reconnectTimer);
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    const attempt = ++this.connectionAttempt;
    const offline = () => {
      if (this.stopped || attempt !== this.connectionAttempt || this.snapshot.status === 'denied')
        return;
      this.sending = false;
      this.publish({ status: 'offline', peers: [] });
      if (this.retries < 3) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          void this.reconnect();
        }, [1000, 2000, 5000][this.retries++]);
      }
    };
    let socket: Socket;
    try {
      socket = await createRealtimeSocket('whiteboards', this.signal);
    } catch (error) {
      if (this.stopped || attempt !== this.connectionAttempt) return;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status))
        this.deny('Phiên hoặc quyền truy cập bảng đã thay đổi.');
      else offline();
      return;
    }
    if (this.stopped || attempt !== this.connectionAttempt || this.signal.aborted) {
      socket.disconnect();
      return;
    }
    this.socket = socket;
    socket.on('connect', () => {
      void this.join();
    });
    socket.on('board:state', (raw: unknown) => {
      const parsed = boardSyncSchema.safeParse(raw);
      if (parsed.success) this.accept(parsed.data);
      else this.deny('Dữ liệu bảng không hợp lệ.');
    });
    socket.on('board:revoked', () =>
      this.deny('Quyền truy cập bảng đã thay đổi. Vui lòng về buổi học.'),
    );
    socket.on('board:awareness', (raw: unknown) => {
      const p = awarenessSchema.safeParse(raw);
      if (!p.success) return;
      this.publish({
        peers: [
          ...this.snapshot.peers.filter((x) => x.connectionId !== p.data.connectionId),
          {
            connectionId: p.data.connectionId,
            ...p.data.identity,
            x: p.data.x,
            y: p.data.y,
            seenAt: Date.now(),
          },
        ],
      });
    });
    socket.on('disconnect', offline);
    socket.on('connect_error', offline);
    socket.connect();
  }
  private async emit(event: string, payload: unknown) {
    if (!this.socket?.connected) throw new Error('Disconnected');
    const response = ackSchema.parse(await this.socket.timeout(8000).emitWithAck(event, payload));
    if (!response.ok)
      throw new ApiError(response.error.statusCode, response.error.code, 'Chưa thể đồng bộ bảng.');
    return response.data;
  }
  private async join() {
    const attempt = this.connectionAttempt;
    try {
      const state = boardSyncSchema.parse(await this.emit('board:join', { boardId: this.boardId }));
      if (this.stopped || attempt !== this.connectionAttempt) return;
      this.accept(state);
      if (!this.pending.length) this.retries = 0;
      this.publish({ status: 'online' });
      void this.flush();
    } catch (e) {
      if (this.stopped || attempt !== this.connectionAttempt) return;
      if (e instanceof ApiError && [401, 403, 404].includes(e.status))
        this.deny('Phiên hoặc quyền truy cập bảng đã thay đổi.');
      else this.publish({ status: 'offline' });
    }
  }
  private accept(state: BoardSync) {
    if (this.stopped) return;
    const changed = this.epoch !== undefined && this.epoch !== state.board.epoch;
    const becameReadOnly = !!this.pending.length && !state.capabilities.canEdit;
    if (changed || becameReadOnly) {
      this.pending = [];
      this.replaceDocument();
      this.publish({
        notice: changed
          ? 'Bảng đã được khôi phục hoặc xóa. Các thao tác chưa lưu của mốc cũ đã được bỏ.'
          : 'Quyền vẽ đã thay đổi. Các thao tác chưa được xác nhận đã được bỏ.',
      });
    }
    if (
      !changed &&
      this.snapshot.state &&
      this.epoch === state.board.epoch &&
      BigInt(state.board.sequence) < BigInt(this.snapshot.state.board.sequence)
    )
      return;
    this.epoch = state.board.epoch;
    try {
      Y.applyUpdate(this.doc, fromBase64(state.binary), REMOTE);
      this.publish({ state, shapes: readShapes(this.doc) });
    } catch {
      this.deny('Chưa thể đọc nội dung bảng.');
    }
  }
  private replaceDocument() {
    this.doc.off('update', this.changed);
    this.undo.destroy();
    this.doc.destroy();
    this.doc = new Y.Doc();
    this.undo = new Y.UndoManager(this.doc.getMap('shapes'), {
      trackedOrigins: new Set([LOCAL_BOARD_ORIGIN]),
      captureTimeout: 0,
    });
    this.doc.on('update', this.changed);
  }
  private resync(notice: string) {
    this.pending = [];
    this.replaceDocument();
    this.publish({ notice, status: 'connecting', shapes: [] });
    void this.join();
  }
  private deny(notice: string) {
    this.pending = [];
    this.replaceDocument();
    this.publish({ status: 'denied', notice, shapes: [], state: null, peers: [] });
    this.socket?.disconnect();
  }
  private async flush() {
    if (this.sending || this.stopped || this.snapshot.status !== 'online') return;
    this.sending = true;
    try {
      while (this.pending.length && this.snapshot.status === 'online') {
        const item = this.pending[0];
        const accepted = z
          .object({ epoch: z.uuidv4(), sequence: z.string(), updateId: z.uuidv4() })
          .parse(await this.emit('board:update', item));
        if (this.stopped) return;
        if (
          this.snapshot.state &&
          accepted.epoch === this.epoch &&
          BigInt(accepted.sequence) > BigInt(this.snapshot.state.board.sequence)
        )
          this.publish({
            state: {
              ...this.snapshot.state,
              board: { ...this.snapshot.state.board, sequence: accepted.sequence },
            },
          });
        this.retries = 0;
        if (this.pending[0] === item) this.pending.shift();
        this.publish({});
      }
    } catch (e) {
      if (e instanceof ApiError && [403, 401, 404].includes(e.status))
        this.deny('Phiên hoặc quyền vẽ đã thay đổi.');
      else if (e instanceof ApiError && [409, 413, 422].includes(e.status))
        this.resync('Thao tác chưa được chấp nhận. Bảng đã tải lại nội dung được lưu.');
      else {
        this.publish({
          status: 'offline',
          notice: 'Chưa nhận được xác nhận lưu. Kết nối lại để kiểm tra và gửi tiếp.',
        });
        this.socket?.disconnect();
      }
    } finally {
      this.sending = false;
    }
  }
  refresh() {
    void this.join();
  }
  async reconnect() {
    if (this.stopped) return;
    clearTimeout(this.reconnectTimer);
    const attempt = this.connectionAttempt;
    this.publish({ status: 'connecting' });
    try {
      await apiRequest({
        path: `whiteboards/${this.boardId}`,
        schema: boardResponseSchema,
        signal: this.signal,
      });
      if (!this.stopped && attempt === this.connectionAttempt) await this.connect();
    } catch (e) {
      if (this.stopped || attempt !== this.connectionAttempt) return;
      if (e instanceof ApiError && [401, 403, 404].includes(e.status))
        this.deny('Phiên hoặc quyền truy cập đã thay đổi.');
      else this.publish({ status: 'offline' });
    }
  }
  awareness(x: number, y: number) {
    if (this.snapshot.status !== 'online' || Date.now() - this.lastAwareness < 120) return;
    this.lastAwareness = Date.now();
    void this.emit('board:awareness', { x, y }).catch(() => {});
  }
  clearNotice() {
    this.publish({ notice: '' });
  }
}
