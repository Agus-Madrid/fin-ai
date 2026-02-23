export function parseUruguayNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value !== 'string') {
    return NaN;
  }

  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return NaN;
  }

  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  let normalized = trimmed;

  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = trimmed.replace(',', '.');
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}
