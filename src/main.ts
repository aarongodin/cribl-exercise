import Hapi from "@hapi/hapi";
import hapiPino from "hapi-pino";
import pino, { type LoggerOptions, type Logger } from "pino";

import { logsAPI } from "./api/logs-api";
import { type Config, loadConfig } from "./config";

function newLogger(config: Config): Logger {
	const opts: LoggerOptions = {};
	if (config.log.format === "console") {
		opts.transport = {
			target: "pino-pretty",
			options: {
				colorize: true,
			},
		};
	}
	if (config.debug) {
		opts.level = "debug";
	}
	return pino(opts);
}

async function main() {
	const config = await loadConfig();
	const logger = newLogger(config);

	const server = Hapi.server({
		port: config.http.port,
		host: config.http.host,
	});

	server.route({
		method: "GET",
		path: "/health",
		handler: () => {
			return {
				message: "healthy",
			};
		},
	});

	await server.register({
		plugin: hapiPino,
		options: {
			instance: logger,
		},
	});

	await server.register({
		plugin: logsAPI,
		options: {
			basePath: config.logFilesBasePath,
		},
	});

	await server.start();
}

main();
