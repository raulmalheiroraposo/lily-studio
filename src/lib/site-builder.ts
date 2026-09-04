import type { Block, ProjectFile } from "./types";
import { DEFAULT_CHART_DATA, type ChartPoint } from "./chart-data";

const CHART_COLORS = ["#5da8ff", "#b48cff", "#66d9c2", "#ffb861", "#ff7d9c"];

/** Pure SVG renderer — also serialized into the exported site runtime. */
export function renderChartSvg(
  kind: string,
  w: number,
  h: number,
  CHART_DATA: ChartPoint[],
  CHART_COLORS: string[]
) {
  const W = Math.max(120, w - 16);
  const H = Math.max(80, h - 16);
  const max = Math.max(...CHART_DATA.map((d) => d.value), 1);
  const pad = 24;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const open = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" font-size="10">`;
  const axis = `<line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#888" /><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#888" />`;
  const labels = CHART_DATA.map((d, i) => {
    const x = pad + (innerW / CHART_DATA.length) * (i + 0.5);
    return `<text x="${x}" y="${H - pad + 12}" fill="#888" text-anchor="middle">${d.name}</text>`;
  }).join("");

  if (kind === "chart-bar") {
    const bw = (innerW / CHART_DATA.length) * 0.6;
    const bars = CHART_DATA.map((d, i) => {
      const bh = (d.value / max) * innerH;
      const x = pad + (innerW / CHART_DATA.length) * (i + 0.5) - bw / 2;
      return `<rect x="${x}" y="${H - pad - bh}" width="${bw}" height="${bh}" fill="#5da8ff" rx="2" />`;
    }).join("");
    return `${open}${axis}${bars}${labels}</svg>`;
  }

  if (kind === "chart-line") {
    const pts = CHART_DATA.map((d, i) => {
      const x = pad + (innerW / CHART_DATA.length) * (i + 0.5);
      const y = H - pad - (d.value / max) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const dots = CHART_DATA.map((d, i) => {
      const x = pad + (innerW / CHART_DATA.length) * (i + 0.5);
      const y = H - pad - (d.value / max) * innerH;
      return `<circle cx="${x}" cy="${y}" r="3" fill="#5da8ff" />`;
    }).join("");
    return `${open}${axis}<polyline points="${pts}" fill="none" stroke="#5da8ff" stroke-width="2" />${dots}${labels}</svg>`;
  }

  const cx = W / 2;
  const cy = H / 2;
  const r = Math.max(20, Math.min(W, H) / 2 - 16);
  const total = CHART_DATA.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;
  const slices = CHART_DATA.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${CHART_COLORS[i % CHART_COLORS.length]}" />`;
  }).join("");
  return `${open}${slices}</svg>`;
}

export function chartSvg(
  kind: "chart-bar" | "chart-line" | "chart-pie",
  w: number,
  h: number,
  data: ChartPoint[] = DEFAULT_CHART_DATA
) {
  return renderChartSvg(kind, w, h, data, CHART_COLORS);
}


