# SEO 評估報告 — 宇宙碎片集散地（2026-07-30）

正式站：https://universum-sliver.vercel.app/  
範圍：搜尋引擎檢索（Google／Bing 等）＋其他 agent／LLM 查找資料的易取得性。

> **實作狀態（2026-07-31）：** Phase 1＋2 已落地（見 `docs/decisions/2026-07-31-seo-phase-1-2.md`）。正式 URL 為 `/trips/{id}/`；build 預渲染 meta／正文；`llms.txt` 已提供。Phase 0（GSC）操作手冊見 `docs/gsc-setup.md`；`npm run check-gsc` 可預檢正式站，驗證仍須站長在 Search Console 登入後按一次。

---

## 1. 結論（先看這段）

| 面向 | 狀態 | 一句話 |
|------|------|--------|
| 基礎可爬 | **及格** | `robots.txt` 全開、sitemap 25 URL、HTTPS／HSTS、各 HTML 殼有 description＋OG／Twitter |
| 內容可索引 | **弱** | 行程／風土／飲食／購物主體靠 JS 灌入；爬蟲拿到的是空殼＋通用 meta |
| 社群預覽 | **弱** | OG 固定為殼層文案＋共用 `hub-hero.webp`；LINE／FB／Slack 幾乎不執行 JS |
| Agent 資料 | **結構強、發現弱** | `/trips/manifest.json`、`/trips/{id}/itinerary.json` 公開可 fetch（含 CORS `*`），但無 `llms.txt`／機器入口說明 |
| 商業 SEO 效益 | **中低** | 站是「真實走過的參考筆記」非流量變現站；優先把「分享正確＋被 agent 讀懂」做好，勝過搶熱門關鍵字 |

**建議優先序：** 先做低成本發現／檢索衛生（Search Console、canonical、`llms.txt`、shopping noindex）→ 再做「每趟行程靜態 meta／預渲染」解 CSR 瓶頸 → 自訂網域與結構化資料加分。

---

## 2. 現況盤點（已驗證）

### 2.1 部署與基礎訊號

| 項目 | 現況 |
|------|------|
| Host | Vercel 正式站 `universum-sliver.vercel.app`；舊 GH Pages 回 404 |
| Origin | `js/site.js` `SITE_ORIGIN`；HTML OG／robots／sitemap 已對齊 |
| HTTPS | 有；`strict-transport-security` 已設 |
| `robots.txt` | `User-agent: *` / `Allow: /` + Sitemap 指向 |
| `sitemap.xml` | Hub 1 + 6 趟 ×（trip／stories／food／shopping）= **25** URL；由 `scripts/gen-sitemap.mjs` 自 manifest 產生 |
| 404 | `public/404.html` 含 `noindex` |
| `lang` | `zh-TW` |
| 驗證檔／GSC | repo 內**無** Search Console／Bing 驗證 meta 或 HTML 檔 |

線上抽樣（2026-07-30）：首頁／robots／sitemap／manifest／單趟 `itinerary.json`／OG 圖皆 HTTP 200；靜態資源帶 `access-control-allow-origin: *`。

公開 `site:` 查詢（無登入 Search Console）無法可靠判定收錄量；Bing／Google 結果頁對 vercel.app 新站常偏空或受 bot 限制。**以「已具備被爬條件、尚未證明穩定收錄」看待**，需在 GSC 提交 sitemap 後才有準數據。

### 2.2 頁面級 SEO

| 頁面 | 靜態 HTML 內容 | Meta／OG | 執行期更新 |
|------|----------------|----------|------------|
| Hub `index.html` | Hero、章節標題有；行程卡／地圖空（JS） | 站名＋品牌描述完整 | 無 |
| `trip.html?trip=` | 區塊骨架＋空容器 | **通用**「行程參考」；`og:url` 無 query | `document.title`＋`description`（**未改 og:**） |
| `stories`／`food` | 章節空殼 | 通用 | title 更新 |
| `shopping` | 工具頁空殼 | 通用 | title 更新 |

