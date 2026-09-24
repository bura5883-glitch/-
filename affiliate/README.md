# 1人アフィリエイト運用チーム（Claude Code）

Claude Code のサブエージェントで6人の役割を分担し、オーナーは**判断だけ**を行う構成です。

| 役割 | エージェント | 主な成果物 |
|---|---|---|
| 戦略責任者 | `strategist` | `strategy.md` |
| リサーチ担当 | `researcher` | `research/*.md` |
| 企画担当 | `planner` | `ideas/*.md` |
| ライティング担当 | `writer` | `posts/*.md` |
| 導線担当 | `funnel` | `cta/patterns.md` |
| 秘書担当 | `secretary` | `tasks.md`, `reports/*.md` |

## 使い方
1. このリポジトリで `claude` を起動
2. 初回: `strategist で運用方針を一緒に決めて` と話しかける
3. 毎週: `/weekly [テーマ]` でリサーチ〜投稿案作成まで一括実行
4. `tasks.md` の「🔴 判断待ち」だけ確認して承認/却下
5. 投稿後、数値を `reports/metrics.csv` に追記 → `/review`

個別に呼ぶこともできます: `researcher に〇〇の案件を比較させて`

## 注意
- **投稿そのものは人間が行う**前提です（SNS APIの自動投稿は含みません）
- 案件紹介には「PR」表記が必須（ステマ規制）。writer に組み込み済み
- 報酬条件・数値はAIが捏造しないようルール化していますが、最終確認はオーナーが行ってください
