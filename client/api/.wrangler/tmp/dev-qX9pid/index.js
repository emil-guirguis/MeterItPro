var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
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

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedAsync(name) {
  const fn = /* @__PURE__ */ notImplemented(name);
  fn.__promisify__ = () => /* @__PURE__ */ notImplemented(name + ".__promisify__");
  fn.native = fn;
  return fn;
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedAsync, "notImplementedAsync");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env3) {
        return 1;
      }
      hasColors(count3, env3) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert2, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node-built-in-modules:events
import libDefault from "events";
var require_events = __commonJS({
  "node-built-in-modules:events"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      static {
        __name(this, "ArrayParser");
      }
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
    __name(identity, "identity");
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var array = require_postgres_array();
    module.exports = {
      create: /* @__PURE__ */ __name(function(source, transform) {
        return {
          parse: /* @__PURE__ */ __name(function() {
            return array.parse(source, transform);
          }, "parse")
        };
      }, "create")
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = /* @__PURE__ */ __name(function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    }, "parseDate");
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    __name(getDate, "getDate");
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign3 = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign3 * 1e3;
    }
    __name(timeZoneOffset, "timeZoneOffset");
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    __name(bcYearToNegativeYear, "bcYearToNegativeYear");
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
    __name(is0To99, "is0To99");
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    __name(extend, "extend");
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw2) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw2);
      }
      extend(this, parse2(raw2));
    }
    __name(PostgresInterval, "PostgresInterval");
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
      __name(buildProperty, "buildProperty");
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    __name(parseMilliseconds, "parseMilliseconds");
    function parse2(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
    __name(parse2, "parse");
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = /* @__PURE__ */ __name(function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return new Buffer(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return new Buffer(output, "binary");
    }, "parseBytea");
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return /* @__PURE__ */ __name(function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      }, "nullAllowed");
    }
    __name(allowNull, "allowNull");
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    __name(parseBool, "parseBool");
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    __name(parseBoolArray, "parseBoolArray");
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    __name(parseBaseTenInt, "parseBaseTenInt");
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    __name(parseIntegerArray, "parseIntegerArray");
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    __name(parseBigIntegerArray, "parseBigIntegerArray");
    var parsePointArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parsePointArray");
    var parseFloatArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseFloatArray");
    var parseStringArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    }, "parseStringArray");
    var parseDateArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseDateArray");
    var parseIntervalArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseIntervalArray");
    var parseByteAArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    }, "parseByteAArray");
    var parseInteger = /* @__PURE__ */ __name(function(value) {
      return parseInt(value, 10);
    }, "parseInteger");
    var parseBigInteger = /* @__PURE__ */ __name(function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    }, "parseBigInteger");
    var parseJsonArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    }, "parseJsonArray");
    var parsePoint = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    }, "parsePoint");
    var parseCircle = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    }, "parseCircle");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign3 = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign3 = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign3 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign3 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign3 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign3 + digits + result;
      }
    }
    __name(readInt8, "readInt8");
    module.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var parseInt64 = require_pg_int8();
    var parseBits = /* @__PURE__ */ __name(function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = /* @__PURE__ */ __name(function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      }, "inv");
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    }, "parseBits");
    var parseFloatFromBits = /* @__PURE__ */ __name(function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign3 = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = /* @__PURE__ */ __name(function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      }, "parsePrecisionBits");
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign3 === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign3 === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    }, "parseFloatFromBits");
    var parseInt16 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    }, "parseInt16");
    var parseInt32 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    }, "parseInt32");
    var parseFloat32 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 23, 8);
    }, "parseFloat32");
    var parseFloat64 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 52, 11);
    }, "parseFloat64");
    var parseNumeric = /* @__PURE__ */ __name(function(value) {
      var sign3 = parseBits(value, 16, 32);
      if (sign3 == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign3 === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    }, "parseNumeric");
    var parseDate = /* @__PURE__ */ __name(function(isUTC, value) {
      var sign3 = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign3 === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    }, "parseDate");
    var parseArray = /* @__PURE__ */ __name(function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = /* @__PURE__ */ __name(function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      }, "parseElement");
      var parse2 = /* @__PURE__ */ __name(function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count3 = dimension.shift();
          for (i2 = 0; i2 < count3; i2++) {
            array[i2] = parse2(dimension, elementType2);
          }
          dimension.unshift(count3);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      }, "parse");
      return parse2(dims, elementType);
    }, "parseArray");
    var parseText = /* @__PURE__ */ __name(function(value) {
      return value.toString("utf8");
    }, "parseText");
    var parseBool = /* @__PURE__ */ __name(function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    }, "parseBool");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    __name(noParse, "noParse");
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    __name(getTypeParser, "getTypeParser");
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    __name(setTypeParser, "setTypeParser");
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node-built-in-modules:util
import libDefault2 from "util";
var require_util = __commonJS({
  "node-built-in-modules:util"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault2;
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var defaults2 = require_defaults();
    var util = require_util();
    var { isDate } = util.types || util;
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    __name(escapeElement, "escapeElement");
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val[i] === null || typeof val[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        } else if (ArrayBuffer.isView(val[i])) {
          let item = val[i];
          if (!(item instanceof Buffer)) {
            const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val[i]));
        }
      }
      result = result + "}";
      return result;
    }
    __name(arrayString, "arrayString");
    var prepareValue = /* @__PURE__ */ __name(function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
          if (buf.length === val.byteLength) {
            return buf;
          }
          return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
        }
        if (isDate(val)) {
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    }, "prepareValue");
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    __name(prepareObject, "prepareObject");
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToString, "dateToString");
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToStringUTC, "dateToStringUTC");
    function normalizeQueryConfig(config2, values, callback) {
      config2 = typeof config2 === "string" ? { text: config2 } : config2;
      if (values) {
        if (typeof values === "function") {
          config2.callback = values;
        } else {
          config2.values = values;
        }
      }
      if (callback) {
        config2.callback = callback;
      }
      return config2;
    }
    __name(normalizeQueryConfig, "normalizeQueryConfig");
    var escapeIdentifier2 = /* @__PURE__ */ __name(function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    }, "escapeIdentifier");
    var escapeLiteral2 = /* @__PURE__ */ __name(function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    }, "escapeLiteral");
    module.exports = {
      prepareValue: /* @__PURE__ */ __name(function prepareValueWrapper(value) {
        return prepareValue(value);
      }, "prepareValueWrapper"),
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node-built-in-modules:crypto
import libDefault3 from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault3;
  }
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/pg/lib/crypto/utils-legacy.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var nodeCrypto = require_crypto();
    function md5(string) {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    }
    __name(md5, "md5");
    function postgresMd5PasswordHash(user, password, salt) {
      const inner = md5(password + user);
      const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    function sha256(text) {
      return nodeCrypto.createHash("sha256").update(text).digest();
    }
    __name(sha256, "sha256");
    function hashByName(hashName, text) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto.createHash(hashName).update(text).digest();
    }
    __name(hashByName, "hashByName");
    function hmacSha256(key, msg) {
      return nodeCrypto.createHmac("sha256", key).update(msg).digest();
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    __name(deriveKey, "deriveKey");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto.randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
  }
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/pg/lib/crypto/utils-webcrypto.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var nodeCrypto = require_crypto();
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    __name(randomBytes, "randomBytes");
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    __name(md5, "md5");
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    __name(sha256, "sha256");
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    __name(hashByName, "hashByName");
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
    __name(deriveKey, "deriveKey");
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module.exports = require_utils_legacy();
    } else {
      module.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    __name(x509Error, "x509Error");
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    __name(readASN1Length, "readASN1Length");
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    __name(readASN1OID, "readASN1OID");
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    __name(expectASN1Seq, "expectASN1Seq");
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    __name(signatureAlgorithmHashFromCertificate, "signatureAlgorithmHashFromCertificate");
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var crypto2 = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function startSession(mechanisms, stream) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto2.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    __name(startSession, "startSession");
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto2.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto2.deriveKey(password, saltBytes, sv.iteration);
      const clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto2.sha256(clientKey);
      const clientSignature = await crypto2.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    __name(continueSession, "continueSession");
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    __name(finalizeSession, "finalizeSession");
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    __name(isPrintableChars, "isPrintableChars");
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    __name(isBase64, "isBase64");
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    __name(parseAttributePairs, "parseAttributePairs");
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    __name(parseServerFirstMessage, "parseServerFirstMessage");
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    __name(parseServerFinalMessage, "parseServerFinalMessage");
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    __name(xorBuffers, "xorBuffers");
    module.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    __name(TypeOverrides2, "TypeOverrides");
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node-built-in-modules:dns
import libDefault4 from "dns";
var require_dns = __commonJS({
  "node-built-in-modules:dns"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault4;
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs
var access, copyFile, cp, open, opendir, rename, truncate, rm, rmdir, mkdir, readdir, readlink, symlink, lstat, stat, link, unlink, chmod, lchmod, lchown, chown, utimes, lutimes, realpath, mkdtemp, writeFile, appendFile, readFile, watch, statfs, glob;
var init_promises = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    access = /* @__PURE__ */ notImplemented("fs.access");
    copyFile = /* @__PURE__ */ notImplemented("fs.copyFile");
    cp = /* @__PURE__ */ notImplemented("fs.cp");
    open = /* @__PURE__ */ notImplemented("fs.open");
    opendir = /* @__PURE__ */ notImplemented("fs.opendir");
    rename = /* @__PURE__ */ notImplemented("fs.rename");
    truncate = /* @__PURE__ */ notImplemented("fs.truncate");
    rm = /* @__PURE__ */ notImplemented("fs.rm");
    rmdir = /* @__PURE__ */ notImplemented("fs.rmdir");
    mkdir = /* @__PURE__ */ notImplemented("fs.mkdir");
    readdir = /* @__PURE__ */ notImplemented("fs.readdir");
    readlink = /* @__PURE__ */ notImplemented("fs.readlink");
    symlink = /* @__PURE__ */ notImplemented("fs.symlink");
    lstat = /* @__PURE__ */ notImplemented("fs.lstat");
    stat = /* @__PURE__ */ notImplemented("fs.stat");
    link = /* @__PURE__ */ notImplemented("fs.link");
    unlink = /* @__PURE__ */ notImplemented("fs.unlink");
    chmod = /* @__PURE__ */ notImplemented("fs.chmod");
    lchmod = /* @__PURE__ */ notImplemented("fs.lchmod");
    lchown = /* @__PURE__ */ notImplemented("fs.lchown");
    chown = /* @__PURE__ */ notImplemented("fs.chown");
    utimes = /* @__PURE__ */ notImplemented("fs.utimes");
    lutimes = /* @__PURE__ */ notImplemented("fs.lutimes");
    realpath = /* @__PURE__ */ notImplemented("fs.realpath");
    mkdtemp = /* @__PURE__ */ notImplemented("fs.mkdtemp");
    writeFile = /* @__PURE__ */ notImplemented("fs.writeFile");
    appendFile = /* @__PURE__ */ notImplemented("fs.appendFile");
    readFile = /* @__PURE__ */ notImplemented("fs.readFile");
    watch = /* @__PURE__ */ notImplemented("fs.watch");
    statfs = /* @__PURE__ */ notImplemented("fs.statfs");
    glob = /* @__PURE__ */ notImplemented("fs.glob");
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs
var constants_exports = {};
__export(constants_exports, {
  COPYFILE_EXCL: () => COPYFILE_EXCL,
  COPYFILE_FICLONE: () => COPYFILE_FICLONE,
  COPYFILE_FICLONE_FORCE: () => COPYFILE_FICLONE_FORCE,
  EXTENSIONLESS_FORMAT_JAVASCRIPT: () => EXTENSIONLESS_FORMAT_JAVASCRIPT,
  EXTENSIONLESS_FORMAT_WASM: () => EXTENSIONLESS_FORMAT_WASM,
  F_OK: () => F_OK,
  O_APPEND: () => O_APPEND,
  O_CREAT: () => O_CREAT,
  O_DIRECT: () => O_DIRECT,
  O_DIRECTORY: () => O_DIRECTORY,
  O_DSYNC: () => O_DSYNC,
  O_EXCL: () => O_EXCL,
  O_NOATIME: () => O_NOATIME,
  O_NOCTTY: () => O_NOCTTY,
  O_NOFOLLOW: () => O_NOFOLLOW,
  O_NONBLOCK: () => O_NONBLOCK,
  O_RDONLY: () => O_RDONLY,
  O_RDWR: () => O_RDWR,
  O_SYNC: () => O_SYNC,
  O_TRUNC: () => O_TRUNC,
  O_WRONLY: () => O_WRONLY,
  R_OK: () => R_OK,
  S_IFBLK: () => S_IFBLK,
  S_IFCHR: () => S_IFCHR,
  S_IFDIR: () => S_IFDIR,
  S_IFIFO: () => S_IFIFO,
  S_IFLNK: () => S_IFLNK,
  S_IFMT: () => S_IFMT,
  S_IFREG: () => S_IFREG,
  S_IFSOCK: () => S_IFSOCK,
  S_IRGRP: () => S_IRGRP,
  S_IROTH: () => S_IROTH,
  S_IRUSR: () => S_IRUSR,
  S_IRWXG: () => S_IRWXG,
  S_IRWXO: () => S_IRWXO,
  S_IRWXU: () => S_IRWXU,
  S_IWGRP: () => S_IWGRP,
  S_IWOTH: () => S_IWOTH,
  S_IWUSR: () => S_IWUSR,
  S_IXGRP: () => S_IXGRP,
  S_IXOTH: () => S_IXOTH,
  S_IXUSR: () => S_IXUSR,
  UV_DIRENT_BLOCK: () => UV_DIRENT_BLOCK,
  UV_DIRENT_CHAR: () => UV_DIRENT_CHAR,
  UV_DIRENT_DIR: () => UV_DIRENT_DIR,
  UV_DIRENT_FIFO: () => UV_DIRENT_FIFO,
  UV_DIRENT_FILE: () => UV_DIRENT_FILE,
  UV_DIRENT_LINK: () => UV_DIRENT_LINK,
  UV_DIRENT_SOCKET: () => UV_DIRENT_SOCKET,
  UV_DIRENT_UNKNOWN: () => UV_DIRENT_UNKNOWN,
  UV_FS_COPYFILE_EXCL: () => UV_FS_COPYFILE_EXCL,
  UV_FS_COPYFILE_FICLONE: () => UV_FS_COPYFILE_FICLONE,
  UV_FS_COPYFILE_FICLONE_FORCE: () => UV_FS_COPYFILE_FICLONE_FORCE,
  UV_FS_O_FILEMAP: () => UV_FS_O_FILEMAP,
  UV_FS_SYMLINK_DIR: () => UV_FS_SYMLINK_DIR,
  UV_FS_SYMLINK_JUNCTION: () => UV_FS_SYMLINK_JUNCTION,
  W_OK: () => W_OK,
  X_OK: () => X_OK
});
var UV_FS_SYMLINK_DIR, UV_FS_SYMLINK_JUNCTION, O_RDONLY, O_WRONLY, O_RDWR, UV_DIRENT_UNKNOWN, UV_DIRENT_FILE, UV_DIRENT_DIR, UV_DIRENT_LINK, UV_DIRENT_FIFO, UV_DIRENT_SOCKET, UV_DIRENT_CHAR, UV_DIRENT_BLOCK, EXTENSIONLESS_FORMAT_JAVASCRIPT, EXTENSIONLESS_FORMAT_WASM, S_IFMT, S_IFREG, S_IFDIR, S_IFCHR, S_IFBLK, S_IFIFO, S_IFLNK, S_IFSOCK, O_CREAT, O_EXCL, UV_FS_O_FILEMAP, O_NOCTTY, O_TRUNC, O_APPEND, O_DIRECTORY, O_NOATIME, O_NOFOLLOW, O_SYNC, O_DSYNC, O_DIRECT, O_NONBLOCK, S_IRWXU, S_IRUSR, S_IWUSR, S_IXUSR, S_IRWXG, S_IRGRP, S_IWGRP, S_IXGRP, S_IRWXO, S_IROTH, S_IWOTH, S_IXOTH, F_OK, R_OK, W_OK, X_OK, UV_FS_COPYFILE_EXCL, COPYFILE_EXCL, UV_FS_COPYFILE_FICLONE, COPYFILE_FICLONE, UV_FS_COPYFILE_FICLONE_FORCE, COPYFILE_FICLONE_FORCE;
var init_constants = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UV_FS_SYMLINK_DIR = 1;
    UV_FS_SYMLINK_JUNCTION = 2;
    O_RDONLY = 0;
    O_WRONLY = 1;
    O_RDWR = 2;
    UV_DIRENT_UNKNOWN = 0;
    UV_DIRENT_FILE = 1;
    UV_DIRENT_DIR = 2;
    UV_DIRENT_LINK = 3;
    UV_DIRENT_FIFO = 4;
    UV_DIRENT_SOCKET = 5;
    UV_DIRENT_CHAR = 6;
    UV_DIRENT_BLOCK = 7;
    EXTENSIONLESS_FORMAT_JAVASCRIPT = 0;
    EXTENSIONLESS_FORMAT_WASM = 1;
    S_IFMT = 61440;
    S_IFREG = 32768;
    S_IFDIR = 16384;
    S_IFCHR = 8192;
    S_IFBLK = 24576;
    S_IFIFO = 4096;
    S_IFLNK = 40960;
    S_IFSOCK = 49152;
    O_CREAT = 64;
    O_EXCL = 128;
    UV_FS_O_FILEMAP = 0;
    O_NOCTTY = 256;
    O_TRUNC = 512;
    O_APPEND = 1024;
    O_DIRECTORY = 65536;
    O_NOATIME = 262144;
    O_NOFOLLOW = 131072;
    O_SYNC = 1052672;
    O_DSYNC = 4096;
    O_DIRECT = 16384;
    O_NONBLOCK = 2048;
    S_IRWXU = 448;
    S_IRUSR = 256;
    S_IWUSR = 128;
    S_IXUSR = 64;
    S_IRWXG = 56;
    S_IRGRP = 32;
    S_IWGRP = 16;
    S_IXGRP = 8;
    S_IRWXO = 7;
    S_IROTH = 4;
    S_IWOTH = 2;
    S_IXOTH = 1;
    F_OK = 0;
    R_OK = 4;
    W_OK = 2;
    X_OK = 1;
    UV_FS_COPYFILE_EXCL = 1;
    COPYFILE_EXCL = 1;
    UV_FS_COPYFILE_FICLONE = 2;
    COPYFILE_FICLONE = 2;
    UV_FS_COPYFILE_FICLONE_FORCE = 4;
    COPYFILE_FICLONE_FORCE = 4;
  }
});

// node_modules/unenv/dist/runtime/node/fs/promises.mjs
var promises_default;
var init_promises2 = __esm({
  "node_modules/unenv/dist/runtime/node/fs/promises.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises();
    init_constants();
    init_promises();
    promises_default = {
      constants: constants_exports,
      access,
      appendFile,
      chmod,
      chown,
      copyFile,
      cp,
      glob,
      lchmod,
      lchown,
      link,
      lstat,
      lutimes,
      mkdir,
      mkdtemp,
      open,
      opendir,
      readFile,
      readdir,
      readlink,
      realpath,
      rename,
      rm,
      rmdir,
      stat,
      statfs,
      symlink,
      truncate,
      unlink,
      utimes,
      watch,
      writeFile
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/classes.mjs
var Dir, Dirent, Stats, ReadStream2, WriteStream2, FileReadStream, FileWriteStream;
var init_classes = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/classes.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    Dir = /* @__PURE__ */ notImplementedClass("fs.Dir");
    Dirent = /* @__PURE__ */ notImplementedClass("fs.Dirent");
    Stats = /* @__PURE__ */ notImplementedClass("fs.Stats");
    ReadStream2 = /* @__PURE__ */ notImplementedClass("fs.ReadStream");
    WriteStream2 = /* @__PURE__ */ notImplementedClass("fs.WriteStream");
    FileReadStream = ReadStream2;
    FileWriteStream = WriteStream2;
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/fs.mjs
function callbackify(fn) {
  const fnc = /* @__PURE__ */ __name(function(...args) {
    const cb = args.pop();
    fn().catch((error3) => cb(error3)).then((val) => cb(void 0, val));
  }, "fnc");
  fnc.__promisify__ = fn;
  fnc.native = fnc;
  return fnc;
}
var access2, appendFile2, chown2, chmod2, copyFile2, cp2, lchown2, lchmod2, link2, lstat2, lutimes2, mkdir2, mkdtemp2, realpath2, open2, opendir2, readdir2, readFile2, readlink2, rename2, rm2, rmdir2, stat2, symlink2, truncate2, unlink2, utimes2, writeFile2, statfs2, close, createReadStream, createWriteStream, exists, fchown, fchmod, fdatasync, fstat, fsync, ftruncate, futimes, lstatSync, read, readv, realpathSync, statSync, unwatchFile, watch2, watchFile, write, writev, _toUnixTimestamp, openAsBlob, glob2, appendFileSync, accessSync, chownSync, chmodSync, closeSync, copyFileSync, cpSync, existsSync, fchownSync, fchmodSync, fdatasyncSync, fstatSync, fsyncSync, ftruncateSync, futimesSync, lchownSync, lchmodSync, linkSync, lutimesSync, mkdirSync, mkdtempSync, openSync, opendirSync, readdirSync, readSync, readvSync, readFileSync, readlinkSync, renameSync, rmSync, rmdirSync, symlinkSync, truncateSync, unlinkSync, utimesSync, writeFileSync, writeSync, writevSync, statfsSync, globSync;
var init_fs = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/fs.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    init_promises();
    __name(callbackify, "callbackify");
    access2 = callbackify(access);
    appendFile2 = callbackify(appendFile);
    chown2 = callbackify(chown);
    chmod2 = callbackify(chmod);
    copyFile2 = callbackify(copyFile);
    cp2 = callbackify(cp);
    lchown2 = callbackify(lchown);
    lchmod2 = callbackify(lchmod);
    link2 = callbackify(link);
    lstat2 = callbackify(lstat);
    lutimes2 = callbackify(lutimes);
    mkdir2 = callbackify(mkdir);
    mkdtemp2 = callbackify(mkdtemp);
    realpath2 = callbackify(realpath);
    open2 = callbackify(open);
    opendir2 = callbackify(opendir);
    readdir2 = callbackify(readdir);
    readFile2 = callbackify(readFile);
    readlink2 = callbackify(readlink);
    rename2 = callbackify(rename);
    rm2 = callbackify(rm);
    rmdir2 = callbackify(rmdir);
    stat2 = callbackify(stat);
    symlink2 = callbackify(symlink);
    truncate2 = callbackify(truncate);
    unlink2 = callbackify(unlink);
    utimes2 = callbackify(utimes);
    writeFile2 = callbackify(writeFile);
    statfs2 = callbackify(statfs);
    close = /* @__PURE__ */ notImplementedAsync("fs.close");
    createReadStream = /* @__PURE__ */ notImplementedAsync("fs.createReadStream");
    createWriteStream = /* @__PURE__ */ notImplementedAsync("fs.createWriteStream");
    exists = /* @__PURE__ */ notImplementedAsync("fs.exists");
    fchown = /* @__PURE__ */ notImplementedAsync("fs.fchown");
    fchmod = /* @__PURE__ */ notImplementedAsync("fs.fchmod");
    fdatasync = /* @__PURE__ */ notImplementedAsync("fs.fdatasync");
    fstat = /* @__PURE__ */ notImplementedAsync("fs.fstat");
    fsync = /* @__PURE__ */ notImplementedAsync("fs.fsync");
    ftruncate = /* @__PURE__ */ notImplementedAsync("fs.ftruncate");
    futimes = /* @__PURE__ */ notImplementedAsync("fs.futimes");
    lstatSync = /* @__PURE__ */ notImplementedAsync("fs.lstatSync");
    read = /* @__PURE__ */ notImplementedAsync("fs.read");
    readv = /* @__PURE__ */ notImplementedAsync("fs.readv");
    realpathSync = /* @__PURE__ */ notImplementedAsync("fs.realpathSync");
    statSync = /* @__PURE__ */ notImplementedAsync("fs.statSync");
    unwatchFile = /* @__PURE__ */ notImplementedAsync("fs.unwatchFile");
    watch2 = /* @__PURE__ */ notImplementedAsync("fs.watch");
    watchFile = /* @__PURE__ */ notImplementedAsync("fs.watchFile");
    write = /* @__PURE__ */ notImplementedAsync("fs.write");
    writev = /* @__PURE__ */ notImplementedAsync("fs.writev");
    _toUnixTimestamp = /* @__PURE__ */ notImplementedAsync("fs._toUnixTimestamp");
    openAsBlob = /* @__PURE__ */ notImplementedAsync("fs.openAsBlob");
    glob2 = /* @__PURE__ */ notImplementedAsync("fs.glob");
    appendFileSync = /* @__PURE__ */ notImplemented("fs.appendFileSync");
    accessSync = /* @__PURE__ */ notImplemented("fs.accessSync");
    chownSync = /* @__PURE__ */ notImplemented("fs.chownSync");
    chmodSync = /* @__PURE__ */ notImplemented("fs.chmodSync");
    closeSync = /* @__PURE__ */ notImplemented("fs.closeSync");
    copyFileSync = /* @__PURE__ */ notImplemented("fs.copyFileSync");
    cpSync = /* @__PURE__ */ notImplemented("fs.cpSync");
    existsSync = /* @__PURE__ */ __name(() => false, "existsSync");
    fchownSync = /* @__PURE__ */ notImplemented("fs.fchownSync");
    fchmodSync = /* @__PURE__ */ notImplemented("fs.fchmodSync");
    fdatasyncSync = /* @__PURE__ */ notImplemented("fs.fdatasyncSync");
    fstatSync = /* @__PURE__ */ notImplemented("fs.fstatSync");
    fsyncSync = /* @__PURE__ */ notImplemented("fs.fsyncSync");
    ftruncateSync = /* @__PURE__ */ notImplemented("fs.ftruncateSync");
    futimesSync = /* @__PURE__ */ notImplemented("fs.futimesSync");
    lchownSync = /* @__PURE__ */ notImplemented("fs.lchownSync");
    lchmodSync = /* @__PURE__ */ notImplemented("fs.lchmodSync");
    linkSync = /* @__PURE__ */ notImplemented("fs.linkSync");
    lutimesSync = /* @__PURE__ */ notImplemented("fs.lutimesSync");
    mkdirSync = /* @__PURE__ */ notImplemented("fs.mkdirSync");
    mkdtempSync = /* @__PURE__ */ notImplemented("fs.mkdtempSync");
    openSync = /* @__PURE__ */ notImplemented("fs.openSync");
    opendirSync = /* @__PURE__ */ notImplemented("fs.opendirSync");
    readdirSync = /* @__PURE__ */ notImplemented("fs.readdirSync");
    readSync = /* @__PURE__ */ notImplemented("fs.readSync");
    readvSync = /* @__PURE__ */ notImplemented("fs.readvSync");
    readFileSync = /* @__PURE__ */ notImplemented("fs.readFileSync");
    readlinkSync = /* @__PURE__ */ notImplemented("fs.readlinkSync");
    renameSync = /* @__PURE__ */ notImplemented("fs.renameSync");
    rmSync = /* @__PURE__ */ notImplemented("fs.rmSync");
    rmdirSync = /* @__PURE__ */ notImplemented("fs.rmdirSync");
    symlinkSync = /* @__PURE__ */ notImplemented("fs.symlinkSync");
    truncateSync = /* @__PURE__ */ notImplemented("fs.truncateSync");
    unlinkSync = /* @__PURE__ */ notImplemented("fs.unlinkSync");
    utimesSync = /* @__PURE__ */ notImplemented("fs.utimesSync");
    writeFileSync = /* @__PURE__ */ notImplemented("fs.writeFileSync");
    writeSync = /* @__PURE__ */ notImplemented("fs.writeSync");
    writevSync = /* @__PURE__ */ notImplemented("fs.writevSync");
    statfsSync = /* @__PURE__ */ notImplemented("fs.statfsSync");
    globSync = /* @__PURE__ */ notImplemented("fs.globSync");
  }
});

// node_modules/unenv/dist/runtime/node/fs.mjs
var fs_default;
var init_fs2 = __esm({
  "node_modules/unenv/dist/runtime/node/fs.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises2();
    init_classes();
    init_fs();
    init_constants();
    init_constants();
    init_fs();
    init_classes();
    fs_default = {
      F_OK,
      R_OK,
      W_OK,
      X_OK,
      constants: constants_exports,
      promises: promises_default,
      Dir,
      Dirent,
      FileReadStream,
      FileWriteStream,
      ReadStream: ReadStream2,
      Stats,
      WriteStream: WriteStream2,
      _toUnixTimestamp,
      access: access2,
      accessSync,
      appendFile: appendFile2,
      appendFileSync,
      chmod: chmod2,
      chmodSync,
      chown: chown2,
      chownSync,
      close,
      closeSync,
      copyFile: copyFile2,
      copyFileSync,
      cp: cp2,
      cpSync,
      createReadStream,
      createWriteStream,
      exists,
      existsSync,
      fchmod,
      fchmodSync,
      fchown,
      fchownSync,
      fdatasync,
      fdatasyncSync,
      fstat,
      fstatSync,
      fsync,
      fsyncSync,
      ftruncate,
      ftruncateSync,
      futimes,
      futimesSync,
      glob: glob2,
      lchmod: lchmod2,
      globSync,
      lchmodSync,
      lchown: lchown2,
      lchownSync,
      link: link2,
      linkSync,
      lstat: lstat2,
      lstatSync,
      lutimes: lutimes2,
      lutimesSync,
      mkdir: mkdir2,
      mkdirSync,
      mkdtemp: mkdtemp2,
      mkdtempSync,
      open: open2,
      openAsBlob,
      openSync,
      opendir: opendir2,
      opendirSync,
      read,
      readFile: readFile2,
      readFileSync,
      readSync,
      readdir: readdir2,
      readdirSync,
      readlink: readlink2,
      readlinkSync,
      readv,
      readvSync,
      realpath: realpath2,
      realpathSync,
      rename: rename2,
      renameSync,
      rm: rm2,
      rmSync,
      rmdir: rmdir2,
      rmdirSync,
      stat: stat2,
      statSync,
      statfs: statfs2,
      statfsSync,
      symlink: symlink2,
      symlinkSync,
      truncate: truncate2,
      truncateSync,
      unlink: unlink2,
      unlinkSync,
      unwatchFile,
      utimes: utimes2,
      utimesSync,
      watch: watch2,
      watchFile,
      write,
      writeFile: writeFile2,
      writeFileSync,
      writeSync,
      writev,
      writevSync
    };
  }
});

