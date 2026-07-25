### 2026-07-25 — 公開站改 Vercel 根路徑

- 問題：自用行程工具要對外成「旅遊參考站」，`github.io/travel-itinerary/` 子路徑不像正式媒體，且不利之後 agent／自訂網域
- 曾考慮：維持 GH Pages + 自訂網域；或暫留 github.io
- 放棄原因：公開正式網址不建議用 github.io 子路徑；Pages 預覽／後端弱於 Vercel
- 現行方案：
  - 託管 Vercel（正式：`https://universum-sliver.vercel.app/`）、`base: '/'`；舊 GitHub Pages 已關閉
  - 切網域時一次改 `SITE_ORIGIN`／OG／sitemap／robots
  - 品牌「宇宙碎片集散地」；對外「真實走過的日本行程與風土筆記——給同樣在排行程的人當參考」
  - 票券／購物 localStorage 保留給訪客自用，補本機／參考標示
  - 五趟全開；切流後停 Pages 雙發或改搬家頁
  - 搬遷保護：BASE_URL 路徑、grep 清舊 host、`dist/trips`、preview 中文行程煙霧、先 Preview 再 prod 再停 Pages；不加 SPA catch-all
- 驗證：`npm run build`；`npm run preview` 根路徑煙霧；Vercel preview／prod
