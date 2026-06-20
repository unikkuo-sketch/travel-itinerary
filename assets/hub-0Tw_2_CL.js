import{l as c,t as p}from"./load-trip-DwSVSJHl.js";function r(a){const t=document.createElement("span");return t.textContent=a,t.innerHTML}function o(a){const t={upcoming:0,past:1};return[...a].sort((e,s)=>{const n=t[e.status]??2,i=t[s.status]??2;return n!==i?n-i:(s.dateRange||"").localeCompare(e.dateRange||"")})}async function d(){const a=document.getElementById("hub-grid");if(a)try{const{trips:t}=await c(),e=o(t);if(!e.length){a.innerHTML='<p class="hub-empty">尚無行程，請參考 docs/add-trip.md 新增。</p>';return}a.innerHTML=e.map(s=>`
      <a class="trip-card" href="${p(s.id)}">
        <div class="trip-card-emoji">${s.emoji||"✈️"}</div>
        <h2>${r(s.title)}</h2>
        <p class="trip-card-sub">${r(s.subtitle||"")}</p>
        <p class="trip-card-date">📅 ${r(s.dateRange||"")}</p>
        ${s.status==="past"?'<span class="trip-card-badge past">已結束</span>':'<span class="trip-card-badge">即將出發</span>'}
      </a>
    `).join("")}catch(t){a.innerHTML=`<p class="hub-empty">無法載入行程列表：${r(t.message)}</p>`}}d();
