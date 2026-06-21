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
- `shopping.recommendations` → 購物頁「行程伴手禮推薦」（依 Day／地點分組）
- `shopping.suggestions` 可保留於 JSON 但購物頁不顯示（請改寫入 `recommendations`）

購物商品以**物件**填寫（也接受純字串，但無圖片與價格）。`imageUrl` 以網路連結為主，**優先使用品牌官網、產地官方商店或觀光協會商品圖**：

```json
{
  "name": "溫泉饅頭",
  "price": "約 ¥500",
  "priceNote": "含稅參考價・實際以店面為準",
  "imageUrl": "https://atami-sakurai.com/wp-content/uploads/2025/08/cha1.jpg"
}
```

| 欄位 | 說明 |
|------|------|
| `name` | 必填，品名 |
| `price` | 選填，日常參考價（如 `約 ¥880`） |
| `priceNote` | 選填，價格備註 |
| `imageUrl` | 建議填，官網商品圖 URL；失效時頁面顯示 placeholder |

圖片來源優先順序：品牌／製造商官網 > 產地官方商店 > 觀光協會商品頁。連結失效時只需改 JSON 中的 `imageUrl`。

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
| `recap.json` | 旅後公開資料（照片路徑、實際花費） |
| `photos/` | 旅後照片（與 recap.json 的 `file` 欄對應） |
| `assets/` | PDF、圖片等原始檔 |

### 5. 預覽

```powershell
npm run dev
```

- Hub：`http://localhost:5173/travel-itinerary/`
- 行程：`http://localhost:5173/travel-itinerary/trip.html?trip=2027_義大利托斯卡尼_蜜月`

### 6. 上線

```powershell
git add trips/
git commit -m "Add trip: 2027_義大利托斯卡尼_蜜月"
git push origin main
```

GitHub Actions 會自動部署到 GitHub Pages。

## 旅後回顧發佈

旅後可在 `recap.html?trip={id}` 上傳照片、填寫實際花費（本機自動儲存）。若要公開分享：

1. 在 recap 頁按「匯出發佈包」
2. 將下載的 `recap.json` 放入 `trips/{id}/`
3. 將各張 `.jpg` 放入 `trips/{id}/photos/`（路徑須與 json 內 `photos[].file` 一致，如 `photos/p1abc.jpg`）
4. commit 並 push

行程頁 `#recap` 會顯示規劃 vs 實際對照。範本見 `trips/_template/recap.json`。
