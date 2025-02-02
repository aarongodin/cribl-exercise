# aarongodin/cribl-exercise

## Getting Started

Ensure you have the necessary pre-requisites to build and test this application:

* Node.js 22 or greater
* Docker & docker-compose

Clone the repository and install the dependencies:

```
npm install
```

## Development mode and testing

Initialize your dev environment by copying the `.envrc-example` file to `.envrc`:

```sh
cp .envrc-example .envrc
```

Then edit `.envrc` with your desired settings, uncommenting the lines. I recommend using a tool like [direnv](https://direnv.net/) to load the variables into your shell. You can also load them using this bash command:

```sh
export $(grep -v '^#' .envrc | xargs)
```

### Running directly

Run the app through Node on your host machine with:

```sh
npm start
# or `npm run dev` for watch mode
```

Check that the server is healthy by requesting the `/health` path:

```
curl http://localhost:3000/health
```

### Running tests

Tests are run through [Jest](https://jestjs.io).

```
npm test
```

### Linting

This project uses [Biome](https://biomejs.dev/) for linting. Run the linter with `npm run lint` or install the Biome extension for your editor ([vscode](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)).

## Usage

### GET /logs/{filename}

Reads a log file in its entirety by its filename in the configured root directory (e.g. `/var/log`), streaming lines from the file starting from the file end.

The response for this endpoint uses `Transfer-Encoding: chunked` and `Content-Type: application/jsonl`.

#### Optional query params

* Set the `lineCount=n` query parameter to control the number of lines streamed.
* Filter lines on a regular expression by passing the `regex=abc` query param. Regexes should be URI encoded to be read correctly.

### Configuration

Settings for the app are provided by environment variables.

#### `HTTP_HOST` and `HTTP_PORT`

Set an HTTP hostname and port for the TCP server to listen on.

#### `DEBUG`

Set to `true` to enable debug logging on the API.

#### `LOG_FORMAT`

Set to any one of `json` or `console` to control the style of logs output by this server (runtime logging, not the log format of the ).

#### `LOG_FILES_BASE_PATH`

Set to an absolute path to control where log files are read from (default `/var/log`).

#### `SECONDARY_HOSTNAMES`

Set a comma-separated list of secondary servers hostnames. Setting this value allows a primary server to aggregate output of the same log file across multiple servers. Defaults to an empty list.

## Monitoring / performance

### How I would monitor this solution

Assuming the concurrency is high for requests to the log files, I would track memory usage and kernel statistics such as count of open file descriptors. Memory usage increasing non-linearly with usage would likely indicate a leak around the `LineReader` implementation with how buffers are used.

### Quick test (sanity check)

I added a k6 test to the project to ensure that there was no obvious bottleneck in my implementation around the file system or stream processing. You can run this file with `k6 run k6/get-file.ts`.

The test reads `/var/log/system.log`. On my machine (macOS), this file is ~8kB. Here are the k6 results I received for your reference (host machine is an M1 Macbook Air, base model):

```
     execution: local
        script: k6/get-file.ts
        output: -

     scenarios: (100.00%) 1 scenario, 10 max VUs, 1m30s max duration (incl. graceful stop):
              * default: 10 looping VUs for 1m0s (gracefulStop: 30s)


     ✓ is status 200

     checks.........................: 100.00% 197578 out of 197578
     data_received..................: 1.4 GB  23 MB/s
     data_sent......................: 19 MB   316 kB/s
     http_req_blocked...............: avg=1.28µs min=0s     med=1µs    max=6.66ms   p(90)=2µs    p(95)=2µs
     http_req_connecting............: avg=13ns   min=0s     med=0s     max=537µs    p(90)=0s     p(95)=0s
     http_req_duration..............: avg=3ms    min=1.78ms med=2.56ms max=190.15ms p(90)=3.59ms p(95)=4.82ms
       { expected_response:true }...: avg=3ms    min=1.78ms med=2.56ms max=190.15ms p(90)=3.59ms p(95)=4.82ms
     http_req_failed................: 0.00%   0 out of 197578
     http_req_receiving.............: avg=1.92ms min=33µs   med=1.67ms max=163.29ms p(90)=2.26ms p(95)=2.99ms
     http_req_sending...............: avg=3.92µs min=1µs    med=2µs    max=7.98ms   p(90)=5µs    p(95)=9µs
     http_req_tls_handshaking.......: avg=0s     min=0s     med=0s     max=0s       p(90)=0s     p(95)=0s
     http_req_waiting...............: avg=1.07ms min=391µs  med=908µs  max=159.65ms p(90)=1.36ms p(95)=1.8ms
     http_reqs......................: 197578  3292.861076/s
     iteration_duration.............: avg=3.03ms min=1.8ms  med=2.58ms max=190.24ms p(90)=3.64ms p(95)=4.88ms
     iterations.....................: 197578  3292.861076/s
     vus............................: 10      min=10               max=10
     vus_max........................: 10      min=10               max=10
```

Notable stats are that, over the course of a minute test, the implementation sent 1.4GB of data serving the file repeatedly.

This test is not meant to be a comprehensive performance test, but it could be used as a starting point to observe how the application responds with respect to CPU, memory and filesystem usage.

## Log aggregation

This app supports manually defining a list of secondary servers (no automated solution around leader election is implemented but would be advisable in a real-world situation). Given a list of secondary servers is set through configuration (`SECONDARY_HOSTNAMES`, see above), that server will act as a primary and pipe output of the same log file from each secondary server to the primary.

### Example setup

The server can be built and run through Docker, and the project has a `docker-compose.yaml` which starts three instances of the app. The `fixtures` directory is mounted at `/var/log`.

Here are the two steps needed to run the example:

```
./build/image.sh
docker-compose up -d
```

Check the status of the services with `docker-compose logs` to ensure they each started.

Make a request to the primary server with:

```
curl http://localhost:3000/logs/caddy.log
```

Observe the response and see that logs have been loaded across all three services (`logs00`, `logs01` and `logs02`).

The logs from both the primary server and the secondary servers are streamed together, so there is no guarantee currently about the order of the logs. However, if the ouput were processed and filtered to a single value in the `svc` field in the JSON line, those logs are guaranteed to be in the expected reverse order.

## Addendum

Adding a note here about tool selection, to provide a bit of context to those curious!

* I prefer to stick with node/npm for most projects, but I acknowledge there are a lot of benefits of other runtimes (deno in particular) and package managers (deno/JSR and pnpm are other favorites). I chose node/npm for compatibility and simplicity for the exercise.
* I've been using jest regularly since 2015, so it was the easiest tool choice on this project.
* [Hapi](https://hapi.dev/) as a framework is still an API that I really love, and I think that's what matters most when working with an HTTP framework. Generally I emphasize usability for HTTP libraries over performance, but there are certainly some faster ones, especially when you look outside of Node (some HTTP server libraries for Bun are pretty incredbile on performance for example).
* I used pino for logging because I've found it to have the strongest combination of solid benchmarks and an API that I like.
