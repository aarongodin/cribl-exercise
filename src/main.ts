import pino from "pino";

import Hapi from "@hapi/hapi";

import { filesAPI } from "./api/files-api";
import { loadConfig } from "./config";

async function main() {
	const config = await loadConfig();
	const logger = pino();

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

	await server.register(filesAPI);
	await server.start();

	logger.info(
		{ port: config.http.port, host: config.http.host },
		"http server started",
	);
}

main();
