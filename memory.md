# memory — Travel Hub

最後更新：2026-09-28

## 待辦

無

## 進行中 / 已知問題

無

## 近期

- 2026-09-28：東北照片從桌面相簿整包重選（封面、每日、風土，以及牛舌、冷麵、八食、稻庭）。小岩井乳製品、Shiny、陸奥八仙沿用原檔。熱海／中部／沖繩仍等自拍照
- 2026-09-27：規則對照通過。行程 JSON 慣例 0 項不符；補 `.env.example`（靜態站無環境變數，`.gitignore` 以 `!.env.example` 保留）；`npm run check` 通過

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
- 風土／飲食 essay 構圖標準見 `AGENTS.md`：檔案先裁 4:3、版面 cover 對齊。放棄「橫幅 cover 切主體」與「每張依原圖比例所以高低不齊」。沒有相關圖的飲食以 `objectFit: contain` 改走 essay；滿版章節不套這套
