import { toAppError } from '../errors/appError';

export function userFacingError(error: unknown, requestId: string): string {
  const appError = toAppError(error);
  if (appError.code === 'AUTHENTICATION') return `Não foi possível autenticar. Código: ${requestId}`;
  if (appError.code === 'AUTHORIZATION') return `Você não possui permissão para esta operação. Código: ${requestId}`;
  if (appError.code === 'CONFLICT') return `A operação entrou em conflito. Atualize e tente novamente. Código: ${requestId}`;
  if (appError.code === 'NETWORK') return `Não foi possível comunicar com o servidor. Código: ${requestId}`;
  return `Não foi possível concluir a operação. Código: ${requestId}`;
}
