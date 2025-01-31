import type { Readable } from "node:stream";
import { LineReader } from "../line-reader";
import path from "node:path";

const fixtureCaddyLog = path.resolve(process.cwd(), "fixtures/caddy.log");
const fixtureEmptyLog = path.resolve(process.cwd(), "fixtures/empty.log");

describe("reading a file", () => {
	test("streams the output lines", async () => {
		const lr = new LineReader(fixtureCaddyLog, { lineCount: 0 });
		await streamToString(lr);
		expect(lr.lines).toEqual(14);
	});

	test("restricts the number of lines read", async () => {
		const lr = new LineReader(fixtureCaddyLog, { lineCount: 10 });
		await streamToString(lr);
		expect(lr.lines).toEqual(10);
	});

	test("allows regex filtering of lines", async () => {
		const lr = new LineReader(fixtureCaddyLog, {
			lineCount: 0,
			regex: "Caddyfile",
		});
		await streamToString(lr);
		expect(lr.lines).toEqual(2);
	});

	test("streams output lines for an empty file", async () => {
		const lr = new LineReader(fixtureEmptyLog, { lineCount: 0 });
		await streamToString(lr);
		expect(lr.lines).toEqual(0);
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
