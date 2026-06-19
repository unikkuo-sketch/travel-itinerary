# AGENTS — Travel Hub

## 專案地圖

```
index.html              Hub 行程總覽
trip.html               單一行程頁（?trip=資料夾名）
shopping.html           購物清單（?trip=資料夾名）
js/hub.js               Hub 渲染
js/trip.js              行程頁入口
js/load-trip.js         fetch trips/{id}/itinerary.json
js/render.js            渲染 hero、票券、每日、預算等
js/nav.js               動態導覽（依 days 長度）
trips/manifest.json     行程索引（Hub 卡片）
trips/{id}/itinerary.json   單趟行程資料（source of truth）
trips/_template/        新行程範本
```

## 行程資料夾命名

`{西元年}_{地區}_{性質}`，例如 `2026_日本熱海長瀞_家族旅遊`。

`manifest.id` = 資料夾名 = `meta.slug` = URL `?trip=` 參數。

## 慣例

- 改行程內容：只編輯 `trips/{id}/itinerary.json`
- 新增行程：複製 `_template`、更新 `manifest.json`（見 docs/add-trip.md）
- 購物清單 localStorage：`travelShoppingList:{tripId}`
- `trips/` 由 vite 插件在 dev/build 時提供靜態 JSON

## 常用指令

```powershell
npm install
npm run dev
npm run build
npm run preview
```

## 部署

- base path：`/travel-itinerary-2026/`
- CI：`.github/workflows/deploy.yml` → `gh-pages`
