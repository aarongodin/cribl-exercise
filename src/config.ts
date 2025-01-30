export type Config = {
	http: {
		port: number;
		host: string;
	};
};

export function loadConfig(): Promise<Config> {
	// TODO: replace with config npm package
	return Promise.resolve({
		http: {
			port: 3000,
			host: "0.0.0.0",
		},
	});
}
