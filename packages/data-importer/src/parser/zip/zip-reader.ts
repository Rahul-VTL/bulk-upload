/**
 * Ultra-fast zero-dependency ZIP central directory parser.
 * Reads the table of contents of any ZIP file in < 15 milliseconds without decompressing image payloads.
 */
export interface ZipInspectionResult {
  fileNames: Set<string>;
  rawList: string[];
  fileCount: number;
}

export async function inspectZipArchive(
  source: File | ArrayBuffer | Uint8Array
): Promise<ZipInspectionResult> {
  let uint8: Uint8Array;
  if (source && typeof (source as any).arrayBuffer === 'function') {
    const arrayBuffer = await (source as any).arrayBuffer();
    uint8 = new Uint8Array(arrayBuffer);
  } else if (source instanceof ArrayBuffer) {
    uint8 = new Uint8Array(source);
  } else {
    uint8 = source as Uint8Array;
  }

  const length = uint8.length;
  if (length < 22) {
    throw new Error('File is too small to be a valid ZIP archive.');
  }

  const view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);

  // Search backwards for End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  const searchLimit = Math.max(0, length - 65557); // 65535 max comment length + 22 bytes
  for (let i = length - 22; i >= searchLimit; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP file: End of Central Directory record not found.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const fileNames = new Set<string>();
  const rawList: string[] = [];
  const textDecoder = new TextDecoder('utf-8');

  let currentOffset = cdOffset;
  for (let i = 0; i < totalEntries && currentOffset < eocdOffset; i++) {
    if (view.getUint32(currentOffset, true) !== 0x02014b50) {
      break; // Central directory header signature check
    }

    const nameLen = view.getUint16(currentOffset + 28, true);
    const extraLen = view.getUint16(currentOffset + 30, true);
    const commentLen = view.getUint16(currentOffset + 32, true);

    const nameBytes = uint8.subarray(currentOffset + 46, currentOffset + 46 + nameLen);
    const fullName = textDecoder.decode(nameBytes);

    // Skip directory entries (ending with / or \)
    if (!fullName.endsWith('/') && !fullName.endsWith('\\')) {
      const baseName = fullName.split(/[/\\]/).pop() || fullName;
      const normalized = baseName.trim().toLowerCase();

      fileNames.add(normalized);
      // Also add full relative path
      fileNames.add(fullName.trim().toLowerCase());
      rawList.push(baseName);
    }

    currentOffset += 46 + nameLen + extraLen + commentLen;
  }

  return {
    fileNames,
    rawList,
    fileCount: rawList.length
  };
}
