/** Read a credit-union logo. The bytes are branding, not a member worksheet. */

const MAX_BYTES = 350_000;

export interface LogoFile {
  dataUrl: string;
  width: number;
  height: number;
  aspect: number;
}

function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function webpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const format = buf.toString('ascii', 12, 16);
  if (format === 'VP8X') {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (format === 'VP8 ' && buf.length > 30) {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (format === 'VP8L' && buf.length > 25) {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function svgSize(buf: Buffer): { width: number; height: number } | null {
  const text = buf.toString('utf8');
  if (/<script|foreignObject|onload=|onerror=/i.test(text)) return null;
  const viewBox = /viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i.exec(text);
  if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
  const width = /width=["']([\d.]+)/i.exec(text);
  const height = /height=["']([\d.]+)/i.exec(text);
  if (!width || !height) return null;
  return { width: Number(width[1]), height: Number(height[1]) };
}

export function readLogoFile(bytes: Buffer, mime: string): LogoFile | null {
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
  const type = mime.toLowerCase().split(';')[0].trim();
  const size = type === 'image/png'
    ? pngSize(bytes)
    : type === 'image/jpeg' || type === 'image/jpg'
      ? jpegSize(bytes)
      : type === 'image/webp'
        ? webpSize(bytes)
        : type === 'image/svg+xml'
          ? svgSize(bytes)
          : null;
  if (!size || size.width < 1 || size.height < 1) return null;
  const media = type === 'image/jpg' ? 'image/jpeg' : type;
  return {
    dataUrl: `data:${media};base64,${bytes.toString('base64')}`,
    width: size.width,
    height: size.height,
    aspect: size.width / size.height,
  };
}
