import { Transform } from "node:stream";

export class JSONLinesTransform extends Transform {
  private meta: Record<string, string>;
  constructor(meta: Record<string, string> = {}) {
    super({ objectMode: false });
    this.meta = meta;
  }

  _transform(
    chunk: Buffer,
    _: BufferEncoding,
    callback: (error?: Error | null, data?: any) => void,
  ) {
    const jsonChunk = `${JSON.stringify({ ...this.meta, l: chunk.toString() })}\n`;
    this.push(jsonChunk);
    callback();
  }
}
