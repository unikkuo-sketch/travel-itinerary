# AGENTS — travel-itinerary

## 專案地圖

```
data/itinerary.json   行程資料（source of truth）
js/render.js          渲染票券、總覽、每日、預算
js/nav.js             共用導覽列
js/main.js            首頁入口（載入 JSON、地圖、scroll spy）
js/map.js             Leaflet 路線圖
js/shopping.js        購物清單
index.html            主頁殼層 + 靜態區（天氣、APP）
shopping.html         購物頁殼層
styles.css            全站樣式
vite.config.js        base: /travel-itinerary-2026/
```

## 架構

- Vite 多頁 build（index + shopping）
- Leaflet 從 npm bundle，不再用 CDN
- GitHub Actions → `gh-pages` 部署

## 慣例

- 改行程只動 `data/itinerary.json`
- `travelShoppingList` 為購物清單 localStorage key，勿改
- `import.meta.env.BASE_URL` 用於跨頁連結

## 常用指令

```powershell
npm install
npm run dev
npm run build
npm run preview
```

## 已知決策

- 交通：單程購票 / IC 卡 + 西武秩父套票
- Day 4 Route-Inn 秩父、Day 5 hotel hisoca 池袋（分開住宿）
- GitHub Pages project site，base path `/travel-itinerary-2026/`