**缺口（技術）：**

1. **CSR 空殼**：無 JS 時行程正文幾乎不可見（Google 可渲染 JS 但不保證、延遲；多數社群爬蟲不跑 JS）。
2. **Query-string URL**：`*.html?trip={中文 id}` 可被列入 sitemap，但不如 path（如 `/trips/{id}/`）清晰；`og:url`／canonical **皆未**綁定完整 trip URL。
3. **無 `<link rel="canonical">`**。
4. **無 JSON-LD**（`WebSite`／`ItemList`／`TouristTrip`／`BreadcrumbList` 等）。
5. **Sitemap 無 `lastmod`**（可選，但利於增量感知）。
6. **購物頁進 sitemap**：工具＋本機 localStorage，搜尋價值低，易稀釋。
7. **每趟封面未進 OG**：AGENTS 已註明靜態站無法給 crawler 動態 cover——與 CSR 同源。

### 2.3 Agent／機器易取性

| 能力 | 現況 | 評價 |
|------|------|------|
| 行程索引 JSON | `GET /trips/manifest.json` | 優：穩定、結構化 |
| 單趟全文 JSON | `GET /trips/{id}/itinerary.json` | 優：source of truth 直接公開 |
| CORS | `*` | 優：瀏覽器／工具跨域可讀 |
| 照片 WebP | `/trips/{id}/photos/...` 自架 | 優：不 hotlink |
| 發現文件 | **無** `llms.txt`／`ai.txt`／`.well-known` | 差：agent 需「猜」或讀人寫 README |
| Schema 說明 | 散落 `docs/add-trip.md`、AGENTS | 人讀 OK；機器無單一入口 |
| Sitemap 含 JSON | 否（僅 HTML） | 中：搜尋引擎不需 JSON；agent 需要另入口 |
| HTML 正文 | 依賴 JS | 對「只抓 HTML、不抓 JSON」的 agent 不友善 |

**判斷：** 資料層對 agent 已經比多數旅遊部落格好（結構化 JSON 即 API）；缺的是**發現層與授權／用途說明**，不是再造後端。

---

## 3. 效益評估（值不值得做）

### 3.1 站點目標對齊

決策（`docs/decisions/2026-07-25-public-vercel.md`）定位：對外「真實走過的日本行程與風土筆記」參考站，非電商／聯盟導流站。

因此 SEO 成功指標應是：

1. **分享連結預覽正確**（標題＝該趟行程、圖＝該趟 cover）
2. **長尾可被搜到**（例：「熱海 長瀞 行程」「東北 睡魔祭 動線」）— 量不大但精準
3. **Agent／助手能穩定讀到行程 JSON**（規劃、摘要、比對）
4. **品牌網址可記**（自訂網域優於 `*.vercel.app`）

不應過度期待：「日本旅遊」這類頭部門檻高，內容量與外鏈不足以短期衝排名。

### 3.2 投入／報酬粗分

| 方案層 | 大致改動面 | 預期效益 | 風險／代價 |
|--------|------------|----------|------------|
| A. 衛生＋發現 | 文件／meta／`llms.txt`／GSC 手操 | 檢索可觀測、agent 找得到門 | 極低；不改架構 |
| B. 每趟靜態 meta／預渲染片段 | build 腳本或少量 HTML 產生 | 解 OG＋提升索引品質 | 中；需接上 gen 流程與新增行程慣例 |
| C. 路徑型 URL／輕量 SSG | 路由慣例、可能改 link | 更乾淨、利 canonical | 中高；舊 query URL 要 redirect |
| D. 搶內容流量（大量新文） | 編輯產能 | 與定位不符則報酬低 | 高維護 |

**效益結論：** A 必做；B 是真正拉開「看起來像正式站」的關鍵；C 可併 B 或隨自訂網域一起做；D 非優先。

---

## 4. 可行方案（分階段）

### Phase 0 — 營運（無／少改碼）

