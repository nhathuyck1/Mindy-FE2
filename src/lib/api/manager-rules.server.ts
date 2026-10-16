import 'server-only';
import { z } from 'zod';
import * as dto from '@/features/manager/schemas/manager-contracts';
import * as collections from '@/features/manager/schemas/manager-collections-contracts';

type ManagerRule = {
  response: z.ZodType;
  body?: z.ZodType;
  query: z.ZodType<Record<string, string | number>>;
  cookies: string[];
};
function rule(
  response: z.ZodType,
  options: Partial<Pick<ManagerRule, 'body' | 'query'>> = {},
): ManagerRule {
  return { response, cookies: ['access_token'], query: z.object({}).strict(), ...options };
}
export function resolveManagerRule(method: string, path: string): ManagerRule | undefined {
  const p = path.split('/');
  if (path === 'files/upload-intents' && method === 'POST')
    return rule(dto.uploadIntentSchema, { body: dto.managerUploadSchema });
  if (p[0] !== 'manager') return;
  if (method === 'GET' && path === 'manager/classes')
    return rule(collections.collectionClassesSchema, {
      query: collections.collectionClassesFiltersSchema,
    });
  if (method === 'GET' && path === 'manager/orders')
    return rule(collections.collectionOrdersSchema, { query: collections.collectionFiltersSchema });
  if (method === 'GET' && p[1] === 'orders' && p.length === 3 && z.uuid().safeParse(p[2]).success)
    return rule(collections.collectionOrderDetailSchema.refine((order) => order.id === p[2]));
  if (
    method === 'POST' &&
    p[1] === 'cash-orders' &&
    p.length === 4 &&
    p[3] === 'confirm' &&
    z.uuid().safeParse(p[2]).success
  )
    return rule(
      collections.confirmedCashOrderSchema.refine((order) => order.id === p[2]),
      { body: collections.confirmCashSchema },
    );
  if (path === 'manager/materials' && method === 'GET')
    return rule(dto.materialsSchema, { query: dto.managerFiltersSchema });
  if (
    p[1] === 'course-units' &&
    z.uuid().safeParse(p[2]).success &&
    p.length === 4 &&
    p[3] === 'materials'
  ) {
    if (method === 'GET')
      return rule(dto.materialsSchema, {
        query: dto.managerFiltersSchema.omit({ courseUnitId: true }),
      });
    if (method === 'POST')
      return rule(dto.materialDetailSchema, { body: dto.createMaterialSchema });
  }
  if (p[1] !== 'materials' || !z.uuid().safeParse(p[2]).success) return;
  if (p.length === 3) {
    if (method === 'GET') return rule(dto.materialDetailSchema);
    if (method === 'PATCH')
      return rule(dto.materialDetailSchema, { body: dto.patchMaterialSchema });
    if (method === 'DELETE') return rule(z.null(), { query: dto.deleteMaterialQuerySchema });
  }
  if (method === 'POST' && p.length === 4) {
    if (p[3] === 'reject')
      return rule(dto.materialDetailSchema, { body: dto.rejectMaterialSchema });
    if (['approve', 'publish', 'unpublish'].includes(p[3]))
      return rule(dto.materialDetailSchema, { body: dto.revisionSchema });
  }
  if (
    method === 'POST' &&
    p.length === 6 &&
    p[3] === 'files' &&
    z.uuid().safeParse(p[4]).success &&
    p[5] === 'access'
  )
    return rule(dto.fileAccessSchema);
}
