import path from "node:path";
import { LineReader } from "../reader/line-reader";
import type { Plugin, RequestQuery } from "@hapi/hapi";

type FilesAPIOptions = {
	basePath: string;
};

function getTailQuery(q: Record<string, string>): number {
	if (typeof q.tail === "string" && q.tail.length > 0) {
		return Number.parseInt(q.tail, 10);
	}
	return 0;
}

export const filesAPI: Plugin<FilesAPIOptions> = {
	name: "fileAPI",
	register: async (server, options) => {
		server.route({
			method: "GET",
			path: "/files/{filename}",
			handler: async (req, h) => {
				const lr = new LineReader(
					path.resolve(options.basePath, req.params.filename),
					getTailQuery(req.query),
				);
				return h.response(lr).type("text/plain");
			},
		});
	},
};
