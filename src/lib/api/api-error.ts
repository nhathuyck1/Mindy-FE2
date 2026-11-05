import type { ValidationField, ScheduleConflict } from './validation-fields';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: ValidationField[] = [],
    public conflicts: ScheduleConflict[] = [],
  ) {
    super(message);
  }
}
