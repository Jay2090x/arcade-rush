var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@netlify/runtime-utils/dist/main.cjs
var require_main = __commonJS({
  "node_modules/@netlify/runtime-utils/dist/main.cjs"(exports2, module2) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var main_exports = {};
    __export(main_exports, {
      base64Decode: () => base64Decode,
      base64Encode: () => base64Encode,
      getEnvironment: () => getEnvironment
    });
    module2.exports = __toCommonJS(main_exports);
    var getString = (input) => typeof input === "string" ? input : JSON.stringify(input);
    var base64Decode = globalThis.Buffer ? (input) => Buffer.from(input, "base64").toString() : (input) => atob(input);
    var base64Encode = globalThis.Buffer ? (input) => Buffer.from(getString(input)).toString("base64") : (input) => btoa(getString(input));
    var getEnvironment = () => {
      const { Deno, Netlify, process: process2 } = globalThis;
      return Netlify?.env ?? Deno?.env ?? {
        delete: (key) => delete process2?.env[key],
        get: (key) => process2?.env[key],
        has: (key) => Boolean(process2?.env[key]),
        set: (key, value) => {
          if (process2?.env) {
            process2.env[key] = value;
          }
        },
        toObject: () => process2?.env ?? {}
      };
    };
  }
});

// node_modules/@netlify/otel/dist/main.cjs
var require_main2 = __commonJS({
  "node_modules/@netlify/otel/dist/main.cjs"(exports2, module2) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var main_exports = {};
    __export(main_exports, {
      getTracer: () => getTracer,
      shutdownTracers: () => shutdownTracers,
      withActiveSpan: () => withActiveSpan
    });
    module2.exports = __toCommonJS(main_exports);
    var GET_TRACER = "__netlify__getTracer";
    var SHUTDOWN_TRACERS = "__netlify__shutdownTracers";
    var getTracer = (name, version) => {
      return globalThis[GET_TRACER]?.(name, version);
    };
    var shutdownTracers = async () => {
      return globalThis[SHUTDOWN_TRACERS]?.();
    };
    function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
      const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
      if (!func) {
        throw new Error("function to execute with active span is missing");
      }
      if (!tracer) {
        return func();
      }
      return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
    }
  }
});

