# memory — Travel Hub

最後更新：2026-07-18

## 待辦

無

## 進行中 / 已知問題

無

## 近期

- 第三階段精緻化已落地：分日地圖配色／編號、票券狀態、預算家庭／已付待付、OG／hero 骨架
- 東北行程 `2026_日本青森仙台秋田_家族旅遊` 已進 `trips/` + `manifest`；票務以 xlsx 為準
- Hub：Hero → Welcome → Featured 世界地圖 → `#hub-grid`
- Leaflet Vite marker icon 已修（`js/leaflet-icons.js`）
- 部署：push `main` → GH Actions → Pages；線上 https://unikkuo-sketch.github.io/travel-itinerary/

## 決策

### 2026-07-18 — 第三階段精緻化

- 問題：地圖無分日色／編號；票券與預算缺購買／付款狀態；分享預覽與 hero 載入體驗不完整
- 曾考慮：票券／預算狀態用 localStorage 本機切換；地圖編號同步到每日 timeline
- 放棄原因：全家需看同一發佈狀態；地圖點是城市級 waypoint，與 timeline 條目數量不一致
- 現行方案：狀態寫在 `itinerary.json`；地圖 `day`+`number` + 圖例；預算字串手填家庭／已付／待付；OG 共用 hub-hero
- 驗證：`npm run build`；`npm run preview` 開 trip 頁看地圖／票券／預算
