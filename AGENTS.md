# AGENTS — Travel Hub

## 專案地圖

```
index.html              Hub 行程總覽
trip.html               單一行程頁（?trip=資料夾名）
shopping.html           購物清單（?trip=資料夾名）
stories.html            風土（景點／歷史／文化；?trip=資料夾名）
food.html               飲食（食物與酒；?trip=資料夾名）
js/hub.js               Hub 渲染
js/photo.js             共用圖片元件（lazy、skeleton、fallback、署名）
js/trip.js              行程頁入口
js/shopping.js          購物頁入口
js/stories.js           風土頁入口（滿版章節）
js/food.js              飲食頁入口（滿版章節，同構風土）
js/load-trip.js         fetch trips/{id}/itinerary.json
js/render.js            渲染 hero、票券、每日、預算等
js/map.js               行程路線圖（分日配色、編號標記、圖例）
js/nav.js               動態導覽（依 days 長度）
trips/manifest.json     行程索引（Hub 卡片）
trips/{id}/itinerary.json   單趟行程資料（source of truth）
trips/{id}/photos/          選填，行程封面／每日代表照／風土・飲食章節照
trips/_template/        新行程範本
public/                 站台共用靜態檔（favicon、hub hero 圖）
ATTRIBUTIONS.md         照片素材授權紀錄（新增圖片必須補列）
```

## 行程資料夾命名

`{西元年}_{地區}_{性質}`，例如 `2026_日本熱海長瀞_家族旅遊`。

`manifest.id` = 資料夾名 = `meta.slug` = URL `?trip=` 參數。

## 慣例

- 動態導覽：`js/nav.js`（僅行程頁）；hero 左上「返回總覽」；sticky 雙列（`nav-shell` 對齊 `.main-content` `max-width: 1200px`；上：行程→亮點→票券→住宿→路線→預算→風土→飲食→購物；下：Day chips＋捲動高亮／橫滑跟蹤）；購物／風土／飲食無 sticky，hero 左上「返回行程」連回本趟 `trip.html`
- 全站 UI token 在 `styles.css` `:root`（Palette 1：`#D0B8AC` → `#FBFEFB` 蜜桃奶油系；字級 `--text-*`、行距 `--leading-*`）
- 改行程內容：只編輯 `trips/{id}/itinerary.json`
- 新增行程：複製 `_template`、更新 `manifest.json`（見 docs/add-trip.md）
- 購物清單 localStorage：`travelShoppingList:{tripId}`
- `trips/` 由 vite 插件在 dev/build 時提供靜態 JSON
- 行程照片：`meta.cover` 與 `days[].photo`（`src` 相對 `trips/{id}/`、`alt`、`credit`）；不 hotlink，WebP 自架，授權記於 `ATTRIBUTIONS.md`
- 旅程色：`meta.theme`（`sakura` / `ocean`），未填用預設蜜桃色
- 票券狀態：`tickets[].status` = `purchased`｜`pending`｜`reservation`；JSON 為預設，本機可點狀態 pill 切換（`travelTicketStatus:{tripId}`）；UI 標「作者端參考／僅存本機」
- 正式站文案：對外參考站口徑；OG／sitemap 用 `js/site.js` `SITE_ORIGIN`
- 預算：`budget.partySize`（換算用、不顯示）+ `budget.fx`（台銀即期賣出月平均）+ `categories`／`total.amount` 一律每人 `NT$` 字串
- 地圖點：`map.locations[]` 需 `name`、`number`、`day`、`coords`；標記與路線依 day 上色；不綁 timeline 編號
- 行程總覽 `overview[].transport`：已訂班次寫 `車次 · HH:MM`；當日多段用全形 `／` 分隔（渲染成多行 tag）
- 風土：獨立頁 `stories.html`；`stories[]`（`theme`=`place`｜`history`｜`culture`、`title`、`kicker`、`body`、`source`、`photo`）；景點／歷史／文化介紹；滿版章節＋下緣疊文；空陣列顯示空狀態
- 飲食：獨立頁 `food.html`；`foods[]`（`theme`=`food`｜`sake`、其餘欄位同 stories）；食物與酒（含酒藏／地酒）；呈現同構風土；空陣列顯示空狀態
- OG：各頁共用 `images/hub-hero.webp` 絕對 URL（靜態站無法給 crawler 動態 trip cover）
- SEO／Agent 評估：`docs/seo-assessment-2026-07-30.md`（CSR 空殼、llms.txt、預渲染分階段）；機器入口：`/trips/manifest.json`、`/trips/{id}/itinerary.json`

## 常用指令

```powershell
npm install
npm run dev
npm run build
npm run preview
```

## 部署

- base path：`/`
- 正式站：Vercel（`dist`）；canonical 見 `js/site.js` `SITE_ORIGIN`
- 舊 GitHub Pages 已關閉（無 Pages workflow）

## Cursor Cloud specific instructions

- Static frontend only (Vite + vanilla JS). No backend, database, env vars, or secrets required.
- Package manager is npm (`package-lock.json`). Commands are in `package.json` / README.
- No lint or test scripts exist; verification = `npm run dev` (or `npm run build`) plus manual browser check.
- Dev server serves at `http://localhost:5173/` — root base; do not use `/travel-itinerary/`.
- `trips/*.json` and photos are served in dev/build by the `tripsStatic` vite plugin in `vite.config.js` (not by importing them), so trip data loads via `fetch` at `/trips/...` paths.
