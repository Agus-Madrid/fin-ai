const PDF_SIGNATURE = Buffer.from('%PDF-');

export function isPdfFilename(filename: string): boolean {
  return filename.trim().toLowerCase().endsWith('.pdf');
}

export function hasPdfMimeType(mimeType: string): boolean {
  const normalized = mimeType.trim().toLowerCase();
  return normalized === 'application/pdf' || normalized === 'application/x-pdf';
}

export function hasPdfSignature(buffer: Buffer): boolean {
  if (buffer.byteLength < PDF_SIGNATURE.byteLength) {
    return false;
  }

  const signature = buffer.subarray(0, PDF_SIGNATURE.byteLength);
  return signature.equals(PDF_SIGNATURE);
}
