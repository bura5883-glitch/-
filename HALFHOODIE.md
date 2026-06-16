# 2way ハーフフーディ デザインプロンプト＆ブリーフ

VELORA第2アイテム：2way可変ハーフフーディ
- **モードA（Half-hood style）**：片袖を顔/口周りにマフラー状に巻く
- **モードB（Normal hoodie）**：普通のパーカーとして着る
- 袖の模様が口周りに来るよう位置計算済み

---

# 1. デザインコンセプト

## 構造
- ベース：オーバーサイズのフーディ（クロップド気味）
- フード一体型、片側に長い延長スリーブ
- 反対側は通常スリーブ（または袖なし）
- ドローコード付き
- グレー杢（ヘザーグレー）or ブラック

## 2wayの切替
- **モードA**：片腕を出して、長い延長スリーブを首〜顔周りに巻きつける（マフラー状）
- **モードB**：両腕を袖に通して、通常のフーディとして着用

## 鍵となる仕様
- **袖の特定位置に刺繍ロゴを配置**
- 顔に巻いた時、ロゴが**口元〜頬付近**に来る位置
- 通常モードでも袖の前腕部分にロゴが見える

---

# 2. 口元ロゴ位置の計算

## 巻き方の想定
1. 袖口（リブ部分）が首の右側に来る
2. 袖を顔の前を通して左肩へ
3. もう一周して首の後ろへ
4. 端を留める

## ロゴ配置の計算式

```
袖口から ◯◯cm の位置に配置
　↓
顔に1周巻くと、ちょうど口元に来る
```

**サイズ別の推奨位置（袖口リブの始まりからの距離）**

| サイズ | 袖全長 | ロゴ位置（袖口から） |
|--------|-------|------------------|
| S | 約65cm | 25cm |
| M | 約68cm | 28cm |
| L | 約72cm | 30cm |
| XL | 約75cm | 32cm |

**ロゴサイズ**：横幅 7〜10cm 程度（顔の半分に収まる）
**ロゴの向き**：袖を巻いた時に**正しく読める向き**で配置（袖の長さ方向に対して90度傾ける）

→ サンプル段階で必ず**マネキン or 4人で実装着テスト**して微調整。

---

# 3. Midjourney / AI画像生成プロンプト

## プロンプトA：モードA（顔に巻いた状態）

英語推奨：
```
fashion editorial photo of a young Japanese model wearing 
an avant-garde asymmetric grey marl hoodie, one arm bare 
showing black tank top underneath, the other sleeve 
wrapped around the face like a scarf covering the mouth, 
silver metallic embroidered logo visible on the wrapped 
sleeve at mouth level, hood up, drawstrings hanging, 
oversized streetwear silhouette, yellow seamless studio 
background, soft natural lighting, shot on Hasselblad, 
fashion magazine aesthetic, gothic streetwear, Y2K 
inspired, 8k, high detail --ar 2:3 --style raw --v 6
```

### 日本語ノート
- `asymmetric` = 左右非対称（片袖だけ）
- `wrapped around the face like a scarf` = マフラー風巻き
- `embroidered logo at mouth level` = 口元に刺繍ロゴ
- `--ar 2:3` = 縦長アスペクト比
- `--v 6` = Midjourney最新モデル

## プロンプトB：モードB（普通に着用）

```
fashion editorial photo of a young Japanese model wearing 
an oversized cropped grey marl pullover hoodie, both arms 
in sleeves, hood down, silver metallic embroidered logo 
on the forearm sleeve area, grey sweat shorts, high-top 
Converse sneakers, red Yankees cap, streetwear styling, 
concrete asphalt background, harsh sunlight, dynamic pose, 
shot from low angle, gothic Y2K streetwear aesthetic, 
8k, high detail --ar 2:3 --style raw --v 6
```

## プロンプトC：商品単体の白背景物撮り

