# 2026 關東賞櫻 6 日遊行程

靜態行程網站：熱海、伊東、長瀞、秩父，含互動地圖與購物清單（localStorage 自動儲存）。

**線上版：** https://unikkuo-sketch.github.io/travel-itinerary-2026/

## 快速開始

```powershell
cd c:\Users\unikkuo\Desktop\App\traveling
npm install
npm run dev
```

開發伺服器：`http://localhost:5173/travel-itinerary-2026/`（base path 與 GitHub Pages 一致）

```powershell
npm run build
npm run preview
```

## 頁面

| 檔案 | 說明 |
|------|------|
| [index.html](index.html) | 主行程殼層（內容由 JS 渲染） |
| [shopping.html](shopping.html) | 購物清單 |
| [data/itinerary.json](data/itinerary.json) | **行程資料來源**（票券、總覽、每日、預算、地圖） |
| [docs/itinerary.md](docs/itinerary.md) | 文字摘要（人工閱讀用） |

## 修改行程

1. 編輯 [data/itinerary.json](data/itinerary.json)
2. 可選：同步更新 [docs/itinerary.md](docs/itinerary.md) 摘要
3. `npm run dev` 預覽

## 部署

推送到 `main` 後，GitHub Actions 會自動 build 並發佈到 `gh-pages` 分支。

Repo 設定：Settings → Pages → Source 選 **Deploy from a branch** → branch `gh-pages` / `/ (root)`。