// node_modules/@netlify/blobs/dist/main.cjs
var require_main3 = __commonJS({
  "node_modules/@netlify/blobs/dist/main.cjs"(exports2, module2) {
    "use strict";
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var main_exports = {};
    __export(main_exports, {
      connectLambda: () => connectLambda,
      getDeployStore: () => getDeployStore,
      getStore: () => getStore,
      listStores: () => listStores,
      setEnvironmentContext: () => setEnvironmentContext
    });
    module2.exports = __toCommonJS(main_exports);
    var import_runtime_utils = require_main();
    var getEnvironmentContext = () => {
      const context = globalThis.netlifyBlobsContext || (0, import_runtime_utils.getEnvironment)().get("NETLIFY_BLOBS_CONTEXT");
      if (typeof context !== "string" || !context) {
        return {};
      }
      const data = (0, import_runtime_utils.base64Decode)(context);
      try {
        return JSON.parse(data);
      } catch {
      }
      return {};
    };
    var setEnvironmentContext = (context) => {
      const encodedContext = (0, import_runtime_utils.base64Encode)(JSON.stringify(context));
      (0, import_runtime_utils.getEnvironment)().set("NETLIFY_BLOBS_CONTEXT", encodedContext);
    };
    var MissingBlobsEnvironmentError = class extends Error {
      constructor(requiredProperties) {
        super(
          `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
            ", "
          )}`
        );
        this.name = "MissingBlobsEnvironmentError";
      }
    };
    var import_runtime_utils2 = require_main();
    var connectLambda = (event) => {
      const rawData = (0, import_runtime_utils2.base64Decode)(event.blobs);
      const data = JSON.parse(rawData);
      const environmentContext = {
        deployID: event.headers["x-nf-deploy-id"],
        edgeURL: data.url,
        siteID: event.headers["x-nf-site-id"],
        token: data.token
      };
      setEnvironmentContext(environmentContext);
    };
    var BlobsConsistencyError = class extends Error {
      constructor() {
        super(
          `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
        );
        this.name = "BlobsConsistencyError";
      }
    };
    var import_runtime_utils3 = require_main();
    var BASE64_PREFIX = "b64;";
    var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
    var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
    var METADATA_MAX_SIZE = 2 * 1024;
    var encodeMetadata = (metadata) => {
      if (!metadata) {
        return null;
      }
      const encodedObject = (0, import_runtime_utils3.base64Encode)(JSON.stringify(metadata));
      const payload = `b64;${encodedObject}`;
      if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
        throw new Error("Metadata object exceeds the maximum size");
      }
      return payload;
    };
    var decodeMetadata = (header) => {
      if (!header?.startsWith(BASE64_PREFIX)) {
        return {};
      }
      const encodedData = header.slice(BASE64_PREFIX.length);
      const decodedData = (0, import_runtime_utils3.base64Decode)(encodedData);
      const metadata = JSON.parse(decodedData);
      return metadata;
    };
    var getMetadataFromResponse = (response) => {
      if (!response.headers) {
        return {};
      }
      const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
      try {
        return decodeMetadata(value);
      } catch {
        throw new Error(
          "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
        );
      }
    };
    var REGION_AUTO = "auto";
    var regions = {
      "us-east-1": true,
      "us-east-2": true,
      "eu-central-1": true,
      "ap-southeast-1": true,
      "ap-southeast-2": true
    };
    var isValidRegion = (input) => Object.keys(regions).includes(input);
    var InvalidBlobsRegionError = class extends Error {
      constructor(region) {
        super(
          `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
        );
        this.name = "InvalidBlobsRegionError";
      }
    };
    var import_runtime_utils4 = require_main();
    var DEFAULT_RETRY_DELAY = (0, import_runtime_utils4.getEnvironment)().get("NODE_ENV") === "test" ? 1 : 5e3;
    var MIN_RETRY_DELAY = 1e3;
    var MAX_RETRY = 5;
    var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
    var fetchAndRetry = async (fetch, url, options, attemptsLeft = MAX_RETRY) => {
      try {
        const res = await fetch(url, options);
        if (attemptsLeft > 0 && (res.status === 429 || res.status >= 500)) {
          const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
          await sleep(delay);
          return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
        }
        return res;
      } catch (error) {
        if (attemptsLeft === 0) {
          throw error;
        }
        const delay = getDelay();
        await sleep(delay);
        return fetchAndRetry(fetch, url, options, attemptsLeft - 1);
      }
    };
    var getDelay = (rateLimitReset) => {
      if (!rateLimitReset) {
        return DEFAULT_RETRY_DELAY;
      }
      return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
    };
    var sleep = (ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    var import_node_process = __toESM(require("process"), 1);
    var import_otel = require_main2();
    var NF_ERROR = "x-nf-error";
    var NF_REQUEST_ID = "x-nf-request-id";
    var BlobsInternalError = class extends Error {
      constructor(res) {
        let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
        if (res.headers.has(NF_REQUEST_ID)) {
          details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
        }
        super(`Netlify Blobs has generated an internal error (${details})`);
        this.name = "BlobsInternalError";
      }
    };
    var collectIterator = async (iterator) => {
      const result = [];
      for await (const item of iterator) {
        result.push(item);
      }
      return result;
    };
    function withSpan(span, name, fn) {
      if (span) return fn(span);
      return (0, import_otel.withActiveSpan)((0, import_otel.getTracer)(), name, (span2) => {
        return fn(span2);
      });
    }
    var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
    var Client = class {
      constructor({ apiURL, consistency, edgeURL, fetch, region, siteID, token, uncachedEdgeURL }) {
        this.apiURL = apiURL;
        this.consistency = consistency ?? "eventual";
        this.edgeURL = edgeURL;
        this.fetch = fetch ?? globalThis.fetch;
        this.region = region;
        this.siteID = siteID;
        this.token = token;
        this.uncachedEdgeURL = uncachedEdgeURL;
        if (!this.fetch) {
          throw new Error(
            "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
          );
        }
      }
      async getFinalRequest({
        consistency: opConsistency,
        key,
        metadata,
        method,
        parameters = {},
        storeName
      }) {
        const encodedMetadata = encodeMetadata(metadata);
        const consistency = opConsistency ?? this.consistency;
        let urlPath = `/${this.siteID}`;
        if (storeName) {
          urlPath += `/${storeName}`;
        }
        if (key) {
          urlPath += `/${key}`;
        }
        if (this.edgeURL) {
          if (consistency === "strong" && !this.uncachedEdgeURL) {
            throw new BlobsConsistencyError();
          }
          const headers = {
            authorization: `Bearer ${this.token}`
          };
          if (encodedMetadata) {
            headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
          }
          if (this.region) {
            urlPath = `/region:${this.region}${urlPath}`;
          }
          const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
          for (const key2 in parameters) {
            url2.searchParams.set(key2, parameters[key2]);
          }
          return {
            headers,
            url: url2.toString()
          };
        }
        const apiHeaders = { authorization: `Bearer ${this.token}` };
        const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
        for (const key2 in parameters) {
          url.searchParams.set(key2, parameters[key2]);
        }
        if (this.region) {
          url.searchParams.set("region", this.region);
        }
        if (storeName === void 0 || key === void 0) {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        if (encodedMetadata) {
          apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
        }
        if (method === "head" || method === "delete") {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        const res = await this.fetch(url.toString(), {
          headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
          method
        });
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
        const { url: signedURL } = await res.json();
        const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
        return {
          headers: userHeaders,
          url: signedURL
        };
      }
      async makeRequest({
        body,
        conditions = {},
        consistency,
        headers: extraHeaders,
        key,
        metadata,
        method,
        parameters,
        storeName
      }) {
        const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
          consistency,
          key,
          metadata,
          method,
          parameters,
          storeName
        });
        const headers = {
          ...baseHeaders,
          ...extraHeaders
        };
        if (method === "put") {
          headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
        }
        if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
          headers["if-match"] = conditions.onlyIfMatch;
        } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
          headers["if-none-match"] = "*";
        }
        const options = {
          body,
          headers,
          method
        };
        if (body instanceof ReadableStream) {
          options.duplex = "half";
        }
        return fetchAndRetry(this.fetch, url, options);
      }
    };
    var getClientOptions = (options, contextOverride) => {
      const context = contextOverride ?? getEnvironmentContext();
      const siteID = context.siteID ?? options.siteID;
      const token = context.token ?? options.token;
      if (!siteID || !token) {
        throw new MissingBlobsEnvironmentError(["siteID", "token"]);
      }
      if (options.region !== void 0 && !isValidRegion(options.region)) {
        throw new InvalidBlobsRegionError(options.region);
      }
      const clientOptions = {
        apiURL: context.apiURL ?? options.apiURL,
        consistency: options.consistency,
        edgeURL: context.edgeURL ?? options.edgeURL,
        fetch: options.fetch,
        region: options.region,
        siteID,
        token,
        uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
      };
      return clientOptions;
    };
    var DEPLOY_STORE_PREFIX = "deploy:";
    var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
    var SITE_STORE_PREFIX = "site:";
    var STATUS_OK = 200;
    var STATUS_PRE_CONDITION_FAILED = 412;
    var Store = class _Store {
      constructor(options) {
        this.client = options.client;
        if ("deployID" in options) {
          _Store.validateDeployID(options.deployID);
          let name = DEPLOY_STORE_PREFIX + options.deployID;
          if (options.name) {
            name += `:${options.name}`;
          }
          this.name = name;
        } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
          const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
          _Store.validateStoreName(storeName);
          this.name = storeName;
        } else {
          _Store.validateStoreName(options.name);
          this.name = SITE_STORE_PREFIX + options.name;
        }
      }
      async delete(key) {
        const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
        if (![200, 204, 404].includes(res.status)) {
          throw new BlobsInternalError(res);
        }
      }
      async deleteAll() {
        let totalDeletedBlobs = 0;
        let hasMore = true;
        while (hasMore) {
          const res = await this.client.makeRequest({ method: "delete", storeName: this.name });
          if (res.status !== 200) {
            throw new BlobsInternalError(res);
          }
          const data = await res.json();
          if (typeof data.blobs_deleted !== "number") {
            throw new BlobsInternalError(res);
          }
          totalDeletedBlobs += data.blobs_deleted;
          hasMore = typeof data.has_more === "boolean" && data.has_more;
        }
        return {
          deletedBlobs: totalDeletedBlobs
        };
      }
      async get(key, options) {
        return withSpan(options?.span, "blobs.get", async (span) => {
          const { consistency, type } = options ?? {};
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.type": type,
            "blobs.method": "GET",
            "blobs.consistency": consistency
          });
          const res = await this.client.makeRequest({
            consistency,
            key,
            method: "get",
            storeName: this.name
          });
          span?.setAttributes({
            "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200) {
            throw new BlobsInternalError(res);
          }
          if (type === void 0 || type === "text") {
            return res.text();
          }
          if (type === "arrayBuffer") {
            return res.arrayBuffer();
          }
          if (type === "blob") {
            return res.blob();
          }
          if (type === "json") {
            return res.json();
          }
          if (type === "stream") {
            return res.body;
          }
          throw new BlobsInternalError(res);
        });
      }
      async getMetadata(key, options = {}) {
        return withSpan(options?.span, "blobs.getMetadata", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "HEAD",
            "blobs.consistency": options.consistency
          });
          const res = await this.client.makeRequest({
            consistency: options.consistency,
            key,
            method: "head",
            storeName: this.name
          });
          span?.setAttributes({
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200 && res.status !== 304) {
            throw new BlobsInternalError(res);
          }
          const etag = res?.headers.get("etag") ?? void 0;
          const metadata = getMetadataFromResponse(res);
          const result = {
            etag,
            metadata
          };
          return result;
        });
      }
      async getWithMetadata(key, options) {
        return withSpan(options?.span, "blobs.getWithMetadata", async (span) => {
          const { consistency, etag: requestETag, type } = options ?? {};
          const headers = requestETag ? { "if-none-match": requestETag } : void 0;
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "GET",
            "blobs.consistency": options?.consistency,
            "blobs.type": type,
            "blobs.request.etag": requestETag
          });
          const res = await this.client.makeRequest({
            consistency,
            headers,
            key,
            method: "get",
            storeName: this.name
          });
          const responseETag = res?.headers.get("etag") ?? void 0;
          span?.setAttributes({
            "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
            "blobs.response.etag": responseETag,
            "blobs.response.status": res.status
          });
          if (res.status === 404) {
            return null;
          }
          if (res.status !== 200 && res.status !== 304) {
            throw new BlobsInternalError(res);
          }
          const metadata = getMetadataFromResponse(res);
          const result = {
            etag: responseETag,
            metadata
          };
          if (res.status === 304 && requestETag) {
            return { data: null, ...result };
          }
          if (type === void 0 || type === "text") {
            return { data: await res.text(), ...result };
          }
          if (type === "arrayBuffer") {
            return { data: await res.arrayBuffer(), ...result };
          }
          if (type === "blob") {
            return { data: await res.blob(), ...result };
          }
          if (type === "json") {
            return { data: await res.json(), ...result };
          }
          if (type === "stream") {
            return { data: res.body, ...result };
          }
          throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
        });
      }
      list(options = {}) {
        return withSpan(options.span, "blobs.list", (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.method": "GET",
            "blobs.list.paginate": options.paginate ?? false
          });
          const iterator = this.getListIterator(options);
          if (options.paginate) {
            return iterator;
          }
          return collectIterator(iterator).then(
            (items) => items.reduce(
              (acc, item) => ({
                blobs: [...acc.blobs, ...item.blobs],
                directories: [...acc.directories, ...item.directories]
              }),
              { blobs: [], directories: [] }
            )
          );
        });
      }
      async set(key, data, options = {}) {
        return withSpan(options.span, "blobs.set", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "PUT",
            "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
            "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
            "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
          });
          _Store.validateKey(key);
          const conditions = _Store.getConditions(options);
          const res = await this.client.makeRequest({
            conditions,
            body: data,
            key,
            metadata: options.metadata,
            method: "put",
            storeName: this.name
          });
          const etag = res.headers.get("etag") ?? "";
          span?.setAttributes({
            "blobs.response.etag": etag,
            "blobs.response.status": res.status
          });
          if (conditions) {
            return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
          }
          if (res.status === STATUS_OK) {
            return {
              etag,
              modified: true
            };
          }
          throw new BlobsInternalError(res);
        });
      }
      async setJSON(key, data, options = {}) {
        return withSpan(options.span, "blobs.setJSON", async (span) => {
          span?.setAttributes({
            "blobs.store": this.name,
            "blobs.key": key,
            "blobs.method": "PUT",
            "blobs.data.type": "json"
          });
          _Store.validateKey(key);
          const conditions = _Store.getConditions(options);
          const payload = JSON.stringify(data);
          const headers = {
            "content-type": "application/json"
          };
          const res = await this.client.makeRequest({
            ...conditions,
            body: payload,
            headers,
            key,
            metadata: options.metadata,
            method: "put",
            storeName: this.name
          });
          const etag = res.headers.get("etag") ?? "";
          span?.setAttributes({
            "blobs.response.etag": etag,
            "blobs.response.status": res.status
          });
          if (conditions) {
            return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
          }
          if (res.status === STATUS_OK) {
            return {
              etag,
              modified: true
            };
          }
          throw new BlobsInternalError(res);
        });
      }
      static formatListResultBlob(result) {
        if (!result.key) {
          return null;
        }
        return {
          etag: result.etag,
          key: result.key
        };
      }
      static getConditions(options) {
        if ("onlyIfMatch" in options && "onlyIfNew" in options) {
          throw new Error(
            `The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`
          );
        }
        if ("onlyIfMatch" in options && options.onlyIfMatch) {
          if (typeof options.onlyIfMatch !== "string") {
            throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
          }
          return {
            onlyIfMatch: options.onlyIfMatch
          };
        }
        if ("onlyIfNew" in options && options.onlyIfNew) {
          if (typeof options.onlyIfNew !== "boolean") {
            throw new Error(
              `The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`
            );
          }
          return {
            onlyIfNew: true
          };
        }
      }
      static validateKey(key) {
        if (key === "") {
          throw new Error("Blob key must not be empty.");
        }
        if (key.startsWith("/") || key.startsWith("%2F")) {
          throw new Error("Blob key must not start with forward slash (/).");
        }
        if (new TextEncoder().encode(key).length > 600) {
          throw new Error(
            "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
          );
        }
      }
      static validateDeployID(deployID) {
        if (!/^\w{1,24}$/.test(deployID)) {
          throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
        }
      }
      static validateStoreName(name) {
        if (name.includes("/") || name.includes("%2F")) {
          throw new Error("Store name must not contain forward slashes (/).");
        }
        if (new TextEncoder().encode(name).length > 64) {
          throw new Error(
            "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
          );
        }
      }
      getListIterator(options) {
        const { client, name: storeName } = this;
        const parameters = {};
        if (options?.prefix) {
          parameters.prefix = options.prefix;
        }
        if (options?.directories) {
          parameters.directories = "true";
        }
        return {
          [Symbol.asyncIterator]() {
            let currentCursor = null;
            let done = false;
            return {
              async next() {
                return withSpan(options?.span, "blobs.list.next", async (span) => {
                  span?.setAttributes({
                    "blobs.store": storeName,
                    "blobs.method": "GET",
                    "blobs.list.paginate": options?.paginate ?? false,
                    "blobs.list.done": done,
                    "blobs.list.cursor": currentCursor ?? void 0
                  });
                  if (done) {
                    return { done: true, value: void 0 };
                  }
                  const nextParameters = { ...parameters };
                  if (currentCursor !== null) {
                    nextParameters.cursor = currentCursor;
                  }
                  const res = await client.makeRequest({
                    method: "get",
                    parameters: nextParameters,
                    storeName
                  });
                  span?.setAttributes({
                    "blobs.response.status": res.status
                  });
                  let blobs = [];
                  let directories = [];
                  if (![200, 204, 404].includes(res.status)) {
                    throw new BlobsInternalError(res);
                  }
                  if (res.status === 404) {
                    done = true;
                  } else {
                    const page = await res.json();
                    if (page.next_cursor) {
                      currentCursor = page.next_cursor;
                    } else {
                      done = true;
                    }
                    blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                    directories = page.directories ?? [];
                  }
                  return {
                    done: false,
                    value: {
                      blobs,
                      directories
                    }
                  };
                });
              }
            };
          }
        };
      }
    };
    var getDeployStore = (input = {}, options) => {
      const context = getEnvironmentContext();
      const mergedOptions = typeof input === "string" ? { ...options, name: input } : input;
      const deployID = mergedOptions.deployID ?? context.deployID;
      if (!deployID) {
        throw new MissingBlobsEnvironmentError(["deployID"]);
      }
      const clientOptions = getClientOptions(mergedOptions, context);
      if (!clientOptions.region) {
        if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
          if (!context.primaryRegion) {
            throw new Error(
              "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the `getDeployStore` options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
            );
          }
          clientOptions.region = context.primaryRegion;
        } else {
          clientOptions.region = REGION_AUTO;
        }
      }
      const client = new Client(clientOptions);
      return new Store({ client, deployID, name: mergedOptions.name });
    };
    var getStore = (input, options) => {
      if (typeof input === "string") {
        const contextOverride = options?.siteID && options?.token ? { siteID: options?.siteID, token: options?.token } : void 0;
        const clientOptions = getClientOptions(options ?? {}, contextOverride);
        const client = new Client(clientOptions);
        return new Store({ client, name: input });
      }
      if (typeof input?.name === "string") {
        const { name } = input;
        const contextOverride = input?.siteID && input?.token ? { siteID: input?.siteID, token: input?.token } : void 0;
        const clientOptions = getClientOptions(input, contextOverride);
        if (!name) {
          throw new MissingBlobsEnvironmentError(["name"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, name });
      }
      if (typeof input?.deployID === "string") {
        const clientOptions = getClientOptions(input);
        const { deployID } = input;
        if (!deployID) {
          throw new MissingBlobsEnvironmentError(["deployID"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, deployID });
      }
      throw new Error(
        "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
      );
    };
    function listStores(options = {}) {
      const context = getEnvironmentContext();
      const clientOptions = getClientOptions(options, context);
      const client = new Client(clientOptions);
      const iterator = getListIterator(client, SITE_STORE_PREFIX);
      if (options.paginate) {
        return iterator;
      }
      return collectIterator(iterator).then((results) => ({ stores: results.flatMap((page) => page.stores) }));
    }
    var formatListStoreResponse = (stores) => stores.filter((store) => !store.startsWith(DEPLOY_STORE_PREFIX)).map((store) => store.startsWith(SITE_STORE_PREFIX) ? store.slice(SITE_STORE_PREFIX.length) : store);
    var getListIterator = (client, prefix) => {
      const parameters = {
        prefix
      };
      return {
        [Symbol.asyncIterator]() {
          let currentCursor = null;
          let done = false;
          return {
            async next() {
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters
              });
              if (res.status === 404) {
                return { done: true, value: void 0 };
              }
              const page = await res.json();
              if (page.next_cursor) {
                currentCursor = page.next_cursor;
              } else {
                done = true;
              }
              return {
                done: false,
                value: {
                  ...page,
                  stores: formatListStoreResponse(page.stores)
                }
              };
            }
          };
        }
      };
    };
  }
});

