# memory — Travel Hub

最後更新：2026-07-18

## 待辦

無

## 進行中 / 已知問題

無

## 近期

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
