# memory — Travel Hub

最後更新：2026-07-19

## 待辦

無

## 進行中 / 已知問題

無

## 近期

- 風土／飲食分頁：`stories[]`＝景點歷史文化；`foods[]`＝食物與酒；nav 風土→飲食→購物；東北行程兩陣列各 ≥5 則
- sticky nav（僅行程頁）：`nav-shell` 對齊主內容 1200px；Day chips scroll-spy＋橫滑跟蹤當日（不收合）
- 行程頁導覽：hero「返回總覽」＋ sticky 雙列（章節／Day chips）；閱讀優先 section 序（行程→亮點→票券→住宿→路線→每日…）
- 購物／風土／飲食：無 sticky；hero 左上「返回行程」連回本趟行程頁
- P0/P1 行程頁清晰度：亮點卡、路線動線 strip、住宿總覽、時間軸 icon／detail；每日照片改上下堆疊（不用桌機左右分欄）
- 行程總覽「交通重點」欄補已訂班次時間（`車次 · HH:MM`，多段用 `／`）
- 風土改獨立頁 `stories.html`：滿版章節＋下緣疊文；飲食同構頁 `food.html`
- 旅後回顧已移除，改「風土」（`stories[]`）＋「飲食」（`foods[]`）
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

### 2026-07-19 — 風土／飲食分頁；飲食含酒

- 問題：風土頁混了景點文化與飲食，定位不清；使用者要分開，且飲食須含酒／酒藏
- 曾考慮：同頁依 `theme` 過濾兩入口；或飲食只放食物、酒另頁
- 放棄原因：分開頁面與購物一致、導覽清楚；飲食本來就涵蓋吃與喝
- 現行方案：`stories[]`→`stories.html`（place｜history｜culture）；`foods[]`→`food.html`（food｜sake）；nav 風土→飲食→購物；既有 food 條目已遷移
- 驗證：`npm run build`；dev 開 trip／stories／food／shopping

### 2026-07-19 — nav-shell 對齊主內容寬度；購物／風土無 sticky

- 問題：fit-content shell 與主內容對不齊；Day 列視覺不對稱；獨立頁不應帶行程雙列導覽
- 曾考慮：shell 仍 fit-content 只求等寬兩列；購物／風土留極簡 sticky
- 放棄原因：使用者要與 `.main-content` 同寬；獨立頁明確不要 sticky
- 現行方案：`nav-shell` `width: 100%; max-width: 1200px`；≤768px 不再強制 nav-row `flex-start`；購物／風土／飲食 hero「返回行程」→ `trip.html?trip=`
- 驗證：`npm run build`；dev 開 trip／shopping／stories／food

### 2026-07-19 — sticky nav：shell 包內容置中＋Day scroll-spy（已修正）

- 問題：nav-shell 拉滿寬，章節列右側（購物後）大片空白；捲到每日時 Day chip 不會跟著高亮／捲入
- 曾考慮：整排 Day 收合為「目前 Day N ▾」下拉；`width: fit-content` 置中
- 放棄原因：下拉多一步；fit-content 後來被判定與版面寬度不合（見同日新決策）
- 現行方案：見「nav-shell 對齊主內容寬度」；Day 列 scroll-spy＋active chip `scrollIntoView(inline: center)` 仍保留
- 驗證：`npm run build`；dev 開 trip 頁

### 2026-07-19 — 行程導覽：hero 返回＋雙列 Day

- 問題：sticky 把 Hub「總覽」與頁內錨點混列；Day 1…N 隨天數膨脹難掃
- 曾考慮：Day 下拉／只靠總覽表跳日／真 tab 切換日內容；購物／風土 sticky 左端返回 Hub
- 放棄原因：下拉多一步；拿掉 Day 不利當日跳轉；tab 會拆現有長頁 hash；獨立頁 sticky 已否決
- 現行方案：行程頁 hero 左上返回 Hub；sticky 上列章節、下列 Day chips；購物／風土 hero「返回行程」
- 驗證：`npm run build`；dev 開 trip／shopping／stories 查 nav 與 hero-back

### 2026-07-19 — 總覽表不再顯示每日一句

- 問題：`overview[].summary` 列排版難與五欄表對齊，體驗一直不理想
- 曾考慮：獨立欄、附行列、併入主要地點
- 放棄原因：使用者決定直接拿掉
- 現行方案：`renderOverview` 只渲染五欄（天數／日期／地點／住宿／交通）；JSON 若仍有 `summary` 會被忽略
- 驗證：dev 開 trip `#overview`，tbody 無 `overview-summary-row`

### 2026-07-19 — 移除行程頁結語區塊

- 問題：`#closing` 結語／footerWish 在頁尾顯得多餘
- 曾考慮：保留但縮成 footer 一行
- 放棄原因：使用者明確不要結語；footer 已有 `footerDate`
- 現行方案：刪 `trip.html` closing section、`renderClosing`、相關 CSS；schema 不再使用 `meta.footerWish`
- 驗證：`npm run build`；dev 開 trip 頁確認無 `#closing`

### 2026-07-19 — 每日照片改上下堆疊（放棄桌機左右分欄）

- 問題：≥900px 雜誌式左右欄把圖拉成全高 cover，顯得模糊；上下排更清晰
- 曾考慮：維持左右但提高圖解析度／限高
- 放棄原因：使用者明確要上下；左右分欄非必要
- 現行方案：移除 `.day-section--photo` desktop grid；全寬度圖上、timeline 下（固定 aspect-ratio）
- 驗證：`npm run build`；寬視窗開 trip Day 區塊應為上下、非左右

### 2026-07-19 — 向 Flipsnack 手冊學 IA，不抄橘紅主題

- 問題：手冊雜誌敘事／掃描清晰度優於網站；網站作業區塊（票券／預算／地圖）手冊沒有
- 曾考慮：整站改橘紅祭典色；或只補文案不改版面
- 放棄原因：色系會衝既有 Palette 1；只改文案無法解決「亮點／住宿／結語」節奏缺口
- 現行方案：P0 亮點卡＋時間軸層次；P1 動線 strip＋住宿總覽；schema 擴充 `highlightCards`／`hotelNote`／`routeLabel`／`detail`（日頁左右編排已改回上下，見同日決策）
- 驗證：`npm run build`；dev 開東北／熱海 trip 頁看 `#highlights` `#lodging`

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
