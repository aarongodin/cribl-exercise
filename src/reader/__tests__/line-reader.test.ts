import type { Readable } from "node:stream";
import fs from "node:fs/promises";
import { LineReader } from "../line-reader";
import path from "node:path";

const fixtureCaddyLog = path.resolve(process.cwd(), "fixtures/caddy.log");

describe("reading a file", () => {
	test("streams the output lines", async () => {
		const lr = new LineReader(fixtureCaddyLog);
		await streamToString(lr);
		expect(lr.lines).toEqual(14);
	});
});

// streamToString is a utility function for reading an entire Readable into memory
async function streamToString(stream: Readable) {
	const chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	return chunks.join("");
}
