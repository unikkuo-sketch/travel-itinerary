import{l,t as d}from"./load-trip-DnsRvTu4.js";import{i as m}from"./icons-BLkUqgzZ.js";function i(n){const t=document.createElement("span");return t.textContent=n,t.innerHTML}function f(n){if(!n)return null;const[t,e]=n.split(/\s*-\s*/);if(!t||!e)return null;const r=t.match(/^(\d{4})\//)?.[1]||String(new Date().getFullYear()),a=/^\d{4}\//.test(e)?e:`${r}/${e.replace(/^\//,"")}`,[s,p,o]=a.split("/").map(u=>parseInt(u,10));return!s||!p||!o?null:new Date(s,p-1,o,23,59,59,999)}function c(n){const t=f(n.dateRange);return t?Date.now()>t.getTime():n.status==="past"}function g(n){const t={upcoming:0,past:1};return[...n].sort((e,r)=>{const a=t[c(e)?"past":"upcoming"]??2,s=t[c(r)?"past":"upcoming"]??2;return a!==s?a-s:(r.dateRange||"").localeCompare(e.dateRange||"")})}async function h(){const n=document.getElementById("hub-grid");if(n)try{const{trips:t}=await l(),e=g(t);if(!e.length){n.innerHTML='<p class="hub-empty">尚無行程，請參考 docs/add-trip.md 新增。</p>';return}n.innerHTML=e.map(r=>`
      <a class="trip-card" href="${d(r.id)}">
        <h2>${i(r.title)}</h2>
        <p class="trip-card-sub">${i(r.subtitle||"")}</p>
        <p class="trip-card-date">${m("calendar")}<time>${i(r.dateRange||"")}</time></p>
        ${c(r)?'<span class="trip-card-badge past">旅程結束</span>':'<span class="trip-card-badge">即將出發</span>'}
      </a>
    `).join("")}catch(t){n.innerHTML=`<p class="hub-empty">無法載入行程列表：${i(t.message)}</p>`}}h();
