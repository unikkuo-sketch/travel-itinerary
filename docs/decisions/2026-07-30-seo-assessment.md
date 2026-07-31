### 2026-07-30 — SEO／Agent 易取性評估（規劃）

- 問題：站已上 Vercel 正式網址，需確認檢索狀態、SEO 效益，並規劃含 agent 資料取得的可行方案
- 曾考慮：立刻上 Next SSR；或先衝內容量搶關鍵字
- 放棄原因：與現行 Vite＋JSON SoT 不符；站定位是參考筆記非流量站，頭部門檻高、報酬低
- 現行方案：評估報告見 `docs/seo-assessment-2026-07-30.md`
  - 現況：robots／sitemap／OG 殼層及格；行程頁 CSR 空殼導致索引與社群預覽弱；JSON 公開對 agent 強、缺 `llms.txt` 發現層
  - 效益：優先「分享正確＋agent 讀得到」，其次長尾索引；不做目錄農場／框架重寫
  - 階段：Phase 0 GSC／Bing → Phase 1 llms.txt／canonical／shopping noindex → Phase 2 每趟靜態 meta／預渲染 → Phase 3 網域／JSON-LD
- 驗證：線上抽樣 robots／sitemap／manifest／itinerary.json HTTP 200；舊 Pages 404