function esc(v: unknown) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function styleToCss(style: Record<string, string> = {}) {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v};`)
    .join("");
}

function attrsToHtml(attrs: Record<string, string> = {}, defaults: Record<string, unknown> = {}) {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (/^\{[\s\S]*\}$/.test(String(v))) continue;
    if (String(v).trim() === "") continue; // blank = attribute omitted
    merged[k] = String(v);
  }
  for (const [k, v] of Object.entries(defaults)) {
    if (v === undefined || v === null || v === "") continue;
    if (!(k in merged)) merged[k] = String(v);
  }
  return Object.entries(merged)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("");
}

function innerBlockHtml(block: Block, code: string) {
  const s = styleToCss(block.style);
  const a = attrsToHtml(block.attrs);
  const text = esc(block.text);
  const full = `width:100%;height:100%;${s}`;
  switch (block.kind) {
    case "heading":
      return `<h2 style="${full}"${a}>${text}</h2>`;
    case "paragraph":
      return `<p style="${full}"${a}>${text}</p>`;
    case "button":
      return `<button style="width:100%;height:100%;border-radius:6px;border:0;cursor:pointer;background:#5da8ff;color:#08111f;font-weight:600;${s}"${attrsToHtml(
        block.attrs,
        { type: "button" }
      )}>${text}</button>`;
    case "input":
      return `<input style="width:100%;height:100%;padding:0 10px;border-radius:6px;border:1px solid #2a3346;background:#0f1626;color:#e6ecf7;${s}"${attrsToHtml(
        block.attrs,
        { placeholder: block.props.placeholder, type: "text" }
      )} />`;
    case "image":
      return `<img style="width:100%;height:100%;object-fit:cover;border-radius:6px;${s}"${attrsToHtml(
        block.attrs,
        { src: block.props.src, alt: block.props.alt, loading: "lazy" }
      )} />`;
    case "link":
      return `<a style="color:#5da8ff;${s}"${attrsToHtml(block.attrs, {
        href: block.props.href ?? "#",
      })}>${text}</a>`;
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return `<div data-chart="${block.kind}" data-chart-w="${block.w}" data-chart-h="${block.h}" style="width:100%;height:100%;background:#111a2b;border-radius:8px;padding:8px;box-sizing:border-box;${s}"${attrsToHtml(
        block.attrs,
        {
          "data-source": block.props.dataSource,
          "data-name-key": block.props.nameKey,
          "data-value-key": block.props.valueKey,
        }
      )}>${chartSvg(block.kind, block.w, block.h)}</div>`;
    case "react":
      return `<div data-react-root="${block.id}" style="width:100%;height:100%;overflow:auto;${s}"${a}></div><script type="text/jsx-source" data-react-code="${block.id}">${code
        .replace(/<\/script>/gi, "<\\/script>")}</script>`;
    default:
      return `<div style="width:100%;height:100%;border-radius:6px;${s}"${a}>${text}</div>`;
  }
}

export function buildPageHtml(
  page: ProjectFile,
  files: ProjectFile[],
  opts: { pages: ProjectFile[]; vendorLocal: boolean }
) {
  const scripts = files.filter((f) => f.type === "script");
  const blocks = (page.blocks ?? [])
    .map((b) => {
      const code = b.sourceFileId ? files.find((f) => f.id === b.sourceFileId)?.code ?? "" : b.code ?? "";
      return `  <div data-block-id="${b.id}" style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;">${innerBlockHtml(b, code)}</div>`;
    })
    .join("\n");

  const bindings = (page.blocks ?? []).flatMap((b) =>
    (b.events ?? []).map((ev) => {
      const script = ev.kind === "function" ? files.find((f) => f.id === ev.scriptId) : null;
      return {
        blockId: b.id,
        event: ev.event,
        ...(ev.kind === "function"
          ? { kind: "function", functionName: ev.functionName, scriptName: script?.name ?? "" }
          : { kind: "url", url: ev.url, method: ev.method }),
      };
    })
  );

  const nav =
    opts.pages.length > 1
      ? `<nav style="position:fixed;top:0;left:0;right:0;z-index:40;display:flex;gap:8px;padding:6px 10px;background:#0b1220e6;border-bottom:1px solid #1f2839;font-size:12px;backdrop-filter:blur(4px)">${opts.pages
          .map(
            (p) =>
              `<a href="${pageFileName(p)}" style="color:${p.id === page.id ? "#5da8ff" : "#9aa7bd"};text-decoration:none">${esc(
                p.name.replace(/\.html$/, "")
              )}</a>`
          )
          .join("")}</nav>`
      : "";

  const vendor = opts.vendorLocal
    ? `  <script src="vendor/react.js"></script>
  <script src="vendor/react-dom.js"></script>
  <script src="vendor/babel.js"></script>`
    : `  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.28.4/babel.min.js"></script>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(page.name.replace(/\.html$/, ""))}</title>
  <meta name="description" content="Página ${esc(page.name.replace(/\.html$/, ""))} exportada do FluxoStudio, funcional offline." />
  <style>
    :root { color-scheme: dark; }
    body { margin:0; font-family: system-ui, -apple-system, sans-serif; background:#0b1220; color:#e6ecf7; }
    .page { position:relative; min-height:100vh; padding-top:${opts.pages.length > 1 ? 32 : 0}px; }
    #fs-log { position:fixed; bottom:0; left:0; right:0; max-height:35vh; overflow:auto; background:#080d17f2; border-top:1px solid #1f2839; font:11px/1.5 ui-monospace, monospace; z-index:50; }
    #fs-log header { display:flex; justify-content:space-between; padding:4px 8px; color:#9aa7bd; border-bottom:1px solid #1f2839; }
    #fs-log button { background:none; border:1px solid #2a3346; color:#9aa7bd; border-radius:4px; cursor:pointer; font:inherit; padding:0 6px; }
    #fs-log ul { list-style:none; margin:0; padding:4px 8px; }
    #fs-log li { padding:1px 0; white-space:pre-wrap; }
    .lvl-error { color:#ff7d9c; } .lvl-success { color:#66d9c2; } .lvl-warn { color:#ffb861; } .lvl-info { color:#9aa7bd; }
    #fs-log-toggle { position:fixed; bottom:8px; right:8px; z-index:51; background:#111a2b; color:#9aa7bd; border:1px solid #2a3346; border-radius:6px; padding:4px 8px; font:11px ui-monospace, monospace; cursor:pointer; }
  </style>
</head>
<body>
${nav}
<div class="page">
${blocks}
</div>
<button id="fs-log-toggle" type="button">logs</button>
<div id="fs-log" hidden><header><span>Logs</span><button type="button" id="fs-log-clear">limpar</button></header><ul id="fs-log-list"></ul></div>
${vendor}
${scripts.map((s) => `  <script src="scripts/${scriptFileName(s)}"></script>`).join("\n")}
  <script>window.__FLUXO_BINDINGS__ = ${JSON.stringify(bindings)};</script>
  <script src="runtime.js"></script>
</body>
</html>
`;
}

