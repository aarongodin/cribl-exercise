import fs, { type FileHandle } from "node:fs/promises";
import { Readable } from "node:stream";
import type { Logger } from "pino";
import RE2 from "re2";

const NEW_LINE = "\n";

export const DefaultLineReaderOptions: LineReaderOptions = {
  lineCount: 0,
};

type LineReaderOptions = {
  lineCount: number;
  regex?: string;
};

export function newLineReaderOptions(
  query: Record<string, string>,
): LineReaderOptions {
  const opts = {
    lineCount: 0,
    regex: query.regex,
  };
  if (query.lineCount) {
    opts.lineCount = Number.parseInt(query.lineCount, 10);
  }
  return opts;
}

export class LineFilter {
  private regex?: RE2;

  constructor(opts: LineReaderOptions) {
    if (opts.regex && opts.regex.length > 0) {
      this.regex = new RE2(opts.regex);
    }
  }

  // match returns whether the buffer string matches any filter, and true when the match is not required
  match(buf: Buffer): boolean {
    if (this.regex) {
      if (this.regex.exec(buf) === null) {
        return false;
      }
      return true;
    }

    // you could add more kinds of compiled matchers here and do the same sort of check as above

    return true;
  }
}

/**
 * LineReader is a readable stream that reads a file starting from the end and emits contents between newline delimeters.
 *
 * lr.lines can be used to see how many lines have been read.
 */
export class LineReader extends Readable {
  private filePath = "";
  private logger: Logger;
  private lineCount = 0;
  private lineFilter: LineFilter;

  private fd: FileHandle | null = null;
  private pos = 0;
  private remainder = "";

  public lines = 0;

  /**
   * Creates a new LineReader. `lineCount` can be passed to control the number of lines emitted, and a zero value indicates to read the entire file.
   *
   * @param filePath string
   * @param lineCount number
   */
  constructor(
    filePath: string,
    size: number,
    logger: Logger,
    options: LineReaderOptions = DefaultLineReaderOptions,
  ) {
    super();
    this.filePath = filePath;
    this.logger = logger;
    this.pos = size;
    this.lineFilter = new LineFilter(options);
    this.lineCount = options.lineCount;
  }

  async _construct(callback: (err?: any) => void): Promise<void> {
    try {
      this.fd = await fs.open(this.filePath, "r");
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async _read(chunkSize: number): Promise<void> {
    if (this.fd === null || this.pos <= 0) {
      if (this.remainder.length > 0 && this.lines !== this.lineCount) {
        this.lines++;
        this.push(this.remainder);
      }
      this.push(null);
      await this.fd?.close();
      return;
    }

    const nextBytes = Math.min(chunkSize, this.pos);
    this.pos = this.pos - nextBytes;
    const buf = Buffer.alloc(nextBytes);
    this.logger.debug(
      { bytes: nextBytes, pos: this.pos, filePath: this.filePath },
      "reading chunk",
    );
    await this.fd.read(buf, 0, nextBytes, this.pos);
    this.remainder = this.pushBuffer(
      Buffer.concat([buf, Buffer.from(this.remainder)]),
    ).toString();
  }

  // pushBuffer reads lines from a Buffer in reverse order and pushes lines to the stream, returning the remainder as a buffer
  pushBuffer(buf: Buffer): Buffer {
    let pos = buf.length - 1; // start at the end of the buffer
    while (pos >= 0) {
      // iterate through characters from the position backward until you reach the delimeter
      const delim = buf.lastIndexOf(NEW_LINE, pos);
      if (delim === pos) {
        // if we reached the delimeter before processing a line, then continue reading
        pos = delim - 1;
        continue;
      }
      if (delim === -1) {
        // we reached the start of the buffer without a delimeter, so return the remaining buffer
        return buf.subarray(0, pos);
      }
      const current = buf.subarray(delim + 1, pos + 1);
      const match = this.lineFilter.match(current);
      if (match) {
        this.lines++;
        this.push(`${current.toString()}`);
      }
      if (this.lineCount > 0 && this.lineCount === this.lines) {
        this.push(null);
        break;
      }
      pos = delim - 1;
    }
    return Buffer.from([]);
  }

  async _destroy(err: any, callback: (err?: any) => void): Promise<void> {
    if (this.fd !== null) {
      try {
        await this.fd.close();
      } catch (fileErr) {
        callback(fileErr);
      }
    }
    callback(err);
  }
}
