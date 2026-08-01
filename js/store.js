// 状態管理とローカル保存
// データはすべてブラウザの localStorage に保存する（サーバー不要）。
(function (global) {
  "use strict";

  const STORAGE_KEY = "furugi-tracker-v1";

  // 事業計画書に基づく固定値
  const PLAN = {
    initialCapital: 10000, // 元手は10,000円のみ。追加資金は投入しない。
    sourceShops: [
      "フリーマーケット",
      "セカンドストリート",
      "トレジャーファクトリー",
      "オフハウス",
      "ブックオフSUPER BAZAAR",
      "リサイクルショップ",
      "古着屋",
    ],
    areas: ["神奈川県", "東京都", "関東近郊"],
    // 販売先と手数料率（率は目安。登録時に手数料額を上書きできる）
    salesChannels: [
      { name: "メルカリ", feeRate: 0.1 },
      { name: "セカンドストリート", feeRate: 0 },
      { name: "フリーマーケット", feeRate: 0 },
      { name: "その他中古販売サービス", feeRate: 0 },
    ],
    // SNS運用の週次ノルマ
    postingGoals: [
      { platform: "TikTok", perWeek: 2 },
      { platform: "Instagram", perWeek: 2 },
      { platform: "YouTube Shorts", perWeek: 2 },
      { platform: "YouTube", perWeek: 0 }, // 必要に応じて投稿
    ],
    followerPlatforms: ["TikTok", "Instagram", "YouTube"],
    conditions: ["S（未使用に近い）", "A（目立つ傷なし）", "B（使用感あり）", "C（難あり）"],
  };

  function emptyState() {
    return {
      version: 1,
      items: [], // 仕入れた商品（売却情報を内包）
      posts: [], // SNS投稿記録
      followers: [], // フォロワー数の記録（スナップショット）
    };
  }

  let state = emptyState();
  const listeners = [];

  function load() {
    let raw = null;
    try {
      raw = global.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // プライベートモード等で localStorage が使えない場合はメモリのみで動作する
      return;
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      state = Object.assign(emptyState(), parsed);
      state.items = Array.isArray(parsed.items) ? parsed.items : [];
      state.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
      state.followers = Array.isArray(parsed.followers) ? parsed.followers : [];
    } catch (e) {
      state = emptyState();
    }
  }

  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* 保存できなくても操作は継続できるようにする */
    }
    listeners.forEach(function (fn) {
      fn(state);
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  function getState() {
    return state;
  }

  function newId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  // --- 商品 ---
  function addItem(data) {
    const item = {
      id: newId("item"),
      name: data.name,
      category: data.category || "",
      brand: data.brand || "",
      size: data.size || "",
      condition: data.condition || "",
      conditionNote: data.conditionNote || "",
      source: data.source || "",
      area: data.area || "",
      purchasePrice: Number(data.purchasePrice) || 0,
      purchaseDate: data.purchaseDate,
      listPrice: Number(data.listPrice) || 0,
      authenticityChecked: !!data.authenticityChecked,
      status: "stock",
      sale: null,
    };
    state.items.push(item);
    save();
    return item;
  }

  function updateItem(id, patch) {
    const item = findItem(id);
    if (!item) return null;
    Object.assign(item, patch);
    save();
    return item;
  }

  function findItem(id) {
    return state.items.filter(function (i) {
      return i.id === id;
    })[0];
  }

  function sellItem(id, data) {
    const item = findItem(id);
    if (!item) return null;
    item.sale = {
      channel: data.channel,
      salePrice: Number(data.salePrice) || 0,
      fee: Number(data.fee) || 0,
      shipping: Number(data.shipping) || 0,
      saleDate: data.saleDate,
    };
    item.status = "sold";
    save();
    return item;
  }

  function cancelSale(id) {
    const item = findItem(id);
    if (!item) return null;
    item.sale = null;
    item.status = "stock";
    save();
    return item;
  }

  function removeItem(id) {
    state.items = state.items.filter(function (i) {
      return i.id !== id;
    });
    save();
  }

  // --- SNS ---
  function addPost(data) {
    const post = {
      id: newId("post"),
      date: data.date,
      platform: data.platform,
      title: data.title || "",
      views: Number(data.views) || 0,
    };
    state.posts.push(post);
    save();
    return post;
  }

  function updatePost(id, patch) {
    const post = state.posts.filter(function (p) {
      return p.id === id;
    })[0];
    if (!post) return null;
    Object.assign(post, patch);
    save();
    return post;
  }

  function removePost(id) {
    state.posts = state.posts.filter(function (p) {
      return p.id !== id;
    });
    save();
  }

  function addFollowerRecord(data) {
    const rec = {
      id: newId("fol"),
      date: data.date,
      platform: data.platform,
      count: Number(data.count) || 0,
    };
    state.followers.push(rec);
    save();
    return rec;
  }

  function removeFollowerRecord(id) {
    state.followers = state.followers.filter(function (f) {
      return f.id !== id;
    });
    save();
  }

  // --- データ入出力 ---
  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("形式が不正です");
    state = Object.assign(emptyState(), parsed);
    state.items = Array.isArray(parsed.items) ? parsed.items : [];
    state.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
    state.followers = Array.isArray(parsed.followers) ? parsed.followers : [];
    save();
  }

  function resetAll() {
    state = emptyState();
    save();
  }

  load();

  global.Store = {
    PLAN: PLAN,
    getState: getState,
    subscribe: subscribe,
    save: save,
    addItem: addItem,
    updateItem: updateItem,
    findItem: findItem,
    sellItem: sellItem,
    cancelSale: cancelSale,
    removeItem: removeItem,
    addPost: addPost,
    updatePost: updatePost,
    removePost: removePost,
    addFollowerRecord: addFollowerRecord,
    removeFollowerRecord: removeFollowerRecord,
    exportJson: exportJson,
    importJson: importJson,
    resetAll: resetAll,
  };
})(window);
