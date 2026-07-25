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
| 單一行程 | `http://localhost:5173/trip.html?trip=2026_日本熱海長瀞_家族旅遊` |
| 購物建議 | `.../shopping.html?trip=2026_日本熱海長瀞_家族旅遊` |
| 風土 | `.../stories.html?trip=2026_日本熱海長瀞_家族旅遊` |
| 飲食 | `.../food.html?trip=2026_日本熱海長瀞_家族旅遊` |

```powershell
npm run build
npm run preview
```

## 目錄結構

```
traveling/                 # 根目錄：共用程式、Hub、建置設定
├── index.html             # Hub 首頁
├── trip.html              # 通用行程頁
├── shopping.html          # 購物建議（本機清單）
├── stories.html           # 風土（景點／歷史／文化，滿版章節）
├── food.html              # 飲食（食物與酒，滿版章節）
├── js/                    # 共用邏輯
├── styles.css
├── public/                # favicon、hub hero、robots、sitemap、404
└── trips/
    ├── manifest.json      # 行程索引
    ├── _template/         # 新行程範本
    └── {西元年}_{地區}_{性質}/
```

## 新增行程

見 [docs/add-trip.md](docs/add-trip.md)。

命名：`{西元年}_{地區}_{性質}`，例如 `2027_泰國曼谷清邁_朋友旅遊`。

## 部署

- **正式：** Vercel（Git 連線 `main` → build `npm run build` → output `dist`）；`base: '/'`
- **舊 Pages：** 已關閉；workflow 停用
- Canonical／OG 主機見 `js/site.js` 的 `SITE_ORIGIN`（換網域後同步 HTML meta、`robots.txt`，再 `node scripts/gen-sitemap.mjs`）
