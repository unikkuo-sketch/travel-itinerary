# 宇宙碎片集散地（Travel Hub）

真實走過的日本行程與風土筆記——給同樣在排行程的人當參考。

**正式站：** https://universum-sliver.vercel.app/  
（舊 GitHub Pages 網址已關閉。）

## 快速開始

在 repo 根目錄執行：

```powershell
npm install
npm run dev
```

| 頁面 | URL |
|------|-----|
| 行程總覽 Hub | `http://localhost:5173/` |
| 單一行程 | `http://localhost:5173/trips/2026_日本熱海長瀞_家族旅遊/` |
| 購物建議 | `.../shopping.html?trip=2026_日本熱海長瀞_家族旅遊` |
| 風土 | `.../trips/2026_日本熱海長瀞_家族旅遊/stories.html` |
| 飲食 | `.../trips/2026_日本熱海長瀞_家族旅遊/food.html` |

```powershell
npm run build
npm run preview
```

`npm run build` 會依序：`gen-seo`（sitemap／llms）→ Vite → 各趟 HTML 預渲染。

## 目錄結構

```
traveling/                 # 根目錄：共用程式、Hub、建置設定
├── index.html             # Hub 首頁
├── trip.html              # 行程頁殼（legacy；正式路徑見下）
├── shopping.html          # 購物建議（本機清單，noindex）
├── stories.html / food.html
├── js/                    # 共用邏輯
├── styles.css
├── public/                # favicon、hub hero、robots、sitemap、llms、404
├── scripts/gen-seo.mjs    # sitemap + llms.txt / llms-full.txt
├── scripts/prerender-trips.mjs  # build 後寫入 dist/trips/{id}/*.html
└── trips/
    ├── manifest.json      # 行程索引
    ├── _template/         # 新行程範本
    └── {西元年}_{地區}_{性質}/
```

正式行程 URL：`/trips/{id}/`、`/stories.html`、`/food.html`（build 預渲染 meta＋正文）。舊 `*.html?trip=` 會 301 到新路徑（`vercel.json`）。

## 新增行程

見 [docs/add-trip.md](docs/add-trip.md)。

命名：`{西元年}_{地區}_{性質}`，例如 `2027_泰國曼谷清邁_朋友旅遊`。

## 部署

- **正式：** Vercel（Git 連線 `main` → build `npm run build` → output `dist`）；`base: '/'`
- **舊 Pages：** 已關閉
- Canonical／OG 主機見 `js/site.js` 的 `SITE_ORIGIN`（換網域後同步 HTML meta、`robots.txt`，再 `npm run gen-seo`）

## Analytics

正式站使用 GA4（`G-S3N7T50JZN`）。gtag 片段緊接在各頁 `<head>` 後方，每頁一組；build 預渲染行程頁會沿用頁殼，不會再插一次。

## SEO／Agent 易取性

評估見 [docs/seo-assessment-2026-07-30.md](docs/seo-assessment-2026-07-30.md)。

機器入口：

- https://universum-sliver.vercel.app/llms.txt
- https://universum-sliver.vercel.app/llms-full.txt
- `/trips/manifest.json`、`/trips/{id}/itinerary.json`
