import{g as j,a as M}from"./load-trip-CBGHvy5k.js";import{m as S}from"./nav-DCx1d7yb.js";import{a as A,i as D,e as H,c as N,s as f,b as x,d as U,v as q,n as z,g as F,h as G,j as O,p as L,f as W,k as Y}from"./recap-storage-CJgOGzEA.js";const o=j();let c=null,e=null,I=null;const R=document.getElementById("photo-day"),B=document.getElementById("photo-caption"),T=document.getElementById("photo-place"),p=document.getElementById("photo-input"),h=document.getElementById("photo-grid"),u=document.getElementById("upload-status"),P=document.getElementById("expense-table-wrap"),b=document.getElementById("total-amount"),v=document.getElementById("total-twd"),E=document.getElementById("expense-notes"),y=document.getElementById("btn-save"),J=document.getElementById("btn-import"),K=document.getElementById("btn-export"),Q=document.getElementById("btn-clear"),C=document.getElementById("recap-trip-title");function V(t){document.body.innerHTML=`
    <main class="main-content" style="padding:4rem 1rem;text-align:center">
      <h1>找不到行程</h1>
      <p>${t}</p>
      <p><a href="/travel-itinerary/">返回行程總覽</a></p>
    </main>`}function X(){e=Y(o),e?e.expenses?.items?.length||(e.expenses=f(c.budget),l()):(e={version:1,updatedAt:"",photos:[],expenses:f(c.budget)},x(o,e))}function l(){clearTimeout(I),I=setTimeout(()=>{e.expenses.totalActual={amount:b.value.trim(),twd:v.value.trim()},e.expenses.notes=E.value.trim(),x(o,e),y.textContent="已儲存"},400),y.textContent="儲存中…"}function Z(){R.innerHTML=(c.days||[]).map(t=>`<option value="${t.number}">Day ${t.number} · ${t.title}</option>`).join("")}async function d(){if(h.innerHTML="",!e.photos.length){h.innerHTML='<p class="recap-empty-inline">尚無照片，選擇上方檔案上傳</p>';return}for(const t of e.photos){const n=await G(o,t.id);if(!n)continue;const s=URL.createObjectURL(n),a=document.createElement("article");a.className="recap-edit-photo-card",a.innerHTML=`
      <img src="${s}" alt="${t.caption||""}" loading="lazy">
      <div class="recap-edit-photo-meta">
        <span class="day-badge">${t.day}</span>
        ${t.caption?`<span>${t.caption}</span>`:""}
      </div>
      <button type="button" class="recap-photo-delete" aria-label="刪除照片">&times;</button>`,a.querySelector(".recap-photo-delete").addEventListener("click",async()=>{confirm("確定刪除這張照片？")&&(e.photos=e.photos.filter(i=>i.id!==t.id),await O(o,t.id),URL.revokeObjectURL(s),l(),d())}),h.appendChild(a)}}function g(){const t=e.expenses.items||[];P.innerHTML=`
    <table class="recap-expense-edit-table">
      <thead>
        <tr><th>類別</th><th>項目</th><th>規劃</th><th>實際</th><th>差異</th></tr>
      </thead>
      <tbody>
        ${t.map((n,s)=>{const a=k(n.planned,n.actual);return`
            <tr>
              <td>${n.categoryTitle}</td>
              <td>${n.label}</td>
              <td>${n.planned}</td>
              <td><input type="text" class="recap-input recap-input--sm" data-expense-index="${s}" value="${n.actual||""}" placeholder="¥0"></td>
              <td class="recap-diff ${a.cls}">${a.text}</td>
            </tr>`}).join("")}
      </tbody>
    </table>`,P.querySelectorAll("[data-expense-index]").forEach(n=>{n.addEventListener("input",()=>{const s=Number(n.dataset.expenseIndex);e.expenses.items[s].actual=n.value.trim();const a=k(e.expenses.items[s].planned,n.value.trim()),r=n.closest("tr").querySelector(".recap-diff");r.textContent=a.text,r.className=`recap-diff ${a.cls}`,l()})}),b.value=e.expenses.totalActual?.amount||"",v.value=e.expenses.totalActual?.twd||"",E.value=e.expenses.notes||""}function k(t,n){if(!n)return{text:"—",cls:""};const s=L(t),a=L(n);if(s==null||a==null)return{text:"—",cls:""};const i=a-s;return i===0?{text:"±0",cls:"recap-diff--even"}:{text:`${i>0?"+":"-"}${W(Math.abs(i))}`,cls:i<0?"recap-diff--under":"recap-diff--over"}}async function _(t){const n=Number(R.value)||1,s=B.value.trim(),a=T.value.trim();let i=0;for(const r of t){if(!r.type.startsWith("image/"))continue;let m;try{m=await U(r)}catch{u.textContent="圖片處理失敗，請換一張試試";continue}const w=await q(o,e,m.size);if(!w.ok){u.textContent=w.message;break}const $=z();await F(o,$,m),e.photos.push({id:$,day:n,caption:s,place:a}),i+=1}i&&(B.value="",T.value="",l(),await d(),u.textContent=`已加入 ${i} 張`,setTimeout(()=>{u.textContent=""},3e3))}p.addEventListener("change",()=>{p.files?.length&&_([...p.files]),p.value=""});b.addEventListener("input",l);v.addEventListener("input",l);E.addEventListener("input",l);J.addEventListener("click",async()=>{const t=await A(o);if(!t){alert("此行程尚無已發佈的 recap.json");return}confirm("將以已發佈版覆蓋本機草稿，確定？")&&(e=await D(o,t),g(),await d(),y.textContent="已儲存")});K.addEventListener("click",async()=>{l(),await new Promise(n=>setTimeout(n,500));const t=await H(o,e);alert(`已下載 recap.json${t?` 與 ${t} 張照片`:""}。請依頁面說明放入 trips 資料夾後 commit。`)});Q.addEventListener("click",async()=>{confirm("確定清除本機草稿？照片與花費紀錄將一併刪除。")&&(await N(o),e={version:1,photos:[],expenses:f(c.budget)},x(o,e),g(),await d())});async function tt(){if(!o){window.location.replace("/travel-itinerary/");return}try{c=await M(o),document.title=`旅後回顧 | ${c.meta.title}`,C&&(C.textContent=`${c.meta.title} · 旅後回顧`),S("recap",o,c.days),X(),Z(),g(),await d()}catch(t){V(t.message)}}tt();
