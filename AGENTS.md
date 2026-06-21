# AGENTS — Travel Hub

## 專案地圖

```
index.html              Hub 行程總覽
trip.html               單一行程頁（?trip=資料夾名）
shopping.html           購物清單（?trip=資料夾名）
recap.html              旅後回顧編輯（?trip=資料夾名）
js/hub.js               Hub 渲染
js/trip.js              行程頁入口
js/recap.js             旅後編輯頁入口
js/recap-storage.js     本機 recap 儲存、匯出、讀取發佈版
js/render-recap.js      旅後展示渲染（trip 頁 #recap）
js/load-trip.js         fetch trips/{id}/itinerary.json
js/render.js            渲染 hero、票券、每日、預算等
js/nav.js               動態導覽（依 days 長度）
trips/manifest.json     行程索引（Hub 卡片）
trips/{id}/itinerary.json   單趟行程資料（source of truth）
trips/{id}/recap.json       選填，旅後公開資料（commit 後所有人可見）
trips/{id}/photos/          選填，recap 照片
trips/_template/        新行程範本
```

## 行程資料夾命名

`{西元年}_{地區}_{性質}`，例如 `2026_日本熱海長瀞_家族旅遊`。

`manifest.id` = 資料夾名 = `meta.slug` = URL `?trip=` 參數。

## 慣例

- 全站 UI token 在 `styles.css` `:root`（Palette 1：`#D0B8AC` → `#FBFEFB` 蜜桃奶油系；字級 `--text-*`、行距 `--leading-*`）
- 改行程內容：只編輯 `trips/{id}/itinerary.json`
- 新增行程：複製 `_template`、更新 `manifest.json`（見 docs/add-trip.md）
- 購物清單 localStorage：`travelShoppingList:{tripId}`
- 旅後回顧 localStorage：`travelRecap:{tripId}`；照片 blob：IndexedDB `travelRecapPhotos`
- 公開旅後資料：匯出後將 `recap.json` + `photos/` 放入 `trips/{id}/` 再 commit
- `trips/` 由 vite 插件在 dev/build 時提供靜態 JSON

## 常用指令

```powershell
npm install
npm run dev
npm run build
npm run preview
```

## 部署

- base path：`/travel-itinerary/`
- CI：`.github/workflows/deploy.yml` → `gh-pages`