// node-built-in-modules:fs
var require_fs = __commonJS({
  "node-built-in-modules:fs"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_fs2();
    module.exports = fs_default;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    function parse2(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config3 = str.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = {};
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
      }
      for (const entry of result.searchParams.entries()) {
        config2[entry[0]] = entry[1];
      }
      config2.user = config2.user || decodeURIComponent(result.username);
      config2.password = config2.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config2.host = decodeURI(result.pathname);
        config2.database = result.searchParams.get("db");
        config2.client_encoding = result.searchParams.get("encoding");
        return config2;
      }
      const hostname = dummyHost ? "" : result.hostname;
      if (!config2.host) {
        config2.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config2.port) {
        config2.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config2.database = pathname ? decodeURI(pathname) : null;
      if (config2.ssl === "true" || config2.ssl === "1") {
        config2.ssl = true;
      }
      if (config2.ssl === "0") {
        config2.ssl = false;
      }
      if (config2.sslcert || config2.sslkey || config2.sslrootcert || config2.sslmode) {
        config2.ssl = {};
      }
      const fs = config2.sslcert || config2.sslkey || config2.sslrootcert ? require_fs() : null;
      if (config2.sslcert) {
        config2.ssl.cert = fs.readFileSync(config2.sslcert).toString();
      }
      if (config2.sslkey) {
        config2.ssl.key = fs.readFileSync(config2.sslkey).toString();
      }
      if (config2.sslrootcert) {
        config2.ssl.ca = fs.readFileSync(config2.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config2.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config2.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config2.sslrootcert) {
              config2.ssl.checkServerIdentity = function() {
              };
            } else {
              config2.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config2.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config2.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            break;
          }
          case "no-verify": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config2;
    }
    __name(parse2, "parse");
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, {});
      return connectionOptions;
    }
    __name(toConnectionOptions, "toConnectionOptions");
    function toClientConfig(config2) {
      const poolConfig = Object.entries(config2).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, {});
      return poolConfig;
    }
    __name(toClientConfig, "toClientConfig");
    function parseIntoClientConfig(str) {
      return toClientConfig(parse2(str));
    }
    __name(parseIntoClientConfig, "parseIntoClientConfig");
    module.exports = parse2;
    parse2.parse = parse2;
    parse2.toClientConfig = toClientConfig;
    parse2.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var dns = require_dns();
    var defaults2 = require_defaults();
    var parse2 = require_pg_connection_string().parse;
    var val = /* @__PURE__ */ __name(function(key, config2, envVar) {
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return config2[key] || envVar || defaults2[key];
    }, "val");
    var readSSLConfigFromEnvironment = /* @__PURE__ */ __name(function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    }, "readSSLConfigFromEnvironment");
    var quoteParamValue = /* @__PURE__ */ __name(function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    }, "quoteParamValue");
    var add = /* @__PURE__ */ __name(function(params, config2, paramName) {
      const value = config2[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    }, "add");
    var ConnectionParameters = class {
      static {
        __name(this, "ConnectionParameters");
      }
      constructor(config2) {
        config2 = typeof config2 === "string" ? parse2(config2) : config2 || {};
        if (config2.connectionString) {
          config2 = Object.assign({}, config2, parse2(config2.connectionString));
        }
        this.user = val("user", config2);
        this.database = val("database", config2);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config2), 10);
        this.host = val("host", config2);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config2)
        });
        this.binary = val("binary", config2);
        this.options = val("options", config2);
        this.ssl = typeof config2.ssl === "undefined" ? readSSLConfigFromEnvironment() : config2.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config2);
        this.replication = val("replication", config2);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config2, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config2, false);
        this.statement_timeout = val("statement_timeout", config2, false);
        this.lock_timeout = val("lock_timeout", config2, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config2, false);
        this.query_timeout = val("query_timeout", config2, false);
        if (config2.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config2.connectionTimeoutMillis / 1e3);
        }
        if (config2.keepAlive === false) {
          this.keepalives = 0;
        } else if (config2.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config2.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config2.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      static {
        __name(this, "Result");
      }
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match2;
        if (msg.text) {
          match2 = matchRegexp.exec(msg.text);
        } else {
          match2 = matchRegexp.exec(msg.command);
        }
        if (match2) {
          this.command = match2[1];
          if (match2[3]) {
            this.oid = parseInt(match2[2], 10);
            this.rowCount = parseInt(match2[3], 10);
          } else if (match2[2]) {
            this.rowCount = parseInt(match2[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field13 = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field13] = this._parsers[i](v);
          } else {
            row[field13] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = {};
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { EventEmitter: EventEmitter2 } = require_events();
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter2 {
      static {
        __name(this, "Query");
      }
      constructor(config2, values, callback) {
        super();
        config2 = utils.normalizeQueryConfig(config2, values, callback);
        this.text = config2.text;
        this.values = config2.values;
        this.rows = config2.rows;
        this.types = config2.types;
        this.name = config2.name;
        this.queryMode = config2.queryMode;
        this.binary = config2.binary;
        this.portal = config2.portal || "";
        this.callback = config2.callback;
        this._rowMode = config2.rowMode;
        if (process.domain && config2.callback) {
          this.callback = process.domain.bind(config2.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      static {
        __name(this, "DatabaseError");
      }
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      static {
        __name(this, "CopyDataMessage");
      }
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      static {
        __name(this, "CopyResponse");
      }
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      static {
        __name(this, "Field");
      }
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      static {
        __name(this, "RowDescriptionMessage");
      }
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      static {
        __name(this, "ParameterDescriptionMessage");
      }
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      static {
        __name(this, "ParameterStatusMessage");
      }
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      static {
        __name(this, "AuthenticationMD5Password");
      }
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      static {
        __name(this, "BackendKeyDataMessage");
      }
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      static {
        __name(this, "NotificationResponseMessage");
      }
      constructor(length, processId, channel2, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel2;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      static {
        __name(this, "ReadyForQueryMessage");
      }
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      static {
        __name(this, "CommandCompleteMessage");
      }
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      static {
        __name(this, "DataRowMessage");
      }
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      static {
        __name(this, "NoticeMessage");
      }
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      static {
        __name(this, "Writer");
      }
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = /* @__PURE__ */ __name((opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    }, "startup");
    var requestSsl = /* @__PURE__ */ __name(() => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    }, "requestSsl");
    var password = /* @__PURE__ */ __name((password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    }, "password");
    var sendSASLInitialResponseMessage = /* @__PURE__ */ __name(function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    }, "sendSASLInitialResponseMessage");
    var sendSCRAMClientFinalMessage = /* @__PURE__ */ __name(function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    }, "sendSCRAMClientFinalMessage");
    var query2 = /* @__PURE__ */ __name((text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    }, "query");
    var emptyArray = [];
    var parse2 = /* @__PURE__ */ __name((query3) => {
      const name = query3.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query3.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query3.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    }, "parse");
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = /* @__PURE__ */ __name(function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    }, "writeValues");
    var bind = /* @__PURE__ */ __name((config2 = {}) => {
      const portal = config2.portal || "";
      const statement = config2.statement || "";
      const binary = config2.binary || false;
      const values = config2.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config2.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    }, "bind");
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = /* @__PURE__ */ __name((config2) => {
      if (!config2 || !config2.portal && !config2.rows) {
        return emptyExecute;
      }
      const portal = config2.portal || "";
      const rows = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    }, "execute");
    var cancel = /* @__PURE__ */ __name((processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    }, "cancel");
    var cstringMessage = /* @__PURE__ */ __name((code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    }, "cstringMessage");
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = /* @__PURE__ */ __name((msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    }, "describe");
    var close2 = /* @__PURE__ */ __name((msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    }, "close");
    var copyData = /* @__PURE__ */ __name((chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    }, "copyData");
    var copyFail = /* @__PURE__ */ __name((message) => {
      return cstringMessage(102, message);
    }, "copyFail");
    var codeOnlyBuffer = /* @__PURE__ */ __name((code) => Buffer.from([code, 0, 0, 0, 4]), "codeOnlyBuffer");
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize2 = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query: query2,
      parse: parse2,
      bind,
      execute,
      describe,
      close: close2,
      flush: /* @__PURE__ */ __name(() => flushBuffer, "flush"),
      sync: /* @__PURE__ */ __name(() => syncBuffer, "sync"),
      end: /* @__PURE__ */ __name(() => endBuffer, "end"),
      copyData,
      copyDone: /* @__PURE__ */ __name(() => copyDoneBuffer, "copyDone"),
      copyFail,
      cancel
    };
    exports.serialize = serialize2;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var BufferReader = class {
      static {
        __name(this, "BufferReader");
      }
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = emptyBuffer;
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      static {
        __name(this, "Parser");
      }
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        switch (code) {
          case 50:
            return messages_1.bindComplete;
          case 49:
            return messages_1.parseComplete;
          case 51:
            return messages_1.closeComplete;
          case 110:
            return messages_1.noData;
          case 115:
            return messages_1.portalSuspended;
          case 99:
            return messages_1.copyDone;
          case 87:
            return messages_1.replicationStart;
          case 73:
            return messages_1.emptyQuery;
          case 68:
            return this.parseDataRowMessage(offset, length, bytes);
          case 67:
            return this.parseCommandCompleteMessage(offset, length, bytes);
          case 90:
            return this.parseReadyForQueryMessage(offset, length, bytes);
          case 65:
            return this.parseNotificationMessage(offset, length, bytes);
          case 82:
            return this.parseAuthenticationResponse(offset, length, bytes);
          case 83:
            return this.parseParameterStatusMessage(offset, length, bytes);
          case 75:
            return this.parseBackendKeyData(offset, length, bytes);
          case 69:
            return this.parseErrorMessage(offset, length, bytes, "error");
          case 78:
            return this.parseErrorMessage(offset, length, bytes, "notice");
          case 84:
            return this.parseRowDescriptionMessage(offset, length, bytes);
          case 116:
            return this.parseParameterDescriptionMessage(offset, length, bytes);
          case 71:
            return this.parseCopyInMessage(offset, length, bytes);
          case 72:
            return this.parseCopyOutMessage(offset, length, bytes);
          case 100:
            return this.parseCopyData(offset, length, bytes);
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
      }
      parseReadyForQueryMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const status = this.reader.string(1);
        return new messages_1.ReadyForQueryMessage(length, status);
      }
      parseCommandCompleteMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const text = this.reader.cstring();
        return new messages_1.CommandCompleteMessage(length, text);
      }
      parseCopyData(offset, length, bytes) {
        const chunk = bytes.slice(offset, offset + (length - 4));
        return new messages_1.CopyDataMessage(length, chunk);
      }
      parseCopyInMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyInResponse");
      }
      parseCopyOutMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyOutResponse");
      }
      parseCopyMessage(offset, length, bytes, messageName) {
        this.reader.setBuffer(offset, bytes);
        const isBinary = this.reader.byte() !== 0;
        const columnCount = this.reader.int16();
        const message = new messages_1.CopyResponse(length, messageName, isBinary, columnCount);
        for (let i = 0; i < columnCount; i++) {
          message.columnTypes[i] = this.reader.int16();
        }
        return message;
      }
      parseNotificationMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processId = this.reader.int32();
        const channel2 = this.reader.cstring();
        const payload = this.reader.cstring();
        return new messages_1.NotificationResponseMessage(length, processId, channel2, payload);
      }
      parseRowDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const message = new messages_1.RowDescriptionMessage(length, fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          message.fields[i] = this.parseField();
        }
        return message;
      }
      parseField() {
        const name = this.reader.cstring();
        const tableID = this.reader.uint32();
        const columnID = this.reader.int16();
        const dataTypeID = this.reader.uint32();
        const dataTypeSize = this.reader.int16();
        const dataTypeModifier = this.reader.int32();
        const mode = this.reader.int16() === 0 ? "text" : "binary";
        return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
      }
      parseParameterDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const parameterCount = this.reader.int16();
        const message = new messages_1.ParameterDescriptionMessage(length, parameterCount);
        for (let i = 0; i < parameterCount; i++) {
          message.dataTypeIDs[i] = this.reader.int32();
        }
        return message;
      }
      parseDataRowMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const fields = new Array(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          const len = this.reader.int32();
          fields[i] = len === -1 ? null : this.reader.string(len);
        }
        return new messages_1.DataRowMessage(length, fields);
      }
      parseParameterStatusMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const name = this.reader.cstring();
        const value = this.reader.cstring();
        return new messages_1.ParameterStatusMessage(length, name, value);
      }
      parseBackendKeyData(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processID = this.reader.int32();
        const secretKey = this.reader.int32();
        return new messages_1.BackendKeyDataMessage(length, processID, secretKey);
      }
      parseAuthenticationResponse(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const code = this.reader.int32();
        const message = {
          name: "authenticationOk",
          length
        };
        switch (code) {
          case 0:
            break;
          case 3:
            if (message.length === 8) {
              message.name = "authenticationCleartextPassword";
            }
            break;
          case 5:
            if (message.length === 12) {
              message.name = "authenticationMD5Password";
              const salt = this.reader.bytes(4);
              return new messages_1.AuthenticationMD5Password(length, salt);
            }
            break;
          case 10:
            {
              message.name = "authenticationSASL";
              message.mechanisms = [];
              let mechanism;
              do {
                mechanism = this.reader.cstring();
                if (mechanism) {
                  message.mechanisms.push(mechanism);
                }
              } while (mechanism);
            }
            break;
          case 11:
            message.name = "authenticationSASLContinue";
            message.data = this.reader.string(length - 8);
            break;
          case 12:
            message.name = "authenticationSASLFinal";
            message.data = this.reader.string(length - 8);
            break;
          default:
            throw new Error("Unknown authenticationOk message type " + code);
        }
        return message;
      }
      parseErrorMessage(offset, length, bytes, name) {
        this.reader.setBuffer(offset, bytes);
        const fields = {};
        let fieldType = this.reader.string(1);
        while (fieldType !== "\0") {
          fields[fieldType] = this.reader.cstring();
          fieldType = this.reader.string(1);
        }
        const messageValue = fields.M;
        const message = name === "notice" ? new messages_1.NoticeMessage(length, messageValue) : new messages_1.DatabaseError(messageValue, length, name);
        message.severity = fields.S;
        message.code = fields.C;
        message.detail = fields.D;
        message.hint = fields.H;
        message.position = fields.P;
        message.internalPosition = fields.p;
        message.internalQuery = fields.q;
        message.where = fields.W;
        message.schema = fields.s;
        message.table = fields.t;
        message.column = fields.c;
        message.dataType = fields.d;
        message.constraint = fields.n;
        message.file = fields.F;
        message.line = fields.L;
        message.routine = fields.R;
        return message;
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = exports.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return messages_1.DatabaseError;
    }, "get") });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return serializer_1.serialize;
    }, "get") });
    var parser_1 = require_parser();
    function parse2(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    __name(parse2, "parse");
    exports.parse = parse2;
  }
});

// node-built-in-modules:net
import libDefault5 from "net";
var require_net = __commonJS({
  "node-built-in-modules:net"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault5;
  }
});

// node-built-in-modules:tls
import libDefault6 from "tls";
var require_tls = __commonJS({
  "node-built-in-modules:tls"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault6;
  }
});

// node_modules/pg-cloudflare/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/pg-cloudflare/dist/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CloudflareSocket = void 0;
    var events_1 = require_events();
    var CloudflareSocket = class extends events_1.EventEmitter {
      static {
        __name(this, "CloudflareSocket");
      }
      constructor(ssl) {
        super();
        this.ssl = ssl;
        this.writable = false;
        this.destroyed = false;
        this._upgrading = false;
        this._upgraded = false;
        this._cfSocket = null;
        this._cfWriter = null;
        this._cfReader = null;
      }
      setNoDelay() {
        return this;
      }
      setKeepAlive() {
        return this;
      }
      ref() {
        return this;
      }
      unref() {
        return this;
      }
      async connect(port, host, connectListener) {
        try {
          log3("connecting");
          if (connectListener)
            this.once("connect", connectListener);
          const options = this.ssl ? { secureTransport: "starttls" } : {};
          const mod = await import("cloudflare:sockets");
          const connect = mod.connect;
          this._cfSocket = connect(`${host}:${port}`, options);
          this._cfWriter = this._cfSocket.writable.getWriter();
          this._addClosedHandler();
          this._cfReader = this._cfSocket.readable.getReader();
          if (this.ssl) {
            this._listenOnce().catch((e) => this.emit("error", e));
          } else {
            this._listen().catch((e) => this.emit("error", e));
          }
          await this._cfWriter.ready;
          log3("socket ready");
          this.writable = true;
          this.emit("connect");
          return this;
        } catch (e) {
          this.emit("error", e);
        }
      }
      async _listen() {
        while (true) {
          log3("awaiting receive from CF socket");
          const { done, value } = await this._cfReader.read();
          log3("CF socket received:", done, value);
          if (done) {
            log3("done");
            break;
          }
          this.emit("data", Buffer.from(value));
        }
      }
      async _listenOnce() {
        log3("awaiting first receive from CF socket");
        const { done, value } = await this._cfReader.read();
        log3("First CF socket received:", done, value);
        this.emit("data", Buffer.from(value));
      }
      write(data, encoding = "utf8", callback = () => {
      }) {
        if (data.length === 0)
          return callback();
        if (typeof data === "string")
          data = Buffer.from(data, encoding);
        log3("sending data direct:", data);
        this._cfWriter.write(data).then(() => {
          log3("data sent");
          callback();
        }, (err) => {
          log3("send error", err);
          callback(err);
        });
        return true;
      }
      end(data = Buffer.alloc(0), encoding = "utf8", callback = () => {
      }) {
        log3("ending CF socket");
        this.write(data, encoding, (err) => {
          this._cfSocket.close();
          if (callback)
            callback(err);
        });
        return this;
      }
      destroy(reason) {
        log3("destroying CF socket", reason);
        this.destroyed = true;
        return this.end();
      }
      startTls(options) {
        if (this._upgraded) {
          this.emit("error", "Cannot call `startTls()` more than once on a socket");
          return;
        }
        this._cfWriter.releaseLock();
        this._cfReader.releaseLock();
        this._upgrading = true;
        this._cfSocket = this._cfSocket.startTls(options);
        this._cfWriter = this._cfSocket.writable.getWriter();
        this._cfReader = this._cfSocket.readable.getReader();
        this._addClosedHandler();
        this._listen().catch((e) => this.emit("error", e));
      }
      _addClosedHandler() {
        this._cfSocket.closed.then(() => {
          if (!this._upgrading) {
            log3("CF socket closed");
            this._cfSocket = null;
            this.emit("close");
          } else {
            this._upgrading = false;
            this._upgraded = true;
          }
        }).catch((e) => this.emit("error", e));
      }
    };
    exports.CloudflareSocket = CloudflareSocket;
    var debug3 = false;
    function dump(data) {
      if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
        const hex = Buffer.from(data).toString("hex");
        const str = new TextDecoder().decode(data);
        return `
>>> STR: "${str.replace(/\n/g, "\\n")}"
>>> HEX: ${hex}
`;
      } else {
        return data;
      }
    }
    __name(dump, "dump");
    function log3(...args) {
      debug3 && console.log(...args.map(dump));
    }
    __name(log3, "log");
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = require_net();
        return new net.Socket();
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        const tls = require_tls();
        return tls.connect(options);
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getNodejsStreamFuncs, "getNodejsStreamFuncs");
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_dist2();
        return new CloudflareSocket(ssl);
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getCloudflareStreamFuncs, "getCloudflareStreamFuncs");
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && true) {
        return true;
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    __name(isCloudflareRuntime, "isCloudflareRuntime");
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
    __name(getStreamFuncs, "getStreamFuncs");
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var { parse: parse2, serialize: serialize2 } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize2.flush();
    var syncBuffer = serialize2.sync();
    var endBuffer = serialize2.end();
    var Connection2 = class extends EventEmitter2 {
      static {
        __name(this, "Connection");
      }
      constructor(config2) {
        super();
        config2 = config2 || {};
        this.stream = config2.stream || getStream(config2.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config2);
        }
        this._keepAlive = config2.keepAlive;
        this._keepAliveInitialDelayMillis = config2.keepAliveInitialDelayMillis;
        this.lastBuffer = false;
        this.parsedStatements = {};
        this.ssl = config2.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self2 = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self2._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self2 = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self2._keepAlive) {
            self2.stream.setKeepAlive(true, self2._keepAliveInitialDelayMillis);
          }
          self2.emit("connect");
        });
        const reportStreamError = /* @__PURE__ */ __name(function(error3) {
          if (self2._ending && (error3.code === "ECONNRESET" || error3.code === "EPIPE")) {
            return;
          }
          self2.emit("error", error3);
        }, "reportStreamError");
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self2.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self2.stream.end();
              return self2.emit("error", new Error("The server does not support SSL connections"));
            default:
              self2.stream.end();
              return self2.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self2.stream
          };
          if (self2.ssl !== true) {
            Object.assign(options, self2.ssl);
            if ("key" in self2.ssl) {
              options.key = self2.ssl.key;
            }
          }
          const net = require_net();
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self2.stream = getSecureStream(options);
          } catch (err) {
            return self2.emit("error", err);
          }
          self2.attachListeners(self2.stream);
          self2.stream.on("error", reportStreamError);
          self2.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse2(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize2.requestSsl());
      }
      startup(config2) {
        this.stream.write(serialize2.startup(config2));
      }
      cancel(processID, secretKey) {
        this._send(serialize2.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize2.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize2.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize2.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize2.query(text));
      }
      // send parse message
      parse(query2) {
        this._send(serialize2.parse(query2));
      }
      // send bind message
      bind(config2) {
        this._send(serialize2.bind(config2));
      }
      // send execute message
      execute(config2) {
        this._send(serialize2.execute(config2));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize2.close(msg));
      }
      describe(msg) {
        this._send(serialize2.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize2.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize2.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize2.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node-built-in-modules:path
import libDefault7 from "path";
var require_path = __commonJS({
  "node-built-in-modules:path"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault7;
  }
});

// node-built-in-modules:stream
import libDefault8 from "stream";
var require_stream2 = __commonJS({
  "node-built-in-modules:stream"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault8;
  }
});

// node-built-in-modules:string_decoder
import libDefault9 from "string_decoder";
var require_string_decoder = __commonJS({
  "node-built-in-modules:string_decoder"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault9;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { Transform } = require_stream2();
    var { StringDecoder } = require_string_decoder();
    var kLast = /* @__PURE__ */ Symbol("last");
    var kDecoder = /* @__PURE__ */ Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error3) {
          return cb(error3);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    __name(transform, "transform");
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error3) {
          return cb(error3);
        }
      }
      cb();
    }
    __name(flush, "flush");
    function push(self2, val) {
      if (val !== void 0) {
        self2.push(val);
      }
    }
    __name(push, "push");
    function noop(incoming) {
      return incoming;
    }
    __name(noop, "noop");
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    __name(split, "split");
    module.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var path = require_path();
    var Stream = require_stream2().Stream;
    var split = require_split2();
    var util = require_util();
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG2 = 56;
    var S_IRWXO2 = 7;
    var S_IFMT2 = 61440;
    var S_IFREG2 = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT2) == S_IFREG2;
    }
    __name(isRegFile, "isRegFile");
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn3() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    __name(warn3, "warn");
    Object.defineProperty(module.exports, "isWin", {
      get: /* @__PURE__ */ __name(function() {
        return isWin;
      }, "get"),
      set: /* @__PURE__ */ __name(function(val) {
        isWin = val;
      }, "set")
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env3 = rawEnv || process.env;
      var file = env3.PGPASSFILE || (isWin ? path.join(env3.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env3.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn3('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG2 | S_IRWXO2)) {
        warn3('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field13, idx) {
        if (idx == 1) {
          if (Number(connInfo[field13] || defaultPort) === Number(entry[field13])) {
            return prev && true;
          }
        }
        return prev && (entry[field13] === "*" || entry[field13] === connInfo[field13]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      __name(onLine, "onLine");
      var onEnd = /* @__PURE__ */ __name(function() {
        stream.destroy();
        cb(pass);
      }, "onEnd");
      var onErr = /* @__PURE__ */ __name(function(err) {
        stream.destroy();
        warn3("WARNING: error on reading file: %s", err);
        cb(void 0);
      }, "onErr");
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = /* @__PURE__ */ __name(function(idx, i0, i1) {
        var field13 = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field13 = field13.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field13;
      }, "addToObj");
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var path = require_path();
    var fs = require_fs();
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat3) {
        if (err || !helper.usePgPass(stat3, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var utils = require_utils();
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto2 = require_utils2();
    var Client2 = class extends EventEmitter2 {
      static {
        __name(this, "Client");
      }
      constructor(config2) {
        super();
        this.connectionParameters = new ConnectionParameters(config2);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config2 || {};
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this.queryQueue = [];
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      _errorAllQueries(err) {
        const enqueueError = /* @__PURE__ */ __name((query2) => {
          process.nextTick(() => {
            query2.handleError(err, this.connection);
          });
        }, "enqueueError");
        if (this.activeQuery) {
          enqueueError(this.activeQuery);
          this.activeQuery = null;
        }
        this.queryQueue.forEach(enqueueError);
        this.queryQueue.length = 0;
      }
      _connect(callback) {
        const self2 = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self2.ssl) {
            con.requestSsl();
          } else {
            con.startup(self2.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self2.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error3 = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error3);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error3);
              } else {
                this._handleErrorEvent(error3);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error3);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error3) => {
            if (error3) {
              reject(error3);
            } else {
              resolve();
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      // TODO(bmc): deprecate pgpass "built in" integration since this.password can be a function
      // it can be supplied by the user if required - this is a breaking change!
      _checkPgPass(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password()).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._checkPgPass(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._checkPgPass(async () => {
          try {
            const hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._checkPgPass(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const { activeQuery } = this;
        this.activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this.activeQuery;
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this.activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        this.activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        this.activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        this.activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        this.activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        if (this.activeQuery == null) {
          const error3 = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error3);
          return;
        }
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        if (this.activeQuery == null) {
          const error3 = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error3);
          return;
        }
        if (this.activeQuery.name) {
          this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        this.activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        this.activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query2) {
        if (client.activeQuery === query2) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client.queryQueue.indexOf(query2) !== -1) {
          client.queryQueue.splice(client.queryQueue.indexOf(query2), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this.activeQuery = this.queryQueue.shift();
          if (this.activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = this.activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                this.activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this.activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config2, values, callback) {
        let query2;
        let result;
        let readTimeout;
        let readTimeoutTimer;
        let queryCallback;
        if (config2 === null || config2 === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config2.submit === "function") {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          result = query2 = config2;
          if (typeof values === "function") {
            query2.callback = query2.callback || values;
          }
        } else {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          query2 = new Query2(config2, values, callback);
          if (!query2.callback) {
            result = new this._Promise((resolve, reject) => {
              query2.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query2.callback;
          readTimeoutTimer = setTimeout(() => {
            const error3 = new Error("Query read timeout");
            process.nextTick(() => {
              query2.handleError(error3, this.connection);
            });
            queryCallback(error3);
            query2.callback = () => {
            };
            const index = this.queryQueue.indexOf(query2);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query2.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query2.binary) {
          query2.binary = true;
        }
        if (query2._result && !query2._result._types) {
          query2._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query2.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query2.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        this.queryQueue.push(query2);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this.activeQuery || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var NOOP = /* @__PURE__ */ __name(function() {
    }, "NOOP");
    var removeWhere = /* @__PURE__ */ __name((list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    }, "removeWhere");
    var IdleItem = class {
      static {
        __name(this, "IdleItem");
      }
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      static {
        __name(this, "PendingItem");
      }
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    __name(throwOnDoubleRelease, "throwOnDoubleRelease");
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = /* @__PURE__ */ __name(function(err, client) {
        err ? rej(err) : res(client);
      }, "cb");
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    __name(promisify, "promisify");
    function makeIdleListener(pool, client) {
      return /* @__PURE__ */ __name(function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        });
        pool._remove(client);
        pool.emit("error", err, client);
      }, "idleListener");
    }
    __name(makeIdleListener, "makeIdleListener");
    var Pool2 = class extends EventEmitter2 {
      static {
        __name(this, "Pool");
      }
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context2 = this;
        client.end(() => {
          context2.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = /* @__PURE__ */ __name((err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          }, "queueCallback");
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            this.log("ending client due to timeout");
            timeoutHit = true;
            client.connection ? client.connection.stream.destroy() : client.end();
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.maxLifetimeSeconds !== 0) {
              const maxLifetimeTimeout = setTimeout(() => {
                this.log("ending client due to expired lifetime");
                this._expired.add(client);
                const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
                if (idleIndex !== -1) {
                  this._acquireClient(
                    client,
                    new PendingItem((err2, client2, clientRelease) => clientRelease()),
                    idleListener,
                    false
                  );
                }
              }, this.options.maxLifetimeSeconds * 1e3);
              maxLifetimeTimeout.unref();
              client.once("end", () => clearTimeout(maxLifetimeTimeout));
            }
            return this._acquireClient(client, pendingItem, idleListener, true);
          }
        });
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            this.log("remove idle client");
            this._remove(client, this._pulseQueue.bind(this));
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = /* @__PURE__ */ __name((err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          }, "onError");
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool2;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var utils = require_utils();
    var NativeQuery = module.exports = function(config2, values, callback) {
      EventEmitter2.call(this);
      config2 = utils.normalizeQueryConfig(config2, values, callback);
      this.text = config2.text;
      this.values = config2.values;
      this.name = config2.name;
      this.queryMode = config2.queryMode;
      this.callback = config2.callback;
      this.state = "new";
      this._arrayMode = config2.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter2);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self2 = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = /* @__PURE__ */ __name(function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self2.emit("_done");
        });
        if (err) {
          return self2.handleError(err);
        }
        if (self2._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self2.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self2.emit("row", row, results);
            });
          }
        }
        self2.state = "end";
        self2.emit("end", results);
        if (self2.callback) {
          self2.callback(null, results);
        }
      }, "after");
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self2.name] = self2.text;
          return self2.native.execute(self2.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var Client2 = module.exports = function(config2) {
      EventEmitter2.call(this);
      config2 = config2 || {};
      this._Promise = config2.Promise || global.Promise;
      this._types = new TypeOverrides2(config2.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp3 = this.connectionParameters = new ConnectionParameters(config2);
      if (config2.nativeConnectionString) cp3.nativeConnectionString = config2.nativeConnectionString;
      this.user = cp3.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp3.password
      });
      this.database = cp3.database;
      this.host = cp3.host;
      this.port = cp3.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter2);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = /* @__PURE__ */ __name((query2) => {
        process.nextTick(() => {
          query2.native = this.native;
          query2.handleError(err);
        });
      }, "enqueueError");
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self2 = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self2.connectionParameters.nativeConnectionString) conString = self2.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self2.native.connect(conString, function(err2) {
          if (err2) {
            self2.native.end();
            return cb(err2);
          }
          self2._connected = true;
          self2.native.on("error", function(err3) {
            self2._queryable = false;
            self2._errorAllQueries(err3);
            self2.emit("error", err3);
          });
          self2.native.on("notification", function(msg) {
            self2.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self2.emit("connect");
          self2._pulseQueryQueue(true);
          cb();
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error3) => {
          if (error3) {
            reject(error3);
          } else {
            resolve();
          }
        });
      });
    };
    Client2.prototype.query = function(config2, values, callback) {
      let query2;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config2 === null || config2 === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config2.submit === "function") {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        result = query2 = config2;
        if (typeof values === "function") {
          config2.callback = values;
        }
      } else {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        query2 = new NativeQuery(config2, values, callback);
        if (!query2.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query2.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query2.callback;
        readTimeoutTimer = setTimeout(() => {
          const error3 = new Error("Query read timeout");
          process.nextTick(() => {
            query2.handleError(error3, this.connection);
          });
          queryCallback(error3);
          query2.callback = () => {
          };
          const index = this._queryQueue.indexOf(query2);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query2.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      this._queryQueue.push(query2);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self2 = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = /* @__PURE__ */ __name((err) => err ? reject(err) : resolve(), "cb");
        });
      }
      this.native.end(function() {
        self2._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self2.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query2 = this._queryQueue.shift();
      if (!query2) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query2;
      query2.submit(this);
      const self2 = this;
      query2.once("_done", function() {
        self2._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query2) {
      if (this._activeQuery === query2) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query2) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query2), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = /* @__PURE__ */ __name((Client3) => {
      return class BoundPool extends Pool2 {
        static {
          __name(this, "BoundPool");
        }
        constructor(options) {
          super(options, Client3);
        }
      };
    }, "poolFactory");
    var PG = /* @__PURE__ */ __name(function(clientConstructor) {
      this.defaults = defaults2;
      this.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    }, "PG");
    if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
      module.exports = new PG(require_native());
    } else {
      module.exports = new PG(Client2);
      Object.defineProperty(module.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          let native = null;
          try {
            native = new PG(require_native());
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
              throw err;
            }
          }
          Object.defineProperty(module.exports, "native", {
            value: native
          });
          return native;
        }
      });
    }
  }
});

// node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(global2, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global2["dcodeIO"] = global2["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt3 = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return require_crypto()["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt3.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt3.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt3.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick2(function() {
            try {
              callback2(null, bcrypt3.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt3.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt3.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt3.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt3.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt3.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt3.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt3.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick2(callback2.bind(this, null, false));
            return;
          }
          bcrypt3.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt3.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt3.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick2 = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off2 = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off2 < len) {
          c1 = b[off2++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off2 < slen - 1 && olen < len) {
          code = s.charCodeAt(off2++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off2++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off2 = 0; off2 < olen; off2++)
          res.push(rs[off2].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp3 = null;
          if (typeof src === "number")
            cp3 = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp3 !== null || (cp3 = src()) !== null) {
            if (cp3 < 128)
              dst(cp3 & 127);
            else if (cp3 < 2048)
              dst(cp3 >> 6 & 31 | 192), dst(cp3 & 63 | 128);
            else if (cp3 < 65536)
              dst(cp3 >> 12 & 15 | 224), dst(cp3 >> 6 & 63 | 128), dst(cp3 & 63 | 128);
            else
              dst(cp3 >> 18 & 7 | 240), dst(cp3 >> 12 & 63 | 128), dst(cp3 >> 6 & 63 | 128), dst(cp3 & 63 | 128);
            cp3 = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp3 = null;
          if (typeof src === "number")
            cp3 = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp3 !== null || (cp3 = src()) !== null) {
            if (cp3 <= 65535)
              dst(cp3);
            else
              cp3 -= 65536, dst((cp3 >> 10) + 55296), dst(cp3 % 1024 + 56320);
            cp3 = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp3) {
            utfx2.encodeUTF8(cp3, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp3) {
            utfx2.UTF8toUTF16(cp3, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp3) {
          return cp3 < 128 ? 1 : cp3 < 2048 ? 2 : cp3 < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp3, l = 0;
          while ((cp3 = src()) !== null)
            l += utfx2.calculateCodePoint(cp3);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp3) {
            ++n;
            l += utfx2.calculateCodePoint(cp3);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off2, P, S) {
        var n, l = lr[off2], r = lr[off2 + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off2] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off2 + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick2(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick2(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt3.encodeBase64 = base64_encode;
      bcrypt3.decodeBase64 = base64_decode;
      return bcrypt3;
    });
  }
});

// node_modules/base32.js/base32.js
var require_base32 = __commonJS({
  "node_modules/base32.js/base32.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var charmap = /* @__PURE__ */ __name(function(alphabet, mappings) {
      mappings || (mappings = {});
      alphabet.split("").forEach(function(c, i) {
        if (!(c in mappings)) mappings[c] = i;
      });
      return mappings;
    }, "charmap");
    var rfc4648 = {
      alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      charmap: {
        0: 14,
        1: 8
      }
    };
    rfc4648.charmap = charmap(rfc4648.alphabet, rfc4648.charmap);
    var crockford = {
      alphabet: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
      charmap: {
        O: 0,
        I: 1,
        L: 1
      }
    };
    crockford.charmap = charmap(crockford.alphabet, crockford.charmap);
    function Decoder(options) {
      this.buf = [];
      this.shift = 8;
      this.carry = 0;
      if (options) {
        switch (options.type) {
          case "rfc4648":
            this.charmap = exports.rfc4648.charmap;
            break;
          case "crockford":
            this.charmap = exports.crockford.charmap;
            break;
          default:
            throw new Error("invalid type");
        }
        if (options.charmap) this.charmap = options.charmap;
      }
    }
    __name(Decoder, "Decoder");
    Decoder.prototype.charmap = rfc4648.charmap;
    Decoder.prototype.write = function(str) {
      var charmap2 = this.charmap;
      var buf = this.buf;
      var shift = this.shift;
      var carry = this.carry;
      str.toUpperCase().split("").forEach(function(char) {
        if (char == "=") return;
        var symbol = charmap2[char] & 255;
        shift -= 5;
        if (shift > 0) {
          carry |= symbol << shift;
        } else if (shift < 0) {
          buf.push(carry | symbol >> -shift);
          shift += 8;
          carry = symbol << shift & 255;
        } else {
          buf.push(carry | symbol);
          shift = 8;
          carry = 0;
        }
      });
      this.shift = shift;
      this.carry = carry;
      return this;
    };
    Decoder.prototype.finalize = function(str) {
      if (str) {
        this.write(str);
      }
      if (this.shift !== 8 && this.carry !== 0) {
        this.buf.push(this.carry);
        this.shift = 8;
        this.carry = 0;
      }
      return this.buf;
    };
    function Encoder(options) {
      this.buf = "";
      this.shift = 3;
      this.carry = 0;
      if (options) {
        switch (options.type) {
          case "rfc4648":
            this.alphabet = exports.rfc4648.alphabet;
            break;
          case "crockford":
            this.alphabet = exports.crockford.alphabet;
            break;
          default:
            throw new Error("invalid type");
        }
        if (options.alphabet) this.alphabet = options.alphabet;
        else if (options.lc) this.alphabet = this.alphabet.toLowerCase();
      }
    }
    __name(Encoder, "Encoder");
    Encoder.prototype.alphabet = rfc4648.alphabet;
    Encoder.prototype.write = function(buf) {
      var shift = this.shift;
      var carry = this.carry;
      var symbol;
      var byte;
      var i;
      for (i = 0; i < buf.length; i++) {
        byte = buf[i];
        symbol = carry | byte >> shift;
        this.buf += this.alphabet[symbol & 31];
        if (shift > 5) {
          shift -= 5;
          symbol = byte >> shift;
          this.buf += this.alphabet[symbol & 31];
        }
        shift = 5 - shift;
        carry = byte << shift;
        shift = 8 - shift;
      }
      this.shift = shift;
      this.carry = carry;
      return this;
    };
    Encoder.prototype.finalize = function(buf) {
      if (buf) {
        this.write(buf);
      }
      if (this.shift !== 3) {
        this.buf += this.alphabet[this.carry & 31];
        this.shift = 3;
        this.carry = 0;
      }
      return this.buf;
    };
    exports.encode = function(buf, options) {
      return new Encoder(options).finalize(buf);
    };
    exports.decode = function(str, options) {
      return new Decoder(options).finalize(str);
    };
    exports.Decoder = Decoder;
    exports.Encoder = Encoder;
    exports.charmap = charmap;
    exports.crockford = crockford;
    exports.rfc4648 = rfc4648;
  }
});

// node-built-in-modules:url
import libDefault10 from "url";
var require_url = __commonJS({
  "node-built-in-modules:url"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault10;
  }
});

// node_modules/speakeasy/index.js
var require_speakeasy = __commonJS({
  "node_modules/speakeasy/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var base32 = require_base32();
    var crypto2 = require_crypto();
    var url = require_url();
    var util = require_util();
    exports.digest = /* @__PURE__ */ __name(function digest(options) {
      var i;
      var secret = options.secret;
      var counter = options.counter;
      var encoding = options.encoding || "ascii";
      var algorithm = (options.algorithm || "sha1").toLowerCase();
      if (options.key != null) {
        console.warn("Speakeasy - Deprecation Notice - Specifying the secret using `key` is no longer supported. Use `secret` instead.");
        secret = options.key;
      }
      if (!Buffer.isBuffer(secret)) {
        secret = encoding === "base32" ? base32.decode(secret) : new Buffer(secret, encoding);
      }
      var buf = new Buffer(8);
      var tmp = counter;
      for (i = 0; i < 8; i++) {
        buf[7 - i] = tmp & 255;
        tmp = tmp >> 8;
      }
      var hmac = crypto2.createHmac(algorithm, secret);
      hmac.update(buf);
      return hmac.digest();
    }, "digest");
    exports.hotp = /* @__PURE__ */ __name(function hotpGenerate(options) {
      var digits = (options.digits != null ? options.digits : options.length) || 6;
      if (options.length != null) console.warn("Speakeasy - Deprecation Notice - Specifying token digits using `length` is no longer supported. Use `digits` instead.");
      var digest = options.digest || exports.digest(options);
      var offset = digest[digest.length - 1] & 15;
      var code = (digest[offset] & 127) << 24 | (digest[offset + 1] & 255) << 16 | (digest[offset + 2] & 255) << 8 | digest[offset + 3] & 255;
      code = new Array(digits + 1).join("0") + code.toString(10);
      return code.substr(-digits);
    }, "hotpGenerate");
    exports.counter = exports.hotp;
    exports.hotp.verifyDelta = /* @__PURE__ */ __name(function hotpVerifyDelta(options) {
      var i;
      options = Object.create(options);
      var token = String(options.token);
      var digits = parseInt(options.digits, 10) || 6;
      var window = parseInt(options.window, 10) || 0;
      var counter = parseInt(options.counter, 10) || 0;
      if (token.length !== digits) {
        return;
      }
      token = parseInt(token, 10);
      if (isNaN(token)) {
        return;
      }
      for (i = counter; i <= counter + window; ++i) {
        options.counter = i;
        if (parseInt(exports.hotp(options), 10) === token) {
          return { delta: i - counter };
        }
      }
    }, "hotpVerifyDelta");
    exports.hotp.verify = /* @__PURE__ */ __name(function hotpVerify(options) {
      return exports.hotp.verifyDelta(options) != null;
    }, "hotpVerify");
    exports._counter = /* @__PURE__ */ __name(function _counter(options) {
      var step = options.step || 30;
      var time3 = options.time != null ? options.time * 1e3 : Date.now();
      var epoch = (options.epoch != null ? options.epoch * 1e3 : options.initial_time * 1e3) || 0;
      if (options.initial_time != null) console.warn("Speakeasy - Deprecation Notice - Specifying the epoch using `initial_time` is no longer supported. Use `epoch` instead.");
      return Math.floor((time3 - epoch) / step / 1e3);
    }, "_counter");
    exports.totp = /* @__PURE__ */ __name(function totpGenerate(options) {
      options = Object.create(options);
      if (options.counter == null) options.counter = exports._counter(options);
      return this.hotp(options);
    }, "totpGenerate");
    exports.time = exports.totp;
    exports.totp.verifyDelta = /* @__PURE__ */ __name(function totpVerifyDelta(options) {
      options = Object.create(options);
      var window = parseInt(options.window, 10) || 0;
      if (options.counter == null) options.counter = exports._counter(options);
      options.counter -= window;
      options.window += window;
      var delta = exports.hotp.verifyDelta(options);
      if (delta) {
        delta.delta -= window;
      }
      return delta;
    }, "totpVerifyDelta");
    exports.totp.verify = /* @__PURE__ */ __name(function totpVerify(options) {
      return exports.totp.verifyDelta(options) != null;
    }, "totpVerify");
    exports.generateSecret = /* @__PURE__ */ __name(function generateSecret(options) {
      if (!options) options = {};
      var length = options.length || 32;
      var name = encodeURIComponent(options.name || "SecretKey");
      var qr_codes = options.qr_codes || false;
      var google_auth_qr = options.google_auth_qr || false;
      var otpauth_url = options.otpauth_url != null ? options.otpauth_url : true;
      var symbols = true;
      if (options.symbols !== void 0 && options.symbols === false) {
        symbols = false;
      }
      var key = this.generateSecretASCII(length, symbols);
      var SecretKey = {};
      SecretKey.ascii = key;
      SecretKey.hex = Buffer(key, "ascii").toString("hex");
      SecretKey.base32 = base32.encode(Buffer(key)).toString().replace(/=/g, "");
      if (qr_codes) {
        console.warn("Speakeasy - Deprecation Notice - generateSecret() QR codes are deprecated and no longer supported. Please use your own QR code implementation.");
        SecretKey.qr_code_ascii = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + encodeURIComponent(SecretKey.ascii);
        SecretKey.qr_code_hex = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + encodeURIComponent(SecretKey.hex);
        SecretKey.qr_code_base32 = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + encodeURIComponent(SecretKey.base32);
      }
      if (otpauth_url) {
        SecretKey.otpauth_url = exports.otpauthURL({
          secret: SecretKey.ascii,
          label: name
        });
      }
      if (google_auth_qr) {
        console.warn("Speakeasy - Deprecation Notice - generateSecret() Google Auth QR code is deprecated and no longer supported. Please use your own QR code implementation.");
        SecretKey.google_auth_qr = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + encodeURIComponent(exports.otpauthURL({ secret: SecretKey.base32, label: name }));
      }
      return SecretKey;
    }, "generateSecret");
    exports.generate_key = util.deprecate(function(options) {
      return exports.generateSecret(options);
    }, "Speakeasy - Deprecation Notice - `generate_key()` is depreciated, please use `generateSecret()` instead.");
    exports.generateSecretASCII = /* @__PURE__ */ __name(function generateSecretASCII(length, symbols) {
      var bytes = crypto2.randomBytes(length || 32);
      var set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      if (symbols) {
        set += "!@#$%^&*()<>?/[]{},.:;";
      }
      var output = "";
      for (var i = 0, l = bytes.length; i < l; i++) {
        output += set[Math.floor(bytes[i] / 255 * (set.length - 1))];
      }
      return output;
    }, "generateSecretASCII");
    exports.generate_key_ascii = util.deprecate(function(length, symbols) {
      return exports.generateSecretASCII(length, symbols);
    }, "Speakeasy - Deprecation Notice - `generate_key_ascii()` is depreciated, please use `generateSecretASCII()` instead.");
    exports.otpauthURL = /* @__PURE__ */ __name(function otpauthURL(options) {
      var secret = options.secret;
      var label = options.label;
      var issuer = options.issuer;
      var type = (options.type || "totp").toLowerCase();
      var counter = options.counter;
      var algorithm = options.algorithm;
      var digits = options.digits;
      var period = options.period;
      var encoding = options.encoding || "ascii";
      switch (type) {
        case "totp":
        case "hotp":
          break;
        default:
          throw new Error("Speakeasy - otpauthURL - Invalid type `" + type + "`; must be `hotp` or `totp`");
      }
      if (!secret) throw new Error("Speakeasy - otpauthURL - Missing secret");
      if (!label) throw new Error("Speakeasy - otpauthURL - Missing label");
      if (type === "hotp" && (counter === null || typeof counter === "undefined")) {
        throw new Error("Speakeasy - otpauthURL - Missing counter value for HOTP");
      }
      if (encoding !== "base32") secret = new Buffer(secret, encoding);
      if (Buffer.isBuffer(secret)) secret = base32.encode(secret);
      var query2 = { secret };
      if (issuer) query2.issuer = issuer;
      if (algorithm != null) {
        switch (algorithm.toUpperCase()) {
          case "SHA1":
          case "SHA256":
          case "SHA512":
            break;
          default:
            console.warn("Speakeasy - otpauthURL - Warning - Algorithm generally should be SHA1, SHA256, or SHA512");
        }
        query2.algorithm = algorithm.toUpperCase();
      }
      if (digits != null) {
        if (isNaN(digits)) {
          throw new Error("Speakeasy - otpauthURL - Invalid digits `" + digits + "`");
        } else {
          switch (parseInt(digits, 10)) {
            case 6:
            case 8:
              break;
            default:
              console.warn("Speakeasy - otpauthURL - Warning - Digits generally should be either 6 or 8");
          }
        }
        query2.digits = digits;
      }
      if (period != null) {
        period = parseInt(period, 10);
        if (~~period !== period) {
          throw new Error("Speakeasy - otpauthURL - Invalid period `" + period + "`");
        }
        query2.period = period;
      }
      return url.format({
        protocol: "otpauth",
        slashes: true,
        hostname: type,
        pathname: label,
        query: query2
      });
    }, "otpauthURL");
  }
});

// ../../framework/backend/api/base/SchemaDefinition.js
var require_SchemaDefinition = __commonJS({
  "../../framework/backend/api/base/SchemaDefinition.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var FieldTypes13 = {
      STRING: "string",
      NUMBER: "number",
      BOOLEAN: "boolean",
      DATE: "date",
      EMAIL: "email",
      PHONE: "phone",
      COUNTRY: "country",
      URL: "url",
      OBJECT: "object",
      ARRAY: "array",
      JSON: "json",
      SELECT: "select"
    };
    function field13(definition) {
      return {
        name: definition.name || null,
        type: definition.type,
        default: definition.default,
        required: definition.required || false,
        readOnly: definition.readOnly || false,
        disable: definition.disable || false,
        label: definition.label || "",
        description: definition.description || "",
        placeholder: definition.placeholder || "",
        dbField: definition.dbField || null,
        enumValues: definition.enumValues || null,
        minLength: definition.minLength !== void 0 ? definition.minLength : null,
        maxLength: definition.maxLength !== void 0 ? definition.maxLength : null,
        min: definition.min !== void 0 ? definition.min : null,
        max: definition.max !== void 0 ? definition.max : null,
        pattern: definition.pattern || null,
        showOn: definition.showOn || null,
        formGrouping: definition.formGrouping || null,
        validate: definition.validate || null,
        validationFields: definition.validationFields || null,
        toApi: definition.toApi || null,
        fromApi: definition.fromApi || null,
        order: definition.order !== void 0 ? definition.order : null,
        minWidth: definition.minWidth || null,
        maxWidth: definition.maxWidth || null
      };
    }
    __name(field13, "field");
    var RelationshipTypes6 = {
      BELONGS_TO: "belongsTo",
      // Many-to-one (e.g., Meter belongs to Location)
      HAS_MANY: "hasMany",
      // One-to-many (e.g., Location has many Meters)
      HAS_ONE: "hasOne",
      // One-to-one
      MANY_TO_MANY: "manyToMany"
      // Many-to-many (through junction table)
    };
    function relationship6(config2) {
      return {
        type: config2.type,
        model: config2.model,
        foreignKey: config2.foreignKey,
        targetKey: config2.targetKey || "id",
        through: config2.through || null,
        autoLoad: config2.autoLoad || false,
        select: config2.select || null,
        as: config2.as || null
        // Alias for the relationship
      };
    }
    __name(relationship6, "relationship");
    function fieldRef(config2) {
      return {
        name: config2.name,
        order: config2.order !== void 0 ? config2.order : null
      };
    }
    __name(fieldRef, "fieldRef");
    function section13(config2) {
      return {
        name: config2.name,
        order: config2.order !== void 0 ? config2.order : null,
        fields: config2.fields || [],
        minWidth: config2.minWidth || null,
        maxWidth: config2.maxWidth || null,
        flex: config2.flex !== void 0 ? config2.flex : 1,
        flexGrow: config2.flexGrow !== void 0 ? config2.flexGrow : 1,
        flexShrink: config2.flexShrink !== void 0 ? config2.flexShrink : 1
      };
    }
    __name(section13, "section");
    function tab13(config2) {
      return {
        name: config2.name,
        order: config2.order !== void 0 ? config2.order : null,
        sections: config2.sections || [],
        sectionOrientation: config2.sectionOrientation || null,
        visibleFor: config2.visibleFor || null
      };
    }
    __name(tab13, "tab");
    function defineSchema13(definition) {
      let formFields = definition.formFields || {};
      if (definition.formTabs && Array.isArray(definition.formTabs)) {
        const extractedFields = {};
        definition.formTabs.forEach((tab14) => {
          if (tab14.sections && Array.isArray(tab14.sections)) {
            tab14.sections.forEach((section14) => {
              if (section14.fields && Array.isArray(section14.fields)) {
                section14.fields.forEach((fieldDef) => {
                  if (fieldDef.type) {
                    const fieldName = fieldDef.name;
                    if (fieldName) {
                      extractedFields[fieldName] = fieldDef;
                    }
                  }
                });
              }
            });
          }
        });
        formFields = { ...extractedFields, ...formFields };
      }
      let defaultSortBy = definition.defaultSortBy || null;
      if (!defaultSortBy && definition.formTabs && Array.isArray(definition.formTabs)) {
        for (const tab14 of definition.formTabs) {
          if (tab14.sections && Array.isArray(tab14.sections)) {
            for (const section14 of tab14.sections) {
              if (section14.fields && Array.isArray(section14.fields)) {
                for (const fieldDef of section14.fields) {
                  if (fieldDef.showOn && fieldDef.showOn.includes("list")) {
                    defaultSortBy = fieldDef.name;
                    break;
                  }
                }
                if (defaultSortBy) break;
              }
            }
            if (defaultSortBy) break;
          }
        }
      }
      const schema = {
        entityName: definition.entityName,
        tableName: definition.tableName,
        description: definition.description || "",
        formFields,
        formTabs: definition.formTabs || null,
        formMaxWidth: definition.formMaxWidth || null,
        defaultSortBy,
        entityFields: definition.entityFields || {},
        relationships: definition.relationships || {},
        validation: definition.validation || {},
        version: "1.2.0",
        // Updated to include formTabs support
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      function toJSON() {
        const serializable = JSON.parse(JSON.stringify(schema, (key, value) => {
          if (typeof value === "function") {
            return void 0;
          }
          return value;
        }));
        return serializable;
      }
      __name(toJSON, "toJSON");
      function getAllFieldNames() {
        return [
          ...Object.keys(schema.formFields),
          ...Object.keys(schema.entityFields)
        ];
      }
      __name(getAllFieldNames, "getAllFieldNames");
      function getFormFieldNames() {
        return Object.keys(schema.formFields);
      }
      __name(getFormFieldNames, "getFormFieldNames");
      function getEntityFieldNames() {
        return Object.keys(schema.entityFields);
      }
      __name(getEntityFieldNames, "getEntityFieldNames");
      function isFormField(fieldName) {
        return fieldName in schema.formFields;
      }
      __name(isFormField, "isFormField");
      function isEntityField(fieldName) {
        return fieldName in schema.entityFields;
      }
      __name(isEntityField, "isEntityField");
      function getField(fieldName) {
        return schema.formFields[fieldName] || schema.entityFields[fieldName] || null;
      }
      __name(getField, "getField");
      function validate(data) {
        const errors = {};
        Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
          const value = data[fieldName];
          if (fieldDef.required && (value === void 0 || value === null || value === "")) {
            errors[fieldName] = `${fieldDef.label || fieldName} is required`;
            return;
          }
          if (value === void 0 || value === null || value === "") {
            return;
          }
          if (fieldDef.type === "number" && typeof value !== "number") {
            errors[fieldName] = `${fieldDef.label || fieldName} must be a number`;
          }
          if (fieldDef.type === "boolean" && typeof value !== "boolean") {
            errors[fieldName] = `${fieldDef.label || fieldName} must be a boolean`;
          }
          if ((fieldDef.type === "string" || fieldDef.type === "email") && typeof value === "string") {
            if (fieldDef.minLength && value.length < fieldDef.minLength) {
              errors[fieldName] = `${fieldDef.label || fieldName} must be at least ${fieldDef.minLength} characters`;
            }
            if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
              errors[fieldName] = `${fieldDef.label || fieldName} must be at most ${fieldDef.maxLength} characters`;
            }
            if (fieldDef.pattern && !new RegExp(fieldDef.pattern).test(value)) {
              errors[fieldName] = `${fieldDef.label || fieldName} format is invalid`;
            }
          }
          if (fieldDef.type === "number" && typeof value === "number") {
            if (fieldDef.min !== null && value < fieldDef.min) {
              errors[fieldName] = `${fieldDef.label || fieldName} must be at least ${fieldDef.min}`;
            }
            if (fieldDef.max !== null && value > fieldDef.max) {
              errors[fieldName] = `${fieldDef.label || fieldName} must be at most ${fieldDef.max}`;
            }
          }
          if (fieldDef.enumValues && !fieldDef.enumValues.includes(value)) {
            errors[fieldName] = `${fieldDef.label || fieldName} must be one of: ${fieldDef.enumValues.join(", ")}`;
          }
          if (fieldDef.validate && typeof fieldDef.validate === "function") {
            const customError = fieldDef.validate(value, data);
            if (customError) {
              errors[fieldName] = customError;
            }
          }
        });
        return {
          isValid: Object.keys(errors).length === 0,
          errors
        };
      }
      __name(validate, "validate");
      function toDatabase(formData) {
        const dbData = {};
        Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
          const value = formData[fieldName];
          const dbField = fieldDef.dbField || fieldName;
          if (value !== void 0) {
            dbData[dbField] = fieldDef.toApi ? fieldDef.toApi(value) : value;
          }
        });
        return dbData;
      }
      __name(toDatabase, "toDatabase");
      function fromDatabase(dbData) {
        const formData = {};
        Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
          const dbField = fieldDef.dbField || fieldName;
          const value = dbData[dbField];
          if (value !== void 0) {
            formData[fieldName] = fieldDef.fromApi ? fieldDef.fromApi(value) : value;
          } else {
            formData[fieldName] = fieldDef.default;
          }
        });
        return formData;
      }
      __name(fromDatabase, "fromDatabase");
      function initializeFromData(instance, data) {
        console.log("\n" + "\u2588".repeat(120));
        console.log("\u2588 [SCHEMA] initializeFromData - START");
        console.log("\u2588".repeat(120));
        console.log("Instance class:", instance.constructor.name);
        console.log("Data keys:", Object.keys(data));
        console.log("Data:", JSON.stringify(data, null, 2));
        console.log("\nForm fields to initialize:");
        Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
          console.log(`  - ${fieldName} (dbField: ${fieldDef.dbField})`);
        });
        console.log("\nEntity fields to initialize:");
        Object.entries(schema.entityFields).forEach(([fieldName, fieldDef]) => {
          console.log(`  - ${fieldName} (dbField: ${fieldDef.dbField})`);
        });
        console.log("\n--- Initializing FORM FIELDS ---");
        Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
          if (fieldDef.dbField === null) {
            console.log(`
Form field: ${fieldName} (dbField: null) - SKIPPED (custom field)`);
            return;
          }
          const dbField = fieldDef.dbField || fieldName;
          console.log(`
Form field: ${fieldName} (dbField: ${dbField})`);
          console.log(`  data[dbField] = data["${dbField}"] =`, data[dbField]);
          console.log(`  data[fieldName] = data["${fieldName}"] =`, data[fieldName]);
          console.log(`  fieldDef.default =`, fieldDef.default);
          if (data[dbField] !== void 0) {
            instance[fieldName] = data[dbField];
            console.log(`  \u2713 Set instance.${fieldName} = ${data[dbField]} (from dbField)`);
          } else if (data[fieldName] !== void 0) {
            instance[fieldName] = data[fieldName];
            console.log(`  \u2713 Set instance.${fieldName} = ${data[fieldName]} (from fieldName)`);
          } else if (fieldDef.default !== void 0) {
            instance[fieldName] = fieldDef.default;
            console.log(`  \u2713 Set instance.${fieldName} = ${fieldDef.default} (from default)`);
          } else {
            console.log(`  - No value set for ${fieldName}`);
          }
        });
        console.log("\n--- Initializing ENTITY FIELDS ---");
        Object.entries(schema.entityFields).forEach(([fieldName, fieldDef]) => {
          if (fieldDef.dbField === null) {
            console.log(`
Entity field: ${fieldName} (dbField: null) - SKIPPED (custom field)`);
            return;
          }
          const dbField = fieldDef.dbField || fieldName;
          console.log(`
Entity field: ${fieldName} (dbField: ${dbField})`);
          console.log(`  data[dbField] = data["${dbField}"] =`, data[dbField]);
          console.log(`  data[fieldName] = data["${fieldName}"] =`, data[fieldName]);
          console.log(`  fieldDef.default =`, fieldDef.default);
          if (data[dbField] !== void 0) {
            instance[fieldName] = data[dbField];
            console.log(`  \u2713 Set instance.${fieldName} = ${data[dbField]} (from dbField)`);
          } else if (data[fieldName] !== void 0) {
            instance[fieldName] = data[fieldName];
            console.log(`  \u2713 Set instance.${fieldName} = ${data[fieldName]} (from fieldName)`);
          } else if (fieldDef.default !== void 0) {
            instance[fieldName] = fieldDef.default;
            console.log(`  \u2713 Set instance.${fieldName} = ${fieldDef.default} (from default)`);
          } else {
            console.log(`  - No value set for ${fieldName}`);
          }
        });
        return instance;
      }
      __name(initializeFromData, "initializeFromData");
      function getConstructorCode(className, dataParamName = "data") {
        const allFields = [
          ...Object.keys(schema.formFields),
          ...Object.keys(schema.entityFields)
        ];
        const assignments = allFields.map((fieldName) => {
          return `    this.${fieldName} = ${dataParamName}.${fieldName};`;
        }).join("\n");
        return `  constructor(${dataParamName} = {}) {
    super(${dataParamName});
    
${assignments}
  }`;
      }
      __name(getConstructorCode, "getConstructorCode");
      return {
        // Expose schema data directly for easy access
        schema,
        formFields: schema.formFields,
        entityFields: schema.entityFields,
        relationships: schema.relationships,
        // Expose utility methods
        toJSON,
        getAllFieldNames,
        getFormFieldNames,
        getEntityFieldNames,
        isFormField,
        isEntityField,
        getField,
        validate,
        toDatabase,
        fromDatabase,
        initializeFromData,
        getConstructorCode
      };
    }
    __name(defineSchema13, "defineSchema");
    module.exports = {
      FieldTypes: FieldTypes13,
      RelationshipTypes: RelationshipTypes6,
      field: field13,
      relationship: relationship6,
      tab: tab13,
      section: section13,
      fieldRef,
      defineSchema: defineSchema13
    };
  }
});

