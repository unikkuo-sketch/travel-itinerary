# Google Search Console — 宇宙碎片集散地

正式站：https://universum-sliver.vercel.app/  
GA4：`G-S3N7T50JZN`（已硬編碼在各頁 `<head>`）  
本機預檢：`npm run check-gsc`（打正式站，不登入 Google）

驗證與提交 sitemap **必須用站長的 Google 帳號**在 Search Console 點一下；repo 無法代登入。下面用本站已經有的 gtag，不必再上傳驗證檔。

---

## 0. 先確認站已就緒

```powershell
npm run check-gsc
```

應看到 `Ready for Search Console.` 且 sitemap 各 URL HTTP 200。失敗就先修 `FAIL` 行，不要提交 sitemap。

`*.vercel.app` **不能**用「網域資源」(Domain property)：你無法在 `vercel.app` 加 DNS TXT。只用 **網址前綴** (URL prefix)。

---

## 1. 新增資源並驗證（約 3 分鐘）

1. 用**管理 GA4 `G-S3N7T50JZN` 的同一個 Google 帳號**打開  
   https://search.google.com/search-console
2. 右上角「新增資源」→ 選左側 **網址前綴**（不要選網域）。
3. 貼上（含 https、結尾斜線）：

   `https://universum-sliver.vercel.app/`

4. 驗證方式選 **Google Analytics**（不要選 HTML 檔，除非 GA 驗證失敗）。
5. 按「驗證」。Google 會抓首頁 HTML，確認 `<head>` 裡有 `gtag.js` + `G-S3N7T50JZN`，且你對該 GA4 資源有編輯權。

成功後資源會出現在 Search Console 首頁。

### GA 驗證失敗時（備用：HTML 檔）

1. 同一流程改選「HTML 檔案」，下載 `googleXXXXXXXX.html`。
2. 把檔案放到 repo 的 `public/googleXXXXXXXX.html`（檔名勿改）。
3. commit、push，等 Vercel 正式部署。
4. 確認 `https://universum-sliver.vercel.app/googleXXXXXXXX.html` 為 200 後，再回 Search Console 按驗證。
5. **不要 gitignore 這個檔**；必須進 `dist` 根目錄。

HTML 標籤 (`<meta name="google-site-verification">`) 若要用，加在 `index.html` 的 `<head>`（首頁靜態 HTML，不要只靠 JS 插入）。本站優先走 GA，不必先加空 meta。

---

## 2. 提交 sitemap

1. Search Console 左側 **Sitemaps**（sitemap）。
2. 「新增 sitemap」貼：

   `sitemap.xml`

   （相對該資源；完整網址是 `https://universum-sliver.vercel.app/sitemap.xml`）
3. 送出。狀態先是「無法擷取／處理中」都正常，數小時內應變成功。
4. 預期約 **19** 個發現的網址（Hub + 6 趟 × 行程／風土／飲食）。`shopping.html` 不在 sitemap，且頁面 `noindex`。

`robots.txt` 已宣告同一條 Sitemap，Google 也可能自己發現；手動提交仍建議做，方便看錯誤。

---

## 3. 抽樣要求編入索引

資料出現要幾天。想加速首批：

1. **網址檢查** → 貼 `https://universum-sliver.vercel.app/` → 要求編入索引。
2. 再抽一趟正式 path，例如  
   `https://universum-sliver.vercel.app/trips/2026_日本青森仙台秋田_家族旅遊/`
3. 不要一次狂點所有 URL（配額有限）。sitemap 會帶其餘頁。

基線（一週後回來看）：

- 頁面索引 → 已編入索引的數量
- 頁面索引 → 原因（已檢索、未編入／已排除）
- 是否出現大量軟 404、重新導向

---

## 4. 接到 GA4（選做，建議）

驗證成功後，同一帳號：

1. [GA4 管理](https://analytics.google.com/) → 管理 → Search Console 連結
2. 連結剛才的 URL 前綴資源  
3. 之後可在 GA4 看搜尋查詢；分享 UTM 與自然搜尋分開看

---

## 5. 換自訂網域時

1. 改 `js/site.js` 的 `SITE_ORIGIN`，同步 HTML OG／`robots.txt`，`npm run gen-seo`
2. Search Console **再新增**一個網址前綴（或屆時用網域資源 + DNS TXT）
3. 提交新 sitemap；舊 `*.vercel.app` 資源可留著觀察 301／遷移，不必立刻刪

---

## 明確不做

- 在 repo 偽造 `google*.html` 或空的 `google-site-verification` meta
- 對 `vercel.app` 設定 Domain property / DNS TXT
- 用已停用的 `google.com/ping?sitemap=` 當提交手段
- 把購物頁放進 sitemap
