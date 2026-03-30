import type { ServiceResult } from '@sdkwork/notes-types';

export const Result = {
  success<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data,
    };
  },
  error<T>(message: string): ServiceResult<T> {
    return {
      success: false,
      message,
    };
  },
};
