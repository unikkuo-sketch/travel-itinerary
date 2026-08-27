# AGENTS — Travel Hub

## 專案地圖

```
index.html              Hub 行程總覽
trip.html / stories.html / food.html  頁殼（legacy；正式見 path）
shopping.html           購物清單（?trip=；noindex）
js/hub.js               Hub 渲染
js/photo.js             共用圖片元件（lazy、skeleton、fallback、署名）
js/trip.js              行程頁入口
js/shopping.js          購物頁入口
js/stories.js           風土頁入口（滿版章節）
js/food.js              飲食頁入口（滿版章節，同構風土）
js/load-trip.js         fetch trips/{id}/itinerary.json；path／query trip id
js/seo.js               title／OG／canonical 同步
js/render.js            渲染 hero、票券、每日、預算等
js/map.js               行程路線圖（分日配色、編號標記、圖例）
js/nav.js               動態導覽（依 days 長度）
scripts/gen-seo.mjs     sitemap + llms.txt / llms-full.txt（讀 js/site.js SITE_ORIGIN）
scripts/prerender-trips.mjs  build 後寫 dist/trips/{id}/*.html
scripts/check.mjs       路徑／縣市解析的單一 assert 檢查
trips/manifest.json     行程索引（Hub 卡片）
trips/{id}/itinerary.json   單趟行程資料（source of truth）
trips/{id}/photos/          選填，行程封面／每日代表照／風土・飲食章節照
trips/_template/        新行程範本
public/                 favicon、hub hero、robots、sitemap、llms、404
ATTRIBUTIONS.md         照片素材授權紀錄（新增圖片必須補列）
```

## 行程資料夾命名

`{西元年}_{地區}_{性質}`，例如 `2026_日本熱海長瀞_家族旅遊`。

`manifest.id` = 資料夾名 = `meta.slug` = 正式 URL `/trips/{id}/`（legacy `?trip=` 仍可解析，正式站 301）。

## 慣例

- 正式行程 URL：`/trips/{id}/`、`/trips/{id}/stories.html`、`/trips/{id}/food.html`；購物維持 `shopping.html?trip=`
- 動態導覽：`js/nav.js`（僅行程頁）；hero 左上「返回總覽」；sticky 雙列（`nav-shell` 對齊 `.main-content` `max-width: 1200px`；上：行程→亮點→票券→住宿→路線→預算→風土→飲食→購物；下：Day chips＋捲動高亮／橫滑跟蹤）；購物／風土／飲食無 sticky，hero 左上「返回行程」連回本趟行程頁
- 全站 UI token 在 `styles.css` `:root`（Palette 1：`#D0B8AC` → `#FBFEFB` 蜜桃奶油系；字級 `--text-*`、行距 `--leading-*`）
- 改行程內容：只編輯 `trips/{id}/itinerary.json`
- 新增行程：複製 `_template`、更新 `manifest.json`（見 docs/add-trip.md）；`npm run build` 會重跑 gen-seo＋預渲染
- 購物清單 localStorage：`travelShoppingList:{tripId}`
- `trips/` 由 vite 插件在 dev/build 時提供靜態 JSON；dev 亦把 `/trips/{id}/` 映到頁殼
- 行程照片：`meta.cover` 與 `days[].photo`（`src` 相對 `trips/{id}/`、`alt`、`credit`）；不 hotlink，WebP 自架，授權記於 `ATTRIBUTIONS.md`
- 旅程色：`meta.theme`（`sakura` / `ocean`），未填用預設蜜桃色
- 票券狀態：`tickets[].status` = `purchased`｜`pending`｜`reservation`；JSON 為預設，本機可點狀態 pill 切換（`travelTicketStatus:{tripId}`）；UI 標「作者端參考／僅存本機」
- 正式站文案：對外參考站口徑；OG／sitemap 用 `js/site.js` `SITE_ORIGIN`
- GA4：gtag `G-S3N7T50JZN` 緊接各頁 `<head>` 後方，每頁一組（含 `public/404.html`）；預渲染沿用頁殼、勿再插一次
- 預算：`budget.partySize`（換算用、不顯示）+ `budget.fx`（台銀即期賣出月平均）+ `categories`／`total.amount` 一律每人 `NT$` 字串
- 地圖點：`map.locations[]` 需 `name`、`number`、`day`、`coords`；標記與路線依 day 上色；不綁 timeline 編號
- 行程總覽 `overview[].transport`：已訂班次寫 `車次 · HH:MM`；當日多段用全形 `／` 分隔（渲染成多行 tag）
- 風土：`stories[]` → `/trips/{id}/stories.html`（`theme`=`place`｜`history`｜`culture`）；滿版章節＋下緣疊文；空陣列顯示空狀態
- 飲食：`foods[]` → `/trips/{id}/food.html`（`theme`=`food`｜`sake`）；呈現同構風土；空陣列顯示空狀態
- SEO：build 預渲染每趟 meta（含 cover OG）＋行程／風土／飲食正文；shopping `noindex`；機器入口 `/llms.txt`、`/llms-full.txt`、`/trips/manifest.json`、`/trips/{id}/itinerary.json`；評估見 `docs/seo-assessment-2026-07-30.md`

## 常用指令

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run gen-seo
npm run check
```

## 部署

- base path：`/`
- 正式站：Vercel（`dist`）；canonical 見 `js/site.js` `SITE_ORIGIN`；舊 query URL 301 見 `vercel.json`
- 舊 GitHub Pages 已關閉（無 Pages workflow）

## Cursor Cloud specific instructions

- Static frontend only (Vite + vanilla JS). No backend, database, env vars, or secrets required (no `.env`).
- Package manager is npm (`package-lock.json`). Commands are in `package.json` / README.
- Verification: `npm run check` then `npm run dev` (or `npm run build`) plus manual browser check.
- Dev server serves at `http://localhost:5173/` — root base; do not use `/travel-itinerary/`.
- `trips/*.json` and photos are served in dev/build by the `tripsStatic` vite plugin in `vite.config.js` (not by importing them), so trip data loads via `fetch` at `/trips/...` paths. Dev also serves trip/stories/food shells for `/trips/{id}/` paths; production HTML is written by `scripts/prerender-trips.mjs` after Vite build.
