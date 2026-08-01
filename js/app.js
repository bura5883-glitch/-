// 画面の組み立てとイベント処理
(function () {
  "use strict";

  const PLAN = Store.PLAN;
  const yen = Calc.formatYen;

  // --- 小さなDOMヘルパー ---
  function $(sel) {
    return document.querySelector(sel);
  }
  function $$(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }
  function td(text, cls) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (cls) cell.className = cls;
    return cell;
  }
  function fillSelect(select, values, placeholder) {
    select.innerHTML = "";
    if (placeholder) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      select.appendChild(opt);
    }
    values.forEach(function (v) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  // --- テーマ ---
  const themeToggle = $("#theme-toggle");
  const savedTheme = (function () {
    try {
      return localStorage.getItem("furugi-theme");
    } catch (e) {
      return null;
    }
  })();
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", function () {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("furugi-theme", next);
    } catch (e) {
      /* 保存できなくても切り替えは有効 */
    }
    renderCharts();
  });

  // --- タブ ---
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tab").forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
      });
      $$(".view").forEach(function (v) {
        v.classList.add("hidden");
      });
      $("#view-" + tab.dataset.view).classList.remove("hidden");
      renderCharts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // --- セレクトの初期化 ---
  const itemForm = $("#item-form");
  fillSelect(itemForm.condition, PLAN.conditions, "選択してください");
  fillSelect(itemForm.source, PLAN.sourceShops, "選択してください");
  fillSelect(itemForm.area, PLAN.areas, "選択してください");
  itemForm.purchaseDate.value = Calc.today();

  const postForm = $("#post-form");
  const postPlatforms = PLAN.postingGoals.map(function (g) {
    return g.platform;
  });
  fillSelect(postForm.platform, postPlatforms, "選択してください");
  postForm.date.value = Calc.today();

  const followerForm = $("#follower-form");
  fillSelect(followerForm.platform, PLAN.followerPlatforms, "選択してください");
  followerForm.date.value = Calc.today();

  const sellForm = $("#sell-form");
  fillSelect(
    sellForm.channel,
    PLAN.salesChannels.map(function (c) {
      return c.name;
    }),
    "選択してください"
  );

  // --- 仕入れ登録 ---
  itemForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const price = Number(itemForm.purchasePrice.value) || 0;
    const cash = Calc.summary(Store.getState()).cash;
    if (price > cash) {
      const ok = window.confirm(
        "仕入れ値 " + yen(price) + " が現在の現金残高 " + yen(cash) +
          " を超えています。追加資金は投入しないルールです。それでも登録しますか？"
      );
      if (!ok) return;
    }
    Store.addItem({
      name: itemForm.name.value.trim(),
      category: itemForm.category.value.trim(),
      brand: itemForm.brand.value.trim(),
      size: itemForm.size.value.trim(),
      condition: itemForm.condition.value,
      conditionNote: itemForm.conditionNote.value.trim(),
      source: itemForm.source.value,
      area: itemForm.area.value,
      purchasePrice: price,
      purchaseDate: itemForm.purchaseDate.value,
      listPrice: Number(itemForm.listPrice.value) || 0,
      authenticityChecked: itemForm.authenticityChecked.checked,
    });
    itemForm.reset();
    itemForm.purchaseDate.value = Calc.today();
  });

  function updateCashNote() {
    const s = Calc.summary(Store.getState());
    $("#cash-note").textContent =
      "現在の現金残高：" + yen(s.cash) + "（元手 " + yen(s.initialCapital) + " のみで運営）";
  }

  // --- 商品一覧 ---
  let itemFilter = "all";
  $$(".filters .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      itemFilter = chip.dataset.filter;
      $$(".filters .chip").forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
      });
      renderItems();
    });
  });

  function renderItems() {
    const tbody = $("#items-table tbody");
    tbody.innerHTML = "";
    const all = Store.getState().items.slice().sort(function (a, b) {
      return a.purchaseDate < b.purchaseDate ? 1 : -1;
    });
    const rows = all.filter(function (i) {
      if (itemFilter === "stock") return i.status !== "sold";
      if (itemFilter === "sold") return i.status === "sold";
      return true;
    });

    $("#items-empty").classList.toggle("hidden", all.length > 0);

    rows.forEach(function (item) {
      const tr = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.className = "item-name";
      nameCell.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = [item.brand, item.category, item.size].filter(Boolean).join(" / ") || "—";
      nameCell.appendChild(meta);
      if (!item.authenticityChecked) {
        const warn = document.createElement("span");
        warn.className = "item-meta neg";
        warn.textContent = "⚠ 正規品の確認が未チェック";
        nameCell.appendChild(warn);
      }
      tr.appendChild(nameCell);

      tr.appendChild(td(item.condition ? item.condition.charAt(0) : "—"));
      tr.appendChild(td(item.source || "—"));
      tr.appendChild(td(yen(item.purchasePrice), "num"));
      tr.appendChild(td(item.purchaseDate || "—"));

      if (item.sale) {
        tr.appendChild(td(yen(item.sale.salePrice), "num"));
        const profit = Calc.itemProfit(item);
        tr.appendChild(td(yen(profit), "num " + (profit >= 0 ? "pos" : "neg")));
      } else {
        tr.appendChild(td(item.listPrice ? "予定 " + yen(item.listPrice) : "—", "num"));
        tr.appendChild(td("—", "num"));
      }

      const statusCell = document.createElement("td");
      const pill = document.createElement("span");
      pill.className = "pill " + (item.status === "sold" ? "sold" : "stock");
      if (item.status === "sold") {
        pill.textContent = "売却済み";
      } else {
        const days = item.purchaseDate ? Calc.daysBetween(item.purchaseDate, Calc.today()) : 0;
        pill.textContent = "在庫 " + days + "日";
      }
      statusCell.appendChild(pill);
      tr.appendChild(statusCell);

      const actions = document.createElement("td");
      if (item.status === "sold") {
        const undo = document.createElement("button");
        undo.type = "button";
        undo.className = "mini-btn link";
        undo.textContent = "販売を取消";
        undo.addEventListener("click", function () {
          if (window.confirm("この商品の販売記録を取り消しますか？")) Store.cancelSale(item.id);
        });
        actions.appendChild(undo);
      } else {
        const sell = document.createElement("button");
        sell.type = "button";
        sell.className = "mini-btn";
        sell.textContent = "販売登録";
        sell.addEventListener("click", function () {
          openSellDialog(item);
        });
        actions.appendChild(sell);
      }
      const del = document.createElement("button");
      del.type = "button";
      del.className = "mini-btn link";
      del.textContent = "削除";
      del.addEventListener("click", function () {
        if (window.confirm("「" + item.name + "」を削除しますか？")) Store.removeItem(item.id);
      });
      actions.appendChild(del);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    });
  }

  // --- 販売登録ダイアログ ---
  const sellDialog = $("#sell-dialog");
  let sellingItem = null;

  function openSellDialog(item) {
    sellingItem = item;
    $("#sell-item-info").textContent =
      item.name + "（仕入 " + yen(item.purchasePrice) + "）";
    sellForm.channel.value = PLAN.salesChannels[0].name;
    sellForm.salePrice.value = item.listPrice || "";
    sellForm.shipping.value = "";
    sellForm.saleDate.value = Calc.today();
    syncFee();
    sellDialog.showModal();
  }

  // 販売先の手数料率から手数料を自動計算する（手入力で上書き可）
  function syncFee() {
    const channel = PLAN.salesChannels.filter(function (c) {
      return c.name === sellForm.channel.value;
    })[0];
    const price = Number(sellForm.salePrice.value) || 0;
    if (channel) sellForm.fee.value = Math.round(price * channel.feeRate);
    updateSellPreview();
  }

  function updateSellPreview() {
    if (!sellingItem) return;
    const price = Number(sellForm.salePrice.value) || 0;
    const fee = Number(sellForm.fee.value) || 0;
    const ship = Number(sellForm.shipping.value) || 0;
    const profit = price - fee - ship - sellingItem.purchasePrice;
    $("#sell-preview").textContent =
      "手残り " + yen(price - fee - ship) + " ／ 利益 " + yen(profit) +
      (price ? "（利益率 " + Calc.formatPercent(profit / price) + "）" : "");
  }

  sellForm.channel.addEventListener("change", syncFee);
  sellForm.salePrice.addEventListener("input", syncFee);
  sellForm.fee.addEventListener("input", updateSellPreview);
  sellForm.shipping.addEventListener("input", updateSellPreview);

  $("#sell-cancel").addEventListener("click", function () {
    sellDialog.close();
  });

  sellForm.addEventListener("submit", function () {
    if (!sellingItem) return;
    Store.sellItem(sellingItem.id, {
      channel: sellForm.channel.value,
      salePrice: Number(sellForm.salePrice.value) || 0,
      fee: Number(sellForm.fee.value) || 0,
      shipping: Number(sellForm.shipping.value) || 0,
      saleDate: sellForm.saleDate.value,
    });
    sellingItem = null;
  });

  // --- SNS ---
  postForm.addEventListener("submit", function (e) {
    e.preventDefault();
    Store.addPost({
      date: postForm.date.value,
      platform: postForm.platform.value,
      title: postForm.title.value.trim(),
      views: Number(postForm.views.value) || 0,
    });
    const keepDate = postForm.date.value;
    postForm.reset();
    postForm.date.value = keepDate;
  });

  followerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    Store.addFollowerRecord({
      date: followerForm.date.value,
      platform: followerForm.platform.value,
      count: Number(followerForm.count.value) || 0,
    });
    const keepDate = followerForm.date.value;
    followerForm.reset();
    followerForm.date.value = keepDate;
  });

  function renderPosts() {
    const tbody = $("#posts-table tbody");
    tbody.innerHTML = "";
    const posts = Store.getState().posts.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
    $("#posts-empty").classList.toggle("hidden", posts.length > 0);

    posts.forEach(function (p) {
      const tr = document.createElement("tr");
      tr.appendChild(td(p.date));
      tr.appendChild(td(p.platform));
      tr.appendChild(td(p.title || "—"));
      tr.appendChild(td(p.views.toLocaleString("ja-JP"), "num"));

      const actions = document.createElement("td");
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "mini-btn";
      edit.textContent = "再生数を更新";
      edit.addEventListener("click", function () {
        const input = window.prompt("最新の再生数を入力してください", String(p.views));
        if (input === null) return;
        const v = Number(input);
        if (isNaN(v) || v < 0) {
          window.alert("0以上の数値を入力してください。");
          return;
        }
        Store.updatePost(p.id, { views: v });
      });
      actions.appendChild(edit);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "mini-btn link";
      del.textContent = "削除";
      del.addEventListener("click", function () {
        if (window.confirm("この投稿記録を削除しますか？")) Store.removePost(p.id);
      });
      actions.appendChild(del);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    });
  }

  function renderFollowers() {
    const tbody = $("#followers-table tbody");
    tbody.innerHTML = "";
    const recs = Store.getState().followers.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
    $("#followers-empty").classList.toggle("hidden", recs.length > 0);

    recs.forEach(function (f) {
      const tr = document.createElement("tr");
      tr.appendChild(td(f.date));
      tr.appendChild(td(f.platform));
      tr.appendChild(td(f.count.toLocaleString("ja-JP"), "num"));

      const actions = document.createElement("td");
      const del = document.createElement("button");
      del.type = "button";
      del.className = "mini-btn link";
      del.textContent = "削除";
      del.addEventListener("click", function () {
        if (window.confirm("この記録を削除しますか？")) Store.removeFollowerRecord(f.id);
      });
      actions.appendChild(del);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    });
  }

  // --- ダッシュボード ---
  function renderDashboard() {
    const state = Store.getState();
    const s = Calc.summary(state);

    $("#hero-assets").textContent = yen(s.totalAssets);
    const deltaEl = $("#hero-delta");
    deltaEl.innerHTML = "";
    const sign = s.totalProfit >= 0 ? "▲" : "▼";
    const strong = document.createElement("span");
    strong.className = s.totalProfit >= 0 ? "delta-up" : "delta-down";
    strong.textContent = sign + " " + yen(Math.abs(s.totalProfit));
    deltaEl.appendChild(strong);
    deltaEl.appendChild(
      document.createTextNode(
        "（元手 " + yen(s.initialCapital) + " 比 " + Calc.formatPercent(s.roi) + "）"
      )
    );

    const kpis = [
      { label: "現金残高", value: yen(s.cash), sub: "すぐ仕入れに使える額" },
      { label: "在庫", value: s.stockCount + " 点", sub: "仕入れ原価 " + yen(s.stockCost) },
      { label: "売上（累計）", value: yen(s.salesTotal), sub: s.soldCount + " 点を販売" },
      {
        label: "手数料+送料",
        value: yen(s.feeTotal + s.shippingTotal),
        sub: "手数料 " + yen(s.feeTotal) + " / 送料 " + yen(s.shippingTotal),
      },
      {
        label: "利益率",
        value: s.salesTotal ? Calc.formatPercent(s.profitRate) : "—",
        sub: "売上に対する利益",
      },
      {
        label: "フォロワー",
        value: s.followerTotal.toLocaleString("ja-JP"),
        sub: s.postCount + " 本投稿 / " + s.viewTotal.toLocaleString("ja-JP") + " 回再生",
      },
    ];
    const row = $("#kpi-row");
    row.innerHTML = "";
    kpis.forEach(function (k) {
      const div = document.createElement("div");
      div.className = "kpi";
      const l = document.createElement("p");
      l.className = "kpi-label";
      l.textContent = k.label;
      const v = document.createElement("p");
      v.className = "kpi-value";
      v.textContent = k.value;
      const sub = document.createElement("p");
      sub.className = "kpi-sub";
      sub.textContent = k.sub;
      div.appendChild(l);
      div.appendChild(v);
      div.appendChild(sub);
      row.appendChild(div);
    });

    // 警告
    const warnBox = $("#warnings");
    warnBox.innerHTML = "";
    Calc.ruleWarnings(state).forEach(function (w) {
      const div = document.createElement("div");
      div.className = "warning " + w.level;
      const icon = document.createElement("span");
      icon.className = "icon";
      icon.textContent = w.level === "critical" ? "🚫" : w.level === "serious" ? "⏳" : "⚠";
      div.appendChild(icon);
      div.appendChild(document.createTextNode(w.text));
      warnBox.appendChild(div);
    });

    // 今週の投稿ノルマ
    const ws = Calc.currentWeekStart();
    $("#week-range").textContent = ws + " 〜 の週（月曜はじまり）";
    const goals = $("#goal-list");
    goals.innerHTML = "";
    Calc.postingProgress(state).forEach(function (g) {
      const li = document.createElement("li");
      if (g.goal > 0 && g.done >= g.goal) li.className = "goal-done";
      const name = document.createElement("span");
      name.textContent = g.platform;
      const meter = document.createElement("div");
      meter.className = "meter";
      const bar = document.createElement("span");
      const ratio = g.goal ? Math.min(1, g.done / g.goal) : g.done ? 1 : 0;
      bar.style.width = ratio * 100 + "%";
      meter.appendChild(bar);
      const count = document.createElement("span");
      count.className = "goal-count";
      count.textContent = g.goal ? g.done + " / " + g.goal + " 本" : g.done + " 本（任意）";
      li.appendChild(name);
      li.appendChild(meter);
      li.appendChild(count);
      goals.appendChild(li);
    });

    // 売れた商品ベスト5
    const top = $("#top-items tbody");
    top.innerHTML = "";
    const sold = Calc.soldItems(state.items)
      .slice()
      .sort(function (a, b) {
        return Calc.itemProfit(b) - Calc.itemProfit(a);
      })
      .slice(0, 5);
    if (!sold.length) {
      const tr = document.createElement("tr");
      const cell = td("まだ売れた商品がありません。");
      cell.colSpan = 6;
      cell.className = "empty-msg";
      tr.appendChild(cell);
      top.appendChild(tr);
    }
    sold.forEach(function (i) {
      const tr = document.createElement("tr");
      tr.appendChild(td(i.name, "item-name"));
      tr.appendChild(td(yen(i.purchasePrice), "num"));
      tr.appendChild(td(yen(i.sale.salePrice), "num"));
      tr.appendChild(td(yen(i.sale.fee + i.sale.shipping), "num"));
      const p = Calc.itemProfit(i);
      tr.appendChild(td(yen(p), "num " + (p >= 0 ? "pos" : "neg")));
      tr.appendChild(td(Calc.daysBetween(i.purchaseDate, i.sale.saleDate) + " 日", "num"));
      top.appendChild(tr);
    });

    updateCashNote();
  }

  // --- 週次レポート ---
  function renderWeekly() {
    const rows = Calc.weekly(Store.getState());
    const tbody = $("#weekly-table tbody");
    tbody.innerHTML = "";
    $("#weekly-empty").classList.toggle("hidden", rows.length > 0);

    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      tr.appendChild(td(r.label));
      tr.appendChild(td(yen(r.cash), "num"));
      tr.appendChild(td(yen(r.purchase), "num"));
      tr.appendChild(td(yen(r.sales), "num"));
      tr.appendChild(td(yen(r.fee), "num"));
      tr.appendChild(td(yen(r.shipping), "num"));
      tr.appendChild(td(yen(r.profit), "num " + (r.profit >= 0 ? "pos" : "neg")));
      tr.appendChild(td(yen(r.cumProfit), "num " + (r.cumProfit >= 0 ? "pos" : "neg")));
      tr.appendChild(td(String(r.stockCount), "num"));
      tr.appendChild(td(String(r.posts), "num"));
      tr.appendChild(td(r.views.toLocaleString("ja-JP"), "num"));
      tr.appendChild(td(r.followers.toLocaleString("ja-JP"), "num"));
      tbody.appendChild(tr);
    });
  }

  $("#csv-btn").addEventListener("click", function () {
    const rows = Calc.weekly(Store.getState());
    if (!rows.length) {
      window.alert("書き出せる記録がありません。");
      return;
    }
    const header = [
      "週開始", "現金残高", "仕入金額", "販売金額", "手数料", "送料",
      "利益", "総利益", "在庫数", "在庫原価", "投稿本数", "再生数", "フォロワー数",
    ];
    const lines = [header.join(",")];
    rows.forEach(function (r) {
      lines.push(
        [r.weekStart, r.cash, r.purchase, r.sales, r.fee, r.shipping,
          r.profit, r.cumProfit, r.stockCount, r.stockCost, r.posts, r.views, r.followers].join(",")
      );
    });
    // Excelで文字化けしないよう BOM を付ける
    download("weekly-report.csv", "﻿" + lines.join("\n"), "text/csv");
  });

  // --- チャート ---
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderCharts() {
    const state = Store.getState();
    const rows = Calc.weekly(state);
    const labels = rows.map(function (r) {
      return r.label;
    });
    const shortYen = function (v) {
      return Math.abs(v) >= 10000 ? Math.round(v / 1000) + "k" : String(Math.round(v));
    };

    Charts.lineChart($("#chart-assets"), {
      labels: labels,
      series: [
        {
          name: "",
          color: cssVar("--series-1"),
          points: rows.map(function (r, i) {
            return { i: i, y: r.assets };
          }),
        },
      ],
      baseline: PLAN.initialCapital,
      baselineLabel: "元手 " + yen(PLAN.initialCapital),
      yFormat: shortYen,
      tipFormat: yen,
      directLabel: false,
      ariaLabel: "週ごとの総資産の推移",
      emptyText: "仕入れを登録すると推移が表示されます",
    });

    Charts.divergingBarChart($("#chart-profit"), {
      points: rows.map(function (r) {
        return {
          label: r.label,
          value: r.profit,
          note: r.soldCount + " 点販売 / 手数料+送料 " + yen(r.fee + r.shipping),
        };
      }),
      posColor: cssVar("--diverge-pos"),
      negColor: cssVar("--diverge-neg"),
      yFormat: shortYen,
      tipFormat: yen,
      valueName: "純利益",
      ariaLabel: "週ごとの純利益",
      emptyText: "販売を登録すると利益が表示されます",
    });

    // フォロワー推移（プラットフォームごとの系列）
    const colors = ["--series-1", "--series-2", "--series-3"];
    const series = PLAN.followerPlatforms.map(function (platform, idx) {
      const points = [];
      rows.forEach(function (r, i) {
        const rec = latestFollowerFor(state, platform, endOfWeekStr(r.weekStart));
        if (rec != null) points.push({ i: i, y: rec });
      });
      return { name: platform, color: cssVar(colors[idx % colors.length]), points: points };
    });

    Charts.lineChart($("#chart-followers"), {
      labels: labels,
      series: series,
      yFormat: function (v) {
        return String(Math.round(v));
      },
      tipFormat: function (v) {
        return Math.round(v).toLocaleString("ja-JP") + " 人";
      },
      ariaLabel: "プラットフォーム別フォロワー数の推移",
      emptyText: "フォロワー数を記録すると推移が表示されます",
    });

    const legend = $("#follower-legend");
    legend.innerHTML = "";
    const latest = Calc.latestFollowersByPlatform(state);
    PLAN.followerPlatforms.forEach(function (platform, idx) {
      const span = document.createElement("span");
      const i = document.createElement("i");
      i.style.background = cssVar(colors[idx % colors.length]);
      span.appendChild(i);
      span.appendChild(
        document.createTextNode(
          platform + "：" + (latest[platform] ? latest[platform].count.toLocaleString("ja-JP") : "未記録")
        )
      );
      legend.appendChild(span);
    });

    Charts.divergingBarChart($("#chart-views"), {
      points: rows.map(function (r) {
        return { label: r.label, value: r.views, note: r.posts + " 本投稿" };
      }),
      posColor: cssVar("--series-1"),
      negColor: cssVar("--diverge-neg"),
      yFormat: function (v) {
        return Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k" : String(Math.round(v));
      },
      tipFormat: function (v) {
        return Math.round(v).toLocaleString("ja-JP") + " 回";
      },
      valueName: "再生数",
      ariaLabel: "週ごとの総再生数",
      emptyText: "投稿を記録すると再生数が表示されます",
    });
  }

  function endOfWeekStr(startStr) {
    const d = new Date(startStr + "T00:00:00");
    d.setDate(d.getDate() + 6);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function latestFollowerFor(state, platform, dateStr) {
    const recs = state.followers
      .filter(function (f) {
        return f.platform === platform && f.date <= dateStr;
      })
      .sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      });
    return recs.length ? recs[recs.length - 1].count : null;
  }

  // --- データ入出力 ---
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || "application/json") + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  $("#export-btn").addEventListener("click", function () {
    download("furugi-tracker-" + Calc.today() + ".json", Store.exportJson());
  });

  $("#import-btn").addEventListener("click", function () {
    $("#import-file").click();
  });

  $("#import-file").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        Store.importJson(String(reader.result));
        window.alert("読み込みました。");
      } catch (err) {
        window.alert("読み込めませんでした：" + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("#reset-btn").addEventListener("click", function () {
    if (!window.confirm("すべての記録を削除します。取り消せません。よろしいですか？")) return;
    if (!window.confirm("本当に削除しますか？必要ならJSONを書き出してから実行してください。")) return;
    Store.resetAll();
  });

  // --- 再描画 ---
  function renderAll() {
    renderDashboard();
    renderItems();
    renderPosts();
    renderFollowers();
    renderWeekly();
    renderCharts();
  }

  Store.subscribe(renderAll);

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCharts, 150);
  });

  renderAll();
})();