1. **Google Search Console** 驗證 `universum-sliver.vercel.app`（DNS 或 HTML file），提交 `sitemap.xml`。
2. **Bing Webmaster Tools** 同上（可匯入 GSC）。
3. 用「網址檢查」抽樣：Hub、一趟 `trip.html?trip=…`、對應 `itinerary.json`。
4. 記錄基線：已索引頁數、覆蓋率、是否「已檢索／未編入索引」。

### Phase 1 — 低成本技術（建議下一 PR 實作）

| # | 項目 | 做法摘要 | 對誰有用 |
|---|------|----------|----------|
| 1.1 | `llms.txt`（＋可選 `llms-full.txt`） | 站名、一句定位、連結 `manifest.json`、各趟 `itinerary.json`、主要 HTML、授權／ATTRIBUTIONS 提示 | Agent |
| 1.2 | Canonical | 各殼層 + JS 在已知 `trip` 時寫入完整 URL | 搜尋 |
| 1.3 | 客戶端同步 OG／Twitter | `trip.js`／stories／food 載入後改 `og:title` 等（補強部分爬蟲；**不解**純靜態社群爬蟲） | 部分 |
| 1.4 | Shopping `noindex` | meta robots；自 sitemap 排除 | 搜尋衛生 |
| 1.5 | Sitemap `lastmod` | `gen-sitemap.mjs` 寫入檔案 mtime 或 manifest 日期 | 搜尋 |
| 1.6 | README／AGENTS 加「機器入口」一節 | 指向 llms.txt + JSON 路徑慣例 | Agent／維護 |

預估改動面：`public/`、`scripts/gen-sitemap.mjs`、少數 `js/*`、HTML head；**不需**換框架。

### Phase 2 — 解 CSR（核心 SEO／OG）

在維持「Vite + vanilla、trips JSON 為 SoT」前提下，擇一：

**方案 B1 — Build-time 預渲染 meta（最小侵入）**

- Build 時讀 manifest，為每趟產生小型靜態頁或注入 meta 的 HTML（至少 title／description／og:url／og:image=cover）。
- 正文可仍 CSR；先讓 crawler／社群看到正確身分。
- 優點：改動可控。缺點：正文索引仍弱。

**方案 B2 — Build-time 預渲染重點正文（推薦中期）**

- 產出每趟 trip／stories／food 的靜態 HTML：hero＋overview 摘要＋風土／飲食章節文字（自 JSON）。
- JS hydrate 地圖、票券狀態、購物勾選等互動。
- 優點：搜尋＋agent-only-HTML 雙贏。缺點：gen 腳本與版型要維護。

**方案 B3 — Edge／Middleware 依 `?trip=` 改 HTML**

- Vercel Middleware 改寫 response meta。
- 優點：URL 可暫不改。缺點：邊緣邏輯＋快取複雜，對純靜態 `dist` 心智較重。

**建議：** 先 B1（快速修分享），內容穩定後上 B2。路徑美化（`/trips/{id}/`）可與 B2 同批，並對舊 `*.html?trip=` 做 301。

### Phase 3 — 加分

| 項目 | 說明 |
|------|------|
| 自訂網域 | 決策已預留；一次改 `SITE_ORIGIN`／OG／robots／sitemap |
| JSON-LD | Hub：`WebSite`＋`ItemList`；Trip：`TouristTrip`／`Trip`＋`BreadcrumbList` |
| 圖片 | 確保 cover 足夠大（建議 ≥1200px 寬）供 OG；已有 alt／credit |
| 內鏈 | Hub→trip→stories／food 已有；可在風土章節加回行程錨點 |
| 舊網域 | Pages 已 404；若曾被索引，GSC 可觀察是否清掉 |

### 明確不做（現階段）

- 為 SEO 重寫成 Next.js／全站 SSR（成本高、與現行架構不符）
- 大量製造關鍵字頁、門戶式「日本景點大全」
- 付費外鏈／目錄農場
- 把私人票券狀態、本機購物勾選當可索引內容