// .wrangler/tmp/bundle-mgbiV3/middleware-loader.entry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// .wrangler/tmp/bundle-mgbiV3/middleware-insertion-facade.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/index.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/hono.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/hono-base.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/compose.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/context.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/request.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/http-exception.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/request/constants.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app22) {
    const subApp = this.basePath(path);
    app22.routes.map((r) => {
      let handler;
      if (app22.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app22.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env3, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env3, "GET")))();
    }
    const path = this.getPath(request, { env: env3 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env3,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env22, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env22, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env22,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/matcher.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/smart-router/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/smart-router/router.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/trie-router/router.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/router/trie-router/node.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var cors = /* @__PURE__ */ __name((options) => {
  const defaults2 = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults2,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// worker/db.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/pg/esm/index.mjs
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;

// worker/db.ts
async function query(env3, text, params = []) {
  const client = new Client({ connectionString: env3.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}
__name(query, "query");
async function transaction(env3, callback) {
  const client = new Client({ connectionString: env3.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error3) {
    await client.query("ROLLBACK");
    throw error3;
  } finally {
    await client.end();
  }
}
__name(transaction, "transaction");

// worker/routes/auth.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/middleware/jwt/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/middleware/jwt/jwt.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/helper/cookie/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/utils/cookie.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/utils/jwt/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/utils/jwt/jwt.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/utils/encode.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/hono/dist/utils/jwt/jwa.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// node_modules/hono/dist/utils/jwt/jws.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/hono/dist/helper/adapter/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global2 = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global2?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global2?.fastly !== void 0) {
    return "fastly";
  }
  if (global2?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform2) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform2);
}, "checkUserAgentEquals");

// node_modules/hono/dist/utils/jwt/types.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var JwtAlgorithmNotImplemented = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotImplemented");
  }
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
};
var JwtAlgorithmRequired = class extends Error {
  static {
    __name(this, "JwtAlgorithmRequired");
  }
  constructor() {
    super('JWT verification requires "alg" option to be specified');
    this.name = "JwtAlgorithmRequired";
  }
};
var JwtAlgorithmMismatch = class extends Error {
  static {
    __name(this, "JwtAlgorithmMismatch");
  }
  constructor(expected, actual) {
    super(`JWT algorithm mismatch: expected "${expected}", got "${actual}"`);
    this.name = "JwtAlgorithmMismatch";
  }
};
var JwtTokenInvalid = class extends Error {
  static {
    __name(this, "JwtTokenInvalid");
  }
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
};
var JwtTokenNotBefore = class extends Error {
  static {
    __name(this, "JwtTokenNotBefore");
  }
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
};
var JwtTokenExpired = class extends Error {
  static {
    __name(this, "JwtTokenExpired");
  }
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
};
var JwtTokenIssuedAt = class extends Error {
  static {
    __name(this, "JwtTokenIssuedAt");
  }
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
};
var JwtTokenIssuer = class extends Error {
  static {
    __name(this, "JwtTokenIssuer");
  }
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
};
var JwtHeaderInvalid = class extends Error {
  static {
    __name(this, "JwtHeaderInvalid");
  }
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
};
var JwtHeaderRequiresKid = class extends Error {
  static {
    __name(this, "JwtHeaderRequiresKid");
  }
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
};
var JwtSymmetricAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtSymmetricAlgorithmNotAllowed");
  }
  constructor(alg) {
    super(`symmetric algorithm "${alg}" is not allowed for JWK verification`);
    this.name = "JwtSymmetricAlgorithmNotAllowed";
  }
};
var JwtAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotAllowed");
  }
  constructor(alg, allowedAlgorithms) {
    super(`algorithm "${alg}" is not in the allowed list: [${allowedAlgorithms.join(", ")}]`);
    this.name = "JwtAlgorithmNotAllowed";
  }
};
var JwtTokenSignatureMismatched = class extends Error {
  static {
    __name(this, "JwtTokenSignatureMismatched");
  }
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
};
var JwtPayloadRequiresAud = class extends Error {
  static {
    __name(this, "JwtPayloadRequiresAud");
  }
  constructor(payload) {
    super(`required "aud" in jwt payload: ${JSON.stringify(payload)}`);
    this.name = "JwtPayloadRequiresAud";
  }
};
var JwtTokenAudience = class extends Error {
  static {
    __name(this, "JwtTokenAudience");
  }
  constructor(expected, aud) {
    super(
      `expected audience "${Array.isArray(expected) ? expected.join(", ") : expected}", got "${aud}"`
    );
    this.name = "JwtTokenAudience";
  }
};
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// node_modules/hono/dist/utils/jwt/utf8.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
        // 256 >> 3
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
        // 384 >> 3
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
        // 512 >> 3,
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  if (!algOrOptions) {
    throw new JwtAlgorithmRequired();
  }
  const {
    alg,
    iss,
    nbf = true,
    exp = true,
    iat = true,
    aud
  } = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions;
  if (!alg) {
    throw new JwtAlgorithmRequired();
  }
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (header.alg !== alg) {
    throw new JwtAlgorithmMismatch(alg, header.alg);
  }
  const now = Date.now() / 1e3 | 0;
  if (nbf && payload.nbf && payload.nbf > now) {
    throw new JwtTokenNotBefore(token);
  }
  if (exp && payload.exp && payload.exp <= now) {
    throw new JwtTokenExpired(token);
  }
  if (iat && payload.iat && now < payload.iat) {
    throw new JwtTokenIssuedAt(now, payload.iat);
  }
  if (iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(iss, null);
    }
    if (typeof iss === "string" && payload.iss !== iss) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
    if (iss instanceof RegExp && !iss.test(payload.iss)) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
  }
  if (aud) {
    if (!payload.aud) {
      throw new JwtPayloadRequiresAud(payload);
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matched = audiences.some(
      (payloadAud) => aud instanceof RegExp ? aud.test(payloadAud) : typeof aud === "string" ? payloadAud === aud : Array.isArray(aud) && aud.includes(payloadAud)
    );
    if (!matched) {
      throw new JwtTokenAudience(aud, payload.aud);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var symmetricAlgorithms = [
  AlgorithmTypes.HS256,
  AlgorithmTypes.HS384,
  AlgorithmTypes.HS512
];
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (symmetricAlgorithms.includes(header.alg)) {
    throw new JwtSymmetricAlgorithmNotAllowed(header.alg);
  }
  if (!options.allowedAlgorithms.includes(header.alg)) {
    throw new JwtAlgorithmNotAllowed(header.alg, options.allowedAlgorithms);
  }
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    if (options.keys) {
      options.keys.push(...data.keys);
    } else {
      options.keys = data.keys;
    }
  } else if (!options.keys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = options.keys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  if (matchingKey.alg && matchingKey.alg !== header.alg) {
    throw new JwtAlgorithmMismatch(matchingKey.alg, header.alg);
  }
  return await verify(token, matchingKey, {
    alg: header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  try {
    const [h, p] = token.split(".");
    const header = decodeJwtPart(h);
    const payload = decodeJwtPart(p);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  try {
    const [h] = token.split(".");
    return decodeJwtPart(h);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyWithJwks };

// node_modules/hono/dist/middleware/jwt/jwt.js
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// worker/routes/auth.ts
var import_bcryptjs = __toESM(require_bcrypt());
var import_speakeasy = __toESM(require_speakeasy());

// worker/middleware.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function authenticateToken(c, next) {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return c.json({ success: false, message: "Access token required" }, 401);
  }
  let decoded;
  try {
    decoded = await verify2(token, c.env.JWT_SECRET, "HS256");
  } catch (err) {
    if (err.message?.includes("expired") || err.name === "JwtTokenExpired") {
      return c.json({ success: false, message: "Token expired" }, 401);
    }
    return c.json({ success: false, message: "Invalid token" }, 401);
  }
  if (!decoded.userId) {
    return c.json({ success: false, message: "Invalid token - missing user ID" }, 401);
  }
  let user;
  try {
    const result = await query(
      c.env,
      `SELECT users_id, name, email, phone, role, active, tenant_id, permissions
       FROM users WHERE users_id = $1`,
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Invalid token - user not found" }, 401);
    }
    user = result.rows[0];
  } catch (e) {
    console.error("[AUTH] User lookup error:", e);
    return c.json({ success: false, message: "Failed to verify user" }, 500);
  }
  if (!user.active) {
    return c.json({ success: false, message: "Account is inactive" }, 401);
  }
  if (!user.tenant_id) {
    return c.json({ success: false, message: "Tenant context required" }, 401);
  }
  c.set("user", user);
  c.set("tenantId", user.tenant_id);
  await next();
}
__name(authenticateToken, "authenticateToken");
function requirePermission(permission2) {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, message: "Authentication required" }, 401);
    }
    if (user.role === "admin") {
      return next();
    }
    const [module, action] = permission2.split(":");
    const perms = user.permissions;
    if (Array.isArray(perms)) {
      if (perms.includes(permission2)) {
        return next();
      }
    } else if (perms && typeof perms === "object" && perms[module] && perms[module][action]) {
      return next();
    }
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  };
}
__name(requirePermission, "requirePermission");
async function authenticateSyncServer(c, next) {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey) {
    return c.json({ success: false, message: "API key required" }, 401);
  }
  const result = await query(
    c.env,
    "SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true",
    [apiKey]
  );
  if (result.rows.length === 0) {
    return c.json({ success: false, message: "Invalid API key" }, 401);
  }
  c.set("tenantId", result.rows[0].tenant_id);
  await next();
}
__name(authenticateSyncServer, "authenticateSyncServer");

