// 集計ロジック
// 「手数料・送料を含めて利益を管理する」という運営ルールに合わせ、
// 利益は必ず  売値 - 手数料 - 送料 - 仕入値  で計算する。
(function (global) {
  "use strict";

  const INITIAL = global.Store.PLAN.initialCapital;

  // 1商品の売上・費用・利益
  function itemProfit(item) {
    if (!item.sale) return 0;
    return item.sale.salePrice - item.sale.fee - item.sale.shipping - item.purchasePrice;
  }

  // 売却で手元に戻る現金（仕入値は仕入時点で既に支出済み）
  function itemNetProceeds(item) {
    if (!item.sale) return 0;
    return item.sale.salePrice - item.sale.fee - item.sale.shipping;
  }

  function sum(arr, fn) {
    return arr.reduce(function (acc, x) {
      return acc + fn(x);
    }, 0);
  }

  function soldItems(items) {
    return items.filter(function (i) {
      return i.status === "sold" && i.sale;
    });
  }

  function stockItems(items) {
    return items.filter(function (i) {
      return i.status !== "sold";
    });
  }

  // 全期間のサマリー
  function summary(state) {
    const items = state.items;
    const sold = soldItems(items);
    const stock = stockItems(items);

    const purchaseTotal = sum(items, function (i) {
      return i.purchasePrice;
    });
    const salesTotal = sum(sold, function (i) {
      return i.sale.salePrice;
    });
    const feeTotal = sum(sold, function (i) {
      return i.sale.fee;
    });
    const shippingTotal = sum(sold, function (i) {
      return i.sale.shipping;
    });
    const netProceeds = salesTotal - feeTotal - shippingTotal;
    const cash = INITIAL - purchaseTotal + netProceeds;
    const stockCost = sum(stock, function (i) {
      return i.purchasePrice;
    });
    const totalAssets = cash + stockCost;
    const totalProfit = totalAssets - INITIAL;

    return {
      initialCapital: INITIAL,
      cash: cash,
      stockCost: stockCost,
      stockCount: stock.length,
      totalAssets: totalAssets,
      totalProfit: totalProfit,
      roi: INITIAL ? totalProfit / INITIAL : 0,
      purchaseTotal: purchaseTotal,
      salesTotal: salesTotal,
      feeTotal: feeTotal,
      shippingTotal: shippingTotal,
      soldCount: sold.length,
      // 売れた商品の平均利益率（売上に対する利益の割合）
      profitRate: salesTotal ? sum(sold, itemProfit) / salesTotal : 0,
      postCount: state.posts.length,
      viewTotal: sum(state.posts, function (p) {
        return p.views;
      }),
      followerTotal: latestFollowerTotal(state),
    };
  }

  // プラットフォームごとの最新フォロワー数の合計
  function latestFollowerTotal(state) {
    const latest = {};
    state.followers
      .slice()
      .sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      })
      .forEach(function (f) {
        latest[f.platform] = f.count;
      });
    return Object.keys(latest).reduce(function (acc, k) {
      return acc + latest[k];
    }, 0);
  }

  // プラットフォームごとの最新フォロワー数
  function latestFollowersByPlatform(state) {
    const latest = {};
    state.followers
      .slice()
      .sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      })
      .forEach(function (f) {
        latest[f.platform] = { count: f.count, date: f.date };
      });
    return latest;
  }

  // --- 週の扱い（月曜はじまり・日曜おわり） ---
  function weekStart(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    const dow = (d.getDay() + 6) % 7; // 月曜=0
    d.setDate(d.getDate() - dow);
    return toDateStr(d);
  }

  function toDateStr(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function weekLabel(startStr) {
    const parts = startStr.split("-");
    return Number(parts[1]) + "/" + Number(parts[2]) + "週";
  }

  function today() {
    return toDateStr(new Date());
  }

  function currentWeekStart() {
    return weekStart(today());
  }

  // 週次レポート。管理項目をすべて週単位で並べる。
  function weekly(state) {
    const buckets = {};

    function bucket(dateStr) {
      const ws = weekStart(dateStr);
      if (!ws) return null;
      if (!buckets[ws]) {
        buckets[ws] = {
          weekStart: ws,
          label: weekLabel(ws),
          purchase: 0,
          purchaseCount: 0,
          sales: 0,
          fee: 0,
          shipping: 0,
          profit: 0,
          soldCount: 0,
          posts: 0,
          views: 0,
        };
      }
      return buckets[ws];
    }

    state.items.forEach(function (i) {
      const b = bucket(i.purchaseDate);
      if (b) {
        b.purchase += i.purchasePrice;
        b.purchaseCount += 1;
      }
      if (i.sale) {
        const sb = bucket(i.sale.saleDate);
        if (sb) {
          sb.sales += i.sale.salePrice;
          sb.fee += i.sale.fee;
          sb.shipping += i.sale.shipping;
          sb.profit += itemProfit(i);
          sb.soldCount += 1;
        }
      }
    });

    state.posts.forEach(function (p) {
      const b = bucket(p.date);
      if (b) {
        b.posts += 1;
        b.views += p.views;
      }
    });

    state.followers.forEach(function (f) {
      bucket(f.date);
    });

    const rows = Object.keys(buckets)
      .sort()
      .map(function (k) {
        return buckets[k];
      });

    // 週をまたいで累積値（現金残高・在庫・総利益・フォロワー）を積み上げる
    let cash = INITIAL;
    let cumProfit = 0;
    rows.forEach(function (r) {
      cash += -r.purchase + (r.sales - r.fee - r.shipping);
      cumProfit += r.profit;
      r.cash = cash;
      r.cumProfit = cumProfit;
      r.stockCount = stockCountAsOf(state, endOfWeek(r.weekStart));
      r.stockCost = stockCostAsOf(state, endOfWeek(r.weekStart));
      r.assets = r.cash + r.stockCost;
      r.followers = followerTotalAsOf(state, endOfWeek(r.weekStart));
    });

    return rows;
  }

  function endOfWeek(startStr) {
    const d = new Date(startStr + "T00:00:00");
    d.setDate(d.getDate() + 6);
    return toDateStr(d);
  }

  // 指定日時点で手元に残っている在庫（仕入済み かつ 未売却または売却日が後）
  function stockAsOf(state, dateStr) {
    return state.items.filter(function (i) {
      if (!i.purchaseDate || i.purchaseDate > dateStr) return false;
      if (i.sale && i.sale.saleDate && i.sale.saleDate <= dateStr) return false;
      return true;
    });
  }

  function stockCountAsOf(state, dateStr) {
    return stockAsOf(state, dateStr).length;
  }

  function stockCostAsOf(state, dateStr) {
    return sum(stockAsOf(state, dateStr), function (i) {
      return i.purchasePrice;
    });
  }

  function followerTotalAsOf(state, dateStr) {
    const latest = {};
    state.followers
      .filter(function (f) {
        return f.date <= dateStr;
      })
      .sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      })
      .forEach(function (f) {
        latest[f.platform] = f.count;
      });
    return Object.keys(latest).reduce(function (acc, k) {
      return acc + latest[k];
    }, 0);
  }

  // 今週の投稿ノルマ達成状況
  function postingProgress(state) {
    const ws = currentWeekStart();
    const counts = {};
    state.posts.forEach(function (p) {
      if (weekStart(p.date) === ws) {
        counts[p.platform] = (counts[p.platform] || 0) + 1;
      }
    });
    return global.Store.PLAN.postingGoals.map(function (g) {
      return {
        platform: g.platform,
        goal: g.perWeek,
        done: counts[g.platform] || 0,
      };
    });
  }

  // 運営ルールに反していないかのチェック
  function ruleWarnings(state) {
    const s = summary(state);
    const warnings = [];
    if (s.cash < 0) {
      warnings.push({
        level: "critical",
        text:
          "現金残高がマイナス（" +
          formatYen(s.cash) +
          "）です。元手10,000円のみ・追加資金なしのルールに反しています。仕入れ記録を見直してください。",
      });
    }
    const unchecked = state.items.filter(function (i) {
      return !i.authenticityChecked;
    });
    if (unchecked.length) {
      warnings.push({
        level: "warning",
        text: "正規品の確認が未チェックの商品が " + unchecked.length + " 点あります。偽物・コピー品は取り扱えません。",
      });
    }
    const noCondition = state.items.filter(function (i) {
      return !i.condition;
    });
    if (noCondition.length) {
      warnings.push({
        level: "warning",
        text: "商品状態が未記入の商品が " + noCondition.length + " 点あります。状態は正確に記載してください。",
      });
    }
    const stale = stockItems(state.items).filter(function (i) {
      return i.purchaseDate && daysBetween(i.purchaseDate, today()) >= 30;
    });
    if (stale.length) {
      warnings.push({
        level: "serious",
        text: "仕入れから30日以上売れていない在庫が " + stale.length + " 点あります。値下げか販路の変更を検討してください。",
      });
    }
    return warnings;
  }

  function daysBetween(a, b) {
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    return Math.round((db - da) / 86400000);
  }

  function formatYen(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "¥" + Math.abs(Math.round(n)).toLocaleString("ja-JP");
  }

  function formatPercent(n) {
    return (n * 100).toFixed(1) + "%";
  }

  global.Calc = {
    itemProfit: itemProfit,
    itemNetProceeds: itemNetProceeds,
    summary: summary,
    weekly: weekly,
    soldItems: soldItems,
    stockItems: stockItems,
    postingProgress: postingProgress,
    ruleWarnings: ruleWarnings,
    latestFollowersByPlatform: latestFollowersByPlatform,
    weekStart: weekStart,
    weekLabel: weekLabel,
    currentWeekStart: currentWeekStart,
    today: today,
    daysBetween: daysBetween,
    formatYen: formatYen,
    formatPercent: formatPercent,
  };
})(window);
