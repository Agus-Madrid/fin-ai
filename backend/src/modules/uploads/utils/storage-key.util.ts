import { randomUUID } from 'node:crypto';

export function buildStorageKey(userId: string): string {
  const datePrefix = new Date().toISOString().slice(0, 10);
  return `${userId}/${datePrefix}/${randomUUID()}.pdf`;
}