// worker/routes/auth.ts
var auth = new Hono2();
var ADMIN_PERMISSIONS = {
  user: { create: true, read: true, update: true, delete: true },
  meter: { create: true, read: true, update: true, delete: true },
  device: { create: true, read: true, update: true, delete: true },
  location: { create: true, read: true, update: true, delete: true },
  contact: { create: true, read: true, update: true, delete: true },
  template: { create: true, read: true, update: true, delete: true },
  settings: { read: true, update: true },
  building: { create: true, read: true, update: true, delete: true },
  equipment: { create: true, read: true, update: true, delete: true }
};
var ROLE_PERMISSIONS = {
  admin: ADMIN_PERMISSIONS,
  manager: {
    user: { read: true },
    meter: { create: true, read: true, update: true },
    device: { create: true, read: true, update: true },
    location: { create: true, read: true, update: true },
    contact: { create: true, read: true, update: true },
    template: { read: true },
    settings: { read: true },
    building: { create: true, read: true, update: true },
    equipment: { create: true, read: true, update: true }
  },
  viewer: {
    meter: { read: true },
    device: { read: true },
    location: { read: true },
    contact: { read: true },
    template: { read: true },
    settings: { read: true },
    building: { read: true },
    equipment: { read: true }
  }
};
function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role.toLowerCase()] || ROLE_PERMISSIONS.viewer;
}
__name(getPermissionsByRole, "getPermissionsByRole");
function parseExpiresIn(expiresIn) {
  const match2 = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match2) return 3600;
  const value = parseInt(match2[1], 10);
  const unit = match2[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 3600;
  }
}
__name(parseExpiresIn, "parseExpiresIn");
async function generateToken(userId, tenant_id, jwtSecret, expiresIn) {
  const seconds = parseExpiresIn(expiresIn || "1h");
  return sign2({ userId, tenant_id, exp: Math.floor(Date.now() / 1e3) + seconds }, jwtSecret);
}
__name(generateToken, "generateToken");
async function generateRefreshToken(userId, tenant_id, jwtSecret) {
  return sign2({ userId, tenant_id, isRefresh: true, exp: Math.floor(Date.now() / 1e3) + 7 * 86400 }, jwtSecret);
}
__name(generateRefreshToken, "generateRefreshToken");
async function generate2FASessionToken(userId, tenant_id, jwtSecret) {
  return sign2({ userId, tenant_id, is2FASession: true, exp: Math.floor(Date.now() / 1e3) + 600 }, jwtSecret);
}
__name(generate2FASessionToken, "generate2FASessionToken");
async function logAuthEvent(env3, params) {
  try {
    await query(
      env3,
      `INSERT INTO auth_logs (user_id, event_type, status, ip_address, user_agent, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        params.userId || null,
        params.eventType,
        params.status,
        params.ipAddress || null,
        params.userAgent || null,
        params.details ? JSON.stringify(params.details) : null
      ]
    );
  } catch (error3) {
    console.error("[AUTH] Failed to log auth event:", error3);
  }
}
__name(logAuthEvent, "logAuthEvent");
async function checkLoginLockout(env3, userId) {
  try {
    const result = await query(env3, "SELECT locked_until, failed_login_attempts FROM users WHERE users_id = $1", [userId]);
    if (result.rows.length === 0) {
      return { isLocked: false, lockedUntil: null };
    }
    const user = result.rows[0];
    const lockedUntil = user.locked_until;
    if (lockedUntil && /* @__PURE__ */ new Date() < new Date(lockedUntil)) {
      return { isLocked: true, lockedUntil };
    }
    if (lockedUntil && /* @__PURE__ */ new Date() >= new Date(lockedUntil)) {
      await query(env3, "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE users_id = $1", [userId]);
    }
    return { isLocked: false, lockedUntil: null };
  } catch (error3) {
    console.error("Error checking login lockout:", error3);
    return { isLocked: false, lockedUntil: null };
  }
}
__name(checkLoginLockout, "checkLoginLockout");
async function incrementFailedLoginAttempts(env3, userId) {
  try {
    const result = await query(env3, "SELECT failed_login_attempts FROM users WHERE users_id = $1", [userId]);
    if (result.rows.length === 0) {
      return { attempts: 0, isLocked: false, lockedUntil: null };
    }
    const newAttempts = (result.rows[0].failed_login_attempts || 0) + 1;
    let lockedUntil = null;
    if (newAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
    }
    await query(env3, "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE users_id = $3", [
      newAttempts,
      lockedUntil,
      userId
    ]);
    return { attempts: newAttempts, isLocked: !!lockedUntil, lockedUntil };
  } catch (error3) {
    console.error("Error incrementing failed login attempts:", error3);
    return { attempts: 0, isLocked: false, lockedUntil: null };
  }
}
__name(incrementFailedLoginAttempts, "incrementFailedLoginAttempts");
async function resetFailedLoginAttempts(env3, userId) {
  try {
    await query(
      env3,
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE users_id = $1",
      [userId]
    );
  } catch (error3) {
    console.error("Error resetting failed login attempts:", error3);
  }
}
__name(resetFailedLoginAttempts, "resetFailedLoginAttempts");
async function get2FAMethods(env3, userId) {
  try {
    const result = await query(
      env3,
      `SELECT method_type FROM user_2fa_methods
       WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    );
    return result.rows ? result.rows.map((row) => row.method_type) : [];
  } catch (error3) {
    console.error("Error getting 2FA methods:", error3);
    return [];
  }
}
__name(get2FAMethods, "get2FAMethods");
async function checkPasswordResetRateLimit(env3, email, maxRequests = 3, windowMs = 60 * 60 * 1e3) {
  try {
    const oneHourAgo = new Date(Date.now() - windowMs);
    const result = await query(
      env3,
      `SELECT COUNT(*) as count FROM auth_logs
       WHERE event_type = 'password_reset_requested'
       AND (details->>'email') = $1
       AND created_at > $2`,
      [email, oneHourAgo]
    );
    const count3 = parseInt(result.rows[0].count, 10);
    return count3 < maxRequests;
  } catch (error3) {
    console.error("Error checking rate limit:", error3);
    return true;
  }
}
__name(checkPasswordResetRateLimit, "checkPasswordResetRateLimit");
function validatePassword(password, email) {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase())) {
    errors.push("Password must not contain your email username");
  }
  return { isValid: errors.length === 0, errors };
}
__name(validatePassword, "validatePassword");
function generateBackupCodes(count3 = 10) {
  const codes = [];
  for (let i = 0; i < count3; i++) {
    const code = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
    codes.push({ code });
  }
  return codes;
}
__name(generateBackupCodes, "generateBackupCodes");
async function storeBackupCodes(env3, userId, codes) {
  await query(env3, "DELETE FROM user_2fa_backup_codes WHERE user_id = $1", [userId]);
  for (const bc of codes) {
    const codeHash = await import_bcryptjs.default.hash(bc.code, await import_bcryptjs.default.genSalt(10));
    await query(
      env3,
      `INSERT INTO user_2fa_backup_codes (user_id, code_hash, is_used, created_at)
       VALUES ($1, $2, false, NOW())`,
      [userId, codeHash]
    );
  }
}
__name(storeBackupCodes, "storeBackupCodes");
async function verifyBackupCode(env3, userId, code) {
  const result = await query(
    env3,
    `SELECT user_2fa_backup_codes_id, code_hash FROM user_2fa_backup_codes
     WHERE user_id = $1 AND is_used = false`,
    [userId]
  );
  for (const row of result.rows) {
    const matches = await import_bcryptjs.default.compare(code, row.code_hash);
    if (matches) {
      await query(
        env3,
        "UPDATE user_2fa_backup_codes SET is_used = true WHERE user_2fa_backup_codes_id = $1",
        [row.user_2fa_backup_codes_id]
      );
      return true;
    }
  }
  return false;
}
__name(verifyBackupCode, "verifyBackupCode");
auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { company, user, payment } = body;
    if (!user?.email || !user.email.includes("@")) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Valid email is required" }] }, 400);
    }
    if (!user?.password || user.password.length < 8) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "Password must be at least 8 characters" }] },
        400
      );
    }
    if (!user?.name || !user.name.trim()) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Name is required" }] }, 400);
    }
    if (!company?.name || !company.name.trim()) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Company name is required" }] }, 400);
    }
    try {
      const result = await transaction(c.env, async (client) => {
        const apiKey = crypto.randomUUID();
        const tenantResult = await client.query(
          `INSERT INTO tenant (name, url, street, street2, city, state, zip, country, active, api_key)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING tenant_id`,
          [
            company.name,
            company.url || null,
            company.street || null,
            company.street2 || null,
            company.city || null,
            company.state || null,
            company.zip || null,
            company.country || "US",
            true,
            apiKey
          ]
        );
        const tenantId = tenantResult.rows[0].tenant_id;
        console.log("[SIGNUP] Created tenant:", tenantId);
        const passwordHash = await import_bcryptjs.default.hash(user.password, await import_bcryptjs.default.genSalt(10));
        const permissionsValue = JSON.stringify(ADMIN_PERMISSIONS);
        const createUserResult = await client.query(
          `INSERT INTO users (email, name, passwordhash, role, permissions, active, tenant_id, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING users_id, email, name, role, tenant_id`,
          [user.email, user.name, passwordHash, "admin", permissionsValue, true, tenantId, user.phone || null]
        );
        const createdUserRow = createUserResult.rows[0];
        console.log("[SIGNUP] Created user (direct SQL):", createdUserRow.users_id);
        const createdUser = {
          id: createdUserRow.users_id,
          email: createdUserRow.email,
          name: createdUserRow.name,
          role: createdUserRow.role,
          tenant_id: createdUserRow.tenant_id
        };
        return { tenantId, user: createdUser };
      });
      console.log("[SIGNUP] Payment method:", payment?.method);
      console.log("[SIGNUP] Plan type:", payment?.planType);
      return c.json({
        success: true,
        message: "Account created successfully",
        data: {
          tenantId: result.tenantId,
          userId: result.user.id
        }
      });
    } catch (err) {
      console.error("[SIGNUP] Transaction error:", err);
      if (err.message && err.message.includes("duplicate key")) {
        return c.json({ success: false, message: "An account with this email already exists" }, 409);
      }
      return c.json({ success: false, message: "Failed to create account" }, 500);
    }
  } catch (error3) {
    console.error("Signup error:", error3);
    return c.json({ success: false, message: "Signup failed" }, 500);
  }
});
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    console.log("[DEBUG] Login endpoint hit - email:", email);
    if (!email || !email.includes("@")) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Valid email is required" }] }, 400);
    }
    if (!password) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Password is required" }] }, 400);
    }
    const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
    const userAgent = c.req.header("user-agent") || "";
    const userResult = await query(env2(c), "SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (userResult.rows.length === 0) {
      await logAuthEvent(env2(c), {
        eventType: "login",
        status: "failed",
        ipAddress,
        userAgent,
        details: { reason: "user_not_found", email }
      });
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    const user = userResult.rows[0];
    const userId = user.users_id;
    const lockoutStatus = await checkLoginLockout(env2(c), userId);
    if (lockoutStatus.isLocked) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "login",
        status: "failed",
        ipAddress,
        userAgent,
        details: { reason: "account_locked", locked_until: lockoutStatus.lockedUntil }
      });
      return c.json({ success: false, message: "Account is locked. Please try again later." }, 401);
    }
    const isPasswordValid = await import_bcryptjs.default.compare(password, user.passwordhash);
    if (!isPasswordValid) {
      const failureStatus = await incrementFailedLoginAttempts(env2(c), userId);
      await logAuthEvent(env2(c), {
        userId,
        eventType: "login",
        status: "failed",
        ipAddress,
        userAgent,
        details: {
          reason: "invalid_password",
          attempts: failureStatus.attempts,
          is_locked: failureStatus.isLocked
        }
      });
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    if (!user.active) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "login",
        status: "failed",
        ipAddress,
        userAgent,
        details: { reason: "user_inactive" }
      });
      return c.json({ success: false, message: "Account is inactive" }, 401);
    }
    const twoFAMethods = await get2FAMethods(env2(c), userId);
    if (twoFAMethods && twoFAMethods.length > 0) {
      const tempSessionToken = await generate2FASessionToken(userId, user.tenant_id, c.env.JWT_SECRET);
      await logAuthEvent(env2(c), {
        userId,
        eventType: "login",
        status: "pending_2fa",
        ipAddress,
        userAgent,
        details: { reason: "2fa_required", methods: twoFAMethods }
      });
      return c.json({
        success: true,
        requires_2fa: true,
        session_token: tempSessionToken,
        available_methods: twoFAMethods,
        message: "2FA verification required"
      });
    }
    const token = await generateToken(userId, user.tenant_id, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
    const refreshToken = await generateRefreshToken(userId, user.tenant_id, c.env.JWT_SECRET);
    await resetFailedLoginAttempts(env2(c), userId);
    await logAuthEvent(env2(c), {
      userId,
      eventType: "login",
      status: "success",
      ipAddress,
      userAgent,
      details: { method: "password" }
    });
    const userRole = (user.role || "viewer").toLowerCase();
    let permissions = getPermissionsByRole(userRole);
    if (user.permissions && typeof user.permissions === "object" && !Array.isArray(user.permissions)) {
      permissions = user.permissions;
    }
    let tenantInfo = null;
    if (user.tenant_id) {
      try {
        const tenantResult = await query(
          env2(c),
          "SELECT tenant_id, name, url, street, street2, city, state, zip, country, active, created_at, updated_at, api_key FROM tenant WHERE tenant_id = $1",
          [user.tenant_id]
        );
        if (tenantResult.rows && tenantResult.rows.length > 0) {
          tenantInfo = tenantResult.rows[0];
        }
      } catch (tenantErr) {
        console.error("Error fetching tenant info:", tenantErr);
      }
    }
    const responseData = {
      success: true,
      data: {
        user: {
          users_id: user.users_id,
          tenant_id: user.tenant_id,
          client: user.tenant_id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
          status: user.active ? "active" : "inactive"
        },
        tenant: tenantInfo,
        token,
        refreshToken,
        expiresIn: 60 * 60
      }
    };
    console.log("[DEBUG] Sending response - user.active:", user.active, "-> status:", responseData.data.user.status);
    return c.json(responseData);
  } catch (error3) {
    console.error("[LOGIN] Unhandled error:", error3);
    console.error("[LOGIN] Error type:", error3?.constructor?.name);
    console.error("[LOGIN] Error message:", error3?.message);
    console.error("[LOGIN] Error stack:", error3?.stack);
    const isDev = c.env.NODE_ENV !== "production";
    return c.json({
      success: false,
      message: "Login failed",
      ...isDev && { detail: error3?.message }
    }, 500);
  }
});
auth.post("/verify-2fa", async (c) => {
  try {
    const body = await c.req.json();
    const { session_token, code, method } = body;
    if (!session_token) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Session token is required" }] }, 400);
    }
    if (!code) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "2FA code is required" }] }, 400);
    }
    if (!["totp", "email_otp", "sms_otp", "backup_code"].includes(method)) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Invalid 2FA method" }] }, 400);
    }
    const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
    const userAgent = c.req.header("user-agent") || "";
    let decoded;
    try {
      decoded = await verify2(session_token, c.env.JWT_SECRET, "HS256");
      if (!decoded.is2FASession) {
        return c.json({ success: false, message: "Invalid session token" }, 401);
      }
    } catch (tokenError) {
      return c.json({ success: false, message: "Session token expired or invalid" }, 401);
    }
    const userId = decoded.userId;
    const tenantId = decoded.tenant_id;
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    let isValid = false;
    const details = { method };
    if (method === "totp") {
      const result = await query(
        env2(c),
        `SELECT secret_key FROM user_2fa_methods
         WHERE user_id = $1 AND method_type = 'totp' AND is_enabled = true`,
        [userId]
      );
      if (result.rows && result.rows.length > 0) {
        const secret = result.rows[0].secret_key;
        isValid = import_speakeasy.default.totp.verify({
          secret,
          encoding: "base32",
          token: code,
          window: 1
        });
      }
    } else if (method === "backup_code") {
      isValid = await verifyBackupCode(env2(c), userId, code);
    }
    if (!isValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "login",
        status: "failed",
        ipAddress,
        userAgent,
        details: { reason: "invalid_2fa_code", ...details }
      });
      return c.json(
        {
          success: false,
          message: "Invalid 2FA code",
          details: {
            attempts_remaining: details.attempts_remaining,
            is_locked: details.is_locked
          }
        },
        401
      );
    }
    const token = await generateToken(userId, tenantId, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
    const refreshTokenValue = await generateRefreshToken(userId, tenantId, c.env.JWT_SECRET);
    await resetFailedLoginAttempts(env2(c), userId);
    await logAuthEvent(env2(c), {
      userId,
      eventType: "login",
      status: "success",
      ipAddress,
      userAgent,
      details: { method: "2fa", verification_method: method }
    });
    const userRole = (user.role || "viewer").toLowerCase();
    let permissions = getPermissionsByRole(userRole);
    if (user.permissions && typeof user.permissions === "object" && !Array.isArray(user.permissions)) {
      permissions = user.permissions;
    }
    let tenantInfo = null;
    if (tenantId) {
      try {
        const tenantResult = await query(
          env2(c),
          "SELECT tenant_id, name, url, street, street2, city, state, zip, country, active, created_at, updated_at FROM tenant WHERE tenant_id = $1",
          [tenantId]
        );
        if (tenantResult.rows && tenantResult.rows.length > 0) {
          tenantInfo = tenantResult.rows[0];
        }
      } catch (tenantErr) {
        console.error("Error fetching tenant info:", tenantErr);
      }
    }
    return c.json({
      success: true,
      data: {
        user: {
          users_id: user.users_id,
          tenant_id: user.tenant_id,
          client: user.tenant_id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
          status: user.active ? "active" : "inactive"
        },
        tenant: tenantInfo,
        token,
        refreshToken: refreshTokenValue,
        expiresIn: 60 * 60
      }
    });
  } catch (error3) {
    console.error("2FA verification error:", error3);
    return c.json({ success: false, message: "2FA verification failed" }, 500);
  }
});
auth.post("/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;
    if (!email || !email.includes("@")) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Valid email is required" }] }, 400);
    }
    const isUnderLimit = await checkPasswordResetRateLimit(env2(c), email, 3, 60 * 60 * 1e3);
    if (!isUnderLimit) {
      return c.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link"
      });
    }
    const userResult = await query(env2(c), "SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const resetToken = crypto.randomUUID();
      const tokenHash = await import_bcryptjs.default.hash(resetToken, await import_bcryptjs.default.genSalt(10));
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await query(
        env2(c),
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, created_at)
         VALUES ($1, $2, $3, false, NOW())`,
        [user.users_id, tokenHash, expiresAt]
      );
      const frontendUrl = c.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      console.log("[AUTH] Password reset link generated for:", email, "- Link:", resetLink);
      try {
        await logAuthEvent(env2(c), {
          userId: user.users_id,
          eventType: "password_reset_requested",
          status: "success",
          details: { email }
        });
      } catch (logError) {
        console.error("[AUTH] Failed to log password reset request:", logError);
      }
    }
    return c.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link"
    });
  } catch (error3) {
    console.error("Forgot password error:", error3);
    return c.json({ success: false, message: "Failed to process password reset request" }, 500);
  }
});
auth.post("/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { token, newPassword, confirmPassword } = body;
    if (!token) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Reset token is required" }] }, 400);
    }
    if (!newPassword) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "New password is required" }] },
        400
      );
    }
    if (!confirmPassword) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "Password confirmation is required" }] },
        400
      );
    }
    if (newPassword !== confirmPassword) {
      return c.json({ success: false, message: "Passwords do not match" }, 400);
    }
    const tokenResult = await query(
      env2(c),
      `SELECT user_id, token_hash, expires_at, is_used
       FROM password_reset_tokens
       WHERE expires_at > CURRENT_TIMESTAMP
       AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`
    );
    if (!tokenResult.rows || tokenResult.rows.length === 0) {
      return c.json({ success: false, message: "Reset link has expired or is invalid" }, 400);
    }
    const tokenRecord = tokenResult.rows[0];
    const userId = tokenRecord.user_id;
    const isTokenValid = await import_bcryptjs.default.compare(token, tokenRecord.token_hash);
    if (!isTokenValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_reset",
        status: "failed",
        details: { reason: "invalid_token" }
      });
      return c.json({ success: false, message: "Reset link has expired or is invalid" }, 400);
    }
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    const validation = validatePassword(newPassword, user.email);
    if (!validation.isValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_reset",
        status: "failed",
        details: { reason: "invalid_password", errors: validation.errors }
      });
      return c.json(
        { success: false, message: "Password does not meet security requirements", errors: validation.errors },
        400
      );
    }
    const newPasswordHash = await import_bcryptjs.default.hash(newPassword, await import_bcryptjs.default.genSalt(10));
    await query(env2(c), "UPDATE users SET passwordhash = $1, password_changed_at = NOW() WHERE users_id = $2", [
      newPasswordHash,
      userId
    ]);
    await query(
      env2(c),
      "UPDATE password_reset_tokens SET is_used = true WHERE user_id = $1 AND is_used = false",
      [userId]
    );
    await logAuthEvent(env2(c), {
      userId,
      eventType: "password_reset",
      status: "success"
    });
    return c.json({
      success: true,
      message: "Password reset successfully. Please log in with your new password."
    });
  } catch (error3) {
    console.error("Reset password error:", error3);
    return c.json({ success: false, message: "Failed to reset password" }, 500);
  }
});
auth.use("/change-password", authenticateToken);
auth.use("/2fa/*", authenticateToken);
auth.use("/verify", authenticateToken);
auth.post("/change-password", async (c) => {
  try {
    const body = await c.req.json();
    const { currentPassword, newPassword, confirmPassword } = body;
    if (!currentPassword) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "Current password is required" }] },
        400
      );
    }
    if (!newPassword) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "New password is required" }] },
        400
      );
    }
    if (!confirmPassword) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "Password confirmation is required" }] },
        400
      );
    }
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    if (newPassword !== confirmPassword) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_change",
        status: "failed",
        details: { reason: "passwords_do_not_match" }
      });
      return c.json({ success: false, message: "Passwords do not match" }, 400);
    }
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    const isCurrentPasswordValid = await import_bcryptjs.default.compare(currentPassword, user.passwordhash);
    if (!isCurrentPasswordValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_change",
        status: "failed",
        details: { reason: "invalid_current_password" }
      });
      return c.json({ success: false, message: "Current password is incorrect" }, 401);
    }
    const validation = validatePassword(newPassword, user.email);
    if (!validation.isValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_change",
        status: "failed",
        details: { reason: "invalid_password", errors: validation.errors }
      });
      return c.json(
        { success: false, message: "Password does not meet security requirements", errors: validation.errors },
        400
      );
    }
    const isSamePassword = await import_bcryptjs.default.compare(newPassword, user.passwordhash);
    if (isSamePassword) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "password_change",
        status: "failed",
        details: { reason: "same_as_current" }
      });
      return c.json({ success: false, message: "New password must be different from current password" }, 400);
    }
    const newPasswordHash = await import_bcryptjs.default.hash(newPassword, await import_bcryptjs.default.genSalt(10));
    await query(env2(c), "UPDATE users SET passwordhash = $1, password_changed_at = NOW() WHERE users_id = $2", [
      newPasswordHash,
      userId
    ]);
    await logAuthEvent(env2(c), {
      userId,
      eventType: "password_change",
      status: "success"
    });
    return c.json({
      success: true,
      message: "Password changed successfully. Please log in again."
    });
  } catch (error3) {
    console.error("Change password error:", error3);
    return c.json({ success: false, message: "Failed to change password" }, 500);
  }
});
auth.post("/2fa/setup", async (c) => {
  try {
    const body = await c.req.json();
    const { method, phoneNumber } = body;
    if (!["totp", "email_otp", "sms_otp"].includes(method)) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Invalid 2FA method" }] }, 400);
    }
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    let setupData = {};
    if (method === "totp") {
      const secret = import_speakeasy.default.generateSecret({
        name: `MeterItPro (${user.email})`,
        issuer: "MeterItPro",
        length: 20
      });
      setupData = {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        method: "totp"
      };
    } else if (method === "email_otp") {
      setupData = {
        message: "Email OTP will be sent to your email during login",
        method: "email_otp"
      };
    } else if (method === "sms_otp") {
      if (!phoneNumber) {
        return c.json({ success: false, message: "Phone number is required for SMS OTP" }, 400);
      }
      setupData = {
        phone_number: phoneNumber,
        message: "SMS OTP will be sent to your phone during login",
        method: "sms_otp"
      };
    }
    return c.json({
      success: true,
      data: setupData
    });
  } catch (error3) {
    console.error("2FA setup error:", error3);
    return c.json({ success: false, message: "Failed to setup 2FA" }, 500);
  }
});
auth.post("/2fa/verify-setup", async (c) => {
  try {
    const body = await c.req.json();
    const { method, code, secret, phoneNumber } = body;
    if (!["totp", "email_otp", "sms_otp"].includes(method)) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Invalid 2FA method" }] }, 400);
    }
    if (!code) {
      return c.json(
        { success: false, message: "Validation failed", errors: [{ msg: "Verification code is required" }] },
        400
      );
    }
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    let isValid = false;
    if (method === "totp") {
      if (!secret) {
        return c.json({ success: false, message: "TOTP secret is required" }, 400);
      }
      isValid = import_speakeasy.default.totp.verify({
        secret,
        encoding: "base32",
        token: code,
        window: 1
      });
    }
    if (!isValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "2fa_enable",
        status: "failed",
        details: { method, reason: "invalid_code" }
      });
      return c.json({ success: false, message: "Invalid verification code" }, 400);
    }
    try {
      await query(
        env2(c),
        `INSERT INTO user_2fa_methods (user_id, method_type, secret_key, phone_number, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT (user_id, method_type) DO UPDATE SET
         secret_key = EXCLUDED.secret_key,
         phone_number = EXCLUDED.phone_number,
         is_enabled = true,
         updated_at = NOW()`,
        [userId, method, method === "totp" ? secret : null, method === "sms_otp" ? phoneNumber : null]
      );
    } catch (dbError) {
      console.error("Error storing 2FA method:", dbError);
      await logAuthEvent(env2(c), {
        userId,
        eventType: "2fa_enable",
        status: "failed",
        details: { method, reason: "database_error" }
      });
      return c.json({ success: false, message: "Failed to store 2FA method" }, 500);
    }
    let backupCodes = [];
    if (method === "totp") {
      backupCodes = generateBackupCodes(10);
      try {
        await storeBackupCodes(env2(c), userId, backupCodes);
      } catch (backupError) {
        console.error("Error storing backup codes:", backupError);
      }
    }
    await logAuthEvent(env2(c), {
      userId,
      eventType: "2fa_enable",
      status: "success",
      details: { method }
    });
    return c.json({
      success: true,
      message: "2FA method enabled successfully",
      data: {
        backup_codes: method === "totp" ? backupCodes.map((bc) => bc.code) : void 0
      }
    });
  } catch (error3) {
    console.error("2FA verify setup error:", error3);
    return c.json({ success: false, message: "Failed to verify 2FA setup" }, 500);
  }
});
auth.get("/2fa/methods", async (c) => {
  try {
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    const result = await query(
      env2(c),
      `SELECT method_type, is_enabled, created_at FROM user_2fa_methods
       WHERE user_id = $1 AND is_enabled = true
       ORDER BY created_at DESC`,
      [userId]
    );
    const methods = result.rows ? result.rows.map((row) => ({
      type: row.method_type,
      enabled: row.is_enabled,
      created_at: row.created_at
    })) : [];
    return c.json({
      success: true,
      data: { methods }
    });
  } catch (error3) {
    console.error("Get 2FA methods error:", error3);
    return c.json({ success: false, message: "Failed to get 2FA methods" }, 500);
  }
});
auth.post("/2fa/disable", async (c) => {
  try {
    const body = await c.req.json();
    const { method, password } = body;
    if (!["totp", "email_otp", "sms_otp"].includes(method)) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Invalid 2FA method" }] }, 400);
    }
    if (!password) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Password is required" }] }, 400);
    }
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    const isPasswordValid = await import_bcryptjs.default.compare(password, user.passwordhash);
    if (!isPasswordValid) {
      await logAuthEvent(env2(c), {
        userId,
        eventType: "2fa_disable",
        status: "failed",
        details: { method, reason: "invalid_password" }
      });
      return c.json({ success: false, message: "Password is incorrect" }, 401);
    }
    const result = await query(
      env2(c),
      `UPDATE user_2fa_methods SET is_enabled = false, updated_at = NOW()
       WHERE user_id = $1 AND method_type = $2
       RETURNING method_type`,
      [userId, method]
    );
    if (!result.rows || result.rows.length === 0) {
      return c.json({ success: false, message: "2FA method not found" }, 404);
    }
    if (method === "totp") {
      await query(env2(c), "DELETE FROM user_2fa_backup_codes WHERE user_id = $1", [userId]);
    }
    await logAuthEvent(env2(c), {
      userId,
      eventType: "2fa_disable",
      status: "success",
      details: { method }
    });
    return c.json({
      success: true,
      message: "2FA method disabled successfully"
    });
  } catch (error3) {
    console.error("Disable 2FA error:", error3);
    return c.json({ success: false, message: "Failed to disable 2FA" }, 500);
  }
});
auth.post("/2fa/regenerate-backup-codes", async (c) => {
  try {
    const body = await c.req.json();
    const { password } = body;
    if (!password) {
      return c.json({ success: false, message: "Validation failed", errors: [{ msg: "Password is required" }] }, 400);
    }
    const currentUser = c.get("user");
    const userId = currentUser.users_id;
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const user = userResult.rows[0];
    const isPasswordValid = await import_bcryptjs.default.compare(password, user.passwordhash);
    if (!isPasswordValid) {
      return c.json({ success: false, message: "Password is incorrect" }, 401);
    }
    const totpResult = await query(
      env2(c),
      `SELECT user_2fa_methods_id FROM user_2fa_methods
       WHERE user_id = $1 AND method_type = 'totp' AND is_enabled = true`,
      [userId]
    );
    if (!totpResult.rows || totpResult.rows.length === 0) {
      return c.json({ success: false, message: "TOTP 2FA is not enabled for this account" }, 400);
    }
    const backupCodes = generateBackupCodes(10);
    try {
      await storeBackupCodes(env2(c), userId, backupCodes);
    } catch (backupError) {
      console.error("Error storing backup codes:", backupError);
      return c.json({ success: false, message: "Failed to regenerate backup codes" }, 500);
    }
    return c.json({
      success: true,
      message: "Backup codes regenerated successfully",
      data: {
        backup_codes: backupCodes.map((bc) => bc.code)
      }
    });
  } catch (error3) {
    console.error("Regenerate backup codes error:", error3);
    return c.json({ success: false, message: "Failed to regenerate backup codes" }, 500);
  }
});
auth.get("/verify", async (c) => {
  try {
    const currentUser = c.get("user");
    const userRole = (currentUser.role || "viewer").toLowerCase();
    let permissions = getPermissionsByRole(userRole);
    if (currentUser.permissions && typeof currentUser.permissions === "object" && !Array.isArray(currentUser.permissions)) {
      permissions = currentUser.permissions;
    }
    const userResponse = {
      ...currentUser,
      users_id: currentUser.users_id,
      permissions,
      client: currentUser.tenant_id
    };
    return c.json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error3) {
    console.error("Token verification error:", error3);
    return c.json({ success: false, message: "Token verification failed" }, 500);
  }
});
auth.post("/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken: refreshTokenValue } = body;
    if (!refreshTokenValue) {
      return c.json({ success: false, message: "Refresh token is required" }, 400);
    }
    let decoded;
    try {
      console.log("[REFRESH] Verifying refresh token, length:", refreshTokenValue.length);
      decoded = await verify2(refreshTokenValue, c.env.JWT_SECRET, "HS256");
      console.log("[REFRESH] Token verified, decoded:", JSON.stringify(decoded));
      if (!decoded.isRefresh) {
        console.log("[REFRESH] Token missing isRefresh claim");
        return c.json({ success: false, message: "Invalid refresh token" }, 401);
      }
    } catch (err) {
      console.error("[REFRESH] Token verify error:", err?.message || err, "name:", err?.name);
      return c.json({ success: false, message: "Refresh token expired or invalid" }, 401);
    }
    const userId = decoded.userId;
    const tenantId = decoded.tenant_id;
    const userResult = await query(env2(c), "SELECT * FROM users WHERE users_id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "User not found" }, 401);
    }
    const user = userResult.rows[0];
    if (!user.active) {
      return c.json({ success: false, message: "Account is inactive" }, 401);
    }
    const newToken = await generateToken(userId, tenantId, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
    const newRefreshToken = await generateRefreshToken(userId, tenantId, c.env.JWT_SECRET);
    const userRole = (user.role || "viewer").toLowerCase();
    let permissions = getPermissionsByRole(userRole);
    if (user.permissions && typeof user.permissions === "object" && !Array.isArray(user.permissions)) {
      permissions = user.permissions;
    }
    return c.json({
      success: true,
      data: {
        user: {
          users_id: user.users_id,
          tenant_id: user.tenant_id,
          client: user.tenant_id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
          status: user.active ? "active" : "inactive"
        },
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 60 * 60
      }
    });
  } catch (error3) {
    console.error("Token refresh error:", error3);
    return c.json({ success: false, message: "Token refresh failed" }, 500);
  }
});
function env2(c) {
  return c.env;
}
__name(env2, "env");
var auth_default = auth;

// worker/routes/users.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_bcryptjs2 = __toESM(require_bcrypt());

// worker/crud.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
__name(camelToSnake, "camelToSnake");
async function findAll(env3, opts) {
  const {
    table: table3,
    primaryKey,
    tenantId,
    page = 1,
    limit = 25,
    search,
    searchFields = ["name"],
    where = {},
    sortBy,
    sortOrder,
    joins = "",
    selectFields = `${table3}.*`
  } = opts;
  let orderBy = opts.orderBy;
  if (!orderBy) {
    if (sortBy) {
      const col = camelToSnake(sortBy);
      const dir3 = (sortOrder || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
      orderBy = `${table3}.${col} ${dir3}`;
    } else {
      orderBy = `${table3}.${primaryKey} DESC`;
    }
  }
  const params = [];
  let paramIdx = 1;
  let whereClauses = [];
  if (tenantId !== void 0) {
    whereClauses.push(`${table3}.tenant_id = $${paramIdx}`);
    params.push(tenantId);
    paramIdx++;
  }
  if (search && searchFields.length > 0) {
    const searchClauses = searchFields.map((f) => {
      const clause = `LOWER(${table3}.${f}) LIKE LOWER($${paramIdx})`;
      return clause;
    });
    whereClauses.push(`(${searchClauses.join(" OR ")})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      whereClauses.push(`${table3}.${key} IS NULL`);
    } else {
      whereClauses.push(`${table3}.${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }
  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const countResult = await query(env3, `SELECT COUNT(*) as total FROM ${table3} ${joins} ${whereSQL}`, params);
  const total = parseInt(countResult.rows[0].total, 10);
  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataResult = await query(
    env3,
    `SELECT ${selectFields} FROM ${table3} ${joins} ${whereSQL} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    dataParams
  );
  return {
    rows: dataResult.rows,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}
__name(findAll, "findAll");
async function findById(env3, table3, primaryKey, id, tenantId) {
  let sql = `SELECT * FROM ${table3} WHERE ${primaryKey} = $1`;
  const params = [id];
  if (tenantId !== void 0) {
    sql += " AND tenant_id = $2";
    params.push(tenantId);
  }
  const result = await query(env3, sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}
__name(findById, "findById");
async function create(env3, table3, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== void 0);
  const values = keys.map((k) => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const sql = `INSERT INTO ${table3} (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
  const result = await query(env3, sql, values);
  return result.rows[0];
}
__name(create, "create");
async function update(env3, table3, primaryKey, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== void 0 && k !== primaryKey);
  if (keys.length === 0) return null;
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  const values = keys.map((k) => data[k]);
  values.push(id);
  const sql = `UPDATE ${table3} SET ${setClauses.join(", ")}, updated_at = NOW() WHERE ${primaryKey} = $${keys.length + 1} RETURNING *`;
  const result = await query(env3, sql, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}
__name(update, "update");
async function remove(env3, table3, primaryKey, id) {
  const sql = `DELETE FROM ${table3} WHERE ${primaryKey} = $1 RETURNING *`;
  const result = await query(env3, sql, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}
__name(remove, "remove");

// worker/routes/users.ts
var app = new Hono2();
app.use("*", authenticateToken);
var ROLE_PERMISSIONS2 = {
  admin: {
    user: { create: true, read: true, update: true, delete: true },
    meter: { create: true, read: true, update: true, delete: true },
    device: { create: true, read: true, update: true, delete: true },
    location: { create: true, read: true, update: true, delete: true },
    contact: { create: true, read: true, update: true, delete: true },
    template: { create: true, read: true, update: true, delete: true },
    settings: { read: true, update: true },
    building: { create: true, read: true, update: true, delete: true },
    equipment: { create: true, read: true, update: true, delete: true }
  },
  Manager: {
    user: { read: true, update: true },
    meter: { create: true, read: true, update: true, delete: true },
    device: { create: true, read: true, update: true, delete: true },
    location: { create: true, read: true, update: true, delete: true },
    contact: { create: true, read: true, update: true, delete: true },
    template: { create: true, read: true, update: true },
    settings: { read: true },
    building: { create: true, read: true, update: true, delete: true },
    equipment: { create: true, read: true, update: true, delete: true }
  },
  Technician: {
    meter: { read: true, update: true },
    device: { read: true, update: true },
    location: { read: true },
    contact: { read: true },
    template: { read: true },
    building: { read: true },
    equipment: { read: true, update: true }
  },
  Viewer: {
    meter: { read: true },
    device: { read: true },
    location: { read: true },
    contact: { read: true },
    template: { read: true },
    settings: { read: true },
    building: { read: true },
    equipment: { read: true }
  }
};
function getPermissionsByRole2(role) {
  return ROLE_PERMISSIONS2[role] || ROLE_PERMISSIONS2["Viewer"];
}
__name(getPermissionsByRole2, "getPermissionsByRole");
function validatePermissionsObject(perms) {
  if (!perms || typeof perms !== "object" || Array.isArray(perms)) return false;
  for (const module of Object.keys(perms)) {
    if (typeof perms[module] !== "object" || Array.isArray(perms[module])) return false;
    for (const action of Object.keys(perms[module])) {
      if (typeof perms[module][action] !== "boolean") return false;
    }
  }
  return true;
}
__name(validatePermissionsObject, "validatePermissionsObject");
function toNestedObject(flatArray) {
  const result = {};
  for (const perm of flatArray) {
    const [module, action] = perm.split(":");
    if (module && action) {
      if (!result[module]) result[module] = {};
      result[module][action] = true;
    }
  }
  return result;
}
__name(toNestedObject, "toNestedObject");
app.get("/", requirePermission("user:read"), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get("tenantId");
    const result = await findAll(c.env, {
      table: "users",
      primaryKey: "users_id",
      tenantId,
      page: parseInt(qs.page || "1", 10),
      limit: parseInt(qs.limit || "25", 10),
      search: qs.search || void 0,
      searchFields: ["name", "email"],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching users:", error3);
    return c.json({ success: false, message: "Failed to fetch users" }, 500);
  }
});
app.get("/:id", requirePermission("user:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const user = await findById(c.env, "users", "users_id", id, tenantId);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    return c.json({ success: true, data: user });
  } catch (error3) {
    console.error("Error fetching user:", error3);
    return c.json({ success: false, message: "Failed to fetch user" }, 500);
  }
});
app.post("/", requirePermission("user:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({
        success: false,
        message: "User must have a valid tenant_id to create users"
      }, 400);
    }
    const body = await c.req.json();
    const userData = {
      ...body,
      tenant_id: tenantId
    };
    if (userData.password) {
      const salt = await import_bcryptjs2.default.genSalt(10);
      userData.passwordhash = await import_bcryptjs2.default.hash(userData.password, salt);
      delete userData.password;
    }
    if (!userData.permissions || Array.isArray(userData.permissions) && userData.permissions.length === 0) {
      const role = userData.role || "Viewer";
      const permissionsObj = getPermissionsByRole2(role);
      if (!validatePermissionsObject(permissionsObj)) {
        return c.json({
          success: false,
          message: "Failed to generate valid permissions for role"
        }, 500);
      }
      userData.permissions = JSON.stringify(permissionsObj);
    } else if (typeof userData.permissions === "object" && !Array.isArray(userData.permissions)) {
      if (!validatePermissionsObject(userData.permissions)) {
        return c.json({
          success: false,
          message: "Invalid permissions object structure"
        }, 400);
      }
      userData.permissions = JSON.stringify(userData.permissions);
    }
    const user = await create(c.env, "users", userData);
    return c.json({ success: true, data: user }, 201);
  } catch (error3) {
    console.error("Error creating user:", error3);
    return c.json({
      success: false,
      message: "Failed to create user",
      error: error3.message,
      detail: error3.detail,
      code: error3.code
    }, 500);
  }
});
app.put("/:id", requirePermission("user:update"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const user = await findById(c.env, "users", "users_id", id, tenantId);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    if (user.tenant_id !== tenantId) {
      return c.json({
        success: false,
        message: "You do not have permission to update this user"
      }, 403);
    }
    const body = await c.req.json();
    const updateData = { ...body };
    delete updateData.password;
    delete updateData.tenant_id;
    delete updateData.tenantId;
    delete updateData.password_reset_token;
    delete updateData.password_reset_expires_at;
    delete updateData.passwordHash;
    delete updateData.passwordhash;
    delete updateData.createdAt;
    delete updateData.created_at;
    delete updateData.updatedAt;
    delete updateData.updated_at;
    delete updateData.lastLogin;
    delete updateData.last_login_at;
    delete updateData.passwordChangedAt;
    delete updateData.failedLoginAttempts;
    delete updateData.failed_login_attempts;
    delete updateData.lockedUntil;
    delete updateData.locked_until;
    if (updateData.permissions !== void 0 && updateData.permissions !== null) {
      if (typeof updateData.permissions === "object" && !Array.isArray(updateData.permissions)) {
        if (Object.keys(updateData.permissions).length === 0) {
          delete updateData.permissions;
        } else if (!validatePermissionsObject(updateData.permissions)) {
          return c.json({ success: false, message: "Invalid permissions object structure" }, 400);
        } else {
          updateData.permissions = JSON.stringify(updateData.permissions);
        }
      } else if (Array.isArray(updateData.permissions)) {
        if (updateData.permissions.length === 0) {
          delete updateData.permissions;
        } else {
          const nestedObj = toNestedObject(updateData.permissions);
          if (!validatePermissionsObject(nestedObj)) {
            return c.json({ success: false, message: "Invalid permissions array format" }, 400);
          }
          updateData.permissions = JSON.stringify(nestedObj);
        }
      } else if (typeof updateData.permissions === "string") {
        try {
          const parsed = JSON.parse(updateData.permissions);
          if (Array.isArray(parsed)) {
            const nestedObj = toNestedObject(parsed);
            if (!validatePermissionsObject(nestedObj)) {
              return c.json({ success: false, message: "Invalid permissions array format" }, 400);
            }
            updateData.permissions = JSON.stringify(nestedObj);
          } else if (!validatePermissionsObject(parsed)) {
            return c.json({ success: false, message: "Invalid permissions JSON format" }, 400);
          }
        } catch (e) {
          return c.json({ success: false, message: "Permissions must be valid JSON" }, 400);
        }
      }
    }
    const updated = await update(c.env, "users", "users_id", id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error3) {
    console.error("Error updating user:", error3);
    return c.json({ success: false, message: "Failed to update user" }, 500);
  }
});
app.put("/:id/password", requirePermission("user:update"), async (c) => {
  try {
    const userId = c.req.param("id");
    const { password, currentPassword } = await c.req.json();
    const currentUser = c.get("user");
    const user = await findById(c.env, "users", "users_id", userId);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    if (String(currentUser.users_id) === String(userId) && currentPassword) {
      const isCurrentValid = await import_bcryptjs2.default.compare(currentPassword, user.passwordhash);
      if (!isCurrentValid) {
        return c.json({ success: false, message: "Current password is incorrect" }, 400);
      }
    }
    const salt = await import_bcryptjs2.default.genSalt(10);
    const passwordHash = await import_bcryptjs2.default.hash(password, salt);
    await query(
      c.env,
      "UPDATE users SET passwordhash = $1, updated_at = NOW() WHERE users_id = $2",
      [passwordHash, userId]
    );
    return c.json({ success: true, message: "Password updated successfully" });
  } catch (error3) {
    console.error("Error changing password:", error3);
    return c.json({ success: false, message: "Failed to change password" }, 500);
  }
});
app.post("/:id/reset-password", requirePermission("user:update"), async (c) => {
  try {
    const userId = parseInt(c.req.param("id"), 10);
    const currentUser = c.get("user");
    const adminId = currentUser.users_id;
    if (!userId || isNaN(userId)) {
      return c.json({ success: false, message: "Valid user ID is required" }, 400);
    }
    const targetUser = await findById(c.env, "users", "users_id", userId);
    if (!targetUser) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const token = crypto.randomUUID();
    const tokenHash = await import_bcryptjs2.default.hash(token, await import_bcryptjs2.default.genSalt(10));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await query(
      c.env,
      "UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2, updated_at = NOW() WHERE users_id = $3",
      [tokenHash, expiresAt.toISOString(), userId]
    );
    try {
      await query(
        c.env,
        "INSERT INTO auth_logs (user_id, event_type, status, details, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
        [userId, "password_reset_admin", "success", JSON.stringify({ admin_id: adminId, email: targetUser.email })]
      );
    } catch (logError) {
      console.error("[AUTH] Failed to log admin password reset:", logError);
    }
    return c.json({
      success: true,
      message: "Password reset token has been generated for the user"
    });
  } catch (error3) {
    console.error("Admin reset password error:", error3);
    return c.json({
      success: false,
      message: "Failed to process admin password reset"
    }, 500);
  }
});
app.delete("/:id", requirePermission("user:delete"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const user = await findById(c.env, "users", "users_id", id, tenantId);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    await remove(c.env, "users", "users_id", id);
    return c.json({ success: true, message: "User deleted successfully" });
  } catch (error3) {
    console.error("Error deleting user:", error3);
    return c.json({ success: false, message: "Failed to delete user" }, 500);
  }
});
var users_default = app;

// worker/routes/meters.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app2 = new Hono2();
app2.use("*", authenticateToken);
app2.get("/elements", requirePermission("meter:read"), async (c) => {
  const { type, excludeIds, searchQuery } = c.req.query();
  const tenantId = c.get("tenantId");
  if (!tenantId) {
    return c.json({ success: false, message: "Tenant context required" }, 401);
  }
  try {
    let sql = "SELECT m.meter_id as id, m.name, m.serial_number as identifier FROM public.meter m WHERE m.tenant_id = $1";
    const params = [tenantId];
    let paramCount = 2;
    if (searchQuery) {
      sql += ` AND (LOWER(m.name) LIKE LOWER($${paramCount}) OR LOWER(m.serial_number) LIKE LOWER($${paramCount + 1}))`;
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
      paramCount += 2;
    }
    if (excludeIds) {
      const excludeIdArray = excludeIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
      if (excludeIdArray.length > 0) {
        const placeholders = excludeIdArray.map((_, i) => `$${paramCount + i}`).join(",");
        sql += ` AND m.meter_id NOT IN (${placeholders})`;
        params.push(...excludeIdArray);
        paramCount += excludeIdArray.length;
      }
    }
    sql += " ORDER BY m.name ASC";
    const result = await query(c.env, sql, params);
    const validatedData = result.rows.filter((row) => {
      if (!row.id || !row.name || !row.identifier) {
        console.warn("Skipping meter with missing required fields:", row);
        return false;
      }
      return true;
    });
    return c.json({ success: true, data: validatedData });
  } catch (error3) {
    console.error("Error fetching meter elements:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch meter elements",
      error: error3.message
    }, 500);
  }
});
app2.get("/:meterId/virtual-config", requirePermission("meter:read"), async (c) => {
  const meterId = c.req.param("meterId");
  const tenantId = c.get("tenantId");
  if (!tenantId) {
    return c.json({ success: false, message: "Tenant context required" }, 401);
  }
  if (!meterId) {
    return c.json({ success: false, message: "Meter ID is required" }, 400);
  }
  try {
    const meterCheckResult = await query(
      c.env,
      "SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterCheckResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    const result = await query(
      c.env,
      `SELECT
        m.meter_id as id,
        m.name,
        m.serial_number as identifier
      FROM public.meter_virtual mv
      JOIN public.meter m ON mv.selected_meter_id = m.meter_id
      WHERE mv.meter_id = $1
      ORDER BY m.name ASC`,
      [meterId]
    );
    const selectedMeters = result.rows.filter((row) => {
      if (!row.id || !row.name || !row.identifier) {
        console.warn("Skipping meter with missing required fields:", row);
        return false;
      }
      return true;
    });
    return c.json({ success: true, meterId, selectedMeters });
  } catch (error3) {
    console.error("Error fetching virtual meter config:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch virtual meter configuration",
      error: error3.message
    }, 500);
  }
});
app2.post("/:meterId/virtual-config", requirePermission("meter:update"), async (c) => {
  const meterId = c.req.param("meterId");
  const tenantId = c.get("tenantId");
  if (!tenantId) {
    return c.json({ success: false, message: "Tenant context required" }, 401);
  }
  if (!meterId) {
    return c.json({ success: false, message: "Meter ID is required" }, 400);
  }
  const body = await c.req.json();
  const { selectedMeterIds = [], selectedMeterElementIds = [] } = body;
  if (!Array.isArray(selectedMeterIds) || !Array.isArray(selectedMeterElementIds)) {
    return c.json({
      success: false,
      message: "selectedMeterIds and selectedMeterElementIds must be arrays"
    }, 400);
  }
  if (selectedMeterIds.length !== selectedMeterElementIds.length) {
    return c.json({
      success: false,
      message: "selectedMeterIds and selectedMeterElementIds must have the same length"
    }, 400);
  }
  try {
    const meterCheckResult = await query(
      c.env,
      "SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterCheckResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    await transaction(c.env, async (client) => {
      await client.query("DELETE FROM public.meter_virtual WHERE meter_id = $1", [meterId]);
      if (selectedMeterIds.length > 0) {
        const insertQuery = `
          INSERT INTO public.meter_virtual (meter_id, selected_meter_id, select_meter_element_id)
          VALUES ${selectedMeterIds.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(", ")}
        `;
        const insertParams = [meterId];
        for (let i = 0; i < selectedMeterIds.length; i++) {
          insertParams.push(selectedMeterIds[i]);
          insertParams.push(selectedMeterElementIds[i]);
        }
        await client.query(insertQuery, insertParams);
      }
    });
    return c.json({
      success: true,
      meterId,
      savedConfiguration: {
        selectedMeterIds,
        selectedMeterElementIds
      }
    });
  } catch (error3) {
    console.error("Error saving virtual meter config:", error3);
    return c.json({
      success: false,
      message: "Failed to save virtual meter configuration",
      error: error3.message
    }, 500);
  }
});
app2.get("/", requirePermission("meter:read"), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get("tenantId");
    const result = await findAll(c.env, {
      table: "meter",
      primaryKey: "meter_id",
      tenantId,
      page: parseInt(qs.page || "1", 10),
      limit: parseInt(qs.limit || "25", 10),
      search: qs.search || void 0,
      searchFields: ["name", "serial_number"],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching meters:", error3);
    return c.json({ success: false, message: "Failed to fetch meters" }, 500);
  }
});
app2.post("/", requirePermission("meter:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({
        success: false,
        message: "User must have a valid tenant_id to create meters"
      }, 400);
    }
    const body = await c.req.json();
    const meterData = {
      ...body,
      tenant_id: tenantId
    };
    delete meterData.elements;
    if (meterData.is_virtual !== void 0) {
      meterData.is_virtual = meterData.is_virtual === "virtual" || meterData.is_virtual === true;
    }
    const meter = await create(c.env, "meter", meterData);
    return c.json({ success: true, data: meter }, 201);
  } catch (error3) {
    console.error("Error creating meter:", error3);
    return c.json({
      success: false,
      message: "Failed to create meter",
      error: error3.message,
      detail: error3.detail,
      code: error3.code
    }, 500);
  }
});
app2.get("/:id", requirePermission("meter:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const meter = await findById(c.env, "meter", "meter_id", id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    return c.json({ success: true, data: meter });
  } catch (error3) {
    console.error("Error fetching meter:", error3);
    return c.json({ success: false, message: "Failed to fetch meter" }, 500);
  }
});
app2.put("/:id", requirePermission("meter:update"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const meter = await findById(c.env, "meter", "meter_id", id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    if (meter.tenant_id !== tenantId) {
      return c.json({
        success: false,
        message: "You do not have permission to update this meter"
      }, 403);
    }
    const body = await c.req.json();
    const updateData = { ...body };
    delete updateData.device;
    delete updateData.model;
    delete updateData.status;
    delete updateData.tenant_id;
    delete updateData.tenantId;
    delete updateData.elements;
    if (updateData.is_virtual !== void 0) {
      updateData.is_virtual = updateData.is_virtual === "virtual" || updateData.is_virtual === true;
    }
    const updated = await update(c.env, "meter", "meter_id", id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error3) {
    console.error("Error updating meter:", error3);
    return c.json({ success: false, message: "Failed to update meter" }, 500);
  }
});
app2.delete("/:id", requirePermission("meter:delete"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const meter = await findById(c.env, "meter", "meter_id", id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    await remove(c.env, "meter", "meter_id", id);
    return c.json({ success: true, message: "Meter deleted successfully" });
  } catch (error3) {
    console.error("Error deleting meter:", error3);
    return c.json({ success: false, message: "Failed to delete meter" }, 500);
  }
});
var meters_default = app2;

// worker/routes/locations.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app3 = new Hono2();
app3.use("*", authenticateToken);
app3.get("/", requirePermission("location:read"), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get("tenantId");
    console.log("[LOCATION] GET / - tenantId:", tenantId, "page:", qs.page, "limit:", qs.limit);
    if (!tenantId) {
      console.error("[LOCATION] No tenantId in context");
      return c.json({ success: false, message: "Tenant context required" }, 401);
    }
    const result = await findAll(c.env, {
      table: "location",
      primaryKey: "location_id",
      tenantId,
      page: parseInt(qs.page || "1", 10),
      limit: parseInt(qs.limit || "25", 10),
      search: qs.search || void 0,
      searchFields: ["name"],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    console.log("[LOCATION] Found", result.rows.length, "locations");
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("[LOCATION] Error fetching locations:", error3);
    console.error("[LOCATION] Error type:", error3?.constructor?.name);
    console.error("[LOCATION] Error message:", error3?.message);
    console.error("[LOCATION] Error stack:", error3?.stack);
    return c.json({
      success: false,
      message: "Failed to fetch locations",
      ...{ detail: error3?.message }
    }, 500);
  }
});
app3.get("/:id", requirePermission("location:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const location = await findById(c.env, "location", "location_id", id, tenantId);
    if (!location) {
      return c.json({ success: false, message: "Location not found" }, 404);
    }
    return c.json({ success: true, data: location });
  } catch (error3) {
    console.error("Error fetching location:", error3);
    return c.json({ success: false, message: "Failed to fetch location" }, 500);
  }
});
app3.post("/", requirePermission("location:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({
        success: false,
        message: "User must have a valid tenant_id to create locations"
      }, 400);
    }
    const body = await c.req.json();
    const locationData = {
      ...body,
      tenant_id: tenantId
    };
    const location = await create(c.env, "location", locationData);
    return c.json({ success: true, data: location }, 201);
  } catch (error3) {
    console.error("Error creating location:", error3);
    return c.json({
      success: false,
      message: "Failed to create location",
      error: error3.message,
      detail: error3.detail,
      code: error3.code
    }, 500);
  }
});
app3.put("/:id", requirePermission("location:update"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const location = await findById(c.env, "location", "location_id", id, tenantId);
    if (!location) {
      return c.json({ success: false, message: "Location not found" }, 404);
    }
    if (location.tenant_id !== tenantId) {
      return c.json({
        success: false,
        message: "You do not have permission to update this location"
      }, 403);
    }
    const body = await c.req.json();
    const updateData = { ...body };
    delete updateData.tenant_id;
    delete updateData.tenantId;
    const updated = await update(c.env, "location", "location_id", id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error3) {
    console.error("Error updating location:", error3);
    return c.json({ success: false, message: "Failed to update location" }, 500);
  }
});
app3.delete("/:id", requirePermission("location:delete"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const location = await findById(c.env, "location", "location_id", id, tenantId);
    if (!location) {
      return c.json({ success: false, message: "Location not found" }, 404);
    }
    const meterCountResult = await query(
      c.env,
      "SELECT COUNT(*) as count FROM meter WHERE location_id = $1 AND tenant_id = $2",
      [id, tenantId]
    );
    const meterCount = parseInt(meterCountResult.rows[0].count, 10);
    if (meterCount > 0) {
      return c.json({
        success: false,
        message: `Cannot delete location. It has ${meterCount} meters associated with it.`
      }, 400);
    }
    await remove(c.env, "location", "location_id", id);
    return c.json({ success: true, message: "Location deleted successfully" });
  } catch (error3) {
    console.error("Error deleting location:", error3);
    return c.json({ success: false, message: "Failed to delete location" }, 500);
  }
});
var locations_default = app3;

// worker/routes/contacts.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app4 = new Hono2();
app4.use("*", authenticateToken);
app4.get("/stats/overview", requirePermission("contact:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const overviewResult = await query(
      c.env,
      `SELECT
        COUNT(*) as "totalContacts",
        COUNT(*) FILTER (WHERE type = 'customer') as "customers",
        COUNT(*) FILTER (WHERE type = 'vendor') as "vendors",
        COUNT(*) FILTER (WHERE active = true) as "activeContacts",
        COUNT(*) FILTER (WHERE active = false) as "inactiveContacts"
      FROM contact
      WHERE tenant_id = $1`,
      [tenantId]
    );
    const industryResult = await query(
      c.env,
      `SELECT industry as "_id", COUNT(*) as count
      FROM contact
      WHERE tenant_id = $1 AND industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10`,
      [tenantId]
    );
    const overview = overviewResult.rows[0] || {
      totalContacts: 0,
      customers: 0,
      vendors: 0,
      activeContacts: 0,
      inactiveContacts: 0
    };
    return c.json({
      success: true,
      data: {
        overview: {
          totalContacts: parseInt(overview.totalContacts, 10),
          customers: parseInt(overview.customers, 10),
          vendors: parseInt(overview.vendors, 10),
          activeContacts: parseInt(overview.activeContacts, 10),
          inactiveContacts: parseInt(overview.inactiveContacts, 10)
        },
        topIndustries: industryResult.rows
      }
    });
  } catch (error3) {
    console.error("Error fetching contact stats:", error3);
    return c.json({ success: false, message: "Failed to fetch contact statistics" }, 500);
  }
});
app4.get("/", requirePermission("contact:read"), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get("tenantId");
    const result = await findAll(c.env, {
      table: "contact",
      primaryKey: "contact_id",
      tenantId,
      page: parseInt(qs.page || "1", 10),
      limit: parseInt(qs.limit || "25", 10),
      search: qs.search || void 0,
      searchFields: ["name", "email", "company"],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching contacts:", error3);
    return c.json({ success: false, message: "Failed to fetch contacts" }, 500);
  }
});
app4.get("/:id", requirePermission("contact:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const contact = await findById(c.env, "contact", "contact_id", id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: "Contact not found" }, 404);
    }
    return c.json({ success: true, data: contact });
  } catch (error3) {
    console.error("Error fetching contact:", error3);
    return c.json({ success: false, message: "Failed to fetch contact" }, 500);
  }
});
app4.post("/", requirePermission("contact:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({
        success: false,
        message: "User must have a valid tenant_id to create contacts"
      }, 400);
    }
    const body = await c.req.json();
    const contactData = {
      ...body,
      tenant_id: tenantId
    };
    const contact = await create(c.env, "contact", contactData);
    return c.json({ success: true, data: contact }, 201);
  } catch (error3) {
    console.error("Error creating contact:", error3);
    return c.json({
      success: false,
      message: "Failed to create contact",
      error: error3.message,
      detail: error3.detail,
      code: error3.code
    }, 500);
  }
});
app4.put("/:id", requirePermission("contact:update"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const contact = await findById(c.env, "contact", "contact_id", id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: "Contact not found" }, 404);
    }
    if (contact.tenant_id !== tenantId) {
      return c.json({
        success: false,
        message: "You do not have permission to update this contact"
      }, 403);
    }
    const body = await c.req.json();
    const updateData = { ...body };
    delete updateData.tenant_id;
    const updated = await update(c.env, "contact", "contact_id", id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error3) {
    console.error("Error updating contact:", error3);
    return c.json({ success: false, message: "Failed to update contact" }, 500);
  }
});
app4.delete("/:id", requirePermission("contact:delete"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const contact = await findById(c.env, "contact", "contact_id", id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: "Contact not found" }, 404);
    }
    await remove(c.env, "contact", "contact_id", id);
    return c.json({ success: true, message: "Contact deleted successfully" });
  } catch (error3) {
    console.error("Error deleting contact:", error3);
    return c.json({ success: false, message: "Failed to delete contact" }, 500);
  }
});
var contacts_default = app4;

// worker/routes/devices.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/routes/deviceSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var { defineSchema, field, tab, section, FieldTypes } = require_SchemaDefinition();
var deviceSchema = defineSchema({
  entityName: "Device",
  tableName: "device",
  description: "Device entity",
  formMaxWidth: "770px",
  defaultSort: "manufacturer",
  customListColumns: {},
  formTabs: [
    tab({
      name: "General",
      order: 1,
      sections: [
        section({
          name: "",
          order: 1,
          flex: 1,
          fields: [
            field({ name: "manufacturer", order: 1, type: FieldTypes.STRING, default: "", required: true, readOnly: true, label: "Manufacturer", dbField: "manufacturer", maxLength: 255, placeholder: "DENT Instruments", enumValues: ["DENT Instruments", "Honeywell", "Siemens", "TBWC, Inc."], showOn: ["list", "form"], filertable: ["true"] }),
            field({ name: "model_number", order: 2, type: FieldTypes.STRING, default: "", required: true, readOnly: true, label: "Model Number", dbField: "model_number", maxLength: 255, placeholder: "Model", showOn: ["list", "form"] }),
            field({ name: "description", order: 3, type: FieldTypes.STRING, default: "", required: false, readOnly: true, label: "Description", dbField: "description", maxLength: 50, placeholder: "Device description", showOn: ["list", "form"], filertable: ["main"] }),
            field({
              name: "type",
              order: 4,
              type: FieldTypes.STRING,
              default: "",
              required: true,
              readOnly: true,
              label: "Type",
              dbField: "type",
              maxLength: 255,
              enumValues: ["Electric", "Gas", "Water", "Steam", "Other"],
              placeholder: "Electric",
              showOn: ["list", "form"],
              filertable: ["true"]
            })
          ]
        })
      ]
    }),
    tab({
      name: "Registers",
      order: 2,
      sections: [
        section({
          name: "",
          order: 1,
          fields: [
            field({ name: "registers", order: 1, type: FieldTypes.OBJECT, default: null, required: false, readOnly: true, label: "Registers", showOn: ["form"] })
          ]
        })
      ]
    })
  ],
  entityFields: {
    device_id: field({ name: "device_id", order: 1, type: FieldTypes.NUMBER, default: null, readOnly: true, label: "Id", dbField: "device_id" })
  },
  relationships: {},
  validation: {}
});

// worker/routes/devices.ts
var app5 = new Hono2();
app5.use("*", authenticateToken);
app5.get("/", requirePermission("device:read"), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = 0;
    const sortBy = qs.sortBy || deviceSchema.defaultSort;
    const result = await findAll(c.env, {
      table: "device",
      primaryKey: "device_id",
      tenantId,
      page: parseInt(qs.page || "1", 10),
      limit: parseInt(qs.limit || "25", 10),
      search: qs.search || void 0,
      searchFields: ["description"],
      sortBy,
      sortOrder: qs.sortOrder
    });
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching devices:", error3);
    return c.json({ success: false, message: "Failed to fetch devices" }, 500);
  }
});
app5.get("/:id", requirePermission("device:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const device = await findById(c.env, "device", "device_id", id, tenantId);
    if (!device) {
      return c.json({ success: false, message: "Device not found" }, 404);
    }
    return c.json({ success: true, data: device });
  } catch (error3) {
    console.error("Error fetching device:", error3);
    return c.json({ success: false, message: "Failed to fetch device" }, 500);
  }
});
var devices_default = app5;

// worker/routes/meterReadings.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app6 = new Hono2();
app6.use("*", authenticateToken);
app6.get("/", requirePermission("meter:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Unauthorized: tenant context required" }, 401);
    }
    const qs = c.req.query();
    const page = parseInt(qs.page || "1") || 1;
    const pageSize = parseInt(qs.pageSize || "20") || 20;
    const skip = (page - 1) * pageSize;
    const meterId = qs.meterId;
    const meterElementId = qs.meterElementId;
    let sql = "SELECT * FROM meter_reading WHERE tenant_id = $1";
    const params = [tenantId];
    let paramCount = 2;
    if (meterId !== void 0 && meterId !== "") {
      sql += ` AND meter_id = $${paramCount}`;
      params.push(parseInt(meterId));
      paramCount++;
    }
    if (meterElementId !== void 0 && meterElementId !== "") {
      sql += ` AND meter_element_id = $${paramCount}`;
      params.push(parseInt(meterElementId));
      paramCount++;
    }
    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize);
    params.push(skip);
    const result = await query(c.env, sql, params);
    const items = result.rows || [];
    return c.json({
      success: true,
      data: {
        items,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
        hasMore: false
      }
    });
  } catch (error3) {
    console.error("[MeterReadings] Error:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch meter readings",
      error: error3.message
    }, 500);
  }
});
app6.get("/last", requirePermission("meter:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Unauthorized: tenant context required" }, 401);
    }
    const qs = c.req.query();
    const meterId = qs.meterId;
    const meterElementId = qs.meterElementId;
    if (!meterId || !meterElementId) {
      return c.json({ success: false, message: "meterId and meterElementId are required" }, 400);
    }
    const sql = `
      SELECT
        mr.*,
        m.name as meter_name,
        m.serial_number,
        m.ip as meter_ip,
        m.port as meter_port,
        m.protocol as meter_protocol,
        m.notes as meter_notes,
        me.name as element_name,
        me.element
      FROM meter_reading mr
      LEFT JOIN meter m ON mr.meter_id = m.meter_id
      LEFT JOIN meter_element me ON mr.meter_element_id = me.meter_element_id
      WHERE mr.tenant_id = $1
        AND mr.meter_id = $2
        AND mr.meter_element_id = $3
      ORDER BY mr.created_at DESC
      LIMIT 1
    `;
    const params = [tenantId, parseInt(meterId), parseInt(meterElementId)];
    const result = await query(c.env, sql, params);
    const reading = result.rows && result.rows.length > 0 ? result.rows[0] : null;
    if (!reading) {
      return c.json({ success: false, message: "No readings found for this meter element" }, 404);
    }
    return c.json({ success: true, data: reading });
  } catch (error3) {
    console.error("[MeterReadings] Error fetching last reading:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch last meter reading",
      error: error3.message
    }, 500);
  }
});
var meterReadings_default = app6;

// worker/routes/meterElements.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app7 = new Hono2();
app7.use("*", authenticateToken);
app7.get("/schema", (c) => {
  try {
    const schema = {
      formFields: {
        name: {
          type: "text",
          label: "Name",
          required: true,
          maxLength: 255
        },
        element: {
          type: "text",
          label: "Element",
          required: true,
          maxLength: 50
        }
      },
      entityFields: {
        meter_element_id: { type: "integer", primaryKey: true },
        meter_id: { type: "integer", foreignKey: "meter.meter_id" },
        tenant_id: { type: "integer" },
        name: { type: "text" },
        element: { type: "text" }
      }
    };
    return c.json({
      success: true,
      data: {
        formFields: schema.formFields,
        entityFields: schema.entityFields
      }
    });
  } catch (error3) {
    return c.json({
      success: false,
      message: "Failed to fetch meter elements schema",
      error: error3.message
    }, 500);
  }
});
app7.get("/", async (c) => {
  try {
    const meterId = c.req.param("meterId");
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant context required" }, 401);
    }
    const meterResult = await query(
      c.env,
      "SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    const sql = `SELECT
      me.meter_element_id,
      me.meter_id,
      me.name,
      me.element
     FROM meter_element me
     WHERE me.meter_id = $1
     ORDER BY me.element ASC`;
    const elements = await query(c.env, sql, [meterId]);
    return c.json({ success: true, data: elements.rows });
  } catch (error3) {
    return c.json({
      success: false,
      message: "Failed to fetch meter elements",
      error: error3.message
    }, 500);
  }
});
app7.post("/", async (c) => {
  try {
    const meterId = c.req.param("meterId");
    const { name, element } = await c.req.json();
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant context required" }, 401);
    }
    if (!name || !element) {
      return c.json({
        success: false,
        message: "Validation failed",
        errors: { name: !name ? "Name is required" : void 0, element: !element ? "Element is required" : void 0 }
      }, 400);
    }
    const meterResult = await query(
      c.env,
      "SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    const duplicateCheck = await query(
      c.env,
      "SELECT meter_element_id FROM meter_element WHERE meter_id = $1 AND element = $2",
      [meterId, element]
    );
    if (duplicateCheck.rows.length > 0) {
      return c.json({
        success: false,
        message: "Validation failed",
        errors: { element: `Element "${element}" is already assigned to this meter` }
      }, 400);
    }
    const result = await query(
      c.env,
      `INSERT INTO meter_element (meter_id, tenant_id, name, element)
       VALUES ($1, $2, $3, $4)
       RETURNING meter_element_id, meter_id, name, element`,
      [meterId, tenantId, name, element]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Failed to create meter element" }, 500);
    }
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error3) {
    return c.json({
      success: false,
      message: "Failed to add meter element",
      error: error3.message
    }, 500);
  }
});
app7.put("/:elementId", async (c) => {
  try {
    const meterId = c.req.param("meterId");
    const elementId = c.req.param("elementId");
    const { name, element } = await c.req.json();
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant context required" }, 401);
    }
    const meterResult = await query(
      c.env,
      "SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    const elementResult = await query(
      c.env,
      "SELECT meter_element_id, name, element FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2",
      [elementId, meterId]
    );
    if (elementResult.rows.length === 0) {
      return c.json({ success: false, message: "Element not found" }, 404);
    }
    const currentElement = elementResult.rows[0];
    if (element !== void 0 && element !== currentElement.element) {
      const duplicateCheck = await query(
        c.env,
        "SELECT meter_element_id FROM meter_element WHERE meter_id = $1 AND element = $2 AND meter_element_id != $3",
        [meterId, element, elementId]
      );
      if (duplicateCheck.rows.length > 0) {
        return c.json({
          success: false,
          message: "Validation failed",
          errors: { element: `Element "${element}" is already assigned to this meter` }
        }, 400);
      }
    }
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (name !== void 0) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (element !== void 0) {
      updates.push(`element = $${paramCount++}`);
      values.push(element);
    }
    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }
    values.push(elementId);
    values.push(meterId);
    const sql = `
      UPDATE meter_element
      SET ${updates.join(", ")}
      WHERE meter_element_id = $${paramCount++} AND meter_id = $${paramCount++}
      RETURNING meter_element_id, meter_id, name, element
    `;
    const result = await query(c.env, sql, values);
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Failed to update meter element" }, 500);
    }
    return c.json({ success: true, data: result.rows[0] });
  } catch (error3) {
    return c.json({
      success: false,
      message: "Failed to update meter element",
      error: error3.message
    }, 500);
  }
});
app7.delete("/:elementId", async (c) => {
  try {
    const meterId = c.req.param("meterId");
    const elementId = c.req.param("elementId");
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant context required" }, 401);
    }
    const meterResult = await query(
      c.env,
      "SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2",
      [meterId, tenantId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: "Meter not found" }, 404);
    }
    const elementResult = await query(
      c.env,
      "SELECT meter_element_id FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2",
      [elementId, meterId]
    );
    if (elementResult.rows.length === 0) {
      return c.json({ success: false, message: "Element not found" }, 404);
    }
    await query(
      c.env,
      "DELETE FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2",
      [elementId, meterId]
    );
    return c.json({ success: true, message: "Element deleted successfully" });
  } catch (error3) {
    return c.json({
      success: false,
      message: "Failed to delete meter element",
      error: error3.message
    }, 500);
  }
});
var meterElements_default = app7;

// worker/routes/settings.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app8 = new Hono2();
app8.use("*", authenticateToken);
app8.get("/company", requirePermission("settings:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant ID not found in user context" }, 400);
    }
    const result = await query(
      c.env,
      "SELECT * FROM settings WHERE tenant_id = $1 LIMIT 1",
      [tenantId]
    );
    const settings = result.rows.length > 0 ? result.rows[0] : {};
    return c.json({ success: true, data: settings });
  } catch (error3) {
    console.error("Error fetching company settings:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch company settings",
      error: error3.message
    }, 500);
  }
});
app8.put("/company", requirePermission("settings:update"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant ID not found in user context" }, 400);
    }
    const body = await c.req.json();
    const existing = await query(
      c.env,
      "SELECT settings_id FROM settings WHERE tenant_id = $1 LIMIT 1",
      [tenantId]
    );
    let settings;
    if (existing.rows.length > 0) {
      const setClause = [];
      const values = [];
      let idx = 1;
      for (const [key, value] of Object.entries(body)) {
        if (key === "settings_id" || key === "tenant_id") continue;
        setClause.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      if (setClause.length === 0) {
        return c.json({ success: true, data: existing.rows[0], message: "No fields to update" });
      }
      setClause.push(`updated_at = NOW()`);
      values.push(existing.rows[0].settings_id);
      const sql = `UPDATE settings SET ${setClause.join(", ")} WHERE settings_id = $${idx} RETURNING *`;
      const result = await query(c.env, sql, values);
      settings = result.rows[0];
    } else {
      const data = { ...body, tenant_id: tenantId };
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`);
      const sql = `INSERT INTO settings (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
      const result = await query(c.env, sql, values);
      settings = result.rows[0];
    }
    return c.json({
      success: true,
      data: settings,
      message: "Company settings updated successfully"
    });
  } catch (error3) {
    console.error("Error updating company settings:", error3);
    return c.json({
      success: false,
      message: "Failed to update company settings",
      error: error3.message
    }, 500);
  }
});
app8.get("/", requirePermission("settings:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "Tenant ID not found in user context" }, 400);
    }
    const result = await query(
      c.env,
      "SELECT * FROM settings WHERE tenant_id = $1 LIMIT 1",
      [tenantId]
    );
    const settings = result.rows.length > 0 ? result.rows[0] : {};
    return c.json({ success: true, data: { company: settings } });
  } catch (error3) {
    console.error("Error fetching settings:", error3);
    return c.json({
      success: false,
      message: "Failed to fetch settings",
      error: error3.message
    }, 500);
  }
});
var settings_default = app8;

// worker/routes/templates.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app9 = new Hono2();
app9.use("*", authenticateToken);
var VALID_CATEGORIES = ["meter_readings", "meter_errors", "maintenance", "general"];
app9.get("/", requirePermission("template:read"), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || "1") || 1;
    const limit = parseInt(qs.limit || "25") || 25;
    const tenantId = c.get("tenantId");
    const where = {};
    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      where.category = qs.category;
    }
    if (qs.isActive !== void 0) {
      where.isactive = qs.isActive === "true";
    }
    const result = await findAll(c.env, {
      table: "email_template",
      primaryKey: "email_template_id",
      tenantId,
      page,
      limit,
      search: qs.search || void 0,
      searchFields: ["name", "subject"],
      where,
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching templates:", error3);
    return c.json({ success: false, message: "Failed to fetch templates" }, 500);
  }
});
app9.get("/stats", requirePermission("template:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const result = await query(
      c.env,
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE isactive = true) as active,
        COUNT(*) FILTER (WHERE isactive = false) as inactive,
        COUNT(DISTINCT category) as categories
       FROM email_template WHERE tenant_id = $1`,
      [tenantId]
    );
    return c.json({ success: true, data: result.rows[0] });
  } catch (error3) {
    console.error("Error fetching template stats:", error3);
    return c.json({ success: false, message: "Failed to fetch template statistics" }, 500);
  }
});
app9.get("/categories", requirePermission("template:read"), (c) => {
  return c.json({
    success: true,
    data: VALID_CATEGORIES.map((cat) => ({ value: cat, label: cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) }))
  });
});
app9.get("/variable-types", requirePermission("template:read"), (c) => {
  return c.json({
    success: true,
    data: [
      { value: "string", label: "String" },
      { value: "number", label: "Number" },
      { value: "date", label: "Date" },
      { value: "boolean", label: "Boolean" },
      { value: "array", label: "Array" }
    ]
  });
});
app9.get("/search", requirePermission("template:read"), async (c) => {
  try {
    const qs = c.req.query();
    const q = qs.q;
    if (!q) {
      return c.json({ success: false, message: "Search query is required" }, 400);
    }
    const tenantId = c.get("tenantId");
    const limit = parseInt(qs.limit || "20") || 20;
    let sql = `SELECT * FROM email_template WHERE tenant_id = $1 AND (LOWER(name) LIKE LOWER($2) OR LOWER(subject) LIKE LOWER($2))`;
    const params = [tenantId, `%${q}%`];
    let paramIdx = 3;
    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      sql += ` AND category = $${paramIdx}`;
      params.push(qs.category);
      paramIdx++;
    }
    sql += ` ORDER BY name ASC LIMIT $${paramIdx}`;
    params.push(limit);
    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error searching templates:", error3);
    return c.json({ success: false, message: "Failed to search templates" }, 500);
  }
});
app9.get("/export", requirePermission("template:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const qs = c.req.query();
    let sql = "SELECT * FROM email_template WHERE tenant_id = $1";
    const params = [tenantId];
    let paramIdx = 2;
    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      sql += ` AND category = $${paramIdx}`;
      params.push(qs.category);
      paramIdx++;
    }
    if (qs.includeInactive !== "true") {
      sql += " AND isactive = true";
    }
    sql += " ORDER BY category ASC, name ASC";
    const result = await query(c.env, sql, params);
    let templates = result.rows;
    if (qs.includeDefault === "false") {
      templates = templates.filter((t) => !t.isdefault);
    }
    const exportTemplates = templates.map((t) => ({
      name: t.name,
      subject: t.subject,
      content: t.content,
      category: t.category,
      variables: t.variables || []
    }));
    return c.json({
      success: true,
      data: {
        templates: exportTemplates,
        exportInfo: {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          totalTemplates: exportTemplates.length
        }
      }
    });
  } catch (error3) {
    console.error("Error exporting templates:", error3);
    return c.json({ success: false, message: "Failed to export templates" }, 500);
  }
});
app9.get("/usage-analytics", requirePermission("template:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const result = await query(
      c.env,
      `SELECT email_template_id, name, category, usagecount, lastused
       FROM email_template WHERE tenant_id = $1
       ORDER BY usagecount DESC LIMIT 50`,
      [tenantId]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching usage analytics:", error3);
    return c.json({ success: false, message: "Failed to fetch usage analytics" }, 500);
  }
});
app9.get("/category/:category", requirePermission("template:read"), async (c) => {
  try {
    const category = c.req.param("category");
    if (!VALID_CATEGORIES.includes(category)) {
      return c.json({ success: false, message: "Invalid category" }, 400);
    }
    const tenantId = c.get("tenantId");
    const result = await query(
      c.env,
      "SELECT * FROM email_template WHERE tenant_id = $1 AND category = $2 ORDER BY name ASC",
      [tenantId, category]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching templates by category:", error3);
    return c.json({ success: false, message: "Failed to fetch templates by category" }, 500);
  }
});
app9.get("/:id/variables", requirePermission("template:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const template = await findById(c.env, "email_template", "email_template_id", id, tenantId);
    if (!template) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    const variables = template.variables || [];
    return c.json({
      success: true,
      data: {
        variables,
        totalVariables: variables.length
      }
    });
  } catch (error3) {
    console.error("Error fetching template variables:", error3);
    return c.json({ success: false, message: "Failed to fetch template variables" }, 500);
  }
});
app9.get("/:id", requirePermission("template:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const template = await findById(c.env, "email_template", "email_template_id", id, tenantId);
    if (!template) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    return c.json({ success: true, data: template });
  } catch (error3) {
    console.error("Error fetching template:", error3);
    return c.json({ success: false, message: "Failed to fetch template" }, 500);
  }
});
app9.post("/validate", requirePermission("template:read"), (c) => {
  return c.json({
    success: false,
    message: "Template validation not yet supported on this deployment"
  }, 501);
});
app9.post("/import", requirePermission("template:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const { templates: templatesList, overwrite = false } = await c.req.json();
    if (!Array.isArray(templatesList) || templatesList.length === 0) {
      return c.json({ success: false, message: "Templates array is required" }, 400);
    }
    const user = c.get("user");
    const results = [];
    let created = 0;
    let updated = 0;
    let failed = 0;
    for (const templateData of templatesList) {
      try {
        const existing = await query(
          c.env,
          "SELECT email_template_id FROM email_template WHERE tenant_id = $1 AND name = $2 LIMIT 1",
          [tenantId, templateData.name]
        );
        if (existing.rows.length > 0) {
          if (overwrite) {
            await update(c.env, "email_template", "email_template_id", existing.rows[0].email_template_id, {
              ...templateData,
              tenant_id: tenantId
            });
            updated++;
            results.push({ name: templateData.name, action: "updated", success: true });
          } else {
            results.push({ name: templateData.name, action: "skipped", success: true, reason: "already_exists" });
          }
        } else {
          await create(c.env, "email_template", { ...templateData, tenant_id: tenantId });
          created++;
          results.push({ name: templateData.name, action: "created", success: true });
        }
      } catch (err) {
        failed++;
        results.push({ name: templateData.name || "unknown", action: "failed", success: false, error: err.message });
      }
    }
    return c.json({
      success: failed === 0,
      data: {
        summary: {
          total: templatesList.length,
          created,
          updated,
          failed,
          skipped: results.filter((r) => r.action === "skipped").length
        },
        results
      },
      message: `Import completed: ${created} created, ${updated} updated, ${failed} failed`
    });
  } catch (error3) {
    console.error("Error importing templates:", error3);
    return c.json({ success: false, message: "Failed to import templates" }, 500);
  }
});
app9.post("/bulk", requirePermission("template:update"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const { action, templateIds } = await c.req.json();
    if (!["activate", "deactivate", "delete"].includes(action)) {
      return c.json({ success: false, message: "Invalid bulk action" }, 400);
    }
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return c.json({ success: false, message: "Template IDs array is required" }, 400);
    }
    if (action === "delete") {
      const user = c.get("user");
      if (user.role !== "admin" && !user.permissions?.template?.delete) {
        return c.json({ success: false, message: "Delete permission required for bulk delete" }, 403);
      }
    }
    let updatedCount = 0;
    let failedCount = 0;
    for (const id of templateIds) {
      try {
        if (action === "delete") {
          await remove(c.env, "email_template", "email_template_id", id);
        } else {
          await update(c.env, "email_template", "email_template_id", id, {
            isactive: action === "activate"
          });
        }
        updatedCount++;
      } catch {
        failedCount++;
      }
    }
    return c.json({
      success: true,
      data: { updated: updatedCount, failed: failedCount },
      message: `Bulk ${action} completed: ${updatedCount} updated, ${failedCount} failed`
    });
  } catch (error3) {
    console.error("Error performing bulk operation:", error3);
    return c.json({ success: false, message: "Failed to perform bulk operation" }, 500);
  }
});
app9.post("/", requirePermission("template:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const body = await c.req.json();
    const user = c.get("user");
    if (!body.name || body.name.length < 3) {
      return c.json({ success: false, message: "Name must be at least 3 characters" }, 400);
    }
    if (!body.subject) {
      return c.json({ success: false, message: "Subject is required" }, 400);
    }
    if (!body.content) {
      return c.json({ success: false, message: "Content is required" }, 400);
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return c.json({ success: false, message: "Invalid category" }, 400);
    }
    const template = await create(c.env, "email_template", {
      ...body,
      tenant_id: tenantId,
      created_by: user?.users_id
    });
    return c.json({ success: true, data: template }, 201);
  } catch (error3) {
    console.error("Error creating template:", error3);
    return c.json({ success: false, message: "Failed to create template" }, 500);
  }
});
app9.post("/:id/duplicate", requirePermission("template:create"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const { name } = await c.req.json();
    if (!name || name.length < 3) {
      return c.json({ success: false, message: "Name must be at least 3 characters" }, 400);
    }
    const original = await findById(c.env, "email_template", "email_template_id", id, tenantId);
    if (!original) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    const user = c.get("user");
    const duplicate = await create(c.env, "email_template", {
      name,
      subject: original.subject,
      content: original.content,
      category: original.category,
      variables: original.variables,
      tenant_id: tenantId,
      isdefault: false,
      isactive: true,
      usagecount: 0,
      created_by: user?.users_id
    });
    return c.json({ success: true, data: duplicate, message: "Template duplicated successfully" }, 201);
  } catch (error3) {
    console.error("Error duplicating template:", error3);
    return c.json({ success: false, message: "Failed to duplicate template" }, 500);
  }
});
app9.post("/:id/preview", requirePermission("template:read"), (c) => {
  return c.json({
    success: false,
    message: "Template preview not yet supported on this deployment"
  }, 501);
});
app9.post("/:id/render", requirePermission("template:read"), (c) => {
  return c.json({
    success: false,
    message: "Template rendering not yet supported on this deployment"
  }, 501);
});
app9.post("/:id/usage", requirePermission("template:read"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const result = await query(
      c.env,
      `UPDATE email_template SET usagecount = COALESCE(usagecount, 0) + 1, lastused = NOW(), updated_at = NOW()
       WHERE email_template_id = $1 AND tenant_id = $2 RETURNING email_template_id, usagecount, lastused`,
      [id, tenantId]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    return c.json({ success: true, data: result.rows[0], message: "Template usage recorded" });
  } catch (error3) {
    console.error("Error recording template usage:", error3);
    return c.json({ success: false, message: "Failed to record template usage" }, 500);
  }
});
app9.put("/:id", requirePermission("template:update"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const body = await c.req.json();
    const existing = await findById(c.env, "email_template", "email_template_id", id, tenantId);
    if (!existing) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    delete body.email_template_id;
    delete body.tenant_id;
    const updated = await update(c.env, "email_template", "email_template_id", id, body);
    return c.json({ success: true, data: updated });
  } catch (error3) {
    console.error("Error updating template:", error3);
    return c.json({ success: false, message: "Failed to update template" }, 500);
  }
});
app9.delete("/:id", requirePermission("template:delete"), async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId");
    const existing = await findById(c.env, "email_template", "email_template_id", id, tenantId);
    if (!existing) {
      return c.json({ success: false, message: "Template not found" }, 404);
    }
    await remove(c.env, "email_template", "email_template_id", id);
    return c.json({ success: true, message: "Template deleted successfully" });
  } catch (error3) {
    console.error("Error deleting template:", error3);
    return c.json({ success: false, message: "Failed to delete template" }, 500);
  }
});
var templates_default = app9;

