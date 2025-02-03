import path from "node:path";
import { LineReader, newLineReaderOptions } from "../reader/line-reader";
import type { Plugin } from "@hapi/hapi";
import Joi from "joi";
import Boom from "@hapi/boom";
import { JSONLinesTransform } from "./jsonl";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import qs from "node:querystring";
import type { Logger } from "pino";

type LogsAPIOptions = {
  basePath: string;
  serviceName: string;
  secondaryHostnames: string[];
  logger: Logger;
};

export const logsAPI: Plugin<LogsAPIOptions> = {
  name: "logsAPI",
  version: "0.1.0",
  register: async (server, options: LogsAPIOptions) => {
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
          const out = new PassThrough();
          const localTransformed = new LineReader(
            filePath,
            options.logger,
            newLineReaderOptions(req.query),
          ).pipe(new JSONLinesTransform({ svc: options.serviceName }));
          localTransformed.pipe(out, {
            end: false,
          });

          const secondaryServers = options.secondaryHostnames.map(
            async (hostname) => {
              try {
                const res = await fetch(
                  `http://${hostname}/logs/${req.params.filename}?${qs.stringify(req.query)}`,
                );
                if (!res.ok) {
                  req.logger.warn(
                    { hostname, status: res.status, message: res.statusText },
                    "failed to request secondary server",
                  );
                  return;
                }
                if (!res.body) {
                  req.logger.warn(
                    { hostname, status: res.status, message: res.statusText },
                    "response body empty",
                  );
                  return;
                }

                const reader = res.body.getReader();
                if (reader === undefined) {
                  req.logger.warn(
                    { hostname, status: res.status, message: res.statusText },
                    "failed to get body reader",
                  );
                  return;
                }

                await pipeline(res.body, out);
              } catch (err) {
                req.logger.error(
                  { hostname, err },
                  "failed on secondary server",
                );
              }
            },
          );

          localTransformed.on("end", () => {
            Promise.all(secondaryServers).then(() => out.end());
          });
          return h.response(out).type("application/jsonl");
        },
      },
    });
  },
};
