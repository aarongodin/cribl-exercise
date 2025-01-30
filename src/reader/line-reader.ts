import fs, { type FileHandle } from "node:fs/promises";
import { Readable } from "node:stream";

const chunkSize = 1024;
const NEW_LINE = "\n";

/**
 * LineReader is a readable stream that reads a file starting from the bottom. It pushes lines to the stream
 * processed as chunks based on the `chunkSize` local const.
 *
 * lr.lines can be used to see how many lines have been read.
 */
export class LineReader extends Readable {
	private filePath = "";
	private tail = 0;

	private fd: FileHandle | null = null;
	private pos = 0;
	private remainder = "";

	public lines = 0;

	/**
	 * Creates a new LineReader. `tail` can be passed to control the number of lines emitted, and a zero value indicates to read the entire file.
	 *
	 * @param filePath string
	 * @param tail number
	 */
	constructor(filePath: string, tail = 0) {
		super();
		this.filePath = filePath;
		this.tail = tail;
	}

	async _construct(callback: (err?: any) => void): Promise<void> {
		try {
			const stats = await fs.stat(this.filePath);
			this.pos = stats.size;
			this.fd = await fs.open(this.filePath, "r");
			callback();
		} catch (err) {
			callback(err);
		}
	}

	async _read(_: number): Promise<void> {
		if (this.fd === null || this.pos <= 0) {
			if (this.remainder.length > 0 && this.lines !== this.tail) {
				if (this.pushLine(`${this.remainder}\n`)) {
					// after pushing the remainder as a line, there were still lines wanted, but
					// we don't have any more file to read
					this.push(null);
				}
			}
			return;
		}

		const nextBytes = Math.min(chunkSize, this.pos);
		this.pos = this.pos - nextBytes;
		const buf = Buffer.alloc(nextBytes);
		await this.fd.read(buf, 0, nextBytes, this.pos);
		this.remainder = this.pushBuffer(
			Buffer.concat([buf, Buffer.from(this.remainder)]),
		).toString();
	}

	// pushLine returns true to indicate that the process should continue processing lines
	pushLine(line: string): boolean {
		this.lines++;
		this.push(line);
		if (this.tail >= 0 && this.tail === this.lines) {
			this.push(null);
			return false;
		}
		return true;
	}

	// pushBuffer reads lines from a Buffer in reverse order and pushes lines to the stream, returning the remainder as a buffer
	pushBuffer(buf: Buffer): Buffer {
		let pos = buf.length - 1; // start at the end of the buffer
		while (true) {
			// iterate through characters from the position backward until you reach the delimeter
			let delim = buf.lastIndexOf(NEW_LINE, pos);
			if (delim === pos) {
				// if we reached the delimeter before processing a line, then continue reading
				delim = buf.lastIndexOf(NEW_LINE, pos - 1);
			}
			if (delim === -1) {
				// we reached the start of the buffer without a delimeter, so return the remaining buffer
				return buf.subarray(0, pos);
			}
			if (!this.pushLine(`${buf.subarray(delim + 1, pos).toString()}\n`)) {
				return Buffer.from([]);
			}
			pos = delim;
		}
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