// worker/routes/emails.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app10 = new Hono2();
app10.use("*", authenticateToken);
app10.post("/send", requirePermission("email:send"), (c) => {
  return c.json({ success: false, message: "Email sending not yet supported on this deployment" }, 501);
});
app10.post("/send-raw", requirePermission("email:send"), (c) => {
  return c.json({ success: false, message: "Email sending not yet supported on this deployment" }, 501);
});
app10.post("/send-with-attachment", (c) => {
  return c.json({ success: false, message: "Email sending with attachments not yet supported on this deployment" }, 501);
});
app10.post("/send-bulk", requirePermission("email:send"), (c) => {
  return c.json({ success: false, message: "Bulk email sending not yet supported on this deployment" }, 501);
});
app10.get("/delivery-stats", requirePermission("email:read"), async (c) => {
  try {
    const result = await query(
      c.env,
      `SELECT
        status,
        COUNT(*) as count
       FROM email_logs
       GROUP BY status
       ORDER BY status`
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching delivery stats:", error3);
    return c.json({ success: false, message: "Failed to fetch delivery statistics" }, 500);
  }
});
app10.get("/logs", requirePermission("email:read"), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || "1") || 1;
    const limit = parseInt(qs.limit || "20") || 20;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT
        el.*,
        et.name as template_name
      FROM email_logs el
      LEFT JOIN email_template et ON el.template_id = et.email_template_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;
    if (qs.status) {
      paramCount++;
      sql += ` AND el.status = $${paramCount}`;
      values.push(qs.status);
    }
    if (qs.startDate) {
      paramCount++;
      sql += ` AND el.created_at >= $${paramCount}`;
      values.push(qs.startDate);
    }
    if (qs.endDate) {
      paramCount++;
      sql += ` AND el.created_at <= $${paramCount}`;
      values.push(qs.endDate);
    }
    if (qs.search) {
      paramCount++;
      sql += ` AND (el.recipient ILIKE $${paramCount} OR el.subject ILIKE $${paramCount})`;
      values.push(`%${qs.search}%`);
    }
    const countSql = sql.replace(
      "SELECT \n        el.*,\n        et.name as template_name",
      "SELECT COUNT(*)"
    );
    const countResult = await query(c.env, countSql, values);
    const total = parseInt(countResult.rows[0].count);
    sql += " ORDER BY el.created_at DESC";
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);
    const result = await query(c.env, sql, values);
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error3) {
    console.error("Error fetching email logs:", error3);
    return c.json({ success: false, message: "Failed to fetch email logs" }, 500);
  }
});
app10.get("/track/open/:trackingId", async (c) => {
  try {
    const trackingId = c.req.param("trackingId");
    await query(
      c.env,
      `UPDATE email_logs
       SET opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE tracking_id = $1 AND opened_at IS NULL`,
      [trackingId]
    );
  } catch (error3) {
    console.error("Error tracking email open:", error3);
  }
  const pixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const pixelBytes = Uint8Array.from(atob(pixelBase64), (ch) => ch.charCodeAt(0));
  return new Response(pixelBytes, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(pixelBytes.length),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    }
  });
});
app10.post("/notifications/trigger", requirePermission("notification:send"), (c) => {
  return c.json({ success: false, message: "Notification triggering not yet supported on this deployment" }, 501);
});
app10.get("/notifications/status", requirePermission("notification:read"), (c) => {
  return c.json({ success: false, message: "Notification scheduler not available on this deployment" }, 501);
});
app10.get("/notifications/logs", requirePermission("notification:read"), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || "1") || 1;
    const limit = parseInt(qs.limit || "20") || 20;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT
        nl.*,
        et.name as template_name
      FROM notification_logs nl
      LEFT JOIN email_template et ON nl.template_id = et.email_template_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;
    if (qs.type) {
      paramCount++;
      sql += ` AND nl.type = $${paramCount}`;
      values.push(qs.type);
    }
    if (qs.status) {
      paramCount++;
      sql += ` AND nl.status = $${paramCount}`;
      values.push(qs.status);
    }
    if (qs.startDate) {
      paramCount++;
      sql += ` AND nl.created_at >= $${paramCount}`;
      values.push(qs.startDate);
    }
    if (qs.endDate) {
      paramCount++;
      sql += ` AND nl.created_at <= $${paramCount}`;
      values.push(qs.endDate);
    }
    const countSql = sql.replace(
      "SELECT \n        nl.*,\n        et.name as template_name",
      "SELECT COUNT(*)"
    );
    const countResult = await query(c.env, countSql, values);
    const total = parseInt(countResult.rows[0].count);
    sql += " ORDER BY nl.created_at DESC";
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);
    const result = await query(c.env, sql, values);
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error3) {
    console.error("Error fetching notification logs:", error3);
    return c.json({ success: false, message: "Failed to fetch notification logs" }, 500);
  }
});
var emails_default = app10;

