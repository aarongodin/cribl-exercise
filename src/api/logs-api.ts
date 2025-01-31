import path from "node:path";
import { LineReader } from "../reader/line-reader";
import type { Plugin } from "@hapi/hapi";
import Joi from "joi";
import Boom from "@hapi/boom";
import { JSONLinesTransform } from "./jsonl";

type LogsAPIOptions = {
	basePath: string;
};

export const logsAPI: Plugin<LogsAPIOptions> = {
	name: "logsAPI",
	version: "0.1.0",
	register: async (server, options) => {
		const basePath = path.resolve(options.basePath);

		server.route({
			method: "GET",
			path: "/logs/{filename}",
			options: {
				validate: {
					params: Joi.object({
						filename: Joi.string()
							.regex(/^[a-zA-Z0-9._-]+$/)
							.required()
							.messages({
								"string.pattern.base":
									"Invalid filename format. Only alphanumeric, dot, underscore, and hyphen are allowed.",
							}),
					}),
					query: Joi.object().unknown(true),
				},
				handler: async (req, h) => {
					const filePath = path.join(basePath, req.params.filename);
					if (!filePath.startsWith(basePath)) {
						throw Boom.badRequest("invalid filename");
					}
					const lr = new LineReader(filePath, req.query as any);
					return h
						.response(lr.pipe(new JSONLinesTransform()))
						.type("application/jsonl");
				},
			},
		});
	},
};