// scripts/functions-src/_blobs.js
var require_blobs = __commonJS({
  "scripts/functions-src/_blobs.js"(exports2, module2) {
    var { getStore, connectLambda } = require_main3();
    var STORE_NAME = "arcade-rush-stats";
    function openStore2(context, event) {
      if (event?.blobs) {
        connectLambda(event);
      }
      const siteID = context?.site?.id || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
      const token = context?.netlify?.token || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_PAT;
      if (siteID && token) {
        return getStore({ name: STORE_NAME, siteID, token });
      }
      return getStore(STORE_NAME);
    }
    module2.exports = { openStore: openStore2, STORE_NAME };
  }
});

// scripts/functions-src/_analytics-store.js
var require_analytics_store = __commonJS({
  "scripts/functions-src/_analytics-store.js"(exports2, module2) {
    var STORE_KEY = "analytics-report";
    var MAX_RECENT = 80;
    var MAX_DAILY_DAYS = 60;
    var MAX_REFERRERS = 40;
    var MAX_UTM = 30;
    function emptyReport() {
      return {
        visits: 0,
        sessions: 0,
        gameStarts: 0,
        firstEvent: null,
        lastEvent: null,
        daily: {},
        sources: {},
        referrers: {},
        utm: {},
        countries: {},
        timezones: {},
        devices: {},
        browsers: {},
        languages: {},
        pages: {},
        games: {},
        landingPages: {},
        recent: [],
        sessionSet: {}
      };
    }
    function dayKey(ts) {
      return new Date(ts).toISOString().slice(0, 10);
    }
    function bump(map, key, n = 1) {
      if (!key) return;
      const k = String(key).slice(0, 120);
      map[k] = (map[k] || 0) + n;
    }
    function topEntries(map, limit = 15) {
      return Object.entries(map || {}).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
    }
    function pruneDaily(daily) {
      const keys = Object.keys(daily).sort();
      while (keys.length > MAX_DAILY_DAYS) {
        delete daily[keys.shift()];
      }
    }
    function pruneSessions(sessionSet) {
      const cutoff = Date.now() - 30 * 864e5;
      for (const [id, ts] of Object.entries(sessionSet)) {
        if (ts < cutoff) delete sessionSet[id];
      }
    }
    function pruneMap(map, max) {
      const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
      if (entries.length <= max) return;
      const keep = new Set(entries.slice(0, max).map(([k]) => k));
      for (const k of Object.keys(map)) {
        if (!keep.has(k)) delete map[k];
      }
    }
    function ensureGame(games, slug) {
      if (!games[slug]) games[slug] = { visits: 0, starts: 0 };
      return games[slug];
    }
    function ingestEvent2(report, ev) {
      const ts = ev.t || Date.now();
      const event = ev.e || "event";
      const session = ev.s ? String(ev.s).slice(0, 32) : null;
      report.lastEvent = ts;
      if (!report.firstEvent) report.firstEvent = ts;
      const dk = dayKey(ts);
      if (!report.daily[dk]) report.daily[dk] = { visits: 0, starts: 0, sessions: {} };
      const day = report.daily[dk];
      if (session) {
        if (!report.sessionSet[session]) {
          report.sessionSet[session] = ts;
          report.sessions++;
          day.sessions[session] = 1;
        } else {
          report.sessionSet[session] = ts;
        }
      }
      if (event === "page_view") {
        report.visits++;
        day.visits++;
        bump(report.sources, ev.source || "Direkt");
        if (ev.referrerHost) bump(report.referrers, ev.referrerHost);
        if (ev.utmKey) bump(report.utm, ev.utmKey);
        bump(report.countries, ev.country || "\u2013");
        bump(report.timezones, ev.timezone || "\u2013");
        bump(report.devices, ev.device || "unknown");
        bump(report.browsers, ev.browser || "unknown");
        bump(report.languages, ev.language || "\u2013");
        bump(report.pages, ev.page || "/");
        bump(report.landingPages, ev.landing || ev.page || "/");
        if (ev.game) ensureGame(report.games, ev.game).visits++;
      }
      if (event === "game_start") {
        report.gameStarts++;
        day.starts++;
        if (ev.game) ensureGame(report.games, ev.game).starts++;
      }
      report.recent.unshift({
        t: ts,
        e: event,
        source: ev.source || "\u2013",
        page: ev.page || "\u2013",
        game: ev.game || null,
        device: ev.device || "\u2013",
        country: ev.country || "\u2013"
      });
      if (report.recent.length > MAX_RECENT) report.recent.length = MAX_RECENT;
    }
    function sanitizeReport2(report) {
      const dailySeries = Object.entries(report.daily || {}).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({
        date,
        visits: d.visits || 0,
        starts: d.starts || 0,
        sessions: Object.keys(d.sessions || {}).length
      }));
      const last7 = dailySeries.slice(-7);
      const last30 = dailySeries.slice(-30);
      const totalSource = Object.values(report.sources || {}).reduce((a, b) => a + b, 0) || 1;
      return {
        visits: report.visits || 0,
        sessions: report.sessions || 0,
        gameStarts: report.gameStarts || 0,
        conversionRate: report.visits ? (report.gameStarts / report.visits * 100).toFixed(1) : "0.0",
        firstEvent: report.firstEvent,
        lastEvent: report.lastEvent,
        daily: last30,
        last7,
        sources: topEntries(report.sources, 12).map((r) => ({
          ...r,
          pct: (r.count / totalSource * 100).toFixed(1)
        })),
        referrers: topEntries(report.referrers, MAX_REFERRERS),
        utm: topEntries(report.utm, MAX_UTM),
        countries: topEntries(report.countries, 15),
        timezones: topEntries(report.timezones, 12),
        devices: topEntries(report.devices, 6),
        browsers: topEntries(report.browsers, 8),
        languages: topEntries(report.languages, 10),
        pages: topEntries(report.pages, 12),
        landingPages: topEntries(report.landingPages, 10),
        games: Object.entries(report.games || {}).map(([slug, g]) => ({
          slug,
          visits: g.visits || 0,
          starts: g.starts || 0,
          conversion: g.visits ? (g.starts / g.visits * 100).toFixed(1) : "0.0"
        })).sort((a, b) => b.visits - a.visits),
        recent: (report.recent || []).slice(0, 25)
      };
    }
    async function loadReport2(store) {
      try {
        let raw = null;
        try {
          raw = await store.get(STORE_KEY, { consistency: "strong" });
        } catch {
          raw = await store.get(STORE_KEY);
        }
        if (!raw) return emptyReport();
        return { ...emptyReport(), ...JSON.parse(raw) };
      } catch {
        return emptyReport();
      }
    }
    async function saveReport2(store, report) {
      pruneDaily(report.daily);
      pruneSessions(report.sessionSet);
      pruneMap(report.referrers, MAX_REFERRERS);
      pruneMap(report.utm, MAX_UTM);
      await store.set(STORE_KEY, JSON.stringify(report));
    }
    function metaToEvent(counterKey, meta = {}) {
      const ts = Date.now();
      const session = meta.session ? String(meta.session).slice(0, 32) : `srv-${ts}`;
      const base = {
        t: ts,
        s: session,
        page: meta.page || "/",
        game: meta.game || null,
        source: meta.source || "Direkt",
        referrerHost: meta.referrerHost || "",
        utmKey: meta.utmKey || "",
        device: meta.device || "unknown",
        browser: meta.browser || "unknown",
        language: meta.language || "\u2013",
        timezone: meta.timezone || "\u2013",
        country: meta.country || "\u2013",
        landing: meta.landing || meta.page || "/"
      };
      if (counterKey === "visits") return { ...base, e: "page_view" };
      if (counterKey === "game-starts") return { ...base, e: "game_start", game: meta.game || null };
      const gm = counterKey.match(/^game-([a-z0-9-]+)-(visits|starts)$/);
      if (gm) {
        const game = gm[1];
        if (gm[2] === "visits") {
          return { ...base, e: "page_view", game, page: meta.page || `/games/${game}/` };
        }
        return { ...base, e: "game_start", game };
      }
      return null;
    }
    module2.exports = {
      STORE_KEY,
      ingestEvent: ingestEvent2,
      sanitizeReport: sanitizeReport2,
      loadReport: loadReport2,
      saveReport: saveReport2,
      metaToEvent
    };
  }
});

// scripts/functions-src/analytics.src.js
var { openStore } = require_blobs();
var {
  ingestEvent,
  sanitizeReport,
  loadReport,
  saveReport
} = require_analytics_store();
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};
exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  try {
    const store = openStore(context, event);
    if (event.httpMethod === "GET") {
      const report = await loadReport(store);
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          ...sanitizeReport(report),
          fetchedAt: Date.now()
        })
      };
    }
    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "invalid_json" }) };
      }
      const events = Array.isArray(body.events) ? body.events.slice(0, 20) : [];
      if (!events.length) {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, ingested: 0 }) };
      }
      const report = await loadReport(store);
      const geoCountry = context?.geo?.country?.code || event.headers?.["x-country"] || null;
      for (const ev of events) {
        if (geoCountry && !ev.country) ev.country = geoCountry;
        ingestEvent(report, ev);
      }
      await saveReport(store, report);
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ ok: true, ingested: events.length })
      };
    }
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "method_not_allowed" }) };
  } catch (err) {
    console.error("analytics error:", err.message);
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: "analytics_unavailable" })
    };
  }
};
