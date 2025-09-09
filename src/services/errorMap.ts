import { AppError } from './appError';

export const GLOBAL_ERROR_MAP: Record<number, string> = {
  401: 'UNAUTHORIZED',
  500: 'SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
  451: 'UNAVAILABLE_FOR_LEGAL_REASONS'
};

export const SERVICE_ERROR_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  404: 'NOT_FOUND',
  409: 'FILE_EXISTS',
  413: 'FILE_TOO_LARGE'
};

export function mapYandexError(
  status: number,
  message?: string,
  map?: Record<number, string>
): AppError | null {
  const table = map ?? SERVICE_ERROR_MAP;
  const code = table[status];
  if (!code) return null;

  if (status === 400 && message) {
    return new AppError('BAD_REQUEST', message, status);
  }
  return new AppError(code, undefined, status);
}


