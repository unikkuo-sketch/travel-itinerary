# 新增一趟旅遊行程

## 命名規則

資料夾名稱 = trip id（三者必須一致）：

```
{西元年}_{國家/地區}_{性質}
```

範例：`2027_義大利托斯卡尼_蜜月`

## 步驟

### 1. 建立資料夾

複製 `trips/_template/` 為 `trips/{你的資料夾名}/`

```powershell
Copy-Item -Recurse trips\_template trips\2027_義大利托斯卡尼_蜜月
```

### 2. 填寫 itinerary.json

- `meta.slug` 必須等於資料夾名
- 依序填寫 `tickets`、`overview`、`days`、`budget`、`map`
- 選填 `shopping`、`events`、`weather`

### 3. 更新 manifest.json

在 `trips/manifest.json` 的 `trips` 陣列新增：

```json
{
  "id": "2027_義大利托斯卡尼_蜜月",
  "title": "標題",
  "subtitle": "副標",
  "dateRange": "2027/05/01 - 05/10",
  "status": "upcoming",
  "emoji": "🇮🇹"
}
```

`status`：`upcoming`（即將出發）或 `past`（已結束）

### 4. 選填檔案

| 檔案 | 用途 |
|------|------|
| `notes.md` | 文字摘要，給自己或 AI 閱讀 |
| `assets/` | PDF、圖片等原始檔 |

### 5. 預覽

```powershell
npm run dev
```

- Hub：`http://localhost:5173/travel-itinerary-2026/`
- 行程：`http://localhost:5173/travel-itinerary-2026/trip.html?trip=2027_義大利托斯卡尼_蜜月`

### 6. 上線

```powershell
git add trips/
git commit -m "Add trip: 2027_義大利托斯卡尼_蜜月"
git push origin main
```

GitHub Actions 會自動部署到 GitHub Pages。
