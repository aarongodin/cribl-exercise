import { Transform } from "node:stream";

export class JSONLinesTransform extends Transform {
	constructor() {
		super({ objectMode: false });
	}

	_transform(
		chunk: Buffer,
		_: BufferEncoding,
		callback: (error?: Error | null, data?: any) => void,
	) {
		const jsonChunk = `${JSON.stringify({ l: chunk.toString() })}\n`;
		this.push(jsonChunk);
		callback();
	}
}
