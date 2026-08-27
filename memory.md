# memory — Travel Hub

最後更新：2026-08-27

## 待辦

無

## 進行中 / 已知問題

無

## 近期

- 公開站：Vercel `https://universum-sliver.vercel.app/`（`base: '/'`）；舊 GitHub Pages 已關閉
- 決策全文：`docs/decisions/`（public-vercel、seo、GA4）；內容審稿：`docs/content-audit-2026-07-25.md`
- 2026-08-27：全庫 bug／ponytail 稽核——錯誤頁 XSS、照片／票券用 URL trip id、nav 略過 hidden section、購物 JSON.parse、tips escape、刪未用 manholeCardsUrl／gen-sitemap stub、SITE_ORIGIN 單一來源、`npm run check`

## 決策

有獨立檔：`docs/decisions/2026-07-25-public-vercel.md`、`2026-07-30-seo-assessment.md`、`2026-07-31-seo-phase-1-2.md`、`2026-08-14-google-analytics.md`。

其餘（一行索引，細節曾寫於本檔舊版）：

- 刪 Pages stub／行程規劃檔：站台只留 `itinerary.json`＋引用中的 `photos/`
- 風土／飲食分頁：`stories[]`→stories.html；`foods[]`→food.html（含酒）
- nav-shell 對齊 `.main-content` 1200px；購物／風土／飲食無 sticky
- sticky 雙列 Day scroll-spy；hero 返回總覽／行程
- 總覽表不顯示 `overview[].summary`；刪 `#closing`
- 每日照片全寬度上下堆疊（放棄桌機左右分欄）
- 向 Flipsnack 學 IA，不抄橘紅主題；P0 亮點卡＋住宿總覽
- 已訂班次寫 `overview[].transport`；多段全形 `／`
- 風土獨立滿版章節，取代旅後 recap
- Hub 地圖維持 Leaflet＋CARTO Positron（否決 3D／SVG）
- 行程地圖底圖對齊 Hub；票券狀態 JSON 預設＋本機 pill
- 勿用舊 commit 整段覆寫 `days[].photo` metadata
- 預算每人 `NT$`；刪已付／待付卡