```
product photography of a grey marl asymmetric hoodie, 
laid flat on white background, one extended long sleeve 
on the right side, normal sleeve on the left side, 
hood with drawstrings, silver embroidered logo on the 
right sleeve forearm area, clean studio lighting, 
high resolution e-commerce product shot, soft shadows, 
top-down view, minimalist, 8k --ar 1:1 --style raw --v 6
```

## プロンプトD：2wayの着方説明図（インフォグラフィック風）

```
fashion product diagram showing a convertible 2-way hoodie, 
split panel design, left side shows hoodie worn normally 
with both arms in sleeves, right side shows the same hoodie 
worn asymmetrically with one sleeve wrapped around face like 
a scarf, grey marl fabric, technical fashion illustration 
style, clean white background, annotations and arrows, 
infographic layout, 8k --ar 16:9 --v 6
```

## プロンプトE：袖を巻く動作の連続写真

```
fashion lookbook sequence showing how to wear a 2-way 
asymmetric hoodie, 4-frame storyboard, frame 1 hoodie worn 
normally, frame 2 removing one arm from sleeve, frame 3 
wrapping the extended sleeve around the face, frame 4 final 
look with sleeve covering mouth and silver logo visible, 
grey marl fabric, young Japanese model, yellow seamless 
background, fashion editorial, 8k --ar 16:9 --v 6
```

---

# 4. デザイナー / 工場向けブリーフ

これをそのまま渡せばOK。

```
=================================
【デザインブリーフ】
VELORA 2way ハーフフーディ
=================================

■ コンセプト
2通りの着方ができるコンバーチブルフーディ。
- モードA：片腕を出して長い延長スリーブを顔/口元に巻く
- モードB：両腕を袖に通して通常のフーディとして着用

■ 構造
- ベース：オーバーサイズ クロップド丈フーディ
- 右側：通常の長袖
- 左側：通常より約20〜25cm長い延長スリーブ
- フード：一体型、ドローコード付き
- 裾：リブ仕様

■ サイズ仕様（Mサイズ基準）
- 着丈：54cm（クロップド）
- 身幅：60cm
- 通常袖丈：68cm
- 延長袖丈：90cm（延長側、22cm長い）
- 袖幅：23cm（袖口リブ8cm）

■ 素材
- 14オンス 裏起毛スウェット
- カラー：グレー杢 / ブラック の2色展開

■ ロゴ刺繍仕様（最重要）
- 配置：延長スリーブ側のみ、袖口リブから28cm上
- サイズ：横7cm × 縦3cm 程度
- 内容：VELORAロゴ（メタル系）
- 糸：シルバー系メタリック刺繍糸
- 向き：袖を巻いた時に正しく読める向き
  （袖の長さ方向に対して垂直 = 袖を顔に巻いた時、
   テキストが横書きで読める状態になる）

■ 2way仕様の動作確認ポイント
1. モードAで袖を巻いた時、ロゴが顔の口元に来ること
2. 巻いた時に解けないよう、袖口リブが少し滑り止め効果を持つこと
3. モードB時、片袖が長くてだぶつかないよう、袖口で折り返せる構造を検討

■ ディテール
- フードのドローコード：シルバーアグレット
- ボディ前面のロゴ：なし（袖のみ）
- バックプリント or 刺繍：要検討（追加でVELORA刻印）

■ 参考画像
- 添付の半袖フーディ着用画像
- マネキンで実装着テストを推奨

■ サンプル制作依頼内容
- ファーストサンプル：1着
- 修正：1〜2回想定
- 最終本生産：30〜50着

=================================
```

---

# 5. 仕様書（パターン制作用）

工場のパタンナーに渡す詳細スペック。

## 各部位の寸法（Mサイズ）

