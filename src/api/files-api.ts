import path from "node:path";
import { LineReader } from "../reader/line-reader";
import type { Plugin } from "@hapi/hapi";

type FilesAPIOptions = {};

export const filesAPI: Plugin<FilesAPIOptions> = {
	name: "fileAPI",
	register: async (server, options) => {
		server.route({
			method: "GET",
			path: "/files/{filename}",
			handler: async (req, h) => {
				const lr = new LineReader(
					path.resolve("/var/log", req.params.filename),
				);
				return h.response(lr).type("text/plain");
			},
		});
	},
};
