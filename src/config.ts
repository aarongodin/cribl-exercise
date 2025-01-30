export type Config = {
	http: {
		port: number;
		host: string;
	};
	debug: boolean;
	log: {
		format: string;
	};
	logFilesBasePath: string;
};

function getNumber(name: string, def: number): number {
	if (process.env[name] && process.env[name].length > 0) {
		return Number.parseInt(process.env[name], 10);
	}
	return def;
}

function getBoolean(name: string, def: boolean): boolean {
	if (process.env[name] && process.env[name].length > 0) {
		return process.env[name] === "true";
	}
	return def;
}

function getString(name: string, def: string): string {
	if (process.env[name] && process.env[name].length > 0) {
		return process.env[name];
	}
	return def;
}

export function loadConfig(): Promise<Config> {
	return Promise.resolve({
		http: {
			port: getNumber("HTTP_PORT", 3000),
			host: getString("HTTP_HOST", "0.0.0.0"),
		},
		debug: getBoolean("DEBUG", false),
		log: {
			format: getString("LOG_FORMAT", "console"),
		},
		logFilesBasePath: getString("LOG_FILES_BASE_PATH", "/var/log"),
	});
}
