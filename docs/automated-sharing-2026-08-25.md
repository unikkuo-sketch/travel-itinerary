# 自動化資訊分享 — 能否變現、怎麼落地（2026-08-25）

對象：宇宙碎片集散地（https://universum-sliver.vercel.app/）  
定位不變：真實走過的日本行程與風土筆記，**非訂票、非導購站**。  
決策摘要：`docs/decisions/2026-08-25-automated-sharing.md`

---

## 1. 先回答：最終可以帶來收益嗎

**可以，但路徑不是「機器一直發文 → 錢進來」。**

自動化只負責把已經寫好的行程，穩定送到還會看的人面前。收益發生在更後面：

1. **被找到**（搜尋、RSS、社群、LLM／agent）
2. **被信任**（真實走過、預算與動線可核對、照片有出處）
3. **有一個不背叛定位的 offer**（人願意付錢的東西）

本站現況對第 1 步其實比多數旅遊部落格更有利：行程 JSON 公開、`llms.txt`、預渲染 HTML、GA4 已上。缺的是**對外重複勞動的出口**（RSS／草稿／單一頻道節奏），不是再造後端。

| 時間感 | 預期 | 為什麼 |
|--------|------|--------|
| 現在～數週 | 幾乎沒有現金流 | 6 趟內容、`*.vercel.app` 網址、沒有電子報名單、沒有已驗證的社群帳號 |
| 穩定發 8～12 週後 | 開始有「可量測的人」 | GA4 看得到 UTM；GSC 看得到長尾（熱海／東北祭／四國自駕） |
| 有穩定來客之後 | 才談收益 | 客製行程諮詢、數位行程包、姊妹站；聯盟／廣告最後才考慮 |

粗量級（台灣旅遊筆記、非網紅）：諮詢或數位包若成交，是**偶爾一筆、高信任**，不是每月被動數萬。把它當「讓真實行程被更多人用到，順便讓未來的 offer 有入口」，才合理；當成印鈔機關會失望。

---

## 2. 不要做的（現階段）

- 一次接 Threads＋IG＋FB＋LINE＋小紅書 API 全自動發（帳號易死、語氣易崩、本站也還沒密鑰）
- 為發文而新寫大量「日本景點大全」
- AdSense／未揭露聯盟連結（與 2026-07-25 公開站定位衝突，且流量不夠賺）
- 把票券本機狀態、購物勾選、私人班次當公開賣點

---

## 3. 本站獨特的自動化原料

`itinerary.json` 已是 source of truth。盤點（2026-08-25）：

| 原料 | 數量 | 適合變成 |
|------|------|----------|
| 行程頁 | 6 | 週年回顧、出發倒數、總覽卡 |
| `stories[]` 風土 | 35 | Threads／LINE 主食（2～4 句＋圖） |
| `foods[]` 飲食 | 32 | 美食／酒 短篇 |
| 合計可輪播單元 | **67** | 每週 2～3 則 → 約 5～8 個月不重複 |

因此第一階段**不要產新文**，把 JSON 切成可分享單元即可。

---

## 4. 落地步驟

### Phase 0 — 量測與頻道（站長手操，無改碼）

1. **Google Search Console** 驗證正式網域、提交 `sitemap.xml`（SEO 評估 Phase 0 仍待做）。
2. 在 GA4 確認會看到 `utm_source`／`utm_campaign`（之後每則分享帶 UTM）。
3. **只開一個對外頻道**（建議台灣受眾先 **Threads 或 LINE 官方帳號**；IG 圖多、小紅書另套規則，都先不要並行）。
4. 自訂網域仍是加分（比 `vercel.app` 好記、好信任），但不擋本階段。

驗收：能回答「這週有沒有人從分享點進來」。

### Phase 1 — 草稿自動化（本 PR 已做）

內容不經過社群 API，先做到「一鍵產生、人工貼上」。

| 產物 | 指令／路徑 | 誰用 |
|------|-------------|------|
| RSS | `npm run gen-seo` → `/feed.xml`（build 一併產） | 訂閱器、之後 n8n／Make／Buffer 吃 RSS |
| 文案包 | `npm run gen-share-pack` → `share-pack/`（不進 git） | 作者複製 Threads／LINE／IG |
| 章節深鏈 | `#story-1`／`#food-1` | 分享落地到該則，不是只到頁頂 |

節奏建議：**週 2～3 則**，輪播風土／飲食，每趟行程每季最多 1 則總覽。發前改一個口語開頭即可，勿整篇機器味連發。

UTM 慣例（文案包已帶）：

```
utm_source=threads|line|instagram|rss
utm_medium=social|rss
utm_campaign=share
utm_content={kind}-{tripId}-{n}
```

### Phase 2 — 一條頻道半自動（有帳號與權限後）

1. 先用人貼 2～4 週，確認哪種單元（祭典／食物／動線）有點閱。
2. 再用 **n8n／Make 訂閱 `/feed.xml`** → 產出草稿到 Notion／Telegram，**仍人工按發送**。
3. 只有單一頻道穩定、沒被限流，才考慮該平台 API 定時發（仍建議先審標題）。

不要在 repo 裡放 token。GitHub Actions 可當「產 `share-pack` artifact」，不要當發文機器人。

### Phase 3 — 收益（有來客再啟動）

優先序（由「最貼定位」到「最容易走鐘」）：

1. **客製行程諮詢** — 真實走過＋公開預算／票券邏輯，最低流量也能成交；Hub 或行程頁放一句「想問這條線怎麼排」即可，用表單／email，不必電商。
2. **數位行程包** — 從現有 JSON 衍生 Notion／PDF「可改的行程骨架」（不是把私人票券拿去賣）。
3. **姊妹站** — 日本行程頁已連 `manholecard.vercel.app`；若那裡有周邊或導覽，用「平行宇宙」互薦，不要在旅遊筆記裡塞購物車。
4. **（延後）揭露式工具連結** — eSIM、JR Pass、訂房。要做必須先改公開站決策，每則標示，且不得蓋過筆記正文。
5. **（不建議當主線）廣告** — 頁數與流量都還不夠。

成功指標不要設「月收」。改設：

- 分享點入（GA4 UTM）每週 > 0 且能指出哪則
- GSC 有非品牌長尾曝光
- 有人主動問「這趟怎麼排」（諮詢訊號）

---

## 5. 技術對照（本 repo）

| 檔案 | 角色 |
|------|------|
| `scripts/share-items.mjs` | 從 manifest／itinerary 收集可分享單元 |
| `scripts/gen-seo.mjs` | sitemap、llms、**RSS `public/feed.xml`** |
| `scripts/gen-share-pack.mjs` | Threads／LINE／IG 草稿＋12 週輪播表 |
| `js/stories.js`／`js/food.js` | 章節 `id`，載入後捲到 hash |
| `scripts/prerender-trips.mjs` | 預渲染章節同樣帶 `id`（無 JS 也可錨點） |
| `index.html` | `rel=alternate` RSS＋footer 訂閱連結 |

換網域時：`js/site.js` 的 `SITE_ORIGIN` 與 `scripts/share-items.mjs` 的 `SITE_ORIGIN` 一併改，再 `npm run gen-seo`。

---

## 6. 作者每週 checklist

1. `npm run gen-share-pack`
2. 打開 `share-pack/calendar.md`，取本週 2～3 則
3. 對應 `captions.md` 複製到選定頻道，改第一句口語
4. 貼上後用自己的連結點一次，確認 GA4 即時有 UTM
5. 新行程上線後重跑即可，不必重寫文案庫
