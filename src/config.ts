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
  serviceName: string;
  secondaryHostnames: string[];
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
  const secondary = process.env.SECONDARY_HOSTNAMES;
  const secondaryHostnames = [];
  if (typeof secondary === "string" && secondary.length > 0) {
    secondaryHostnames.push(...secondary.split(",").map((h) => h.trim()));
  }

  return Promise.resolve({
    http: {
      port: getNumber("HTTP_PORT", 3000),
      host: getString("HTTP_HOST", "0.0.0.0"),
    },
    debug: getBoolean("DEBUG", false),
    log: {
      format: getString("LOG_FORMAT", "json"),
    },
    logFilesBasePath: getString("LOG_FILES_BASE_PATH", "/var/log"),
    serviceName: getString("SERVICE_NAME", ""),
    secondaryHostnames,
  });
}