// worker/routes/sync.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app11 = new Hono2();
app11.post("/readings/batch", authenticateSyncServer, async (c) => {
  try {
    const { readings } = await c.req.json();
    const tenantId = c.get("tenantId");
    if (!readings || readings.length === 0) {
      return c.json({ success: false, message: "No readings provided" }, 400);
    }
    console.log(`[Sync] Received batch upload with ${readings.length} readings for tenant ${tenantId}`);
    const result = await transaction(c.env, async (client) => {
      let insertedCount = 0;
      let skippedCount = 0;
      const insertErrors = [];
      for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];
        const savepointName = `sp_${i}`;
        try {
          await client.query(`SAVEPOINT ${savepointName}`);
          const readingQuery = `
            INSERT INTO meter_reading (
              tenant_id, meter_id, created_at, sync_status,
              active_energy, active_energy_export, apparent_energy, apparent_energy_export,
              apparent_power, apparent_power_phase_a, apparent_power_phase_b, apparent_power_phase_c,
              current, current_line_a, current_line_b, current_line_c,
              frequency, maximum_demand_real, power, power_factor,
              power_factor_phase_a, power_factor_phase_b, power_factor_phase_c,
              power_phase_a, power_phase_b, power_phase_c,
              reactive_energy, reactive_energy_export, reactive_power,
              reactive_power_phase_a, reactive_power_phase_b, reactive_power_phase_c,
              voltage_a_b, voltage_a_n, voltage_b_c, voltage_b_n,
              voltage_c_a, voltage_c_n, voltage_p_n, voltage_p_p,
              voltage_thd, voltage_thd_phase_a, voltage_thd_phase_b, voltage_thd_phase_c,
              meter_element_id
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8,
              $9, $10, $11, $12,
              $13, $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23,
              $24, $25, $26,
              $27, $28, $29,
              $30, $31, $32,
              $33, $34, $35, $36,
              $37, $38, $39, $40,
              $41, $42, $43, $44,
              $45
            )
            RETURNING meter_reading_id
          `;
          const readingParams = [
            tenantId,
            parseInt(reading.meter_id, 10),
            /* @__PURE__ */ new Date(),
            "pending",
            reading.active_energy ?? null,
            reading.active_energy_export ?? null,
            reading.apparent_energy ?? null,
            reading.apparent_energy_export ?? null,
            reading.apparent_power ?? null,
            reading.apparent_power_phase_a ?? null,
            reading.apparent_power_phase_b ?? null,
            reading.apparent_power_phase_c ?? null,
            reading.current ?? null,
            reading.current_line_a ?? null,
            reading.current_line_b ?? null,
            reading.current_line_c ?? null,
            reading.frequency ?? null,
            reading.maximum_demand_real ?? null,
            reading.power ?? null,
            reading.power_factor ?? null,
            reading.power_factor_phase_a ?? null,
            reading.power_factor_phase_b ?? null,
            reading.power_factor_phase_c ?? null,
            reading.power_phase_a ?? null,
            reading.power_phase_b ?? null,
            reading.power_phase_c ?? null,
            reading.reactive_energy ?? null,
            reading.reactive_energy_export ?? null,
            reading.reactive_power ?? null,
            reading.reactive_power_phase_a ?? null,
            reading.reactive_power_phase_b ?? null,
            reading.reactive_power_phase_c ?? null,
            reading.voltage_a_b ?? null,
            reading.voltage_a_n ?? null,
            reading.voltage_b_c ?? null,
            reading.voltage_b_n ?? null,
            reading.voltage_c_a ?? null,
            reading.voltage_c_n ?? null,
            reading.voltage_p_n ?? null,
            reading.voltage_p_p ?? null,
            reading.voltage_thd ?? null,
            reading.voltage_thd_phase_a ?? null,
            reading.voltage_thd_phase_b ?? null,
            reading.voltage_thd_phase_c ?? null,
            reading.meter_element_id ?? null
          ];
          const insertResult = await client.query(readingQuery, readingParams);
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          if (insertResult.rowCount && insertResult.rowCount > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (error3) {
          try {
            await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          } catch (_) {
          }
          insertErrors.push({
            meter_id: reading.meter_id,
            error: error3.message,
            code: error3.code,
            detail: error3.detail
          });
          skippedCount++;
        }
      }
      return { insertedCount, skippedCount, insertErrors };
    });
    return c.json({
      success: true,
      recordsProcessed: result.insertedCount,
      message: `Batch upload completed: ${result.insertedCount} inserted, ${result.skippedCount} skipped`,
      inserted: result.insertedCount,
      skipped: result.skippedCount,
      errors: result.insertErrors
    });
  } catch (error3) {
    console.error("[Sync] Batch upload error:", error3);
    return c.json({
      success: false,
      recordsProcessed: 0,
      message: "Batch upload error",
      error: error3.message
    }, 500);
  }
});
app11.get("/getmeters", authenticateSyncServer, async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const sql = `SELECT m.meter_id, m.device_id, m.ip, m.port, m.active,
                me.meter_element_id, me.element, me.name as name
                 FROM meter m
                    JOIN meter_element me ON me.meter_id = m.meter_id
                 WHERE m.tenant_id = $1`;
    const result = await query(c.env, sql, [tenantId]);
    const meter = result.rows[0];
    if (!meter) {
      return c.json({ success: false, message: "meter not found" }, 404);
    }
    const meters = result.rows || [];
    return c.json({
      success: true,
      config: {
        site: {
          id: meter.meter_id,
          ip: meter.ip
        },
        meters: meters.map((m) => ({
          meter_id: m.meter_id,
          device_id: m.device_id,
          ip: m.ip,
          port: m.port,
          element: m.element,
          active: m.active
        })),
        sync_interval_minutes: 5,
        batch_size: 1e3
      }
    });
  } catch (error3) {
    console.error("Meter download error:", error3);
    return c.json({ success: false, message: "Meter download error", error: error3.message }, 500);
  }
});
app11.get("/getmregisters", authenticateSyncServer, async (c) => {
  try {
    const qs = c.req.query();
    const deviceId = qs.deviceId || c.req.header("x-device-id");
    if (!deviceId) {
      return c.json({ success: false, message: "deviceId is required" }, 400);
    }
    const sql = `SELECT dr.device_id, r.register, r.field_name
                 FROM register r
                    JOIN device_register dr ON dr.register_id = r.register_id
                 WHERE dr.device_id = $1`;
    const result = await query(c.env, sql, [deviceId]);
    const register = result.rows[0];
    if (!register) {
      return c.json({ success: false, message: "register not found" }, 404);
    }
    const registers = result.rows || [];
    return c.json({
      success: true,
      config: {
        register: {
          id: register.id,
          name: register.name
        },
        registers: registers.map((r) => ({
          device_id: r.device_id,
          register: r.register,
          field_name: r.field_name
        })),
        sync_interval_minutes: 5,
        batch_size: 1e3
      }
    });
  } catch (error3) {
    console.error("Register download error:", error3);
    return c.json({ success: false, message: "Register download error", error: error3.message }, 500);
  }
});
app11.post("/connect", async (c) => {
  try {
    const { email, apiKey } = await c.req.json();
    if (!email || !apiKey) {
      return c.json({ success: false, message: "Email and API key are required" }, 400);
    }
    const userResult = await query(
      c.env,
      "SELECT users_id, name, email, active, tenant_id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (userResult.rows.length === 0) {
      return c.json({ success: false, message: "Invalid email or API key" }, 401);
    }
    const user = userResult.rows[0];
    if (!user.active) {
      return c.json({ success: false, message: "Account is inactive" }, 401);
    }
    const tenantResult = await query(
      c.env,
      "SELECT * FROM tenant WHERE tenant_id = $1",
      [user.tenant_id]
    );
    if (tenantResult.rows.length === 0) {
      return c.json({ success: false, message: "Tenant not found" }, 404);
    }
    const tenant = tenantResult.rows[0];
    if (tenant.api_key !== apiKey) {
      return c.json({ success: false, message: "Invalid email or API key" }, 401);
    }
    return c.json({
      success: true,
      message: "Connected successfully",
      data: {
        tenant: {
          tenant_id: tenant.tenant_id,
          name: tenant.name,
          url: tenant.url,
          street: tenant.street,
          street2: tenant.street2,
          city: tenant.city,
          state: tenant.state,
          zip: tenant.zip,
          country: tenant.country,
          api_key: tenant.api_key,
          download_batch_size: tenant.download_batch_size,
          upload_batch_size: tenant.upload_batch_size
        },
        user: {
          users_id: user.users_id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error3) {
    console.error("[Sync Connect] Error:", error3);
    return c.json({ success: false, message: "Connection failed" }, 500);
  }
});
app11.post("/trigger-upload", async (c) => {
  return c.json({
    success: true,
    message: "Upload triggered successfully. Check the sync system logs for details."
  });
});
var sync_default = app11;

// worker/routes/schema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/routes/locationSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition = __toESM(require_SchemaDefinition());
var locationSchema = (0, import_SchemaDefinition.defineSchema)({
  entityName: "Location",
  tableName: "location",
  description: "Location entity",
  formMaxWidth: "700px",
  customListColumns: {},
  formTabs: [
    (0, import_SchemaDefinition.tab)({
      name: "General",
      order: 1,
      sections: [
        (0, import_SchemaDefinition.section)({
          name: "Details",
          order: 1,
          fields: [
            (0, import_SchemaDefinition.field)({ name: "name", order: 1, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "Name", dbField: "name", maxLength: 200, placeholder: "Location", filertable: ["main"], showOn: ["list", "form"] }),
            (0, import_SchemaDefinition.field)({ name: "type", order: 2, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "Type", dbField: "type", maxLength: 20, enumValues: ["Warehouse", "Apartment", "Ofice", "Retail", "Hotel", "Building", "Other"], placeholder: "Warehouse", showOn: ["list", "form"] })
          ]
        }),
        (0, import_SchemaDefinition.section)({
          name: "Address",
          order: 2,
          fields: [
            (0, import_SchemaDefinition.field)({ name: "street", order: 1, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "Street", dbField: "street", maxLength: 200, placeholder: "1234 Street", showOn: ["form"] }),
            (0, import_SchemaDefinition.field)({ name: "street2", order: 2, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: false, label: "Street2", dbField: "street2", maxLength: 100, placeholder: "Unit A", showOn: ["form"] }),
            (0, import_SchemaDefinition.field)({ name: "city", order: 3, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "City", dbField: "city", maxLength: 100, placeholder: "City", showOn: ["form"] }),
            (0, import_SchemaDefinition.field)({ name: "state", order: 4, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "State", dbField: "state", maxLength: 50, placeholder: "State", showOn: ["form"] }),
            (0, import_SchemaDefinition.field)({ name: "zip", order: 5, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: true, label: "Zip", dbField: "zip", placeholder: "Zip", showOn: ["form"], maxLength: 20 }),
            (0, import_SchemaDefinition.field)({ name: "country", order: 6, type: import_SchemaDefinition.FieldTypes.COUNTRY, default: "", required: true, label: "Country", dbField: "country", maxLength: 100, placeholder: "USA", showOn: ["form"] })
          ]
        }),
        (0, import_SchemaDefinition.section)({
          name: "Status",
          order: 3,
          maxWidth: "100px",
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            (0, import_SchemaDefinition.field)({ name: "active", order: 2, type: import_SchemaDefinition.FieldTypes.BOOLEAN, default: true, required: false, label: "Active", dbField: "active", showOn: ["list", "form"] })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition.tab)({
      name: "Additional Info",
      order: 2,
      sections: [
        (0, import_SchemaDefinition.section)({
          name: "Notes",
          order: 1,
          fields: [
            (0, import_SchemaDefinition.field)({ name: "notes", order: 1, type: import_SchemaDefinition.FieldTypes.STRING, default: "", required: false, label: "Notes", dbField: "notes", showOn: ["form"] })
          ]
        }),
        (0, import_SchemaDefinition.section)({
          name: "Audit",
          order: 3,
          maxWidth: "200px",
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            (0, import_SchemaDefinition.field)({ name: "created_at", order: 1, type: import_SchemaDefinition.FieldTypes.DATE, default: null, disable: true, label: "Created At", dbField: "created_at", showOn: ["form"] }),
            (0, import_SchemaDefinition.field)({ name: "updated_at", order: 2, type: import_SchemaDefinition.FieldTypes.DATE, default: null, disable: true, label: "Updated At", dbField: "updated_at", showOn: ["form"] })
          ]
        })
      ]
    })
  ],
  entityFields: {
    location_id: (0, import_SchemaDefinition.field)({ name: "location_id", type: import_SchemaDefinition.FieldTypes.NUMBER, default: null, readOnly: true, label: "Id", dbField: "location_id" }),
    tenant_id: (0, import_SchemaDefinition.field)({ name: "tenant_id", type: import_SchemaDefinition.FieldTypes.NUMBER, default: null, readOnly: false, label: "Tenant ID", dbField: "tenant_id" })
  },
  validation: {}
});

// worker/routes/meterSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition2 = __toESM(require_SchemaDefinition());
var meterSchema = (0, import_SchemaDefinition2.defineSchema)({
  entityName: "Meter",
  tableName: "meter",
  description: "Meter entity for managing electric, gas, water, and other utility meters",
  formMaxWidth: "770px",
  customListColumns: {},
  formTabs: [
    (0, import_SchemaDefinition2.tab)({
      name: "Meter",
      order: 1,
      minWidth: "400px",
      sections: [
        (0, import_SchemaDefinition2.section)({
          name: "Information",
          order: 1,
          minWidth: "350px",
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "name",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.STRING,
              default: "",
              required: true,
              label: "Meter Name",
              dbField: "name",
              minLength: 3,
              maxLength: 100,
              placeholder: "Enter meter name",
              showOn: ["list", "form"],
              filertable: ["main"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "serial_number",
              order: 2,
              type: import_SchemaDefinition2.FieldTypes.STRING,
              default: "",
              required: true,
              label: "Serial Number",
              dbField: "serial_number",
              maxLength: 200,
              placeholder: "Enter serial number",
              filertable: ["true"],
              showOn: ["list", "form"],
              visibleFor: ["physical"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "device_id",
              order: 3,
              type: import_SchemaDefinition2.FieldTypes.NUMBER,
              default: null,
              required: true,
              label: "Device",
              dbField: "device_id",
              min: 1,
              maxLength: 200,
              showOn: ["form"],
              validate: true,
              validationFields: ["manufacturer", "model_number"],
              visibleFor: ["physical"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "location_id",
              order: 4,
              type: import_SchemaDefinition2.FieldTypes.NUMBER,
              default: null,
              required: true,
              label: "Location",
              dbField: "location_id",
              min: 1,
              showOn: ["form"],
              validate: true,
              validationFields: ["name"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "type",
              order: 5,
              type: import_SchemaDefinition2.FieldTypes.SELECT,
              default: "electric",
              required: true,
              label: "Meter Type",
              dbField: "type",
              readOnly: false,
              enumValues: ["electric", "gas", "water", "steam", "other"],
              enumLabels: {
                electric: "Electric",
                gas: "Gas",
                water: "Water",
                steam: "Steam",
                other: "Other"
              },
              showOn: ["form", "list"]
            })
          ]
        }),
        (0, import_SchemaDefinition2.section)({
          name: "Network",
          order: 2,
          visibleFor: ["physical"],
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "ip",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.STRING,
              default: "",
              required: true,
              label: "IP Address",
              dbField: "ip",
              placeholder: "192.168.1.100",
              showOn: ["list", "form"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "port",
              order: 2,
              type: import_SchemaDefinition2.FieldTypes.NUMBER,
              default: 47808,
              required: true,
              label: "Port Number",
              dbField: "port",
              min: 1,
              max: 65535,
              placeholder: "47808",
              showOn: ["form"]
            })
          ]
        }),
        (0, import_SchemaDefinition2.section)({
          name: "Status",
          order: 3,
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "active",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.BOOLEAN,
              default: true,
              required: true,
              label: "Active",
              dbField: "active",
              showOn: ["list", "form"],
              filertable: ["true"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "installation_date",
              order: 2,
              type: import_SchemaDefinition2.FieldTypes.DATE,
              default: null,
              required: false,
              label: "Installation Date",
              dbField: "installation_date",
              placeholder: "Select date",
              showOn: ["form"]
            }),
            (0, import_SchemaDefinition2.field)({
              name: "is_virtual",
              order: 3,
              type: import_SchemaDefinition2.FieldTypes.SELECT,
              default: "physical",
              required: true,
              label: "Physical/Virtual",
              dbField: "is_virtual",
              readOnly: true,
              enumValues: ["physical", "virtual"],
              enumLabels: {
                physical: "Physical",
                virtual: "Virtual"
              },
              showOn: ["form", "list"]
            })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition2.tab)({
      name: "Elements",
      order: 2,
      visibleFor: ["physical"],
      sections: [
        (0, import_SchemaDefinition2.section)({
          name: "Meter Elements",
          order: 1,
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "elements",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.OBJECT,
              default: null,
              required: false,
              label: "Elements",
              dbField: null,
              showOn: ["form"]
            })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition2.tab)({
      name: "Combined Meters",
      order: 2,
      visibleFor: ["virtual"],
      sections: [
        (0, import_SchemaDefinition2.section)({
          name: "Combined Meters",
          order: 1,
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "elements",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.OBJECT,
              default: null,
              required: false,
              label: "Elements",
              dbField: null,
              showOn: ["form"]
            })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition2.tab)({
      name: "Additional Info",
      order: 3,
      sectionOrientation: "vertical",
      sections: [
        (0, import_SchemaDefinition2.section)({
          name: "notes",
          order: 1,
          minWidth: "500px",
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "notes",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.STRING,
              default: "",
              required: false,
              label: "Notes",
              dbField: "notes",
              maxLength: 500,
              placeholder: "Enter notes",
              showOn: ["form"]
            })
          ]
        }),
        (0, import_SchemaDefinition2.section)({
          name: "Audit",
          order: 2,
          fields: [
            (0, import_SchemaDefinition2.field)({
              name: "created_at",
              order: 1,
              type: import_SchemaDefinition2.FieldTypes.DATE,
              default: null,
              readOnly: true,
              label: "Created At",
              dbField: "created_at"
            }),
            (0, import_SchemaDefinition2.field)({
              name: "updated_at",
              order: 2,
              type: import_SchemaDefinition2.FieldTypes.DATE,
              default: null,
              readOnly: true,
              label: "Updated At",
              dbField: "updated_at"
            })
          ]
        })
      ]
    })
  ],
  formFields: {
    elements: (0, import_SchemaDefinition2.field)({
      type: import_SchemaDefinition2.FieldTypes.OBJECT,
      default: null,
      required: false,
      label: "Elements",
      dbField: null,
      showOn: ["form"]
    }),
    device: (0, import_SchemaDefinition2.field)({
      type: import_SchemaDefinition2.FieldTypes.STRING,
      default: "",
      readOnly: true,
      label: "Device",
      dbField: null,
      showOn: ["list"]
    })
  },
  entityFields: {
    meter_id: (0, import_SchemaDefinition2.field)({
      name: "meter_id",
      type: import_SchemaDefinition2.FieldTypes.NUMBER,
      default: null,
      readOnly: true,
      label: "ID",
      dbField: "meter_id"
    }),
    tenant_id: (0, import_SchemaDefinition2.field)({
      name: "tenant_id",
      type: import_SchemaDefinition2.FieldTypes.NUMBER,
      default: 0,
      readOnly: false,
      label: "Tenant ID",
      dbField: "tenant_id"
    })
  },
  validation: {}
});

// worker/routes/contactSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var { defineSchema: defineSchema4, field: field4, tab: tab4, section: section4, FieldTypes: FieldTypes4 } = require_SchemaDefinition();
var contactSchema = defineSchema4({
  entityName: "Contact",
  tableName: "contact",
  description: "Contact entity for customers, vendors, and other business contacts",
  formMaxWidth: "700px",
  customListColumns: {},
  formTabs: [
    tab4({
      name: "Contact",
      order: 1,
      sections: [
        section4({
          name: "Information",
          order: 1,
          flex: 1,
          minWidth: "300px",
          fields: [
            field4({ name: "name", order: 1, type: FieldTypes4.STRING, default: "", required: true, label: "Name", dbField: "name", minLength: 2, maxLength: 100, placeholder: "John Doe", filertable: ["main"], showOn: ["list", "form"] }),
            field4({ name: "company", order: 2, type: FieldTypes4.STRING, default: "", required: false, label: "Company", dbField: "company", maxLength: 200, placeholder: "Acme Corporation", filertable: ["true"], showOn: ["list", "form"] }),
            field4({ name: "role", order: 3, type: FieldTypes4.STRING, default: "", required: false, label: "Role", dbField: "role", maxLength: 100, enumValues: ["Vendor", "Customer", "Contractor", "Technician", "Client", "Sales Manager"], placeholder: "Vendor", filertable: ["true"], showOn: ["list", "form"] }),
            field4({ name: "email", order: 4, type: FieldTypes4.EMAIL, default: "", required: true, label: "Email", dbField: "email", maxLength: 254, pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", placeholder: "john@example.com", showOn: ["form"] }),
            field4({ name: "phone", order: 5, type: FieldTypes4.PHONE, default: "", required: false, label: "Phone", dbField: "phone", maxLength: 50, placeholder: "() -", showOn: ["list", "form"] })
          ]
        }),
        section4({
          name: "Status",
          order: 2,
          maxWidth: "100px",
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field4({ name: "active", order: 1, type: FieldTypes4.BOOLEAN, default: true, readOnly: false, label: "Active", dbField: "active", description: "Whether the contact is active", showOn: ["list", "form"] })
          ]
        })
      ]
    }),
    tab4({
      name: "Address",
      order: 2,
      sections: [
        section4({
          name: "Address Information",
          order: 1,
          fields: [
            field4({ name: "street", order: 1, type: FieldTypes4.STRING, default: "", required: false, label: "Street Address", dbField: "street", maxLength: 200, placeholder: "123 Main St", showOn: ["form"] }),
            field4({ name: "street2", order: 2, type: FieldTypes4.STRING, default: "", required: false, label: "Street Address 2", dbField: "street2", maxLength: 100, placeholder: "Suite 100", showOn: ["form"] }),
            field4({ name: "city", order: 3, type: FieldTypes4.STRING, default: "", required: false, label: "City", dbField: "city", maxLength: 100, placeholder: "New York", showOn: ["form"] }),
            field4({ name: "state", order: 4, type: FieldTypes4.STRING, default: "", required: false, label: "State", dbField: "state", maxLength: 50, placeholder: "NY", showOn: ["form"] }),
            field4({ name: "zip", order: 5, type: FieldTypes4.STRING, default: "", required: false, label: "ZIP Code", dbField: "zip", maxLength: 20, pattern: "^[0-9]{5}(-[0-9]{4})?$", placeholder: "10001", showOn: ["form"] }),
            field4({ name: "country", order: 6, type: FieldTypes4.COUNTRY, default: "US", required: false, label: "Country", dbField: "country", maxLength: 100, placeholder: "USA", showOn: ["form"] })
          ]
        })
      ]
    }),
    tab4({
      name: "Additional Info",
      order: 3,
      sectionOrientation: "vertical",
      sections: [
        section4({
          name: "Notes",
          order: 1,
          fields: [
            field4({ name: "notes", order: 1, type: FieldTypes4.STRING, default: "", required: false, label: "Notes", dbField: "notes", maxLength: 5e3, placeholder: "Additional notes...", showOn: ["form"] })
          ]
        }),
        section4({
          name: "Audit",
          order: 2,
          fields: [
            field4({ name: "created_at", order: 1, type: FieldTypes4.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at", showOn: ["form"] }),
            field4({ name: "updated_at", order: 2, type: FieldTypes4.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at", showOn: ["form"] })
          ]
        })
      ]
    })
  ],
  entityFields: {
    contact_id: field4({ name: "contact_id", type: FieldTypes4.NUMBER, default: null, readOnly: true, label: "ID", dbField: "contact_id" }),
    tenant_id: field4({ name: "tenant_id", type: FieldTypes4.NUMBER, default: 0, readOnly: false, label: "Tenant ID", dbField: "tenant_id" })
  },
  relationships: {},
  validation: {}
});

// worker/routes/usersSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition3 = __toESM(require_SchemaDefinition());
var userSchema = (0, import_SchemaDefinition3.defineSchema)({
  entityName: "User",
  tableName: "users",
  description: "User entity for authentication and authorization",
  formMaxWidth: "700px",
  customListColumns: {},
  formTabs: [
    (0, import_SchemaDefinition3.tab)({
      name: "General",
      order: 1,
      sections: [
        (0, import_SchemaDefinition3.section)({
          name: "Information",
          order: 1,
          fields: [
            (0, import_SchemaDefinition3.field)({ name: "name", order: 1, type: import_SchemaDefinition3.FieldTypes.STRING, default: "", required: true, label: "Name", dbField: "name", maxLength: 100, placeholder: "John Doe", filertable: ["main"], showOn: ["list", "form"] }),
            (0, import_SchemaDefinition3.field)({ name: "email", order: 2, type: import_SchemaDefinition3.FieldTypes.EMAIL, default: "", required: true, label: "Email", dbField: "email", maxLength: 254, placeholder: "email@yahoo.com", showOn: ["list", "form"] }),
            (0, import_SchemaDefinition3.field)({ name: "phone", order: 3, type: import_SchemaDefinition3.FieldTypes.PHONE, default: "", required: true, label: "Phone", dbField: "phone", maxLength: 20, placeholder: "(xxx) xxx-xxxx", showOn: ["list", "form"] }),
            (0, import_SchemaDefinition3.field)({ name: "password", order: 3, type: "password", default: "", required: true, label: "Password", dbField: "password", maxLength: 200, placeholder: "********", showOn: ["form"] }),
            (0, import_SchemaDefinition3.field)({ name: "role", order: 4, type: import_SchemaDefinition3.FieldTypes.STRING, default: "viewer", required: false, label: "Role", dbField: "role", maxLength: 20, enumValues: ["admin", "manager", "technician", "viewer"], placeholder: "viewer", filertable: ["true"], showOn: ["list", "form"] })
          ]
        }),
        (0, import_SchemaDefinition3.section)({
          name: "Status",
          order: 2,
          maxWidth: "100px",
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            (0, import_SchemaDefinition3.field)({ name: "active", order: 1, type: import_SchemaDefinition3.FieldTypes.BOOLEAN, default: true, required: false, label: "Active", dbField: "active", showOn: ["list", "form"] })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition3.tab)({
      name: "Security",
      order: 2,
      sections: [
        (0, import_SchemaDefinition3.section)({
          name: "Permissions",
          order: 1,
          maxWidth: "400px",
          fields: [
            (0, import_SchemaDefinition3.field)({ name: "permissions", order: 1, type: import_SchemaDefinition3.FieldTypes.JSON, default: {}, required: false, label: "", dbField: "permissions", showOn: ["form"] })
          ]
        }),
        (0, import_SchemaDefinition3.section)({
          name: "Password Reset",
          order: 2,
          maxWidth: "200px",
          fields: [
            (0, import_SchemaDefinition3.field)({ name: "password_reset_actions", order: 1, type: import_SchemaDefinition3.FieldTypes.STRING, default: "", required: false, label: "Password Management", dbField: "", readOnly: true, showOn: ["form"], description: "Actions for managing user password" }),
            (0, import_SchemaDefinition3.field)({ name: "password_reset_token", order: 2, type: import_SchemaDefinition3.FieldTypes.STRING, default: "", required: false, label: "Reset Token", dbField: "password_reset_token", maxLength: 200, readOnly: true, showOn: ["form"], placeholder: "No active reset", description: "Active password reset token if one exists" }),
            (0, import_SchemaDefinition3.field)({ name: "password_reset_expires_at", order: 3, type: import_SchemaDefinition3.FieldTypes.DATE, default: null, required: false, label: "Token Expires", dbField: "password_reset_expires_at", readOnly: true, showOn: ["form"], placeholder: "No expiration", description: "When the reset token expires" })
          ]
        })
      ]
    })
  ],
  entityFields: {
    users_id: (0, import_SchemaDefinition3.field)({ name: "users_id", type: import_SchemaDefinition3.FieldTypes.NUMBER, default: null, readOnly: true, label: "ID", dbField: "users_id" }),
    tenant_id: (0, import_SchemaDefinition3.field)({ name: "tenant_id", type: import_SchemaDefinition3.FieldTypes.NUMBER, default: null, readOnly: false, label: "Tenant ID", dbField: "tenant_id" }),
    passwordHash: (0, import_SchemaDefinition3.field)({ name: "passwordHash", type: import_SchemaDefinition3.FieldTypes.STRING, default: "", required: false, label: "Password Hash", dbField: "passwordhash", maxLength: 200, readOnly: true }),
    createdAt: (0, import_SchemaDefinition3.field)({ name: "createdAt", type: import_SchemaDefinition3.FieldTypes.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at" }),
    updatedAt: (0, import_SchemaDefinition3.field)({ name: "updatedAt", type: import_SchemaDefinition3.FieldTypes.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at" }),
    lastLogin: (0, import_SchemaDefinition3.field)({ name: "lastLogin", type: import_SchemaDefinition3.FieldTypes.DATE, default: null, readOnly: true, label: "Last Login", dbField: "last_login_at" }),
    passwordChangedAt: (0, import_SchemaDefinition3.field)({ name: "passwordChangedAt", type: import_SchemaDefinition3.FieldTypes.DATE, default: null, readOnly: true, label: "Password Changed At", dbField: "password_changed_at" }),
    failedLoginAttempts: (0, import_SchemaDefinition3.field)({ name: "failedLoginAttempts", type: import_SchemaDefinition3.FieldTypes.NUMBER, default: 0, readOnly: false, label: "Failed Login Attempts", dbField: "failed_login_attempts" }),
    lockedUntil: (0, import_SchemaDefinition3.field)({ name: "lockedUntil", type: import_SchemaDefinition3.FieldTypes.DATE, default: null, readOnly: false, label: "Locked Until", dbField: "locked_until" })
  },
  relationships: {
    tenant: (0, import_SchemaDefinition3.relationship)({
      type: import_SchemaDefinition3.RelationshipTypes.BELONGS_TO,
      model: "Tenant",
      foreignKey: "tenant_id",
      autoLoad: false
    })
  },
  validation: {}
});

// worker/routes/tenantSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition4 = __toESM(require_SchemaDefinition());
var tenantSchema = (0, import_SchemaDefinition4.defineSchema)({
  entityName: "Tenant",
  tableName: "tenant",
  description: "Tenant entity for multi-tenant isolation",
  customListColumns: {},
  formFields: {
    name: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: true, label: "Name", dbField: "name", maxLength: 100, placeholder: "Company Name" }),
    url: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.URL, default: "", required: false, label: "Website URL", dbField: "url", maxLength: 255, placeholder: "https://example.com" }),
    street: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: false, label: "Street Address", dbField: "street", maxLength: 100, placeholder: "123 Main St" }),
    street2: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: false, label: "Street Address 2", dbField: "street2", maxLength: 100, placeholder: "Suite 100" }),
    city: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: false, label: "City", dbField: "city", maxLength: 50, placeholder: "New York" }),
    state: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: false, label: "State", dbField: "state", maxLength: 50, placeholder: "NY" }),
    zip: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.STRING, default: "", required: false, label: "ZIP Code", dbField: "zip", maxLength: 15, placeholder: "10001" }),
    country: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.COUNTRY, default: "US", required: false, label: "Country", dbField: "country", maxLength: 50, placeholder: "USA" }),
    active: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.BOOLEAN, default: true, required: false, label: "Active", dbField: "active", description: "Whether the tenant is active" }),
    meterReadingBatchCount: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.NUMBER, default: 0, required: false, label: "Meter Reading Batch Count", dbField: "meter_reading_batch_count", description: "Number of meter reading batches processed" })
  },
  entityFields: {
    tenant_id: (0, import_SchemaDefinition4.field)({ name: "tenant_id", type: import_SchemaDefinition4.FieldTypes.NUMBER, default: null, readOnly: true, label: "ID", dbField: "tenant_id" }),
    createdAt: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at" }),
    updatedAt: (0, import_SchemaDefinition4.field)({ type: import_SchemaDefinition4.FieldTypes.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at" })
  },
  relationships: {
    users: (0, import_SchemaDefinition4.relationship)({ type: import_SchemaDefinition4.RelationshipTypes.HAS_MANY, model: "User", foreignKey: "tenant_id", autoLoad: false, as: "users" }),
    contacts: (0, import_SchemaDefinition4.relationship)({ type: import_SchemaDefinition4.RelationshipTypes.HAS_MANY, model: "Contact", foreignKey: "contact_id", autoLoad: false, as: "contacts" }),
    devices: (0, import_SchemaDefinition4.relationship)({ type: import_SchemaDefinition4.RelationshipTypes.HAS_MANY, model: "Device", foreignKey: "device_id", autoLoad: false, as: "devices" })
  },
  validation: {}
});

// worker/routes/meterReadingSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition5 = __toESM(require_SchemaDefinition());
var meterReadingSchema = (0, import_SchemaDefinition5.defineSchema)({
  entityName: "MeterReadings",
  tableName: "meter_reading",
  description: "MeterReadings entity",
  customListColumns: {},
  formFields: {
    source: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Source", dbField: "source", maxLength: 100 }),
    quality: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Quality", dbField: "quality", maxLength: 20 }),
    voltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Voltage", dbField: "voltage" }),
    current: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Current", dbField: "current" }),
    power: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Power", dbField: "power" }),
    energy: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Energy", dbField: "energy" }),
    frequency: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Frequency", dbField: "frequency" }),
    powerfactor: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Powerfactor", dbField: "powerfactor" }),
    temperature: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Temperature", dbField: "temperature" }),
    kwh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Kwh", dbField: "kwh" }),
    kw: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Kw", dbField: "kw" }),
    v: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "V", dbField: "v" }),
    a: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "A", dbField: "a" }),
    dpf: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Dpf", dbField: "dpf" }),
    dpfchannel: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Dpfchannel", dbField: "dpfchannel" }),
    kwpeak: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Kwpeak", dbField: "kwpeak" }),
    kvarh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Kvarh", dbField: "kvarh" }),
    kvah: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Kvah", dbField: "kvah" }),
    phaseavoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phaseavoltage", dbField: "phaseavoltage" }),
    phasebvoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phasebvoltage", dbField: "phasebvoltage" }),
    phasecvoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phasecvoltage", dbField: "phasecvoltage" }),
    phaseacurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phaseacurrent", dbField: "phaseacurrent" }),
    phasebcurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phasebcurrent", dbField: "phasebcurrent" }),
    phaseccurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phaseccurrent", dbField: "phaseccurrent" }),
    phaseapower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phaseapower", dbField: "phaseapower" }),
    phasebpower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phasebpower", dbField: "phasebpower" }),
    phasecpower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Phasecpower", dbField: "phasecpower" }),
    deviceIp: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Device Ip", dbField: "device_ip", maxLength: 50 }),
    port: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Port", dbField: "port" }),
    powerFactor: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Power Factor", dbField: "power_factor" }),
    phaseAVoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase A Voltage", dbField: "phase_a_voltage" }),
    phaseBVoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase B Voltage", dbField: "phase_b_voltage" }),
    phaseCVoltage: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase C Voltage", dbField: "phase_c_voltage" }),
    phaseACurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase A Current", dbField: "phase_a_current" }),
    phaseBCurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase B Current", dbField: "phase_b_current" }),
    phaseCCurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase C Current", dbField: "phase_c_current" }),
    phaseAPower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase A Power", dbField: "phase_a_power" }),
    phaseBPower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase B Power", dbField: "phase_b_power" }),
    phaseCPower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase C Power", dbField: "phase_c_power" }),
    lineToLineVoltageAb: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Line To Line Voltage Ab", dbField: "line_to_line_voltage_ab" }),
    lineToLineVoltageBc: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Line To Line Voltage Bc", dbField: "line_to_line_voltage_bc" }),
    lineToLineVoltageCa: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Line To Line Voltage Ca", dbField: "line_to_line_voltage_ca" }),
    totalActivePower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Active Power", dbField: "total_active_power" }),
    totalReactivePower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Reactive Power", dbField: "total_reactive_power" }),
    totalApparentPower: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Apparent Power", dbField: "total_apparent_power" }),
    totalActiveEnergyWh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Active Energy Wh", dbField: "total_active_energy_wh" }),
    totalReactiveEnergyVarh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Reactive Energy Varh", dbField: "total_reactive_energy_varh" }),
    totalApparentEnergyVah: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Total Apparent Energy Vah", dbField: "total_apparent_energy_vah" }),
    frequencyHz: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Frequency Hz", dbField: "frequency_hz" }),
    temperatureC: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Temperature C", dbField: "temperature_c" }),
    humidity: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Humidity", dbField: "humidity" }),
    neutralCurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Neutral Current", dbField: "neutral_current" }),
    phaseAPowerFactor: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase A Power Factor", dbField: "phase_a_power_factor" }),
    phaseBPowerFactor: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase B Power Factor", dbField: "phase_b_power_factor" }),
    phaseCPowerFactor: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase C Power Factor", dbField: "phase_c_power_factor" }),
    voltageThd: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Thd", dbField: "voltage_thd" }),
    currentThd: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Thd", dbField: "current_thd" }),
    maxDemandKw: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Max Demand Kw", dbField: "max_demand_kw" }),
    maxDemandKvar: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Max Demand Kvar", dbField: "max_demand_kvar" }),
    maxDemandKva: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Max Demand Kva", dbField: "max_demand_kva" }),
    voltageUnbalance: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Unbalance", dbField: "voltage_unbalance" }),
    currentUnbalance: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Unbalance", dbField: "current_unbalance" }),
    communicationStatus: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Communication Status", dbField: "communication_status", maxLength: 20 }),
    deviceModel: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Device Model", dbField: "device_model", maxLength: 100 }),
    firmwareVersion: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Firmware Version", dbField: "firmware_version", maxLength: 100 }),
    serial_number: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Serial Number", dbField: "serial_number", maxLength: 100 }),
    alarmStatus: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Alarm Status", dbField: "alarm_status", maxLength: 20 }),
    dataQuality: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Data Quality", dbField: "data_quality", maxLength: 20 }),
    rawBasic: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Raw Basic", dbField: "raw_basic" }),
    rawExtended: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Raw Extended", dbField: "raw_extended" }),
    importActiveEnergyWh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Import Active Energy Wh", dbField: "import_active_energy_wh" }),
    exportActiveEnergyWh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Export Active Energy Wh", dbField: "export_active_energy_wh" }),
    importReactiveEnergyVarh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Import Reactive Energy Varh", dbField: "import_reactive_energy_varh" }),
    exportReactiveEnergyVarh: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Export Reactive Energy Varh", dbField: "export_reactive_energy_varh" }),
    groundCurrent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Ground Current", dbField: "ground_current" }),
    voltageThdPhaseA: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Thd Phase A", dbField: "voltage_thd_phase_a" }),
    voltageThdPhaseB: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Thd Phase B", dbField: "voltage_thd_phase_b" }),
    voltageThdPhaseC: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Thd Phase C", dbField: "voltage_thd_phase_c" }),
    currentThdPhaseA: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Thd Phase A", dbField: "current_thd_phase_a" }),
    currentThdPhaseB: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Thd Phase B", dbField: "current_thd_phase_b" }),
    currentThdPhaseC: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Thd Phase C", dbField: "current_thd_phase_c" }),
    voltageHarmonic_3: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Harmonic 3", dbField: "voltage_harmonic_3" }),
    voltageHarmonic_5: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Harmonic 5", dbField: "voltage_harmonic_5" }),
    voltageHarmonic_7: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Harmonic 7", dbField: "voltage_harmonic_7" }),
    currentHarmonic_3: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Harmonic 3", dbField: "current_harmonic_3" }),
    currentHarmonic_5: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Harmonic 5", dbField: "current_harmonic_5" }),
    currentHarmonic_7: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Harmonic 7", dbField: "current_harmonic_7" }),
    currentDemandKw: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Demand Kw", dbField: "current_demand_kw" }),
    currentDemandKvar: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Demand Kvar", dbField: "current_demand_kvar" }),
    currentDemandKva: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Demand Kva", dbField: "current_demand_kva" }),
    predictedDemandKw: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Predicted Demand Kw", dbField: "predicted_demand_kw" }),
    voltageFlicker: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Flicker", dbField: "voltage_flicker" }),
    frequencyDeviation: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Frequency Deviation", dbField: "frequency_deviation" }),
    phaseSequence: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase Sequence", dbField: "phase_sequence", maxLength: 10 }),
    phaseRotation: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Phase Rotation", dbField: "phase_rotation", maxLength: 10 }),
    powerDirection: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Power Direction", dbField: "power_direction", maxLength: 10 }),
    reactiveDirection: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Reactive Direction", dbField: "reactive_direction", maxLength: 12 }),
    lastCommunication: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.DATE, default: "", required: false, label: "Last Communication", dbField: "last_communication" }),
    manufacturerCode: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Manufacturer Code", dbField: "manufacturer_code" }),
    deviceTime: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.DATE, default: "", required: false, label: "Device Time", dbField: "device_time" }),
    syncStatus: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Sync Status", dbField: "sync_status", maxLength: 20 }),
    timeSource: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Time Source", dbField: "time_source", maxLength: 20 }),
    eventCounter: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Event Counter", dbField: "event_counter" }),
    lastEvent: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Last Event", dbField: "last_event" }),
    currentTransformerRatio: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Current Transformer Ratio", dbField: "current_transformer_ratio" }),
    voltageTransformerRatio: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Voltage Transformer Ratio", dbField: "voltage_transformer_ratio" }),
    pulseConstant: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Pulse Constant", dbField: "pulse_constant" }),
    status: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Status", dbField: "status", maxLength: 20 }),
    unitOfMeasurement: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.STRING, default: "", required: false, label: "Unit Of Measurement", dbField: "unit_of_measurement", maxLength: 20 }),
    meterId: (0, import_SchemaDefinition5.field)({ type: import_SchemaDefinition5.FieldTypes.NUMBER, default: 0, required: false, label: "Meter Id", dbField: "meter_id" })
  },
  entityFields: {
    meter_reading_id: (0, import_SchemaDefinition5.field)({ name: "meter_reading_id", type: import_SchemaDefinition5.FieldTypes.STRING, default: null, readOnly: true, label: "Id", dbField: "meter_reading_id" }),
    createdat: (0, import_SchemaDefinition5.field)({ name: "createdat", type: import_SchemaDefinition5.FieldTypes.DATE, default: null, readOnly: true, label: "Createdat", dbField: "created_at" }),
    tenantId: (0, import_SchemaDefinition5.field)({ name: "tenantId", type: import_SchemaDefinition5.FieldTypes.NUMBER, default: null, readOnly: true, label: "Tenant Id", dbField: "tenant_id" })
  },
  relationships: {
    meter: (0, import_SchemaDefinition5.relationship)({ type: import_SchemaDefinition5.RelationshipTypes.BELONGS_TO, model: "Meter", foreignKey: "meter_id", autoLoad: false })
  },
  validation: {}
});

