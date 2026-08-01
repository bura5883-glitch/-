(function () {
  "use strict";

  const menuEl = document.getElementById("menu");
  const playEl = document.getElementById("play");
  const listEl = document.getElementById("puzzle-list");
  const backBtn = document.getElementById("back-btn");
  const titleEl = document.getElementById("puzzle-title");
  const diffEl = document.getElementById("puzzle-difficulty");
  const problemEl = document.getElementById("puzzle-problem");
  const form = document.getElementById("question-form");
  const input = document.getElementById("question-input");
  const historyEl = document.getElementById("history");
  const hintBtn = document.getElementById("hint-btn");
  const answerBtn = document.getElementById("answer-btn");
  const answerBox = document.getElementById("answer-box");
  const answerText = document.getElementById("answer-text");

  let current = null; // 現在のパズル
  let hintIndex = 0;

  // --- メニュー描画 ---
  function renderMenu() {
    listEl.innerHTML = "";
    PUZZLES.forEach(function (p) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML =
        '<span class="difficulty">' +
        escapeHtml(p.difficulty) +
        "</span>" +
        '<span class="title">' +
        escapeHtml(p.title) +
        "</span>";
      btn.addEventListener("click", function () {
        startPuzzle(p);
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  // --- プレイ開始 ---
  function startPuzzle(p) {
    current = p;
    hintIndex = 0;
    titleEl.textContent = p.title;
    diffEl.textContent = p.difficulty;
    problemEl.textContent = p.problem;
    historyEl.innerHTML = "";
    answerText.textContent = p.answer;
    answerBox.open = false;
    answerBox.hidden = true;
    menuEl.classList.add("hidden");
    playEl.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    input.focus();
  }

  // --- 戻る ---
  backBtn.addEventListener("click", function () {
    current = null;
    playEl.classList.add("hidden");
    menuEl.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- 質問送信 ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || !current) return;
    const result = judge(q, current.judge);
    appendQA(q, result);
    input.value = "";
    input.focus();
  });

  // --- 判定 ---
  function judge(question, rules) {
    const text = normalize(question);
    if (!rules) return { kind: "unknown", message: defaultMessage(text) };
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (matchRule(text, r)) {
        return { kind: r.kind, message: kindMessage(r.kind) };
      }
    }
    return { kind: "unknown", message: defaultMessage(text) };
  }

  function matchRule(text, rule) {
    if (rule.none && rule.none.some(function (k) { return text.indexOf(normalize(k)) >= 0; })) {
      return false;
    }
    const anyOk = !rule.any || rule.any.some(function (k) {
      return text.indexOf(normalize(k)) >= 0;
    });
    if (!anyOk) return false;
    const allOk = !rule.all || rule.all.every(function (k) {
      return text.indexOf(normalize(k)) >= 0;
    });
    return allOk;
  }

  function normalize(s) {
    // ひらがな・カタカナ・大文字小文字の違いをざっくり吸収
    return String(s)
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0x60);
      })
      .replace(/\s+/g, "");
  }

  function kindMessage(kind) {
    switch (kind) {
      case "yes":
        return "その通りです。";
      case "no":
        return "違います。";
      case "partial":
        return "一部はそう言えます。";
      case "unrelated":
        return "今回の真相には関係ありません。";
      default:
        return "";
    }
  }

  function defaultMessage() {
    const candidates = [
      "質問の意味がうまく掴めませんでした。もう少し具体的に聞いてみてください。",
      "はい / いいえ で答えられる形に言い換えてみてください。",
      "判定できませんでした。人物・場所・物・動機など、対象を絞って質問してみましょう。",
    ];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function appendQA(question, result) {
    const item = document.createElement("div");
    item.className = "qa-item " + result.kind;
    const q = document.createElement("div");
    q.className = "q";
    q.textContent = question;
    const a = document.createElement("div");
    a.className = "a";
    a.textContent = result.message;
    item.appendChild(q);
    item.appendChild(a);
    historyEl.appendChild(item);
  }

  // --- ヒント ---
  hintBtn.addEventListener("click", function () {
    if (!current) return;
    const hints = current.hints || [];
    if (hintIndex >= hints.length) {
      appendSystemMessage("これ以上ヒントはありません。答えを確認してみましょう。", "unknown");
      return;
    }
    const h = hints[hintIndex++];
    appendSystemMessage("ヒント " + hintIndex + ": " + h, "partial");
  });

  function appendSystemMessage(text, kind) {
    const item = document.createElement("div");
    item.className = "qa-item " + (kind || "unknown");
    const a = document.createElement("div");
    a.className = "a";
    a.textContent = text;
    item.appendChild(a);
    historyEl.appendChild(item);
  }

  // --- 答え公開 ---
  answerBtn.addEventListener("click", function () {
    if (!current) return;
    const ok = window.confirm("本当に答えを表示しますか？");
    if (!ok) return;
    answerBox.hidden = false;
    answerBox.open = true;
    answerBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // --- util ---
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  renderMenu();
})();