export function pageFileName(file: ProjectFile) {
  return file.name.endsWith(".html") ? file.name : `${file.name}.html`;
}

export function scriptFileName(file: ProjectFile) {
  return /\.[cm]?js$/.test(file.name) ? file.name : `${file.name}.js`;
}

const BASE_RUNTIME_JS = String.raw`(function () {
  var listEl = document.getElementById("fs-log-list");
  var panel = document.getElementById("fs-log");
  var toggle = document.getElementById("fs-log-toggle");
  var clear = document.getElementById("fs-log-clear");
  if (toggle) toggle.addEventListener("click", function () { panel.hidden = !panel.hidden; });
  if (clear) clear.addEventListener("click", function () { listEl.innerHTML = ""; });

  function log(level, source, message, detail) {
    if (!listEl) return;
    var li = document.createElement("li");
    li.className = "lvl-" + level;
    li.textContent =
      new Date().toLocaleTimeString("pt-BR") + " [" + source + "] " + message + (detail ? " — " + detail : "");
    listEl.appendChild(li);
    listEl.parentElement.scrollTop = listEl.parentElement.scrollHeight;
  }
  window.__fluxoLog = log;
  window.addEventListener("error", function (e) { log("error", "janela", e.message); });
  window.addEventListener("unhandledrejection", function (e) {
    log("error", "promise", String(e.reason && e.reason.message ? e.reason.message : e.reason));
  });

  // React blocks
  var sources = document.querySelectorAll('script[data-react-code]');
  Array.prototype.forEach.call(sources, function (tag) {
    var id = tag.getAttribute("data-react-code");
    var mount = document.querySelector('[data-react-root="' + id + '"]');
    if (!mount) return;
    var source = tag.textContent || "";
    if (!source.trim()) return;
    if (!window.Babel || !window.React || !window.ReactDOM) {
      mount.textContent = "Compilador React indisponível.";
      return;
    }
    try {
      var src = source.trim().replace(/^\s*import\s[^\n]*\n?/gm, "");
      var hasModule = /(^|\n)\s*export\s+(default|function|const|class)/.test(src);
      if (!hasModule) src = "function Componente(props) {\n" + src + "\n}\nexport default Componente;";
      var out = window.Babel.transform(src, {
        filename: "component.tsx",
        presets: [["react", { runtime: "classic" }], "typescript"],
        plugins: ["transform-modules-commonjs"],
        sourceType: "module",
      });
      var exports = {};
      var React = window.React;
      var fn = new Function(
        "React", "exports", "module", "require", "useState", "useEffect", "useMemo", "useRef", "useCallback", "FluxoChart",
        out.code
      );
      fn(React, exports, { exports: exports }, function (name) {
        if (name === "react") return React;
        throw new Error('Import não suportado: "' + name + '"');
      }, React.useState, React.useEffect, React.useMemo, React.useRef, React.useCallback,
      function FluxoChart(props) {
        return window.__fluxoChartComponent
          ? React.createElement(window.__fluxoChartComponent, props)
          : null;
      });

      var Comp = exports["default"];
      if (!Comp) {
        for (var k in exports) if (typeof exports[k] === "function") { Comp = exports[k]; break; }
      }
      if (!Comp) throw new Error("Nenhum componente exportado.");
      if (window.ReactDOM.createRoot) window.ReactDOM.createRoot(mount).render(React.createElement(Comp));
      else window.ReactDOM.render(React.createElement(Comp), mount);
    } catch (err) {
      mount.innerHTML = '<pre style="color:#ff7d9c;font:11px ui-monospace,monospace;white-space:pre-wrap">' +
        String(err && err.message ? err.message : err) + "</pre>";
      log("error", "react:" + id, String(err && err.message ? err.message : err));
    }
  });

  // Event bindings
  var bindings = window.__FLUXO_BINDINGS__ || [];
  bindings.forEach(function (b) {
    var host = document.querySelector('[data-block-id="' + b.blockId + '"]');
    var el = host && (host.firstElementChild || host);
    if (!el) return;
    var type = b.event.replace(/^on/, "").toLowerCase();
    el.addEventListener(type, function (e) {
      if (b.kind === "url") {
        var started = Date.now();
        log("info", b.event, b.method + " " + b.url);
        fetch(b.url, { method: b.method })
          .then(function (res) {
            log(res.ok ? "success" : "error", b.event,
              res.status + " " + (res.statusText || "") + " · " + b.method + " " + b.url,
              Date.now() - started + " ms");
          })
          .catch(function (err) { log("error", b.event, String(err && err.message ? err.message : err)); });
        return;
      }
      var fn = window[b.functionName];
      if (typeof fn !== "function") {
        log("warn", b.event, "Função " + b.functionName + " não encontrada" + (b.scriptName ? " em " + b.scriptName : ""));
        return;
      }
      try {
        var started2 = Date.now();
        var result = fn(e);
        Promise.resolve(result).then(function (r) {
          log("success", b.event, (b.scriptName ? b.scriptName + " :: " : "") + b.functionName + "()",
            Date.now() - started2 + " ms" + (r === undefined ? "" : " · retorno: " + String(r).slice(0, 120)));
        });
      } catch (err) {
        log("error", b.event, String(err && err.message ? err.message : err));
      }
    });
  });
})();
`;