// worker/routes/meterElementSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition6 = __toESM(require_SchemaDefinition());
var meterElementsSchema = (0, import_SchemaDefinition6.defineSchema)({
  entityName: "MeterElement",
  tableName: "meter_element",
  description: "Meter element entity for managing individual elements within a meter",
  customListColumns: {},
  formFields: {
    element: (0, import_SchemaDefinition6.field)({ type: import_SchemaDefinition6.FieldTypes.STRING, default: "", required: true, label: "Element", dbField: "element", maxLength: 255, placeholder: "Enter element value", enumValues: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"], showOn: ["form"] }),
    name: (0, import_SchemaDefinition6.field)({ type: import_SchemaDefinition6.FieldTypes.STRING, default: "", required: true, label: "Name", dbField: "name", maxLength: 255, placeholder: "Enter element name", showOn: ["list", "form"] })
  },
  entityFields: {
    meter_element_id: (0, import_SchemaDefinition6.field)({ name: "meter_element_id", type: import_SchemaDefinition6.FieldTypes.NUMBER, default: null, readOnly: true, label: "ID", dbField: "meter_element_id" }),
    meter_id: (0, import_SchemaDefinition6.field)({ name: "meter_id", type: import_SchemaDefinition6.FieldTypes.NUMBER, default: null, readOnly: true, label: "Meter ID", dbField: "meter_id" }),
    tenant_id: (0, import_SchemaDefinition6.field)({ name: "tenant_id", type: import_SchemaDefinition6.FieldTypes.NUMBER, default: null, readOnly: false, label: "Tenant ID", dbField: "tenant_id" }),
    created_at: (0, import_SchemaDefinition6.field)({ name: "created_at", type: import_SchemaDefinition6.FieldTypes.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at" }),
    updated_at: (0, import_SchemaDefinition6.field)({ name: "updated_at", type: import_SchemaDefinition6.FieldTypes.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at" })
  },
  validation: {}
});

// worker/routes/reportSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition7 = __toESM(require_SchemaDefinition());
var reportSchema = (0, import_SchemaDefinition7.defineSchema)({
  entityName: "Report",
  tableName: "report",
  description: "Scheduled report configuration for automated email delivery",
  formMaxWidth: "600px",
  formTabs: [
    (0, import_SchemaDefinition7.tab)({
      name: "General",
      order: 1,
      sections: [
        (0, import_SchemaDefinition7.section)({
          name: "Details",
          order: 1,
          flex: 1,
          fields: [
            (0, import_SchemaDefinition7.field)({ name: "name", order: 1, type: import_SchemaDefinition7.FieldTypes.STRING, default: "", required: true, label: "Report Name", dbField: "name", minLength: 1, maxLength: 255, placeholder: "Monthly Usage Report", filterable: ["main"], showOn: ["list", "form"] }),
            (0, import_SchemaDefinition7.field)({ name: "type", order: 2, type: import_SchemaDefinition7.FieldTypes.SELECT, default: "meter_readings", required: true, label: "Report Type", dbField: "type", enumValues: ["meter_readings", "usage_summary", "daily_summary"], enumLabels: { "meter_readings": "Meter Readings", "usage_summary": "Usage Summary", "daily_summary": "Daily Summary" }, filterable: ["true"], showOn: ["list", "form"] }),
            (0, import_SchemaDefinition7.field)({ name: "active", order: 3, type: import_SchemaDefinition7.FieldTypes.BOOLEAN, default: true, required: false, label: "Active", dbField: "active", filterable: ["true"], showOn: ["list", "form"] })
          ]
        })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Schedule",
      order: 2,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Execution Schedule", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "schedule", order: 1, type: import_SchemaDefinition7.FieldTypes.STRING, default: "", required: true, label: "Schedule", dbField: "schedule", placeholder: "Daily at 9 AM", helpText: "Cron format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)", showOn: ["form"], customField: true })
        ] })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Recipients",
      order: 3,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Email Recipients", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "recipients", order: 1, type: import_SchemaDefinition7.FieldTypes.STRING, default: [], required: true, label: "Email Recipients", dbField: "recipients", placeholder: "user@example.com", helpText: "Add email addresses to receive the report", showOn: ["form"], customField: true })
        ] })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Configuration",
      order: 4,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Type-Specific Settings", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "config", order: 1, type: import_SchemaDefinition7.FieldTypes.STRING, default: {}, required: false, label: "Configuration", dbField: "config", placeholder: "Type-specific configuration", helpText: "Configuration options specific to the selected report type", showOn: ["form"], customField: true })
        ] })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Meters & Elements",
      order: 5,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Select Meters and Elements", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "meter_ids", order: 1, type: "custom", label: "Meters and Elements", required: false, default: [], showOn: ["form"], customField: true }),
          (0, import_SchemaDefinition7.field)({ name: "element_ids", order: 2, type: "custom", label: "Selected Elements", required: false, default: [], showOn: ["form"], customField: true })
        ] })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Registers",
      order: 6,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Select Registers", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "register_ids", order: 1, type: "custom", label: "Registers", required: false, default: [], showOn: ["form"], customField: true })
        ] })
      ]
    }),
    (0, import_SchemaDefinition7.tab)({
      name: "Formatting",
      order: 7,
      sections: [
        (0, import_SchemaDefinition7.section)({ name: "Output Format", order: 1, flex: 1, fields: [
          (0, import_SchemaDefinition7.field)({ name: "html_format", order: 1, type: import_SchemaDefinition7.FieldTypes.BOOLEAN, label: "Enable HTML Formatting", required: false, default: false, showOn: ["form"] })
        ] })
      ]
    })
  ]
});

// worker/routes/dashboardSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var { defineSchema: defineSchema10, field: field10, tab: tab10, section: section10, FieldTypes: FieldTypes10 } = require_SchemaDefinition();
var dashboardSchema = defineSchema10({
  entityName: "Dashboard",
  tableName: "dashboard",
  description: "Dashboard card configuration for displaying aggregated meter reading data",
  customListColumns: {},
  formTabs: [
    tab10({
      name: "Card Configuration",
      order: 1,
      sections: [
        section10({
          name: "Basic Information",
          order: 1,
          minWidth: "350px",
          fields: [
            field10({ name: "card_name", order: 1, type: FieldTypes10.STRING, default: "", required: true, label: "Card Name", dbField: "card_name", minLength: 1, maxLength: 255, placeholder: "Enter card name", showOn: ["list", "form"] }),
            field10({ name: "card_description", order: 2, type: FieldTypes10.STRING, default: "", required: false, label: "Description", dbField: "card_description", maxLength: 1e3, placeholder: "Enter card description", showOn: ["form"] }),
            field10({ name: "meter_element_id", order: 3, type: FieldTypes10.NUMBER, default: null, required: true, label: "Meter Element", dbField: "meter_element_id", min: 1, showOn: ["list", "form"], validate: true, validationFields: ["name"] }),
            field10({ name: "meter_id", order: 4, type: FieldTypes10.NUMBER, default: null, required: true, label: "Meter", dbField: "meter_id", min: 1, showOn: ["form"], validate: true, validationFields: ["name"] })
          ]
        }),
        section10({ name: "Data Selection", order: 2, fields: [
          field10({ name: "selected_columns", order: 1, type: FieldTypes10.OBJECT, default: [], required: true, label: "Selected Power Columns", dbField: "selected_columns", showOn: ["form"], description: "Select which power columns to display on this card" })
        ] }),
        section10({ name: "Time Frame", order: 3, fields: [
          field10({ name: "time_frame_type", order: 1, type: FieldTypes10.STRING, default: "last_month", required: true, label: "Time Frame Type", dbField: "time_frame_type", enumValues: ["custom", "last_month", "this_month_to_date", "since_installation"], showOn: ["list", "form"] }),
          field10({ name: "custom_start_date", order: 2, type: FieldTypes10.DATE, default: null, required: false, label: "Custom Start Date", dbField: "custom_start_date", placeholder: "Select start date", showOn: ["form"], description: 'Required when Time Frame Type is "custom"' }),
          field10({ name: "custom_end_date", order: 3, type: FieldTypes10.DATE, default: null, required: false, label: "Custom End Date", dbField: "custom_end_date", placeholder: "Select end date", showOn: ["form"], description: 'Required when Time Frame Type is "custom"' })
        ] }),
        section10({ name: "Visualization", order: 4, fields: [
          field10({ name: "visualization_type", order: 1, type: FieldTypes10.STRING, default: "line", required: true, label: "Visualization Type", dbField: "visualization_type", enumValues: ["pie", "line", "candlestick", "bar", "area"], showOn: ["list", "form"] }),
          field10({ name: "grouping_type", order: 2, type: FieldTypes10.STRING, default: "daily", required: true, label: "Data Grouping", dbField: "grouping_type", enumValues: ["total", "hourly", "daily", "weekly", "monthly"], showOn: ["list", "form"], description: "How to group the aggregated data" })
        ] }),
        section10({ name: "Grid Layout", order: 5, fields: [
          field10({ name: "grid_x", order: 1, type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid X Position", dbField: "grid_x", showOn: ["form"] }),
          field10({ name: "grid_y", order: 2, type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Y Position", dbField: "grid_y", showOn: ["form"] }),
          field10({ name: "grid_w", order: 3, type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Width", dbField: "grid_w", showOn: ["form"] }),
          field10({ name: "grid_h", order: 4, type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Height", dbField: "grid_h", showOn: ["form"] })
        ] })
      ]
    }),
    tab10({
      name: "Additional Info",
      order: 2,
      sectionOrientation: "vertical",
      sections: [
        section10({ name: "Audit", order: 1, fields: [
          field10({ name: "created_at", order: 1, type: FieldTypes10.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at", showOn: ["form"] }),
          field10({ name: "updated_at", order: 2, type: FieldTypes10.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at", showOn: ["form"] })
        ] })
      ]
    })
  ],
  formFields: {
    card_name: field10({ type: FieldTypes10.STRING, default: "", required: true, label: "Card Name", dbField: "card_name", minLength: 1, maxLength: 255, showOn: ["list", "form"] }),
    card_description: field10({ type: FieldTypes10.STRING, default: "", required: false, label: "Description", dbField: "card_description", maxLength: 1e3, showOn: ["form"] }),
    meter_element_id: field10({ type: FieldTypes10.NUMBER, default: null, required: true, label: "Meter Element", dbField: "meter_element_id", min: 1, showOn: ["list", "form"], validate: true }),
    meter_id: field10({ type: FieldTypes10.NUMBER, default: null, required: true, label: "Meter", dbField: "meter_id", min: 1, showOn: ["form"], validate: true }),
    selected_columns: field10({ type: FieldTypes10.OBJECT, default: [], required: true, label: "Selected Power Columns", dbField: "selected_columns", showOn: ["form"] }),
    time_frame_type: field10({ type: FieldTypes10.STRING, default: "last_month", required: true, label: "Time Frame Type", dbField: "time_frame_type", enumValues: ["custom", "last_month", "this_month_to_date", "since_installation"], showOn: ["list", "form"] }),
    custom_start_date: field10({ type: FieldTypes10.DATE, default: null, required: false, label: "Custom Start Date", dbField: "custom_start_date", showOn: ["form"] }),
    custom_end_date: field10({ type: FieldTypes10.DATE, default: null, required: false, label: "Custom End Date", dbField: "custom_end_date", showOn: ["form"] }),
    visualization_type: field10({ type: FieldTypes10.STRING, default: "line", required: true, label: "Visualization Type", dbField: "visualization_type", enumValues: ["pie", "line", "candlestick", "bar", "area"], showOn: ["list", "form"] }),
    grouping_type: field10({ type: FieldTypes10.STRING, default: "daily", required: true, label: "Data Grouping", dbField: "grouping_type", enumValues: ["total", "hourly", "daily", "weekly", "monthly"], showOn: ["list", "form"] }),
    grid_x: field10({ type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid X Position", dbField: "grid_x", showOn: ["form"] }),
    grid_y: field10({ type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Y Position", dbField: "grid_y", showOn: ["form"] }),
    grid_w: field10({ type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Width", dbField: "grid_w", showOn: ["form"] }),
    grid_h: field10({ type: FieldTypes10.NUMBER, default: null, required: false, label: "Grid Height", dbField: "grid_h", showOn: ["form"] })
  },
  entityFields: {
    dashboard_id: field10({ name: "dashboard_id", type: FieldTypes10.NUMBER, default: null, readOnly: true, label: "ID", dbField: "dashboard_id" }),
    tenant_id: field10({ name: "tenant_id", type: FieldTypes10.NUMBER, default: 0, readOnly: false, label: "Tenant ID", dbField: "tenant_id" }),
    created_by_users_id: field10({ name: "created_by_users_id", type: FieldTypes10.NUMBER, default: null, readOnly: true, label: "Created By User ID", dbField: "created_by_users_id" }),
    created_at: field10({ name: "created_at", type: FieldTypes10.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at" }),
    updated_at: field10({ name: "updated_at", type: FieldTypes10.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updated_at" }),
    grid_x: field10({ name: "grid_x", type: FieldTypes10.NUMBER, default: null, readOnly: false, label: "Grid X Position", dbField: "grid_x" }),
    grid_y: field10({ name: "grid_y", type: FieldTypes10.NUMBER, default: null, readOnly: false, label: "Grid Y Position", dbField: "grid_y" }),
    grid_w: field10({ name: "grid_w", type: FieldTypes10.NUMBER, default: null, readOnly: false, label: "Grid Width", dbField: "grid_w" }),
    grid_h: field10({ name: "grid_h", type: FieldTypes10.NUMBER, default: null, readOnly: false, label: "Grid Height", dbField: "grid_h" })
  },
  validation: {}
});

// worker/routes/authLogsSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition8 = __toESM(require_SchemaDefinition());
var authLogsSchema = (0, import_SchemaDefinition8.defineSchema)({
  entityName: "AuthLogs",
  tableName: "auth_logs",
  description: "Authentication logs entity for tracking login and auth events",
  customListColumns: {},
  formFields: {
    userId: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.NUMBER, default: 0, required: true, label: "User ID", dbField: "user_id" }),
    eventType: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.STRING, default: "", required: true, label: "Event Type", dbField: "event_type", maxLength: 50 }),
    status: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.STRING, default: "", required: true, label: "Status", dbField: "status", maxLength: 20 }),
    ipAddress: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.STRING, default: "", required: false, label: "IP Address", dbField: "ip_address" }),
    userAgent: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.STRING, default: "", required: false, label: "User Agent", dbField: "user_agent" }),
    details: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.JSON, default: {}, required: false, label: "Details", dbField: "details" })
  },
  entityFields: {
    authLogsId: (0, import_SchemaDefinition8.field)({ name: "auth_logs_id", type: import_SchemaDefinition8.FieldTypes.NUMBER, default: null, readOnly: true, label: "Auth Logs ID", dbField: "auth_logs_id" }),
    createdAt: (0, import_SchemaDefinition8.field)({ type: import_SchemaDefinition8.FieldTypes.DATE, default: null, readOnly: true, label: "Created At", dbField: "created_at" })
  },
  relationships: {
    user: (0, import_SchemaDefinition8.relationship)({ type: import_SchemaDefinition8.RelationshipTypes.BELONGS_TO, model: "User", foreignKey: "user_id", autoLoad: false })
  },
  validation: {}
});

// worker/routes/emailTemplatesSchema.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_SchemaDefinition9 = __toESM(require_SchemaDefinition());
var emailTemplatesSchema = (0, import_SchemaDefinition9.defineSchema)({
  entityName: "EmailTemplates",
  tableName: "email_templates",
  description: "EmailTemplates entity",
  customListColumns: {},
  formFields: {
    name: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.STRING, default: "", required: true, label: "Name", dbField: "name", maxLength: 255 }),
    subject: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.STRING, default: "", required: true, label: "Subject", dbField: "subject", maxLength: 500 }),
    content: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.STRING, default: "", required: true, label: "Content", dbField: "content" }),
    category: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.STRING, default: "", required: true, label: "Category", dbField: "category", maxLength: 50 }),
    variables: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.OBJECT, default: null, required: false, label: "Variables", dbField: "variables" }),
    isdefault: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.BOOLEAN, default: false, required: false, label: "Is Default", dbField: "isdefault" }),
    isactive: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.BOOLEAN, default: true, required: false, label: "Is Active", dbField: "isactive" }),
    usagecount: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.NUMBER, default: 0, required: false, label: "Usage Count", dbField: "usagecount" }),
    lastused: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.DATE, default: "", required: false, label: "Last Used", dbField: "lastused" }),
    createdby: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.NUMBER, default: 0, required: false, label: "Created By", dbField: "createdby" })
  },
  entityFields: {
    id: (0, import_SchemaDefinition9.field)({ name: "email_template_id", type: import_SchemaDefinition9.FieldTypes.NUMBER, default: null, readOnly: true, label: "Id", dbField: "email_template_id" }),
    createdat: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.DATE, default: null, readOnly: true, label: "Created At", dbField: "createdat" }),
    updatedat: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.DATE, default: null, readOnly: true, label: "Updated At", dbField: "updatedat" }),
    tenantId: (0, import_SchemaDefinition9.field)({ type: import_SchemaDefinition9.FieldTypes.NUMBER, default: null, readOnly: true, label: "Tenant ID", dbField: "tenant_id" })
  },
  validation: {}
});

// worker/routes/schema.ts
var app12 = new Hono2();
app12.use("*", authenticateToken);
var schemas = {
  meter: meterSchema,
  location: locationSchema,
  contact: contactSchema,
  device: deviceSchema,
  user: userSchema,
  tenant: tenantSchema,
  meter_reading: meterReadingSchema,
  meterReadings: { $ref: "meter_reading" },
  meterElements: meterElementsSchema,
  report: reportSchema,
  dashboard: dashboardSchema,
  authLogs: authLogsSchema,
  emailTemplates: emailTemplatesSchema
};
function resolveSchema(key) {
  const schema = schemas[key];
  if (!schema) return null;
  if (schema.$ref) return schemas[schema.$ref] || null;
  return schema;
}
__name(resolveSchema, "resolveSchema");
app12.get("/", (c) => {
  try {
    const availableSchemas = Object.keys(schemas).filter((k) => !schemas[k].$ref).map((entityName) => {
      const schema = schemas[entityName];
      const json = schema.toJSON();
      return {
        entityName: json.entityName,
        tableName: json.tableName,
        description: json.description,
        endpoint: `/api/schema/${entityName}`
      };
    });
    return c.json({
      success: true,
      data: {
        schemas: availableSchemas,
        count: availableSchemas.length
      }
    });
  } catch (error3) {
    return c.json({ success: false, message: "Failed to fetch schema list", error: error3.message }, 500);
  }
});
app12.get("/:entity", (c) => {
  try {
    const entity = c.req.param("entity");
    const schema = resolveSchema(entity);
    if (!schema) {
      return c.json({ success: false, message: `Schema not found for entity: ${entity}`, availableEntities: Object.keys(schemas) }, 404);
    }
    return c.json({ success: true, data: schema.toJSON() });
  } catch (error3) {
    return c.json({ success: false, message: "Failed to fetch schema", error: error3.message }, 500);
  }
});
app12.post("/:entity/validate", async (c) => {
  try {
    const entity = c.req.param("entity");
    const schema = resolveSchema(entity);
    if (!schema) {
      return c.json({ success: false, message: `Schema not found for entity: ${entity}` }, 404);
    }
    const data = await c.req.json();
    const result = schema.validate(data);
    return c.json({ success: true, data: result });
  } catch (error3) {
    return c.json({ success: false, message: "Failed to validate data", error: error3.message }, 500);
  }
});
var schema_default = app12;

