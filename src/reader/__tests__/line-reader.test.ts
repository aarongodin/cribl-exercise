import { text } from "node:stream/consumers";
import { LineReader } from "../line-reader";
import path from "node:path";

const fixtureCaddyLog = path.resolve(process.cwd(), "fixtures/caddy.log");
const fixtureEmptyLog = path.resolve(process.cwd(), "fixtures/empty.log");

describe("reading a file", () => {
	test("streams the output lines", async () => {
		const lr = new LineReader(fixtureCaddyLog, { lineCount: 0 });
		await text(lr);
		expect(lr.lines).toEqual(14);
	});

	test("restricts the number of lines read", async () => {
		const lr = new LineReader(fixtureCaddyLog, { lineCount: 10 });
		await text(lr);
		expect(lr.lines).toEqual(10);
	});

	test("allows regex filtering of lines", async () => {
		const lr = new LineReader(fixtureCaddyLog, {
			lineCount: 0,
			regex: "Caddyfile",
		});
		await text(lr);
		expect(lr.lines).toEqual(2);
	});

	test("streams output lines for an empty file", async () => {
		const lr = new LineReader(fixtureEmptyLog, { lineCount: 0 });
		await text(lr);
		expect(lr.lines).toEqual(0);
	});
});
