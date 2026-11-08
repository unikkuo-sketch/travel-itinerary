# memory — Travel Hub

最後更新：2026-11-08

## 待辦

- 靜態導航 PR 交 Grok Bot 獨立驗收；本端不宣告最終通過、不合併、不部署正式

## 進行中 / 已知問題

- 2026-11-08 共識：只把既有 JS 導航變成初始 HTML 的 `<a href>`。範圍＝首頁各行程卡，以及同一趟主頁／風土／飲食間**已經存在**的導航。排版、文章、導航外觀／位置／操作不變。不新增依賴、不改 title／description／其他 SEO 文案、不 redesign。不承諾搜尋收錄。
- 驗收（須附可複核證據，不截圖）：(1) 正式輸出初始 HTML 可解析出上述 `a[href]`，resolve 後為 canonical（中文編碼、主頁尾斜線）；(2) JS 前後導航不重複，既有篩選／切頁／互動仍在，用 DOM 斷言；(3) 無新可見區塊，文章與 title／description 未改寫；(4) 最終 `npm run build` 與連結／互動測試各一次，失敗只重測失敗項，最多 3 輪。
- repo 無 `PRODUCT.md`、`DESIGN.md`、`.impeccable`（無 launcher，不跑 context）。

## JS 前後連結（2026-11-08，改碼前；本機 dev 與正式站渲染一致）

抽樣：首頁、熱海（含「瀞」）主頁／風土／飲食。初始 HTML 用 HTTP 原文；JS 後用 headless Chrome DOM。

- 首頁初始：`#hub-grid`、`#featured`、GitHub、manholecard。JS 後多 6 張 `a.trip-card`（編碼路徑、尾斜線），順序東北→熱海→四國→北海道→沖繩→中部，皆「旅程結束」。無 input／select。地圖「查看行程」只在點標記後出現。
- 行程主頁初始：站內只有 hero `a.hero-back` → `/`。JS 後 `.nav-shell` 一條：行程／亮點／票券／住宿／路線／預算／風土／飲食／購物＋ Day chips。另有 route-chip、票券 pill、住宿 `<details>`、相片放大、地圖縮放。
- 風土、飲食初始：無站內連結。JS 後各一顆 hero「返回行程」→ 該趟 `/trips/{id}/`。兩邊都沒有連到對方。
- 不新增：風土↔飲食、地圖彈窗常駐連結、購物頁返回（仍只在 JS）。sticky 整條既有導航（含購物與 Day）改寫進初始 HTML，避免半條導航。
- 2026-11-08 實作後各跑一次 `npm run build`、`node scripts/check-nav.mjs`：673 通過、0 失敗、19 頁 JS 關／開連結一致。不宣告通過。

## 近期

- 2026-09-29：東北風土／飲食改以下載區已分好的 zip 各取 3 張（1 主圖 + 2 相關），不再從整包相簿自選。住宿只補松島壯觀飯店。七夕、Shiny、陸奥八仙沒有對應資料夾，沿用原檔
- 2026-09-28：東北照片從桌面相簿整包重選（封面、每日、風土，以及牛舌、冷麵、八食、稻庭）。小岩井乳製品、Shiny、陸奥八仙沿用原檔。熱海／中部／沖繩仍等自拍照
- 2026-09-27：規則對照通過。行程 JSON 慣例 0 項不符；補 `.env.example`（靜態站無環境變數，`.gitignore` 以 `!.env.example` 保留）；`npm run check` 通過

## 決策

有獨立檔：`docs/decisions/2026-07-25-public-vercel.md`、`2026-07-30-seo-assessment.md`、`2026-07-31-seo-phase-1-2.md`、`2026-08-14-google-analytics.md`。

其餘（一行索引，細節曾寫於本檔舊版）：

- 刪 Pages stub／行程規劃檔：站台只留 `itinerary.json`＋引用中的 `photos/`
- 風土／飲食分頁：`stories[]`→stories.html；`foods[]`→food.html（含酒）
- nav-shell 對齊 `.main-content` 1200px；購物／風土／飲食無 sticky
- sticky 雙列 Day scroll-spy；hero 返回總覽／行程
- 總覽表不顯示 `overview[].summary`；刪 `#closing`
- 每日照片全寬度上下堆疊（放棄桌機左右分欄）
- 向 Flipsnack 學 IA，不抄橘紅主題；P0 亮點卡＋住宿總覽
- 已訂班次寫 `overview[].transport`；多段全形 `／`
- 風土獨立滿版章節，取代旅後 recap
- Hub 地圖維持 Leaflet（否決 3D／SVG）。底圖改 OpenFreeMap Positron（CARTO light_all 已要 API key，會畫出 API KEY REQUIRED）
- 行程地圖底圖對齊 Hub；票券狀態 JSON 預設＋本機 pill
- 勿用舊 commit 整段覆寫 `days[].photo` metadata
- 預算每人 `NT$`；刪已付／待付卡
- 風土／飲食 essay 構圖標準見 `AGENTS.md`：檔案先裁 4:3、版面 cover 對齊。放棄「橫幅 cover 切主體」與「每張依原圖比例所以高低不齊」。沒有相關圖的飲食以 `objectFit: contain` 改走 essay；滿版章節不套這套
- 作者口吻與選圖見 `AGENTS.md`（2026-09-29）：遊記口吻、資料夾對章、看不懂就換、不湊重複圖、沒相關圖也走 essay。放棄導覽腔與整包相簿自選
- 東北照片以下載區資料夾為準，放棄整包相簿自己挑