/** Resolves chart data sources (JSON, URL or script function) in the exported site. */
const CHART_RUNTIME_JS = `(function () {
  var renderChartSvg = ${renderChartSvg.toString()};
  var COLORS = ${JSON.stringify(CHART_COLORS)};
  var FALLBACK = ${JSON.stringify(DEFAULT_CHART_DATA)};

  function normalize(raw, nameKey, valueKey) {
    var data = raw;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      var nested = null;
      for (var k in data) if (Array.isArray(data[k])) { nested = data[k]; break; }
      if (nested) data = nested;
      else {
        return Object.keys(data).map(function (key) {
          return { name: key, value: Number(data[key]) || 0 };
        });
      }
    }
    if (!Array.isArray(data)) return [];
    return data.map(function (item, i) {
      if (typeof item === "number") return { name: String(i + 1), value: item };
      var o = item || {};
      var name = o[nameKey] != null ? o[nameKey] : (o.name != null ? o.name : (o.label != null ? o.label : i + 1));
      var value = Number(o[valueKey] != null ? o[valueKey] : (o.value != null ? o.value : o.y));
      return { name: String(name), value: isFinite(value) ? value : 0 };
    });
  }

  function resolve(source) {
    var src = (source || "").trim();
    if (!src) return Promise.resolve(null);
    if (src.charAt(0) === "[" || src.charAt(0) === "{") return Promise.resolve(JSON.parse(src));
    if (/^(https?:)?\\/\\//.test(src) || src.charAt(0) === "/") {
      return fetch(src).then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + (res.statusText || "") + " · " + src);
        return res.json();
      });
    }
    var fn = window[src.replace(/\\(\\s*\\)$/, "")];
    if (typeof fn !== "function") throw new Error("Fonte de dados não reconhecida: " + src);
    return Promise.resolve(fn());
  }

  var charts = document.querySelectorAll("[data-chart]");
  Array.prototype.forEach.call(charts, function (el) {
    var source = el.getAttribute("data-source") || el.getAttribute("data-chart-source") || "";
    if (!source) return;
    var nameKey = el.getAttribute("data-name-key") || "name";
    var valueKey = el.getAttribute("data-value-key") || "value";
    var w = parseInt(el.getAttribute("data-chart-w"), 10) || el.clientWidth || 320;
    var h = parseInt(el.getAttribute("data-chart-h"), 10) || el.clientHeight || 200;
    try {
      Promise.resolve(resolve(source))
        .then(function (raw) {
          var data = normalize(raw, nameKey, valueKey);
          el.innerHTML = renderChartSvg(el.getAttribute("data-chart"), w, h, data.length ? data : FALLBACK, COLORS);
          if (window.__fluxoLog) window.__fluxoLog("success", "grafico", "dados carregados de " + source, data.length + " pontos");
        })
        .catch(function (err) {
          if (window.__fluxoLog) window.__fluxoLog("error", "grafico", String(err && err.message ? err.message : err));
        });
    } catch (err) {
      if (window.__fluxoLog) window.__fluxoLog("error", "grafico", String(err && err.message ? err.message : err));
    }
  });

  // Chart component available to compiled React blocks (<FluxoChart />).
  window.__fluxoChartComponent = function (props) {
    var React = window.React;
    var ref = React.useRef(null);
    var kind = props.kind || props["data-chart"] || "chart-bar";
    var source = props.source || props["data-source"] || props.dataSource || "";
    var nameKey = props.nameKey || props["data-name-key"] || "name";
    var valueKey = props.valueKey || props["data-value-key"] || "value";
    React.useEffect(function () {
      var el = ref.current;
      if (!el) return;
      var w = el.clientWidth || 320;
      var h = el.clientHeight || 200;
      function paint(data) {
        el.innerHTML = renderChartSvg(kind, w, h, data && data.length ? data : FALLBACK, COLORS);
      }
      paint(null);
      if (!source) return;
      try {
        Promise.resolve(resolve(source))
          .then(function (raw) { paint(normalize(raw, nameKey, valueKey)); })
          .catch(function (err) {
            if (window.__fluxoLog) window.__fluxoLog("error", "grafico", String(err && err.message ? err.message : err));
          });
      } catch (err) {
        if (window.__fluxoLog) window.__fluxoLog("error", "grafico", String(err && err.message ? err.message : err));
      }
    }, [kind, source, nameKey, valueKey]);
    return React.createElement("div", {
      ref: ref,
      style: Object.assign({ width: "100%", height: "100%" }, props.style || {}),
    });
  };
})();
`;

export const SITE_RUNTIME_JS = `${CHART_RUNTIME_JS}\n${BASE_RUNTIME_JS}`;

