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
| `status` | `purchased`（已購）／`pending`（待購）／`reservation`（免費但需預約）；JSON 為發佈預設；行程頁可點狀態 pill 本機切換（`travelTicketStatus:{tripId}`） |

#### Meta 亮點與動線

| 欄位 | 說明 |
|------|------|
| `meta.highlightCards[]` | 選填；`{ icon, title, desc }`。有則渲染行程頁「行程亮點」；無則回退 `meta.highlights` 字串 |
| `meta.routeRegions` | 選填；路線區上方縣／地區標籤（例 `宮城・岩手・青森・秋田`） |

`highlightCards[].icon` 對應 `js/icons.js`（如 `train`、`food`、`hotel`、`festival`、`shrine`、`plane`）。

#### 行程總覽 `overview[]`

| 欄位 | 說明 |
|------|------|
| `hotelNote` | 選填；住宿總覽卡片說明（站距／賣點） |
| `routeLabel` | 選填；路線動線 chip 短名（缺省取 `places` 最後一段） |
| `transport` | 交通重點；已訂班次寫 `車次 · HH:MM`（例 `Hayabusa 1 · 08:05`）；當日多段用全形 `／` 分隔，會渲染成多行 tag |

#### 每日時間軸 `days[].timeline[]`

| 欄位 | 說明 |
|------|------|
| `icon` | 選填；時間軸圓標 icon key。缺省時從 `tag` 開頭 emoji 推斷 |
| `detail` | 選填；主說明 `desc` 下方的後勤細字（班次、步行分鐘等） |
| `tag` | 選填；類別標籤（可含 emoji；有 icon 時顯示會去掉開頭 emoji） |

#### 預算 `budget`

| 欄位 | 說明 |
|------|------|
| `partySize` | 人數（僅供作者換算每人；頁面不顯示） |
| `fx` | 匯率：`month`、`jpyToTwd`、`basis`（台銀即期賣出月平均）；行程月未結束時加 `provisional: true` |
| `categories` | 每人明細（金額皆為 `NT$…`） |
| `total.amount` | 每人總額（字串，如 `約 NT$33,137`） |

金額維持字串；日圓先依 `fx` 換算成每人新台幣再填入。不做 runtime 自動換算。票券／購物價格可維持當地幣別。

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
| `photos/` | 行程封面與每日代表照（見下方照片慣例） |
| `assets/` | PDF、圖片等原始檔 |

`itinerary.json` 可含兩組獨立章節陣列（欄位相同：`theme`、`title`、`kicker`、`body`、`source`（`label` + `url`，優先日文官方站）、`photo`（同 day photo：`src`／`alt`／`credit`））：

| 陣列 | 頁面 | `theme` | 定位 |
|------|------|---------|------|
| `stories[]` | `stories.html?trip={id}` | `place`｜`history`｜`culture` | 景點、歷史與文化 |
| `foods[]` | `food.html?trip={id}` | `food`｜`sake` | 食物與酒（含酒藏／地酒；`sake`＝酒） |

兩頁皆以滿版章節＋下緣疊文呈現；未填或空陣列顯示空狀態。建議各至少約 5 則；可重用 `photos/` 既有封面／每日照，新圖須補 `ATTRIBUTIONS.md`。

### 6. 預覽

```powershell
npm run dev
```

- Hub：`http://localhost:5173/`
- 行程：`http://localhost:5173/trip.html?trip=2027_義大利托斯卡尼_蜜月`

### 7. 上線

```powershell
git add trips/
git commit -m "Add trip: 2027_義大利托斯卡尼_蜜月"
git push origin main
```

Vercel 會從 `main` 自動建置部署。若新增行程，記得更新 `public/sitemap.xml`（或執行 `node scripts/gen-sitemap.mjs`）。
舊 GitHub Pages 僅顯示搬家頁，非正式站。