---

## 5. Agent 易取性專章

### 5.1 今天 agent 怎麼拿資料（已可用）

```text
1. GET https://universum-sliver.vercel.app/trips/manifest.json
2. 選 id
3. GET https://universum-sliver.vercel.app/trips/{id}/itinerary.json
```

`itinerary.json` 含 meta、overview、days、stories、foods、map、budget、tickets、shopping 等；足夠做摘要、行程比對、景點列表。

### 5.2 建議補上的發現契約

`public/llms.txt` 草案大綱：

```text
# 宇宙碎片集散地
> 真實走過的日本行程與風土筆記（參考站，非訂票服務）

## 機器可讀入口
- https://…/trips/manifest.json
- https://…/trips/{id}/itinerary.json
- https://…/llms.txt

## 主要人類頁面
- https://…/
- https://…/trip.html?trip={id}
- …

## 注意
- 票券 status／購物勾選為訪客本機狀態，勿當權威資料
- 照片授權見 ATTRIBUTIONS.md；請保留 credit
```

可選：`llms-full.txt` 內嵌各趟 title／subtitle／dateRange／JSON URL 表（由 gen 腳本與 sitemap 同源產生）。

### 5.3 與「網站 SEO」的關係

| 手段 | 搜尋引擎 | Agent |
|------|----------|-------|
| 預渲染 HTML 正文 | 高 | 中（若只會抓 HTML） |
| 公開 JSON + CORS | 低 | **高** |
| `llms.txt` | 低 | **高** |
| GSC／sitemap | 高 | 低 |
| JSON-LD | 中（富結果機會） | 中 |

兩者重疊最大的投資是 **B1／B2 預渲染**＋**llms.txt／JSON 入口文件化**。

---

## 6. 驗收清單（實作後用）

- [ ] GSC：sitemap 已提交、無大量「已排除／軟 404」
- [ ] 無 JS（curl）查看任一 trip URL：title／description／og 含該趟名稱；最好有可見文字摘要
- [ ] 分享預覽（Facebook Sharing Debugger／LINE）顯示該趟 title＋cover
- [ ] `curl /llms.txt` 200，且所列 JSON URL 皆 200
- [ ] `node scripts/gen-sitemap.mjs` 與新增行程文件步驟一致（`docs/add-trip.md`）
- [ ] shopping 不在 sitemap 或標 `noindex`
- [ ] 換網域時 checklist：`SITE_ORIGIN`、HTML OG、robots、sitemap、llms.txt

---

## 7. 建議下一步（給實作 PR）

1. **本評估合併後**：開實作 PR 做 Phase 1（llms.txt、canonical、sitemap 調整、shopping noindex、文件入口）。
2. **並行營運**：站長完成 GSC／Bing 驗證與 sitemap 提交（需帳號權限，agent 無法代勞）。
3. **第二實作 PR**：Phase 2 B1 或 B2（每趟靜態 meta／摘要預渲染）——對 SEO／分享效益最大。

---

## 附錄 A — 盤點時的關鍵路徑

| 路徑 | 角色 |
|------|------|
| `public/robots.txt` | 爬蟲政策 |
| `public/sitemap.xml` | URL 清單 |
| `scripts/gen-sitemap.mjs` | sitemap 產生 |
| `js/site.js` | `SITE_ORIGIN` |
| `js/trip.js` 等 | 客戶端 title／description |
| `trips/manifest.json` | Hub／sitemap／agent 索引 |
| `trips/{id}/itinerary.json` | 內容 SoT |
| `docs/decisions/2026-07-25-public-vercel.md` | 搬站與網域決策 |

## 附錄 B — 與搬站決策的銜接

搬到 Vercel 根路徑的原由之一即「利於之後 agent／自訂網域」。本報告把該方向具體化：JSON 已具備 agent 資料面；下一步是發現契約（llms.txt）與可索引 HTML／OG（預渲染），再隨自訂網域一次切 `SITE_ORIGIN`。
