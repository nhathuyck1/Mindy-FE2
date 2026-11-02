import { WhiteboardPage } from '@/features/whiteboard/components/whiteboard-page';
export const metadata = {
  title: 'Bảng vẽ lớp học | Mindy',
  robots: { index: false, follow: false },
};
export default async function SessionBoardPage(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  return <WhiteboardPage sessionId={sessionId} />;
}