```
【上身頃】
着丈：54cm（後ろ襟ぐり下から裾まで）
身幅：60cm（脇下〜脇下）
肩幅：55cm（ドロップショルダー）

【フード】
高さ：35cm
横幅：28cm
深さ：22cm
ドローコード：120cm × 2本

【右袖（通常）】
肩〜袖口：68cm
袖幅（上）：30cm
袖幅（下）：23cm
袖口リブ：8cm幅

【左袖（延長）】
肩〜袖口：90cm（通常より22cm長い）
袖幅：右袖と同じ
袖口リブ：8cm幅
→ 巻きやすい柔らかさを優先

【裾】
リブ幅：6cm
リブ素材：本体と同色

【刺繍位置】
左袖（延長側）の前面
袖口リブ終わり位置から上に28cm
ロゴサイズ：横7cm × 縦3cm
ロゴ向き：袖の長さ方向に対して垂直
```

---

# 6. 試作・検証チェックリスト

## サンプル受領時に4人で確認すること

- [ ] モードA：袖を顔に巻いた時、ロゴが**口元の位置**に来るか
- [ ] モードA：巻いた状態が崩れないか（30分間着用テスト）
- [ ] モードA：苦しくないか、息はしやすいか
- [ ] モードB：通常のフーディとして違和感ないか
- [ ] モードB：延長袖が邪魔にならないか（折り返し or 何か工夫）
- [ ] ロゴの向きが正しいか（巻いた時に逆さま等になっていないか）
- [ ] 全身鏡で見てかっこいいか
- [ ] 4人でフィッティング（背格好の違うメンバーで確認）

## 写真記録
- 各モードで前後左右の写真
- 巻き方の手順動画
- ロゴ位置の細部写真

---

# 7. 完成後の見せ方（SNS向け）

## Instagram投稿アイデア
- **「How to wear」動画**：モードB → モードA に変化する過程
- **2分割画像**：左にモードA、右にモードBで比較
- **ロゴが現れる瞬間**：巻き終わりでロゴが顔に出てくるGIF
- **後ろ姿**：背中側からの巻き具合

## TikTokリール
- 着替えチャレンジ系（5秒で着方変えるシリーズ）
- スローモーションで巻く動作
- 朝起きてから外出するまでの流れ（モードB→モードA）

## 商品名候補
- VELORA Convertible Hoodie
- VELORA 2-Way Hood
- VELORA Wrap Hoodie
- VELORA Asymmetric Hoodie
- VELORA Shawl Hood

---

# 8. 工場への聞き方

このアイテムは特殊なので、商談時に必ず以下を確認：

```
「片側の袖を通常より22cm長く延長したい仕様です。
この延長スリーブを首〜顔周りに巻いて『マフラー状に
着用できる』2way構造を目指しています。

【確認したいこと】
1. 片袖だけ延長する仕様の縫製は可能か
2. 巻いた時に解けない素材感を出すには
   どんな生地が向いているか
3. 袖の延長部分のパターンは、テーパー（細くなる）か
   ストレートか、どちらが巻きやすいか
4. サンプルでマネキンに巻いてテストできるか」
```

---

# 9. AI画像生成の使い方ガイド（4人向け）

## Midjourney（月10ドル〜）
1. discord.gg/midjourney に参加
2. 上記プロンプトをコピペ
3. `/imagine` コマンドで生成
4. 気に入った画像で U1〜U4 で高画質化

## DALL-E（ChatGPT Plus 月20ドル）
- プロンプトをそのまま入力
- スタイル指定 `--ar` などは無効、文章で指示

## NijiJourney（Midjourneyのアニメ特化）
- イラスト風のラフ案が欲しい時はこちら

## 無料で試すなら
- Bing Image Creator（無料、DALL-E3ベース）
- Leonardo.ai（毎日無料クレジット）

---

# まとめ：この後の流れ

1. **今**：上記プロンプトでAI画像を10〜20枚生成 → 4人で世界観すり合わせ
2. **Week 1**：気に入った画像をデザインブリーフと一緒に工場へ送付
3. **Week 2〜3**：工場と仕様詰め、パターン制作
4. **Week 4〜6**：ファーストサンプル → 巻きテスト
5. **Week 7〜8**：修正 → セカンドサンプル
6. **Week 9〜**：本生産発注

→ VELORAブランドの**「シグネチャーアイテム（看板商品）」**になり得る尖った仕様。
　しっかり時間かけて作り込むべき。
