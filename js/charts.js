// SVGチャート描画（外部ライブラリなし）
// 線は2px、マーカーは8px以上、棒の値側の角は4px丸め、グリッドは控えめ。
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  function niceTicks(min, max, count) {
    if (min === max) {
      min = Math.min(0, min);
      max = max === 0 ? 1 : max * 1.2;
    }
    const span = max - min;
    const rawStep = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return ticks;
  }

  // 値側の角だけ丸めた棒のパス。
  // yZero は基準線のy座標、dy は基準線からの差（SVG座標なので上向きは負）。
  function barPath(x, yZero, w, dy, r) {
    const radius = Math.min(r, w / 2, Math.abs(dy));
    const end = yZero + dy;
    if (dy <= 0) {
      // 上向き：上側の角を丸める
      return (
        "M" + x + "," + yZero +
        "V" + (end + radius) +
        "a" + radius + "," + radius + " 0 0 1 " + radius + ",-" + radius +
        "H" + (x + w - radius) +
        "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius +
        "V" + yZero + "Z"
      );
    }
    // 下向き：下側の角を丸める
    return (
      "M" + x + "," + yZero +
      "V" + (end - radius) +
      "a" + radius + "," + radius + " 0 0 0 " + radius + "," + radius +
      "H" + (x + w - radius) +
      "a" + radius + "," + radius + " 0 0 0 " + radius + ",-" + radius +
      "V" + yZero + "Z"
    );
  }

  function ensureTooltip(container) {
    let tip = container.querySelector(".viz-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "viz-tooltip";
      tip.hidden = true;
      container.appendChild(tip);
    }
    return tip;
  }

  function emptyMessage(container, text) {
    container.innerHTML = "";
    const p = document.createElement("p");
    p.className = "viz-empty";
    p.textContent = text;
    container.appendChild(p);
  }

  // 折れ線グラフ（1〜3系列）。x はカテゴリ（週ラベル）。
  function lineChart(container, opts) {
    const series = opts.series.filter(function (s) {
      return s.points.length;
    });
    if (!series.length) {
      emptyMessage(container, opts.emptyText || "データがまだありません");
      return;
    }
    container.innerHTML = "";
    const tip = ensureTooltip(container);

    const labels = opts.labels;
    const width = Math.max(320, container.clientWidth || 640);
    const height = opts.height || 240;
    const pad = { top: 16, right: 16, bottom: 28, left: 56 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    let values = [];
    series.forEach(function (s) {
      values = values.concat(
        s.points.map(function (p) {
          return p.y;
        })
      );
    });
    if (opts.baseline != null) values.push(opts.baseline);
    const ticks = niceTicks(Math.min.apply(null, values), Math.max.apply(null, values), 4);
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];

    const xAt = function (i) {
      return labels.length === 1 ? pad.left + plotW / 2 : pad.left + (plotW * i) / (labels.length - 1);
    };
    const yAt = function (v) {
      return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    };

    const svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      width: "100%",
      height: height,
      role: "img",
      "aria-label": opts.ariaLabel || "推移グラフ",
    });

    ticks.forEach(function (t) {
      svg.appendChild(
        el("line", { x1: pad.left, x2: width - pad.right, y1: yAt(t), y2: yAt(t), class: "viz-grid" })
      );
      const label = el("text", { x: pad.left - 8, y: yAt(t) + 4, class: "viz-axis-label", "text-anchor": "end" });
      label.textContent = opts.yFormat ? opts.yFormat(t) : t;
      svg.appendChild(label);
    });

    // 元手ラインなどの基準線
    if (opts.baseline != null) {
      svg.appendChild(
        el("line", {
          x1: pad.left,
          x2: width - pad.right,
          y1: yAt(opts.baseline),
          y2: yAt(opts.baseline),
          class: "viz-baseline-ref",
        })
      );
      if (opts.baselineLabel) {
        const bl = el("text", {
          x: width - pad.right,
          y: yAt(opts.baseline) - 6,
          class: "viz-axis-label",
          "text-anchor": "end",
        });
        bl.textContent = opts.baselineLabel;
        svg.appendChild(bl);
      }
    }

    // x軸ラベルは間引いて重なりを防ぐ
    const stride = Math.ceil(labels.length / Math.max(2, Math.floor(plotW / 64)));
    labels.forEach(function (lab, i) {
      if (i % stride !== 0 && i !== labels.length - 1) return;
      const t = el("text", { x: xAt(i), y: height - 8, class: "viz-axis-label", "text-anchor": "middle" });
      t.textContent = lab;
      svg.appendChild(t);
    });

    series.forEach(function (s) {
      const d = s.points
        .map(function (p, idx) {
          return (idx === 0 ? "M" : "L") + xAt(p.i) + "," + yAt(p.y);
        })
        .join(" ");
      const path = el("path", { d: d, class: "viz-line", fill: "none" });
      path.style.stroke = s.color;
      svg.appendChild(path);

      s.points.forEach(function (p) {
        const c = el("circle", { cx: xAt(p.i), cy: yAt(p.y), r: 4, class: "viz-dot" });
        c.style.fill = s.color;
        svg.appendChild(c);
      });

      // 直接ラベル（凡例の色だけに頼らないため）
      if (s.name && opts.directLabel !== false) {
        const last = s.points[s.points.length - 1];
        const t = el("text", {
          x: xAt(last.i) - 8,
          y: yAt(last.y) - 10,
          class: "viz-series-label",
          "text-anchor": "end",
        });
        t.textContent = s.name;
        svg.appendChild(t);
      }
    });

    // ホバー：縦線＋ツールチップ
    const cross = el("line", { y1: pad.top, y2: pad.top + plotH, class: "viz-crosshair" });
    cross.setAttribute("opacity", "0");
    svg.appendChild(cross);

    const hit = el("rect", { x: pad.left, y: pad.top, width: plotW, height: plotH, fill: "transparent" });
    svg.appendChild(hit);

    function onMove(ev) {
      const rect = svg.getBoundingClientRect();
      const scale = width / rect.width;
      const x = (ev.clientX - rect.left) * scale;
      let idx = 0;
      if (labels.length > 1) {
        idx = Math.round(((x - pad.left) / plotW) * (labels.length - 1));
      }
      idx = Math.max(0, Math.min(labels.length - 1, idx));
      cross.setAttribute("x1", xAt(idx));
      cross.setAttribute("x2", xAt(idx));
      cross.setAttribute("opacity", "1");

      let html = "<strong>" + labels[idx] + "</strong>";
      series.forEach(function (s) {
        const p = s.points.filter(function (q) {
          return q.i === idx;
        })[0];
        if (!p) return;
        const fmt = opts.tipFormat || opts.yFormat;
        html +=
          '<span class="viz-tt-row"><i style="background:' + s.color + '"></i>' +
          (s.name ? s.name + " " : "") +
          "<b>" + (fmt ? fmt(p.y) : p.y) + "</b></span>";
      });
      tip.innerHTML = html;
      tip.hidden = false;
      const left = (xAt(idx) / width) * rect.width;
      tip.style.left = Math.min(Math.max(left, 8), rect.width - 8) + "px";
      tip.style.top = "8px";
    }

    hit.addEventListener("mousemove", onMove);
    hit.addEventListener("mouseleave", function () {
      tip.hidden = true;
      cross.setAttribute("opacity", "0");
    });

    container.appendChild(svg);
  }

  // 発散棒グラフ（0を基準に上下）。利益がマイナスの週を一目で分かるようにする。
  function divergingBarChart(container, opts) {
    if (!opts.points.length) {
      emptyMessage(container, opts.emptyText || "データがまだありません");
      return;
    }
    container.innerHTML = "";
    const tip = ensureTooltip(container);

    const width = Math.max(320, container.clientWidth || 640);
    const height = opts.height || 240;
    const pad = { top: 16, right: 16, bottom: 28, left: 56 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const values = opts.points.map(function (p) {
      return p.value;
    });
    const ticks = niceTicks(Math.min(0, Math.min.apply(null, values)), Math.max(0, Math.max.apply(null, values)), 4);
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const yAt = function (v) {
      return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    };

    const n = opts.points.length;
    const slot = plotW / n;
    const barW = Math.max(6, Math.min(48, slot - 2)); // 棒の間に2pxの隙間

    const svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      width: "100%",
      height: height,
      role: "img",
      "aria-label": opts.ariaLabel || "週次グラフ",
    });

    ticks.forEach(function (t) {
      svg.appendChild(
        el("line", {
          x1: pad.left,
          x2: width - pad.right,
          y1: yAt(t),
          y2: yAt(t),
          class: t === 0 ? "viz-zero" : "viz-grid",
        })
      );
      const label = el("text", { x: pad.left - 8, y: yAt(t) + 4, class: "viz-axis-label", "text-anchor": "end" });
      label.textContent = opts.yFormat ? opts.yFormat(t) : t;
      svg.appendChild(label);
    });

    const stride = Math.ceil(n / Math.max(2, Math.floor(plotW / 64)));
    opts.points.forEach(function (p, i) {
      const x = pad.left + slot * i + (slot - barW) / 2;
      const zero = yAt(0);
      const dy = yAt(p.value) - zero; // 正の値ほど上に伸びる（＝負の差）
      const path = el("path", { d: barPath(x, zero, barW, dy, 4), class: "viz-bar" });
      path.style.fill = p.value >= 0 ? opts.posColor : opts.negColor;
      svg.appendChild(path);

      path.addEventListener("mouseenter", function () {
        const fmt = opts.tipFormat || opts.yFormat;
        tip.innerHTML =
          "<strong>" + p.label + "</strong>" +
          '<span class="viz-tt-row"><i style="background:' +
          (p.value >= 0 ? opts.posColor : opts.negColor) +
          '"></i>' + (opts.valueName || "値") + " <b>" +
          (fmt ? fmt(p.value) : p.value) + "</b></span>" +
          (p.note ? '<span class="viz-tt-row">' + p.note + "</span>" : "");
        tip.hidden = false;
        const rect = svg.getBoundingClientRect();
        tip.style.left = ((x + barW / 2) / width) * rect.width + "px";
        tip.style.top = "8px";
      });
      path.addEventListener("mouseleave", function () {
        tip.hidden = true;
      });

      if (i % stride === 0 || i === n - 1) {
        const t = el("text", { x: x + barW / 2, y: height - 8, class: "viz-axis-label", "text-anchor": "middle" });
        t.textContent = p.label;
        svg.appendChild(t);
      }
    });

    container.appendChild(svg);
  }

  global.Charts = {
    lineChart: lineChart,
    divergingBarChart: divergingBarChart,
  };
})(window);
