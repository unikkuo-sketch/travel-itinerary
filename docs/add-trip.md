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
- `shopping.recommendations` → 購物頁「在地特產推薦」（依 Day／地點分組）
- `shopping.suggestions` 可保留於 JSON 但購物頁不顯示（請改寫入 `recommendations`）

#### 票券 `tickets[]`

| 欄位 | 說明 |
|------|------|
| `status` | `purchased`（已購）／`pending`（待購）／`reservation`（免費但需預約）；寫在 JSON，發佈後全家看到同一狀態 |

#### 預算 `budget`

| 欄位 | 說明 |
|------|------|
| `partySize` | 家庭人數（顯示「家庭 × N」） |
| `categories` | 每人明細分類（不變） |
| `total.amount` / `twd` | 每人總額（字串） |
| `total.family` / `familyTwd` | 家庭總額（字串，作者手填） |
| `total.paid` / `pending` | 已付／待付（字串，作者手填） |

金額維持字串，不做自動換算。

#### 地圖 `map.locations[]`

| 欄位 | 說明 |
|------|------|
| `name` | 景點／城市名（不含編號前綴） |
| `number` | 地圖標記編號（與圖例同步） |
| `day` | 主要所屬日（決定標記與路線段顏色） |
| `coords` | `[緯度, 經度]` |

地圖為城市級 waypoint；**不**替每日 timeline 逐項加編號。

購物商品以**物件**填寫（也接受純字串，但無圖片與價格）。`imageUrl` 以網路連結為主，**優先使用品牌官網、產地官方商店或觀光協會商品圖**：

```json
{
  "name": "溫泉饅頭",
  "price": "約 ¥500",
  "priceNote": "含稅參考價・實際以店面為準",
  "imageUrl": "https://atami-sakurai.com/wp-content/uploads/2025/08/cha1.jpg",
  "url": "https://atami-sakurai.com/"
}
```

| 欄位 | 說明 |
|------|------|
| `name` | 必填，品名 |
| `price` | 選填，日常參考價（如 `約 ¥880`） |
| `priceNote` | 選填，價格備註 |
| `imageUrl` | 建議填，官網商品圖 URL；失效時頁面顯示 placeholder |
| `url` | 選填，商品或品牌官網；有填時品名與圖片可點擊另開新分頁 |

圖片來源優先順序：品牌／製造商官網 > 產地官方商店 > 觀光協會商品頁。連結失效時只需改 JSON 中的 `imageUrl`。

### 3. 加入照片（封面與每日代表照）

照片流程與授權紀錄格式見 `ATTRIBUTIONS.md`。重點：

- 不 hotlink；從 Wikimedia Commons 等免費來源下載後轉 WebP 放入 `trips/{id}/photos/`（封面寬 1600px、每日照片寬 1200px）
- `meta.cover` 填封面（`src`、`alt`、`credit`）；`days[].photo` 填每日代表照（同欄位）
- `meta.theme` 選填旅程色：`sakura`（櫻花粉）或 `ocean`（海洋藍），未填用預設蜜桃色
- 每張照片都要在 `ATTRIBUTIONS.md` 補一列（作者、授權、來源連結）

### 4. 更新 manifest.json

在 `trips/manifest.json` 的 `trips` 陣列新增：

```json
{
  "id": "2027_義大利托斯卡尼_蜜月",
  "title": "標題",
  "subtitle": "副標",
  "dateRange": "2027/05/01 - 05/10",
  "status": "upcoming",
  "emoji": "🇮🇹",
  "coords": [43.77, 11.25],
  "days": 10,
  "location": "托斯卡尼",
  "cover": "photos/cover.webp",
  "coverAlt": "封面照片說明",
  "coverCredit": "作者 / 授權"
}
```

`status`：`upcoming`（即將出發）或 `past`（已結束）

`coords`：`[緯度, 經度]`，Hub 首頁「目的地地圖」用來標出目的地釘點；未填則不顯示於地圖。

`days`／`location`／`cover*`：Hub 行程卡顯示天數、地點與封面圖；`cover` 未填時卡片顯示 emoji 底圖。

### 5. 選填檔案

| 檔案 | 用途 |
|------|------|
| `notes.md` | 文字摘要，給自己或 AI 閱讀 |
| `recap.json` | 旅後公開資料（照片路徑、實際花費） |
| `photos/` | 旅後照片（與 recap.json 的 `file` 欄對應） |
| `assets/` | PDF、圖片等原始檔 |

### 6. 預覽

```powershell
npm run dev
```

- Hub：`http://localhost:5173/travel-itinerary/`
- 行程：`http://localhost:5173/travel-itinerary/trip.html?trip=2027_義大利托斯卡尼_蜜月`

### 7. 上線

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
