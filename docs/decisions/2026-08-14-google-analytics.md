### 2026-08-14 — 全站 GA4 gtag

- 問題：要量測正式站造訪，GA 後台提供 Measurement ID `G-S3N7T50JZN`，要求緊接 `<head>`、每頁一組
- 曾考慮：另寫 `js/analytics.js` 再 import；或只在正式 host 才插入
- 放棄原因：與後台「貼上這段代碼」指示不符，且 JS 再載一次會重複計數
- 現行方案：`index.html`／`trip.html`／`stories.html`／`food.html`／`shopping.html`／`public/404.html` 在 `<head>` 後插入同一組 gtag；預渲染沿用頁殼
- 驗證：原始 HTML 與 `npm run build` 後 `dist` 各頁 `G-S3N7T50JZN` 恰一次，且位於 `<head>` 之後
