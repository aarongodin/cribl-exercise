# aarongodin/cribl-exercise

## Getting Started

Ensure you have the necessary pre-requisites to build and test this application:

* Node.js 22 or greater
* Docker

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
# or `npm run watch` for watch mode
```

### Running tests

Tests are run through [Jest](https://jestjs.io).

```
npm test
```

### Linting

This project uses Biome for linting. Run the linter with `npm run lint` or install the Biome extension for your editor ([vscode](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)).

## Addendum

I've been mostly writing code in Go since 2022, but I selected to do this in JavaScript as it seemed most applicable to working on Cribl products.

Adding a note here about tool selection, to provide a bit of context to those curious!

* I prefer to stick with node/npm for most projects, but I acknowledge there are a lot of benefits of other runtimes (deno in particular) and package managers (deno/JSR and pnpm are other favorites). I chose node/npm for compatibility and simplicity for the exercise.
* I've been using jest regularly since 2015, so it was the easiest tool choice on this project.
* [Hapi](https://hapi.dev/) as a framework is still an API that I really love, and I think that's what matters most when working with an HTTP framework. Generally I emphasize usability for HTTP libraries over performance, but there are certainly some faster ones, especially when you look outside of Node (some HTTP server libraries for Bun are pretty incredbile on performance for example).
* I used pino for logging because I've found it to have the strongest combination of remarkable benchmarks and an API that I like.
