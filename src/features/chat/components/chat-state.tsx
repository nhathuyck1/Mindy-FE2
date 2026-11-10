import { Button } from '@/components/ui/button';
import { chatError } from '../api/chat-queries';
export function ChatState(props: {
  pending?: boolean;
  error?: unknown;
  retry?: () => unknown;
  empty?: string;
}) {
  if (props.pending) return null;
  return (
    <div className="p-6 text-sm text-muted" role={props.error ? 'alert' : 'status'}>
      <p>{props.error ? chatError(props.error) : props.empty}</p>
      {!!props.error && props.retry && (
        <Button variant="outline" className="mt-3" onClick={() => props.retry?.()}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
