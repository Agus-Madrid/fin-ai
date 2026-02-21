export function joinUrl(base: string, path: string): string {
  if (!base) {
    return path;
  }
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}
