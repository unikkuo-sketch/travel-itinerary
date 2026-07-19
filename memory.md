# memory — Travel Hub

最後更新：2026-07-18

## 待辦

無

## 進行中 / 已知問題

無

## 近期

- P0/P1 行程頁清晰度：亮點卡、總覽當日一句、路線動線 strip、住宿總覽、時間軸 icon／detail、桌機每日左右編排、結語區塊（對齊 Flipsnack 手冊資訊架構，保留蜜桃奶油色系）
- 行程總覽「交通重點」欄補已訂班次時間（`車次 · HH:MM`，多段用 `／`）
- 風土碎片改獨立頁 `stories.html`：滿版章節＋下緣疊文（對齊購物進入方式）
- 旅後回顧已移除，改「風土碎片」（`stories[]`）
- 行程路線圖底圖改 CARTO Positron + 蜜桃奶油 filter，與 Hub featured-map 對齊
- Hub 文案：Welcome blurb 置中；「每日行程一覽」；「碎片寶箱」／「碎片漂泊地」
- 票券狀態可在行程頁點擊切換（本機 localStorage），JSON 仍為預設來源
- 第三階段精緻化已落地：分日地圖配色／編號、票券狀態、預算家庭總額、OG／hero 骨架
- 預算「已付／待付」摘要卡已移除（手填字串、無連動，易誤導）
- 東北行程 `2026_日本青森仙台秋田_家族旅遊` 已進 `trips/` + `manifest`；票務以 xlsx 為準
- Hub：Hero → Welcome → Featured 世界地圖 → `#hub-grid`
- Leaflet Vite marker icon 已修（`js/leaflet-icons.js`）
- 部署：push `main` → GH Actions → Pages；線上 https://unikkuo-sketch.github.io/travel-itinerary/

## 決策

### 2026-07-19 — 向 Flipsnack 手冊學 IA，不抄橘紅主題

- 問題：手冊雜誌敘事／掃描清晰度優於網站；網站作業區塊（票券／預算／地圖）手冊沒有
- 曾考慮：整站改橘紅祭典色；或只補文案不改版面
- 放棄原因：色系會衝既有 Palette 1；只改文案無法解決「亮點／住宿／結語」節奏缺口
- 現行方案：P0 亮點卡＋時間軸層次＋總覽當日一句；P1 動線 strip＋住宿總覽＋桌機日頁左右編排＋結語；schema 擴充 `highlightCards`／`summary`／`hotelNote`／`routeLabel`／`detail`
- 驗證：`npm run build`；dev 開東北／熱海 trip 頁看 `#highlights` `#lodging` `#closing` 與 Day 左右編排

### 2026-07-18 — 班次時間放行程總覽交通欄

- 問題：已訂車班／航班時間埋在每日 timeline，總覽一眼看不到
- 曾考慮：塞進票券卡 features；或總覽另開 section
- 放棄原因：周遊券一卡多段，票券卡是購票核對不是時間軸；獨立 section 多餘
- 現行方案：改 `overview[].transport`（例 `Hayabusa 1 · 08:05`）；多段用全形 `／`，`render.js` 拆成多行 tag
- 驗證：`npm run build`；dev 開 trip `#overview` 看交通重點欄

### 2026-07-18 — 風土碎片獨立頁＋滿版章節

- 問題：風土內容若嵌在行程頁易被物流區塊淹沒；使用者希望與購物相同「點擊進入獨立頁」
- 曾考慮：左右圖文卡；或維持 trip `#stories` 文字列表
- 放棄原因：卡片語彙像購物目錄；內嵌區精緻感不足
- 現行方案：`stories.html`＋`js/stories.js`；nav「風土」連獨立頁；每則接近一屏 full-bleed＋下緣漸層疊文；`stories[].photo` 優先重用行程照，缺圖再補（竿燈／牛タン已補）
- 驗證：`npm run build`；`npm run dev` → `stories.html?trip=…` 五則滿版章節

### 2026-07-18 — 風土碎片取代旅後回顧

- 問題：旅後編輯／本機草稿／發佈包過重，且與「介紹旅程亮點歷史與風土」需求不符
- 曾考慮：保留 recap 並另加文化區塊；或獨立 stories 頁
- 放棄原因：旅後功能無已發佈資料、維護面大；使用者要的是精短風土故事而非旅後對照
- 現行方案：刪除 recap 全套；風土改獨立頁（細節見上一則「獨立頁＋滿版章節」）
- 驗證：見上一則

### 2026-07-18 — Hub 地圖維持 Leaflet，否決 3D／SVG 實驗

- 問題：評估「碎片漂泊地」是否改成 3D 地球（Globe.gl）或 2D SVG 世界投影
- 曾考慮：A `experiment/hub-globe-3d`；B `experiment/hub-svg-map-2d`（worktree 對照，皆無航班弧線）
- 放棄原因：實機比較後仍以現行 Leaflet featured-map 最合適（體感／品牌／維護成本）
- 現行方案：Hub `#featured-map` 繼續用 Leaflet + CARTO Positron；不引入 globe.gl／d3 世界圖
- 驗證：`npm run dev` → `#featured` 為既有 Leaflet 標記與 popup

### 2026-07-18 — 行程地圖底圖對齊 Hub

- 問題：行程內頁用預設 OSM 街景，與蜜桃奶油站台／Hub Positron 風格衝突
- 曾考慮：維持 OSM；或改 Voyager 增路網細節
- 放棄原因：OSM 飽和度過高；城市級 waypoint 不需 Voyager
- 現行方案：`map.js` 用 CARTO Positron；`.leaflet-map` 套略淡於 Hub 的 warm filter（保路線色可讀）
- 驗證：`npm run dev` → 開任一 trip 頁 `#route-map`，應與 Hub 地圖調性一致

### 2026-07-18 — 票券狀態本機可切換

- 問題：使用者希望在網頁上立刻調整已購／待購等狀態
- 曾考慮：只改 JSON 再 commit（全家同步）；或後端／帳號系統
- 放棄原因：後端過重；每次改狀態都要 commit 太慢
- 現行方案：JSON `tickets[].status` 仍是發佈預設；點狀態 pill 循環 `purchased`→`pending`→`reservation`，寫入 `travelTicketStatus:{tripId}`（僅本機）
- 驗證：行程頁點票券狀態 pill，重新整理後狀態應保留

### 2026-07-18 — 第三階段精緻化

- 問題：地圖無分日色／編號；票券與預算缺購買／付款狀態；分享預覽與 hero 載入體驗不完整
- 曾考慮：票券／預算狀態用 localStorage 本機切換；地圖編號同步到每日 timeline
- 放棄原因（當時）：全家需看同一發佈狀態；地圖點是城市級 waypoint，與 timeline 條目數量不一致
- 現行方案：狀態寫在 `itinerary.json` 為預設（本機覆寫見上一則）；地圖 `day`+`number` + 圖例；預算字串手填每人／家庭；OG 共用 hub-hero
- 驗證：`npm run build`；`npm run preview` 開 trip 頁看地圖／票券／預算

### 2026-07-18 — 移除預算已付／待付卡

- 問題：摘要卡看起來像自動計算，實際是 JSON 手填字串，且與票券狀態無關
- 曾考慮：保留手填；或依票券／類別自動加總
- 放棄原因：手填易漂移；自動加總需改金額為數字 schema，目前不需要
- 現行方案：預算區只保留每人／家庭兩張卡；`total.paid`／`pending` 從資料與文件移除
- 驗證：行程頁 `#budget` 應只有每人、家庭兩卡
