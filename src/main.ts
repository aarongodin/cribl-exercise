import pino from "pino";

import Hapi from "@hapi/hapi";
import hapiPino from "hapi-pino";

import { filesAPI } from "./api/files-api";
import { loadConfig } from "./config";

async function main() {
	const config = await loadConfig();

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

	await server.register(hapiPino);

	await server.register({
		plugin: filesAPI,
		options: {
			basePath: config.logFilesBasePath,
		},
	});

	await server.start();
}

main();
