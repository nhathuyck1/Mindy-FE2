import { ManagerMaterialReviewPage } from '@/features/manager/components/manager-material-review-page';

export default async function MaterialReviewPage(props: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await props.params;
  return <ManagerMaterialReviewPage materialId={materialId} />;
}
