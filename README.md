# 我的旅遊行程（Travel Hub）

所有旅程規劃集中於一個網站。每趟旅行一個資料夾，共用同一套 UI。

**線上版：** https://unikkuo-sketch.github.io/travel-itinerary-2026/

## 快速開始

```powershell
cd c:\Users\unikkuo\Desktop\App\traveling
npm install
npm run dev
```

| 頁面 | URL |
|------|-----|
| 行程總覽 Hub | `http://localhost:5173/travel-itinerary-2026/` |
| 單一行程 | `http://localhost:5173/travel-itinerary-2026/trip.html?trip=2026_日本熱海長瀞_家族旅遊` |
| 購物清單 | `.../shopping.html?trip=2026_日本熱海長瀞_家族旅遊` |

```powershell
npm run build
npm run preview
```

## 目錄結構

```
traveling/                 # 根目錄：共用程式、Hub、建置設定
├── index.html             # Hub 首頁
├── trip.html              # 通用行程頁
├── shopping.html          # 通用購物頁
├── js/                    # 共用邏輯
├── styles.css
└── trips/
    ├── manifest.json      # 行程索引
    ├── _template/         # 新行程範本
    └── 2026_日本熱海長瀞_家族旅遊/   # 單一趟行程
        ├── itinerary.json # 必填
        ├── notes.md       # 選填
        └── assets/        # 選填
```

## 新增行程

見 [docs/add-trip.md](docs/add-trip.md)。

命名：`{西元年}_{地區}_{性質}`，例如 `2027_泰國曼谷清邁_朋友旅遊`。

## 部署

推送到 `main` 後 GitHub Actions 自動 build 並發佈到 `gh-pages`。
