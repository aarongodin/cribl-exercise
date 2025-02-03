import { Readable } from "node:stream";
import { JSONLinesTransform } from "../jsonl";
import { text } from "node:stream/consumers";

describe("jsonl", () => {
  test("it transforms a string chunk into a string of JSON", async () => {
    const t = Readable.from(["test log line"]).pipe(new JSONLinesTransform());
    await expect(text(t)).resolves.toMatchInlineSnapshot(`
"{"l":"test log line"}
"
`);
  });

  test("it transforms with meta data on the JSON", async () => {
    const t = Readable.from(["test log line"]).pipe(
      new JSONLinesTransform({ svc: "test-svc" }),
    );
    await expect(text(t)).resolves.toMatchInlineSnapshot(`
"{"svc":"test-svc","l":"test log line"}
"
`);
  });
});