// worker/routes/dashboard.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app13 = new Hono2();
app13.use("*", authenticateToken);
var POWER_COLUMNS = [
  "active_energy",
  "active_energy_export",
  "apparent_energy",
  "apparent_energy_export",
  "apparent_power",
  "apparent_power_phase_a",
  "apparent_power_phase_b",
  "apparent_power_phase_c",
  "current",
  "current_line_a",
  "current_line_b",
  "current_line_c",
  "frequency",
  "maximum_demand_real",
  "power",
  "power_factor",
  "power_factor_phase_a",
  "power_factor_phase_b",
  "power_factor_phase_c",
  "power_phase_a",
  "power_phase_b",
  "power_phase_c",
  "reactive_energy",
  "reactive_energy_export",
  "reactive_power",
  "reactive_power_phase_a",
  "reactive_power_phase_b",
  "reactive_power_phase_c",
  "voltage_a_b",
  "voltage_a_n",
  "voltage_b_c",
  "voltage_b_n",
  "voltage_c_a",
  "voltage_c_n",
  "voltage_p_n",
  "voltage_p_p",
  "voltage_thd",
  "voltage_thd_phase_a",
  "voltage_thd_phase_b",
  "voltage_thd_phase_c"
];
app13.get("/cards", requirePermission("dashboard:read"), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || "1") || 1;
    const limit = parseInt(qs.limit || "25") || 25;
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    }
    const where = {};
    if (qs.search) {
      where.card_name = qs.search;
    }
    const result = await findAll(c.env, {
      table: "dashboard_card",
      primaryKey: "dashboard_card_id",
      tenantId,
      page,
      limit,
      where,
      search: qs.search || void 0,
      searchFields: ["card_name"],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder
    });
    const items = result.rows.map((card, index) => {
      const cardIndex = (page - 1) * limit + index;
      return {
        ...card,
        dashboard_id: card.dashboard_card_id || card.id,
        grid_x: card.grid_x ?? 0,
        grid_y: card.grid_y ?? cardIndex * 520,
        grid_w: card.grid_w ?? 500,
        grid_h: card.grid_h ?? 500
      };
    });
    return c.json({
      success: true,
      data: {
        items,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error3) {
    console.error("Error fetching cards:", error3);
    return c.json({ success: false, message: "Failed to fetch dashboard cards" }, 500);
  }
});
app13.get("/cards/:id", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    return c.json({
      success: true,
      data: {
        ...card,
        dashboard_id: card.dashboard_card_id,
        grid_x: card.grid_x ?? 0,
        grid_y: card.grid_y ?? 0,
        grid_w: card.grid_w ?? 500,
        grid_h: card.grid_h ?? 500
      }
    });
  } catch (error3) {
    console.error("Error fetching card:", error3);
    return c.json({ success: false, message: "Failed to fetch dashboard card" }, 500);
  }
});
app13.get("/cards/:id/data", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    const selectedColumns = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    if (selectedColumns.length === 0) {
      return c.json({ success: true, data: { card_id: card.dashboard_card_id, aggregated_values: {}, grouped_data: [] } });
    }
    const now = /* @__PURE__ */ new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;
    const aggCols = selectedColumns.map((col) => `AVG("${col}") as "avg_${col}", MIN("${col}") as "min_${col}", MAX("${col}") as "max_${col}"`).join(", ");
    const aggSql = `SELECT ${aggCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4`;
    const aggResult = await query(c.env, aggSql, [tenantId, card.meter_element_id, startDate, endDate]);
    const groupCols = selectedColumns.map((col) => `AVG("${col}") as "${col}"`).join(", ");
    const groupSql = `SELECT DATE(created_at) as date, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE(created_at) ORDER BY DATE(created_at)`;
    const groupResult = await query(c.env, groupSql, [tenantId, card.meter_element_id, startDate, endDate]);
    return c.json({
      success: true,
      data: {
        card_id: card.dashboard_card_id,
        card_name: card.card_name,
        meter_element_id: card.meter_element_id,
        time_frame: {
          type: card.time_frame_type || "last_30_days",
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        selected_columns: selectedColumns,
        aggregated_values: aggResult.rows[0] || {},
        grouped_data: groupResult.rows,
        grouping_type: card.grouping_type || "daily",
        visualization_type: card.visualization_type
      }
    });
  } catch (error3) {
    console.error("Error fetching aggregated data:", error3);
    return c.json({ success: false, message: "Failed to fetch aggregated card data" }, 500);
  }
});
app13.post("/cards", requirePermission("dashboard:create"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    const user = c.get("user");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const body = await c.req.json();
    if (body.meter_id) {
      const meter = await findById(c.env, "meter", "meter_id", body.meter_id, tenantId);
      if (!meter) return c.json({ success: false, message: "Meter not found", errors: [{ field: "meter_id", message: "Meter does not exist" }] }, 400);
    }
    if (body.meter_element_id) {
      const me = await findById(c.env, "meter_element", "meter_element_id", body.meter_element_id);
      if (!me) return c.json({ success: false, message: "Meter element not found", errors: [{ field: "meter_element_id", message: "Meter element does not exist" }] }, 400);
      if (me.meter_id !== body.meter_id) {
        return c.json({ success: false, message: "Validation failed", errors: [{ field: "meter_element_id", message: "Meter element does not belong to the selected meter" }] }, 400);
      }
    }
    if (!body.selected_columns || Array.isArray(body.selected_columns) && body.selected_columns.length === 0) {
      return c.json({ success: false, message: "Validation failed", errors: [{ field: "selected_columns", message: "At least one power column must be selected" }] }, 400);
    }
    const invalidCols = (body.selected_columns || []).filter((col) => !POWER_COLUMNS.includes(col));
    if (invalidCols.length > 0) {
      return c.json({ success: false, message: "Validation failed", errors: [{ field: "selected_columns", message: `Invalid columns: ${invalidCols.join(", ")}` }] }, 400);
    }
    const existingCards = await findAll(c.env, {
      table: "dashboard_card",
      primaryKey: "dashboard_card_id",
      tenantId,
      limit: 1e3
    });
    const nextIndex = existingCards.rows.length;
    const cardData = {
      ...body,
      tenant_id: tenantId,
      created_by_users_id: user?.users_id,
      grid_x: body.grid_x !== void 0 ? body.grid_x : 0,
      grid_y: body.grid_y !== void 0 ? body.grid_y : nextIndex * 520,
      grid_w: body.grid_w !== void 0 ? body.grid_w : 500,
      grid_h: body.grid_h !== void 0 ? body.grid_h : 500
    };
    const card = await create(c.env, "dashboard_card", cardData);
    return c.json({
      success: true,
      data: {
        ...card,
        dashboard_id: card.dashboard_card_id
      }
    }, 201);
  } catch (error3) {
    console.error("Error creating card:", error3);
    return c.json({ success: false, message: "Failed to create dashboard card" }, 500);
  }
});
app13.put("/cards/:id", requirePermission("dashboard:update"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    const body = await c.req.json();
    if (body.selected_columns !== void 0) {
      if (!Array.isArray(body.selected_columns) || body.selected_columns.length === 0) {
        return c.json({ success: false, message: "Validation failed", errors: [{ field: "selected_columns", message: "At least one power column must be selected" }] }, 400);
      }
      const invalidCols = body.selected_columns.filter((col) => !POWER_COLUMNS.includes(col));
      if (invalidCols.length > 0) {
        return c.json({ success: false, message: "Validation failed", errors: [{ field: "selected_columns", message: `Invalid columns: ${invalidCols.join(", ")}` }] }, 400);
      }
    }
    delete body.tenant_id;
    delete body.created_by_users_id;
    const updated = await update(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), body);
    return c.json({
      success: true,
      data: {
        ...updated,
        dashboard_id: updated.dashboard_card_id,
        grid_x: updated.grid_x ?? 0,
        grid_y: updated.grid_y ?? 0,
        grid_w: updated.grid_w ?? 500,
        grid_h: updated.grid_h ?? 500
      }
    });
  } catch (error3) {
    console.error("Error updating card:", error3);
    return c.json({ success: false, message: "Failed to update dashboard card" }, 500);
  }
});
app13.delete("/cards/:id", requirePermission("dashboard:delete"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    await remove(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"));
    return c.json({ success: true, message: "Dashboard card deleted successfully" });
  } catch (error3) {
    console.error("Error deleting card:", error3);
    return c.json({ success: false, message: "Failed to delete dashboard card" }, 500);
  }
});
app13.get("/cards/:id/readings", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const qs = c.req.query();
    const page = Math.max(1, parseInt(qs.page || "1") || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(qs.pageSize || "50") || 50));
    const sortBy = qs.sortBy || "created_at";
    const sortOrder = (qs.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    const now = /* @__PURE__ */ new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;
    const selectedColumns = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    const columnsList = ["meter_reading_id", "created_at", ...selectedColumns];
    const validSortColumns = ["meter_reading_id", "created_at", "updated_at", "meter_id", "meter_element_id", ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    const countResult = await query(
      c.env,
      "SELECT COUNT(*) as total FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4",
      [tenantId, card.meter_element_id, startDate, endDate]
    );
    const total = parseInt(countResult.rows[0]?.total || "0");
    const totalPages = Math.ceil(total / pageSize);
    const sql = `SELECT ${columnsList.map((col) => `"${col}"`).join(", ")} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY "${safeSortBy}" ${sortOrder} LIMIT $5 OFFSET $6`;
    const result = await query(c.env, sql, [tenantId, card.meter_element_id, startDate, endDate, pageSize, (page - 1) * pageSize]);
    return c.json({
      success: true,
      data: {
        items: result.rows,
        pagination: { page, pageSize, total, totalPages, hasMore: page < totalPages },
        metadata: {
          card_id: card.dashboard_card_id,
          card_name: card.card_name,
          meter_element_id: card.meter_element_id,
          time_frame: { type: card.time_frame_type || "last_30_days", start: startDate.toISOString(), end: endDate.toISOString() },
          selected_columns: selectedColumns,
          sort_by: safeSortBy,
          sort_order: sortOrder
        }
      }
    });
  } catch (error3) {
    console.error("Error fetching meter readings:", error3);
    return c.json({ success: false, message: "Failed to fetch meter readings" }, 500);
  }
});
app13.get("/cards/:id/readings/export", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const qs = c.req.query();
    const sortBy = qs.sortBy || "created_at";
    const sortOrder = (qs.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const card = await findById(c.env, "dashboard_card", "dashboard_card_id", c.req.param("id"), tenantId);
    if (!card) return c.json({ success: false, message: "Dashboard card not found" }, 404);
    const now = /* @__PURE__ */ new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;
    const selectedColumns = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    const columnsList = ["meter_reading_id", "created_at", ...selectedColumns];
    const validSortColumns = ["meter_reading_id", "created_at", ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    const sql = `SELECT ${columnsList.map((col) => `"${col}"`).join(", ")} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY "${safeSortBy}" ${sortOrder}`;
    const result = await query(c.env, sql, [tenantId, card.meter_element_id, startDate, endDate]);
    const escapeCSV = /* @__PURE__ */ __name((v) => {
      if (v === null || v === void 0) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }, "escapeCSV");
    const headers = columnsList.map((col) => col.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
    const metadata = [
      ["Meter Reading Export"],
      ["Card Name", card.card_name],
      ["Meter Element ID", card.meter_element_id],
      ["Time Frame", `${startDate.toISOString()} to ${endDate.toISOString()}`],
      ["Export Date", (/* @__PURE__ */ new Date()).toISOString()],
      ["Total Records", result.rows.length],
      []
    ];
    const csvRows = [
      ...metadata.map((row) => row.map(escapeCSV).join(",")),
      headers.join(","),
      ...result.rows.map((row) => columnsList.map((col) => escapeCSV(row[col])).join(","))
    ];
    const csv = csvRows.join("\n");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const filename = `${(card.card_name || "export").replace(/\s+/g, "_")}_${timestamp}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error3) {
    console.error("Error exporting meter readings:", error3);
    return c.json({ success: false, message: "Failed to export meter readings" }, 500);
  }
});
app13.get("/meters", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const result = await query(
      c.env,
      "SELECT meter_id as id, name FROM meter WHERE tenant_id = $1 ORDER BY name ASC",
      [tenantId]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching meters:", error3);
    return c.json({ success: false, message: "Failed to fetch meters" }, 500);
  }
});
app13.get("/meters/:meterId/elements", requirePermission("dashboard:read"), async (c) => {
  try {
    const tenantId = c.get("tenantId");
    if (!tenantId) return c.json({ success: false, message: "User must have a valid tenant_id" }, 400);
    const meterId = parseInt(c.req.param("meterId"));
    if (isNaN(meterId)) return c.json({ success: false, message: "Invalid meter ID" }, 400);
    const meterResult = await query(c.env, "SELECT meter_id, tenant_id FROM meter WHERE meter_id = $1", [meterId]);
    if (meterResult.rows.length === 0) return c.json({ success: false, message: "Meter not found" }, 404);
    if (meterResult.rows[0].tenant_id !== tenantId) return c.json({ success: false, message: "You do not have permission to access this meter" }, 403);
    const result = await query(
      c.env,
      "SELECT meter_element_id, meter_id, element, name FROM meter_element WHERE meter_id = $1 AND tenant_id = $2 ORDER BY element ASC",
      [meterId, tenantId]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching meter elements:", error3);
    return c.json({ success: false, message: "Failed to fetch meter elements" }, 500);
  }
});
app13.get("/power-columns", requirePermission("dashboard:read"), async (c) => {
  try {
    const result = await query(
      c.env,
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'meter_reading'
         AND data_type IN ('numeric', 'double precision', 'real', 'integer', 'bigint')
         AND column_name NOT IN ('meter_reading_id', 'tenant_id', 'meter_id', 'meter_element_id')
       ORDER BY ordinal_position`
    );
    const columns = result.rows.length > 0 ? result.rows.map((r) => ({
      name: r.column_name,
      label: r.column_name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      type: "numeric"
    })) : POWER_COLUMNS.map((col) => ({
      name: col,
      label: col.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      type: "numeric"
    }));
    return c.json({
      success: true,
      data: columns,
      meta: { count: columns.length }
    });
  } catch (error3) {
    console.error("Error discovering power columns:", error3);
    return c.json({ success: false, message: "Failed to discover power columns" }, 500);
  }
});
app13.get("/power-columns/cache/invalidate", requirePermission("dashboard:admin"), (c) => {
  return c.json({ success: true, message: "Power columns cache invalidated (no-op on worker)" });
});
app13.get("/power-columns/cache/stats", requirePermission("dashboard:read"), (c) => {
  return c.json({ success: true, data: { cached: false, message: "No cache on worker deployment" } });
});
var dashboard_default = app13;

// worker/routes/favorites.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app14 = new Hono2();
app14.use("*", authenticateToken);
function transformMetersWithElements(rows) {
  const metersMap = {};
  rows.forEach((row) => {
    if (!metersMap[row.meter_id]) {
      metersMap[row.meter_id] = {
        id: row.meter_id,
        name: row.meter_name,
        elements: []
      };
    }
    if (row.meter_element_id) {
      metersMap[row.meter_id].elements.push({
        meter_element_id: row.meter_element_id,
        element: row.element,
        name: row.name,
        favorite_name: row.favorite_name,
        is_favorited: row.is_favorited,
        favorite_id: row.favorite_id
      });
    }
  });
  return Object.values(metersMap);
}
__name(transformMetersWithElements, "transformMetersWithElements");
app14.get("/meters", async (c) => {
  try {
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get("tenantId"));
    const users_id = qs.users_id;
    if (!users_id) return c.json({ success: false, message: "users_id is required" }, 400);
    if (!tenant_id) return c.json({ success: false, message: "tenant_id is required" }, 400);
    const sql = `
      SELECT
        m.meter_id,
        m.name as meter_name,
        me.meter_element_id,
        me.element,
        me.name,
        CASE
          WHEN me.meter_element_id IS NOT NULL THEN
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name,
        CASE WHEN f.favorite_id IS NOT NULL THEN true ELSE false END as is_favorited,
        f.favorite_id
      FROM public.meter m
      LEFT JOIN public.meter_element me ON m.meter_id = me.meter_id AND me.tenant_id = $1
      LEFT JOIN public.favorite f ON
        f.id1 = me.meter_id
        AND f.id2 = me.meter_element_id
        AND f.table_name = 'meter'
        AND f.tenant_id = $1
        AND f.users_id = $2
      WHERE m.tenant_id = $1
      ORDER BY m.name ASC, me.element ASC
    `;
    const result = await query(c.env, sql, [tenant_id, users_id]);
    const meters = transformMetersWithElements(result.rows);
    return c.json({ success: true, data: meters });
  } catch (error3) {
    console.error("Error fetching meters with elements:", error3);
    return c.json({ success: false, message: "Failed to fetch meters with elements", error: error3.message }, 500);
  }
});
app14.get("/", async (c) => {
  try {
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get("tenantId"));
    const users_id = qs.users_id;
    const table_name = qs.table_name;
    if (!users_id) return c.json({ success: false, message: "users_id is required" }, 400);
    if (!tenant_id) return c.json({ success: false, message: "tenant_id is required" }, 400);
    let sql = `
      SELECT
        f.favorite_id,
        f.tenant_id,
        f.users_id,
        f.table_name,
        f.id1,
        f.id2,
        f.order_by,
        m.name as meter_name,
        me.element,
        me.name as element_name,
        CASE
          WHEN me.meter_element_id IS NOT NULL THEN
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name
      FROM public.favorite f
      LEFT JOIN public.meter m ON f.id1 = m.meter_id AND m.tenant_id = $1
      LEFT JOIN public.meter_element me ON f.id1 = me.meter_id AND f.id2 = me.meter_element_id AND me.tenant_id = $1
      WHERE f.tenant_id = $1 AND f.users_id = $2
    `;
    const params = [tenant_id, users_id];
    if (table_name) {
      sql += " AND f.table_name = $3";
      params.push(table_name);
    }
    sql += " ORDER BY COALESCE(f.order_by, 999999) ASC, f.favorite_id ASC";
    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching favorites:", error3);
    return c.json({ success: false, message: "Failed to fetch favorites", error: error3.message }, 500);
  }
});
app14.put("/order", async (c) => {
  try {
    const { tenant_id, users_id, order } = await c.req.json();
    if (!tenant_id || !users_id || !Array.isArray(order)) {
      return c.json({ success: false, message: "tenant_id, users_id, and order array are required" }, 400);
    }
    await transaction(c.env, async (client) => {
      for (const item of order) {
        await client.query(
          "UPDATE public.favorite SET order_by = $1 WHERE favorite_id = $2 AND tenant_id = $3 AND users_id = $4",
          [item.order_by, item.favorite_id, tenant_id, users_id]
        );
      }
    });
    return c.json({ success: true, message: "Favorite order updated successfully" });
  } catch (error3) {
    console.error("Error updating favorite order:", error3);
    return c.json({ success: false, message: "Failed to update favorite order", error: error3.message }, 500);
  }
});
app14.post("/", async (c) => {
  try {
    const { tenant_id, users_id, table_name, id1, id2 } = await c.req.json();
    const id2Value = id2 !== void 0 && id2 !== null ? parseInt(id2, 10) : 0;
    if (!users_id || !table_name || !id1) {
      return c.json({ success: false, message: "users_id, table_name, and id1 (meter_id) are required" }, 400);
    }
    if (!tenant_id) {
      return c.json({ success: false, message: "tenant_id is required" }, 400);
    }
    const existingResult = await query(
      c.env,
      "SELECT * FROM public.favorite WHERE tenant_id = $1 AND users_id = $2 AND table_name = $3 AND id1 = $4 AND id2 = $5",
      [tenant_id, users_id, table_name, id1, id2Value]
    );
    if (existingResult.rows.length > 0) {
      return c.json({ success: false, message: "Favorite already exists", data: existingResult.rows[0] }, 409);
    }
    const maxOrderResult = await query(
      c.env,
      "SELECT COALESCE(MAX(order_by), 0) + 1 as next_order FROM public.favorite WHERE tenant_id = $1 AND users_id = $2",
      [tenant_id, users_id]
    );
    const nextOrder = maxOrderResult.rows[0].next_order;
    const result = await query(
      c.env,
      "INSERT INTO public.favorite (tenant_id, users_id, table_name, id1, id2, order_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [tenant_id, users_id, table_name, id1, id2Value, nextOrder]
    );
    return c.json({ success: true, message: "Favorite created successfully", data: result.rows[0] }, 201);
  } catch (error3) {
    console.error("Error creating favorite:", error3);
    return c.json({ success: false, message: "Failed to create favorite", error: error3.message }, 500);
  }
});
app14.delete("/:favoriteId", async (c) => {
  try {
    const favoriteId = c.req.param("favoriteId");
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get("tenantId"));
    if (!favoriteId) return c.json({ success: false, message: "favoriteId is required" }, 400);
    if (!tenant_id) return c.json({ success: false, message: "tenant_id is required" }, 400);
    const result = await query(
      c.env,
      "DELETE FROM public.favorite WHERE favorite_id = $1 AND tenant_id = $2 RETURNING *",
      [favoriteId, tenant_id]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Favorite not found" }, 404);
    }
    return c.json({ success: true, message: "Favorite deleted successfully", data: result.rows[0] });
  } catch (error3) {
    console.error("Error deleting favorite:", error3);
    return c.json({ success: false, message: "Failed to delete favorite", error: error3.message }, 500);
  }
});
var favorites_default = app14;

// worker/routes/reports.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app15 = new Hono2();
app15.use("*", authenticateToken);
function isValidCronExpression(expr) {
  if (!expr || typeof expr !== "string") return false;
  const parts = expr.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 7;
}
__name(isValidCronExpression, "isValidCronExpression");
function validateEmailList(emails) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = emails.filter((e) => !emailRegex.test(e));
  return { isValid: invalid.length === 0, invalidEmails: invalid };
}
__name(validateEmailList, "validateEmailList");
app15.post("/", async (c) => {
  try {
    const { name, type, schedule, recipients, config: config2 } = await c.req.json();
    const errors = [];
    if (!name || typeof name !== "string" || name.trim().length === 0) errors.push("Report name is required");
    else if (name.length > 255) errors.push("Report name must not exceed 255 characters");
    if (!type || typeof type !== "string" || type.trim().length === 0) errors.push("Report type is required");
    if (!schedule || !isValidCronExpression(schedule)) errors.push("Report schedule must be a valid cron expression");
    if (!Array.isArray(recipients) || recipients.length === 0) {
      errors.push("At least one recipient is required");
    } else {
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) errors.push(`Invalid emails: ${emailValidation.invalidEmails.join(", ")}`);
    }
    if (errors.length > 0) {
      return c.json({ success: false, message: "Validation failed", errors }, 400);
    }
    const now = /* @__PURE__ */ new Date();
    const result = await query(
      c.env,
      `INSERT INTO public.report (name, type, schedule, recipients, config, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING report_id, name, type, schedule, recipients, config, active , created_at, updated_at`,
      [name.trim(), type.trim(), schedule.trim(), JSON.stringify(recipients), JSON.stringify(config2 || {}), true, now, now]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: "Failed to create report" }, 500);
    }
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error3) {
    if (error3.code === "23505") return c.json({ success: false, message: "Report name already exists" }, 409);
    if (error3.code === "23502") return c.json({ success: false, message: "Missing required fields" }, 400);
    console.error("Error creating report:", error3);
    return c.json({ success: false, message: "Failed to create report" }, 500);
  }
});
app15.get("/", async (c) => {
  try {
    const qs = c.req.query();
    let page = parseInt(qs.page || "1") || 1;
    let limit = parseInt(qs.limit || "10") || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;
    const countResult = await query(c.env, "SELECT COUNT(*) as total FROM public.report");
    const total = parseInt(countResult.rows[0].total, 10);
    const result = await query(
      c.env,
      `SELECT report_id, name, type, schedule, recipients, config, active , created_at, updated_at
       FROM public.report ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return c.json({
      success: true,
      data: {
        items: result.rows,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error3) {
    console.error("Error retrieving reports:", error3);
    return c.json({ success: false, message: "Failed to retrieve reports" }, 500);
  }
});
app15.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (isNaN(Number(id))) return c.json({ success: false, message: "Invalid report ID format" }, 400);
    const result = await query(
      c.env,
      `SELECT report_id, name, type, schedule, recipients, config, active, created_at, updated_at
       FROM public.report WHERE report_id = $1`,
      [id]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error3) {
    console.error("Error retrieving report:", error3);
    return c.json({ success: false, message: "Failed to retrieve report" }, 500);
  }
});
app15.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (isNaN(Number(id))) return c.json({ success: false, message: "Invalid report ID format" }, 400);
    const existing = await query(c.env, "SELECT report_id FROM public.report WHERE report_id = $1", [id]);
    if (existing.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    const { name, type, schedule, recipients, config: config2 } = await c.req.json();
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (name !== void 0) {
      if (typeof name !== "string" || name.trim().length === 0) return c.json({ success: false, message: "Validation failed", errors: ["Report name must be a non-empty string"] }, 400);
      if (name.length > 255) return c.json({ success: false, message: "Validation failed", errors: ["Report name must not exceed 255 characters"] }, 400);
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }
    if (type !== void 0) {
      if (typeof type !== "string" || type.trim().length === 0) return c.json({ success: false, message: "Validation failed", errors: ["Report type must be a non-empty string"] }, 400);
      updates.push(`type = $${paramCount}`);
      values.push(type.trim());
      paramCount++;
    }
    if (schedule !== void 0) {
      if (!isValidCronExpression(schedule)) return c.json({ success: false, message: "Validation failed", errors: ["Invalid cron expression"] }, 400);
      updates.push(`schedule = $${paramCount}`);
      values.push(schedule.trim());
      paramCount++;
    }
    if (recipients !== void 0) {
      if (!Array.isArray(recipients) || recipients.length === 0) return c.json({ success: false, message: "Validation failed", errors: ["Recipients must be a non-empty array"] }, 400);
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) return c.json({ success: false, message: "Validation failed", errors: [`Invalid emails: ${emailValidation.invalidEmails.join(", ")}`] }, 400);
      updates.push(`recipients = $${paramCount}`);
      values.push(JSON.stringify(recipients));
      paramCount++;
    }
    if (config2 !== void 0) {
      if (typeof config2 !== "object" || config2 === null) return c.json({ success: false, message: "Validation failed", errors: ["Config must be an object"] }, 400);
      updates.push(`config = $${paramCount}`);
      values.push(JSON.stringify(config2));
      paramCount++;
    }
    if (updates.length === 0) {
      const result2 = await query(c.env, "SELECT * FROM public.report WHERE report_id = $1", [id]);
      return c.json({ success: true, data: result2.rows[0] });
    }
    updates.push(`updated_at = $${paramCount}`);
    values.push(/* @__PURE__ */ new Date());
    paramCount++;
    values.push(id);
    const result = await query(
      c.env,
      `UPDATE public.report SET ${updates.join(", ")} WHERE report_id = $${paramCount} RETURNING report_id, name, type, schedule, recipients, config, active, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) return c.json({ success: false, message: "Failed to update report" }, 500);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error3) {
    if (error3.code === "23505") return c.json({ success: false, message: "Report name already exists" }, 409);
    console.error("Error updating report:", error3);
    return c.json({ success: false, message: "Failed to update report" }, 500);
  }
});
app15.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (isNaN(Number(id))) return c.json({ success: false, message: "Invalid report ID format" }, 400);
    const existing = await query(c.env, "SELECT report_id, name FROM public.report WHERE report_id = $1", [id]);
    if (existing.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    await query(c.env, "DELETE FROM public.report WHERE report_id = $1", [id]);
    return c.json({ success: true, message: "Report deleted successfully" });
  } catch (error3) {
    console.error("Error deleting report:", error3);
    return c.json({ success: false, message: "Failed to delete report" }, 500);
  }
});
app15.patch("/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");
    if (isNaN(Number(id))) return c.json({ success: false, message: "Invalid report ID format" }, 400);
    const getResult = await query(c.env, "SELECT report_id, name, active FROM public.report WHERE report_id = $1", [id]);
    if (getResult.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    const newActive = !getResult.rows[0].active;
    const result = await query(
      c.env,
      "UPDATE public.report SET active = $1, updated_at = $2 WHERE report_id = $3 RETURNING report_id, name, active, updated_at",
      [newActive, /* @__PURE__ */ new Date(), id]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: "Failed to toggle report status" }, 500);
    return c.json({
      success: true,
      data: {
        id: result.rows[0].report_id,
        name: result.rows[0].name,
        active: result.rows[0].active,
        updated_at: result.rows[0].updated_at
      }
    });
  } catch (error3) {
    console.error("Error toggling report status:", error3);
    return c.json({ success: false, message: "Failed to toggle report status" }, 500);
  }
});
app15.get("/:id/history", async (c) => {
  try {
    const id = c.req.param("id");
    if (isNaN(Number(id))) return c.json({ success: false, message: "Invalid report ID format" }, 400);
    const qs = c.req.query();
    let page = parseInt(qs.page || "1") || 1;
    let limit = parseInt(qs.limit || "10") || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;
    const reportCheck = await query(c.env, "SELECT report_id FROM public.report WHERE report_id = $1", [id]);
    if (reportCheck.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    let countSql = "SELECT COUNT(*) as total FROM public.report_history WHERE report_id = $1";
    let historySql = "SELECT report_history_id, report_id, executed_at, status, error_message, created_at FROM public.report_history WHERE report_id = $1";
    const countParams = [id];
    const historyParams = [id];
    if (qs.startDate) {
      const start = new Date(qs.startDate);
      if (isNaN(start.getTime())) return c.json({ success: false, message: "Invalid startDate format" }, 400);
      countSql += " AND executed_at >= $2";
      historySql += " AND executed_at >= $2";
      countParams.push(start);
      historyParams.push(start);
    }
    if (qs.endDate) {
      const end = new Date(qs.endDate);
      if (isNaN(end.getTime())) return c.json({ success: false, message: "Invalid endDate format" }, 400);
      const idx = countParams.length + 1;
      countSql += ` AND executed_at < $${idx}`;
      historySql += ` AND executed_at < $${idx}`;
      countParams.push(end);
      historyParams.push(end);
    }
    const countResult = await query(c.env, countSql, countParams);
    const total = parseInt(countResult.rows[0].total, 10);
    const paramIdx = historyParams.length + 1;
    historySql += ` ORDER BY executed_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    historyParams.push(limit, offset);
    const historyResult = await query(c.env, historySql, historyParams);
    return c.json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error3) {
    console.error("Error retrieving report history:", error3);
    return c.json({ success: false, message: "Failed to retrieve report history" }, 500);
  }
});
app15.get("/:id/history/:historyId/emails", async (c) => {
  try {
    const id = c.req.param("id");
    const historyId = c.req.param("historyId");
    if (isNaN(Number(id)) || isNaN(Number(historyId))) {
      return c.json({ success: false, message: "Invalid report ID or history ID format" }, 400);
    }
    const reportCheck = await query(c.env, "SELECT report_id FROM public.report WHERE report_id = $1", [id]);
    if (reportCheck.rows.length === 0) return c.json({ success: false, message: "Report not found" }, 404);
    const historyCheck = await query(c.env, "SELECT report_history_id FROM public.report_history WHERE report_history_id = $1 AND report_id = $2", [historyId, id]);
    if (historyCheck.rows.length === 0) return c.json({ success: false, message: "History entry not found" }, 404);
    const result = await query(
      c.env,
      `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
       FROM public.report_email_logs WHERE report_history_id = $1 ORDER BY sent_at DESC`,
      [historyId]
    );
    return c.json({ success: true, data: { emails: result.rows } });
  } catch (error3) {
    console.error("Error retrieving email logs:", error3);
    return c.json({ success: false, message: "Failed to retrieve email logs" }, 500);
  }
});
var reports_default = app15;

// worker/routes/emailLogs.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app16 = new Hono2();
app16.use("*", authenticateToken);
app16.get("/search", async (c) => {
  try {
    const { recipient, page: pageStr, limit: limitStr } = c.req.query();
    if (!recipient || recipient.trim().length === 0) {
      return c.json({ success: false, message: "Recipient parameter is required" }, 400);
    }
    let page = parseInt(pageStr || "1", 10);
    let limit = parseInt(limitStr || "10", 10);
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;
    const countResult = await query(
      c.env,
      `SELECT COUNT(*) as total FROM public.report_email_logs WHERE recipient ILIKE $1`,
      [`%${recipient}%`]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const emailsResult = await query(
      c.env,
      `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
       FROM public.report_email_logs WHERE recipient ILIKE $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3`,
      [`%${recipient}%`, limit, offset]
    );
    return c.json({
      success: true,
      data: {
        emails: emailsResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error3) {
    console.error("Error searching email logs:", error3);
    return c.json({ success: false, message: "Failed to search email logs" }, 500);
  }
});
app16.get("/export", async (c) => {
  try {
    const { format = "csv", reportId, startDate, endDate } = c.req.query();
    if (format && !["csv", "json"].includes(format)) {
      return c.json({ success: false, message: 'Format must be either "csv" or "json"' }, 400);
    }
    let sql = `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
               FROM public.report_email_logs WHERE 1=1`;
    const params = [];
    let paramCount = 1;
    if (reportId) {
      sql += ` AND report_id = $${paramCount}`;
      params.push(reportId);
      paramCount++;
    }
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return c.json({ success: false, message: "Invalid startDate format" }, 400);
      sql += ` AND sent_at >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) return c.json({ success: false, message: "Invalid endDate format" }, 400);
      sql += ` AND sent_at < $${paramCount}`;
      params.push(end);
      paramCount++;
    }
    sql += " ORDER BY sent_at DESC";
    const result = await query(c.env, sql, params);
    const emailLogs = result.rows;
    if (format === "json") {
      return c.json({ success: true, data: { emails: emailLogs, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), count: emailLogs.length } });
    }
    const headers = ["ID", "Report ID", "History ID", "Recipient", "Sent At", "Status", "Error Details", "Created At"];
    const rows = emailLogs.map((log3) => [
      log3.report_email_logs_id,
      log3.report_id,
      log3.report_history_id,
      log3.recipient,
      log3.sent_at,
      log3.status,
      log3.error_details ? `"${log3.error_details.replace(/"/g, '""')}"` : "",
      log3.created_at
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="email-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`
      }
    });
  } catch (error3) {
    console.error("Error exporting email logs:", error3);
    return c.json({ success: false, message: "Failed to export email logs" }, 500);
  }
});
var emailLogs_default = app16;

// worker/routes/aiSearch.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app17 = new Hono2();
app17.use("*", authenticateToken);
app17.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { query: searchQuery, limit = 20, offset = 0 } = body;
    const tenantId = c.get("tenantId");
    if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
      return c.json({ success: false, error: { code: "INVALID_QUERY", message: "Query is required and must be a non-empty string" } }, 400);
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      return c.json({ success: false, error: { code: "INVALID_LIMIT", message: "Limit must be a positive integer" } }, 400);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return c.json({ success: false, error: { code: "INVALID_OFFSET", message: "Offset must be a non-negative integer" } }, 400);
    }
    const startTime = Date.now();
    const devicesResult = await query(
      c.env,
      `SELECT device_id as id, tenant_id as "tenantId", name, type, location, status, metadata
       FROM public.device WHERE tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    const devices = devicesResult.rows || [];
    if (devices.length === 0) {
      return c.json({ success: true, data: { results: [], total: 0, clarifications: [], executionTime: Date.now() - startTime } });
    }
    const metersResult = await query(
      c.env,
      `SELECT meter_id as id, tenant_id as "tenantId", device_id as "deviceId", name, unit, type
       FROM public.meter WHERE tenant_id = $1`,
      [tenantId]
    );
    const meters = metersResult.rows || [];
    const readingsResult = await query(
      c.env,
      `SELECT mr.meter_id as "meterId", mr.value, mr.timestamp, mr.quality
       FROM public.meter_reading mr WHERE mr.tenant_id = $1 AND mr.timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY mr.meter_id, mr.timestamp DESC`,
      [tenantId]
    );
    const readings = readingsResult.rows || [];
    const readingsByDevice = /* @__PURE__ */ new Map();
    devices.forEach((device) => {
      const deviceReadings = readings.filter((r) => {
        const meter = meters.find((m) => m.id === r.meterId);
        return meter && meter.deviceId === device.id;
      });
      readingsByDevice.set(device.id, deviceReadings || []);
    });
    const queryLower = searchQuery.toLowerCase();
    const scoredDevices = devices.map((device) => {
      let score = 0;
      const nameLower = device.name.toLowerCase();
      if (nameLower === queryLower) score += 10;
      else if (nameLower.includes(queryLower)) score += 5;
      if (device.type && device.type.toLowerCase().includes(queryLower)) score += 3;
      if (device.location && device.location.toLowerCase().includes(queryLower)) score += 2;
      if (device.status && device.status.toLowerCase().includes(queryLower)) score += 1;
      return { device, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    const results = [];
    for (let i = offset; i < Math.min(offset + limit, scoredDevices.length); i++) {
      const { device, score } = scoredDevices[i];
      const deviceReadings = readingsByDevice.get(device.id) || [];
      const latestReading = deviceReadings.length > 0 ? deviceReadings[0] : { value: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      results.push({
        id: device.id,
        name: device.name,
        type: "device",
        location: device.location || "Unknown",
        currentConsumption: latestReading.value || 0,
        unit: "kWh",
        status: device.status || "unknown",
        relevanceScore: Math.min(score / 10, 1),
        lastReading: { value: latestReading.value || 0, timestamp: latestReading.timestamp || (/* @__PURE__ */ new Date()).toISOString() }
      });
    }
    return c.json({ success: true, data: { results, total: devices.length, clarifications: [], executionTime: Date.now() - startTime } });
  } catch (error3) {
    console.error("[AI_SEARCH] Error:", error3.message);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: "An error occurred while processing your search" } }, 500);
  }
});
var aiSearch_default = app17;

// worker/routes/registers.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app18 = new Hono2();
app18.use("*", authenticateToken);
app18.get("/", async (c) => {
  try {
    const result = await query(
      c.env,
      `SELECT register_id, number, name, unit, field_name FROM register ORDER BY number ASC`
    );
    return c.json({ success: true, data: result.rows });
  } catch (error3) {
    console.error("Error fetching registers:", error3);
    return c.json({ success: false, message: "Failed to fetch registers" }, 500);
  }
});
var registers_default = app18;

// worker/routes/deviceRegisters.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app19 = new Hono2();
app19.use("*", authenticateToken);
app19.get("/", async (c) => {
  try {
    const deviceId = c.req.param("deviceId");
    const deviceResult = await query(
      c.env,
      "SELECT device_id FROM device WHERE device_id = $1",
      [deviceId]
    );
    if (deviceResult.rows.length === 0) {
      return c.json({ success: false, message: "Device not found" }, 404);
    }
    const result = await query(
      c.env,
      `SELECT dr.device_register_id, dr.device_id, dr.register_id,
              r.register, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.register_id
       WHERE dr.device_id = $1
       ORDER BY r.register ASC`,
      [deviceId]
    );
    const data = result.rows.map((row) => ({
      device_register_id: row.device_register_id,
      register_id: row.register_id,
      device_id: row.device_id,
      register: {
        id: row.device_register_id,
        register: row.register,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name
      }
    }));
    return c.json({ success: true, data });
  } catch (error3) {
    console.error("Error fetching device registers:", error3);
    return c.json({ success: false, message: "Failed to fetch device registers" }, 500);
  }
});
var deviceRegisters_default = app19;

// worker/routes/upload.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var app20 = new Hono2();
app20.use("*", authenticateToken);
app20.post("/image", requirePermission("settings:update"), async (c) => {
  return c.json({
    success: false,
    message: "File uploads are not yet supported on this deployment. Use R2 storage integration for production file uploads."
  }, 501);
});
app20.delete("/image/:filename", requirePermission("settings:update"), async (c) => {
  return c.json({
    success: false,
    message: "File deletion is not yet supported on this deployment."
  }, 501);
});
var upload_default = app20;

// worker/index.ts
var app21 = new Hono2();
function getAllowedOrigins(env3) {
  const frontendUrl = env3.FRONTEND_URL || "https://meteritpro.com";
  return frontendUrl.split(",").map((s) => s.trim());
}
__name(getAllowedOrigins, "getAllowedOrigins");
app21.use("*", cors({
  origin: /* @__PURE__ */ __name((origin, c) => {
    const allowedOrigins = getAllowedOrigins(c.env);
    if (!origin) {
      return allowedOrigins[0];
    }
    const isAllowed = allowedOrigins.includes(origin);
    return isAllowed ? origin : allowedOrigins[0];
  }, "origin"),
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
  exposeHeaders: ["Content-Range", "X-Content-Range"]
}));
app21.onError((err, c) => {
  console.error("[WORKER] Unhandled error:", err);
  console.error("[WORKER] Error type:", err?.constructor?.name);
  console.error("[WORKER] Error message:", err?.message);
  const response = c.json({ success: false, message: "Internal server error" }, 500);
  const frontendUrl = c.env.FRONTEND_URL || "https://meteritpro.com";
  const allowedOrigins = frontendUrl.split(",").map((s) => s.trim());
  const origin = c.req.header("origin");
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return response;
});
app21.get("/api/health", async (c) => {
  try {
    const result = await query(c.env, "SELECT NOW()");
    return c.json({
      status: "OK",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: "Connected",
      serverTime: result.rows[0].now
    });
  } catch (error3) {
    return c.json({
      status: "Error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: "Disconnected",
      error: error3.message
    }, 500);
  }
});
app21.get("/swagger", (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MeterIt Pro Client API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
        <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/favicon-16x16.png" sizes="16x16" />
        <style>
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }
          *,
          *:before,
          *:after {
            box-sizing: inherit;
          }
          body {
            margin: 0;
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"><\/script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"><\/script>
        <script>
          window.onload = function() {
            window.ui = SwaggerUIBundle({
              urls: [ { url: "/swagger/spec.json", name: "MeterIt Pro Client API" } ],
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          };
        <\/script>
      </body>
    </html>
  `;
  return c.html(html);
});
app21.get("/swagger/spec.json", (c) => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "MeterIt Pro Client API",
      version: "1.0.0",
      description: "Cloudflare Workers-based API for MeterIt Pro"
    },
    servers: [
      { url: "https://meteritpro.com/api", description: "Production" },
      { url: "http://localhost:8787/api", description: "Local development" }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          tags: ["Health"],
          responses: { 200: { description: "OK" } }
        }
      },
      "/auth/login": {
        post: {
          summary: "User login",
          tags: ["Auth"],
          responses: { 200: { description: "Login successful" }, 401: { description: "Invalid credentials" } }
        }
      },
      "/users/me": {
        get: {
          summary: "Get current user",
          tags: ["Users"],
          responses: { 200: { description: "User data" }, 401: { description: "Unauthorized" } }
        }
      },
      "/meters": {
        get: {
          summary: "List meters",
          tags: ["Meters"],
          responses: { 200: { description: "List of meters" }, 401: { description: "Unauthorized" } }
        }
      },
      "/sync/connect": {
        post: {
          summary: "Connect sync client",
          tags: ["Sync"],
          responses: { 200: { description: "Connected" }, 401: { description: "Invalid credentials" } }
        }
      }
    }
  };
  return c.json(spec);
});
app21.route("/api/auth", auth_default);
app21.route("/api/users", users_default);
app21.route("/api/meters", meters_default);
app21.route("/api/location", locations_default);
app21.route("/api/contacts", contacts_default);
app21.route("/api/device", devices_default);
app21.route("/api/meterreadings", meterReadings_default);
app21.route("/api/settings", settings_default);
app21.route("/api/templates", templates_default);
app21.route("/api/emails", emails_default);
app21.route("/api/sync", sync_default);
app21.route("/api/schema", schema_default);
app21.route("/api/dashboard", dashboard_default);
app21.route("/api/favorites", favorites_default);
app21.route("/api/ai/search", aiSearch_default);
app21.route("/api/reports", reports_default);
app21.route("/api/email-logs", emailLogs_default);
app21.route("/api/registers", registers_default);
app21.route("/api/upload", upload_default);
app21.route("/api/meters/:meterId/elements", meterElements_default);
app21.route("/api/devices/:deviceId/registers", deviceRegisters_default);
app21.all("*", (c) => {
  return c.json({ success: false, message: "Route not found" }, 404);
});
var worker_default = app21;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-mgbiV3/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env3, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env3, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env3, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env3, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-mgbiV3/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env3, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env3, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env3, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env3, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env3, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env3, ctx) => {
      this.env = env3;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=index.js.map
