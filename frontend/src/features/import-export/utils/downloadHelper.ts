/**
 * Triggers a browser download for a Blob object and immediately revokes the object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Triggers a browser download from raw ArrayBuffer or Uint8Array bytes.
 */
export function downloadArrayBuffer(
  buffer: ArrayBuffer | Uint8Array,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([buffer as BlobPart], { type: mimeType });
  downloadBlob(blob, filename);
}
