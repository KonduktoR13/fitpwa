(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const Be="training-log-pwa-state-v1",Pe=5,Ne=[["push","Жим"],["pull","Тяга"],["legs","Ноги"],["core","Кор"],["cardio","Кардио"],["other","Другое"]],$e=[["barbell","Штанга"],["dumbbell","Гантели"],["machine","Тренажер"],["cable","Блок"],["smith","Смит"],["bodyweight","Свой вес"],["cardio","Кардио"],["other","Другое"]],Et=[["Жим лёжа","push","barbell","🏋️"],["Тяга горизонтального блока","pull","cable","↔️"],["Жим гантелей сидя","push","dumbbell","💪"],["Кроссовер","push","cable","✳️"],["Трицепс на блоке","push","cable","⬇️"],["Присед в смитте","legs","smith","🦵"],["Румынская тяга","legs","dumbbell","〽️"],["Выпады с гантелями","legs","dumbbell","🚶"],["Тяга вертикального блока","pull","cable","⬇️"],["Пресс","core","bodyweight","◼️"],["Тяга гантели в наклоне","pull","dumbbell","↙️"],["Разведения гантелей в стороны","pull","dumbbell","↔️"],["Бицепс с гантелями","pull","dumbbell","💪"],["Face pull","pull","cable","🎯"],["Гребля","cardio","cardio","🚣"]];let $=kt(),R={name:"home"},k={weight:"",reps:"8",reserve:2,warmup:!1},oe={minutes:"",seconds:"",distanceM:"",setting:""},xe=!1,F=[],ee="weight",Y=!1,L=!1,T=null,G="",V=!1,q=null,Le=null,ve=null,X=null,De=null,be=null,K=new Date,he=N(Date.now()),Ae=new Set,me=new Set(["active"]),Oe="",ye="strength",ue="performance",Te=new Set,B=null,we=null,rt=null;function Z(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}function kt(){const e=localStorage.getItem(Be);if(e)try{const n=JSON.parse(e);return Ue(n)}catch{localStorage.removeItem(Be)}const t=Date.now();return Ue({schemaVersion:Pe,exercises:Et.map(([n,a,s,i],o)=>({id:Z(),name:n,category:a,equipmentType:s,icon:i,image:"",createdAt:t+o})),sets:[],settings:{unit:"кг"}})}function Ue(e){const t={schemaVersion:Pe,exercises:[],sets:[],settings:{unit:"кг",autoUpdateCheck:!0},...e};return t.settings={unit:"кг",autoUpdateCheck:!0,...e.settings||{}},t.exercises=(e.exercises||[]).map(n=>({id:n.id||Z(),name:n.name==="Гребля 3000 м"?"Гребля":n.name||"Упражнение",category:n.category||"other",equipmentType:n.equipmentType||"other",icon:n.icon||"🏋️",image:n.image||"",createdAt:n.createdAt||Date.now()})),t.exercises.some(n=>te(n))||t.exercises.push({id:Z(),name:"Гребля",category:"cardio",equipmentType:"cardio",icon:"🚣",image:"",createdAt:Date.now()}),t.sets=(e.sets||[]).filter(n=>{const a=n.type==="cardio"||n.durationSec!=null||n.distanceM!=null||n.durationMin!=null||n.distanceKm!=null,s=Number.isFinite(Number(n.weight))&&Number.isFinite(Number(n.reps));return n.exerciseId&&(a||s)}).map(n=>{if(n.type==="cardio"||n.durationSec!=null||n.distanceM!=null||n.durationMin!=null||n.distanceKm!=null){const i=n.durationSec!=null?Number(n.durationSec):(Number(n.durationMin)||0)*60,o=n.distanceM!=null?Number(n.distanceM):(Number(n.distanceKm)||0)*1e3,c={id:n.id||Z(),type:"cardio",exerciseId:n.exerciseId,durationSec:Math.max(0,Math.round(Number.isFinite(i)?i:0)),distanceM:Math.max(0,Math.round(Number.isFinite(o)?o:0)),setting:n.setting!=null?String(n.setting):"",createdAt:n.createdAt||Date.now()};return n.updatedAt&&(c.updatedAt=n.updatedAt),c}const a=n.reserve!=null?Number(n.reserve):E(n),s={id:n.id||Z(),type:"strength",exerciseId:n.exerciseId,weight:Number(n.weight),reps:Number(n.reps),reserve:Math.max(0,Math.min(10,Number.isFinite(a)?a:0)),warmup:!!n.warmup,createdAt:n.createdAt||Date.now()};return n.updatedAt&&(s.updatedAt=n.updatedAt),s}),t}function fe(){localStorage.setItem(Be,JSON.stringify($))}function se(e){R=e,e.name==="home"&&(me=new Set(["active"])),e.name!=="exercise"&&(q=null,Le=null,Y=!1,G=""),window.scrollTo({top:0,behavior:"instant"}),y()}function ce(e,t){var n;return((n=e.find(([a])=>a===t))==null?void 0:n[1])||"Другое"}function m(e){return Number.isInteger(e)?`${e}`:e.toFixed(1).replace(".",",")}function He(e){return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(e))}function w(e){return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit"}).format(new Date(e))}function N(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function Rt(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}`}function qt(e){return new Intl.DateTimeFormat("ru-RU",{month:"long",year:"numeric"}).format(e)}function Dt(e,t){return new Date(e.getFullYear(),e.getMonth()+t,1)}function At(e){return e.weight*(1+e.reps/30)}function Se(e){return e.weight*(1+(e.reps+E(e))/30)}function Me(e){return(e==null?void 0:e.type)==="strength"&&!e.warmup&&Number(e.weight)>0&&Number(e.reps)>0&&E(e)>=0&&e.reps+E(e)<=15}function le(e){return(e==null?void 0:e.category)==="cardio"||(e==null?void 0:e.equipmentType)==="cardio"}function I(e){return(e==null?void 0:e.type)==="cardio"||(e==null?void 0:e.durationSec)!=null||(e==null?void 0:e.distanceM)!=null||(e==null?void 0:e.durationMin)!=null||(e==null?void 0:e.distanceKm)!=null}function te(e){return/греб|гребл|row/i.test((e==null?void 0:e.name)||"")}function Tt(e){return/эллип|ellipt/i.test((e==null?void 0:e.name)||"")}function E(e){return e.reserve!=null?e.reserve:e.effort==null?0:Math.max(0,Math.min(10,10-e.effort))}function z(e){return e<=0?"0, отказ":e<=1?"1 в запасе":e<=3?`${e} в запасе`:e<=6?"много запаса":"очень легко"}function lt(e){return`hsl(${6+Math.max(0,Math.min(10,e))*13} 63% 42%)`}function Ie(e){if(I(e))return Je(e);const t=At(e),n=1+Math.min(6,Math.max(0,E(e)))*.012,a=e.warmup?.72:1;return t*n*a}function U(e){return(e==null?void 0:e.durationSec)!=null?Number(e.durationSec)||0:(Number(e==null?void 0:e.durationMin)||0)*60}function ne(e){return(e==null?void 0:e.distanceM)!=null?Number(e.distanceM)||0:(Number(e==null?void 0:e.distanceKm)||0)*1e3}function Ve(e){return ne(e)/1e3}function dt(e){const t=U(e),n=Ve(e);return t>0?n/t*3600:0}function Ct(e){const t=Ve(e),n=U(e);return t>0?n/t:null}function Je(e){const t=Ve(e),n=U(e),a=dt(e);return t>0?t*100+a*6:n/60*4}function b(e){if(e==null||!Number.isFinite(Number(e)))return"—";const t=Math.max(0,Math.round(Number(e)||0)),n=Math.floor(t/60),a=t%60;return`${n}:${String(a).padStart(2,"0")}`}function ut(e){const t=Math.max(0,Math.round(Number(e)||0));return t>=1e3&&t%1e3===0?`${t/1e3} км`:`${t} м`}function H(e){return`${m(Number(e)||0)} км`}function je(e){if(e==null||!Number.isFinite(e))return"—";const t=Math.max(0,Math.round(e)),n=Math.floor(t/60),a=t%60;return`${n}:${String(a).padStart(2,"0")} /км`}function ge(e){const t=U(e),n=ne(e);return t>0&&n>0?t*500/n:null}function Xe(e){const t=U(e),n=ne(e);return t>0&&n>0?t*3e3/n:null}function Nt(e,t){if(!e)return"Недостаточно данных";if(!t)return"нужна ещё одна тренировка для сравнения";const n=e.performanceScore-t.performanceScore;return Math.abs(n)<.05?"без изменений к прошлому разу":`${n>0?"+":"−"}${m(Math.abs(n))} к прошлому разу`}function st(e,t=!1){return e==null||Math.abs(e)<.05?"":(t?e<0:e>0)?"good":"bad"}function Ee(e){const t=ne(e),n=Xe(e);return n==null?"3000 м: —":`${Math.abs(t-3e3)<1?"3000 м":"3000 м по темпу"}: ${b(n)}`}function Ye(){return"Нормы из Android: муж. 18-29 13:30, 30-39 14:00, 40-49 14:30, 50+ 15:00; жен. 15:00."}function ae(e){return $.sets.filter(t=>t.exerciseId===e).sort((t,n)=>t.createdAt-n.createdAt)}function Ze(e){const t=new Map;return e.forEach(n=>{const a=`${N(n.createdAt)}-${n.exerciseId}`;t.has(a)||t.set(a,[]),t.get(a).push(n)}),[...t.values()].map(n=>n.sort((a,s)=>a.createdAt-s.createdAt))}function pt(e){var C,W,O;if(e.some(I)){const M=e.filter(I),x=M.reduce((Q,re)=>Q+U(re),0),qe=M.reduce((Q,re)=>Q+ne(re),0),de=qe/1e3,nt=x>0?de/x*3600:0,St=de>0?x/de:null,at=de>0?de*100+nt*6:x/60*4,We=qe>0?x/qe*500:null,wt=We!=null?We*6:null,Mt=[...new Set(M.map(Q=>String(Q.setting||"").trim()).filter(Boolean))];return{type:"cardio",date:((C=e[0])==null?void 0:C.createdAt)||Date.now(),count:M.length,workCount:M.length,warmupCount:0,durationSec:x,durationMin:x/60,distanceM:qe,distanceKm:de,speedKmh:nt,pace:St,score:at,performanceScore:at,pace500Sec:We,projected3000Sec:wt,settings:Mt,tonnage:0,pureE1rm:0,avgReserve:0,fatigue:null,top:M.reduce((Q,re)=>Je(re)>Je(Q||re)?re:Q,M[0])}}const t=e.filter(M=>!M.warmup),n=t.filter(Me),a=t.filter(M=>!Me(M)),s=n.length?n.reduce((M,x)=>Se(x)>Se(M||x)?x:M,n[0]):null,i=t.reduce((M,x)=>M+x.weight*x.reps,0),o=t.length?Math.max(...t.map(M=>Number(M.weight)||0)):0,c=s?Se(s):0,d=c,l=c,u=t.reduce((M,x)=>M+E(x),0)/Math.max(1,t.length),g=t.filter(M=>E(M)<=3).length,h=n.at(-1)||null,S=n.length>=2&&c>0?Se(h)/c*100:null,D=S==null?null:100-S,A=((W=e.at(0))==null?void 0:W.createdAt)||Date.now(),r=((O=e.at(-1))==null?void 0:O.createdAt)||A,p=Math.max(1,(r-A)/6e4),f=i/p,v=t.at(0)||null,j=t.at(-1)||null;return{date:A,count:e.length,workCount:t.length,warmupCount:e.length-t.length,top:s,tonnage:i,pureE1rm:d,bestSessionE1RM:c,maxWorkingWeight:o,hardSets:g,score:l,avgReserve:u,fatigue:D,strengthRetention:S,validWorkCount:n.length,excludedE1rmCount:a.length,workingSets:t,warmupSets:e.filter(M=>M.warmup),excludedE1rm:a,density:f,firstWork:v,lastWork:j}}function _(e){return Ze(ae(e)).map(pt).filter(t=>t.type==="cardio"||t.workCount>0)}function ze(e){const t=_(e),n=t.at(-1),a=t.at(-2),s=t.reduce((i,o)=>o.score>((i==null?void 0:i.score)||0)?o:i,null);return{sessions:t,last:n,prev:a,best:s}}function xt(){return $.exercises.map(e=>({exercise:e,sessions:_(e.id),sets:ae(e.id)})).filter(e=>e.sets.length>0).sort((e,t)=>{var n,a;return(((n=t.sessions.at(-1))==null?void 0:n.date)||0)-(((a=e.sessions.at(-1))==null?void 0:a.date)||0)})}function et(){const e=new Map;return $.sets.slice().sort((t,n)=>t.createdAt-n.createdAt).forEach(t=>{const n=N(t.createdAt);e.has(n)||e.set(n,[]),e.get(n).push(t)}),e}function tt(e){const t=e.filter(d=>!I(d)&&!d.warmup),n=e.filter(I),a=new Set(e.map(d=>d.exerciseId)),s=t.reduce((d,l)=>d+l.weight*l.reps,0),i=n.reduce((d,l)=>d+ne(l),0),o=n.reduce((d,l)=>d+U(l),0),c=t.reduce((d,l)=>Ie(l)>Ie(d||l)?l:d,t[0]||null);return{exerciseCount:a.size,setCount:e.length,workCount:t.length,cardioCount:n.length,distanceM:i,distanceKm:i/1e3,durationSec:o,durationMin:o/60,tonnage:s,top:c}}function Lt(e){const t=new Map;return e.forEach(n=>{t.has(n.exerciseId)||t.set(n.exerciseId,[]),t.get(n.exerciseId).push(n)}),[...t.entries()].map(([n,a])=>({exerciseId:n,exercise:$.exercises.find(s=>s.id===n),sets:a.sort((s,i)=>s.createdAt-i.createdAt),metrics:pt(a)}))}function mt(e,t=Date.now()){return Ze(ae(e).filter(n=>n.createdAt<t)).filter(n=>N(n[0].createdAt)!==N(Date.now())).at(-1)||[]}function It(e,t){return $.sets.filter(n=>n.exerciseId===e&&!I(n)&&!!n.warmup===t&&N(n.createdAt)===N(Date.now())).length}function Ge(e,t){return mt(e).filter(n=>!I(n)&&!!n.warmup===t).sort((n,a)=>n.createdAt-a.createdAt)}function _e(e,t=null){return $.sets.filter(n=>n.exerciseId===e&&!I(n)&&N(n.createdAt)===N(Date.now())&&(t==null||!!n.warmup===t)).sort((n,a)=>n.createdAt-a.createdAt)}function jt(e){const t=_e(e,!0),n=_e(e,!1);return!!(!t.length&&!n.length||t.length&&!n.length)}function Fe(e,t={}){const n=t.warmup??jt(e),a=_e(e,n),s=mt(e),i=s.filter(d=>!I(d)&&!!d.warmup===n).sort((d,l)=>d.createdAt-l.createdAt),o=s.filter(d=>!I(d)).sort((d,l)=>d.createdAt-l.createdAt),c=i[a.length]||a.at(-1)||i[0]||o.at(-1)||null;return{weight:c?String(c.weight):t.weight||"",reps:c?String(c.reps):t.reps||"8",reserve:c?E(c):t.reserve??(n?6:2),warmup:n}}function P(e,t,n=""){if(!e||!t)return"Нужна ещё одна тренировка";const a=e-t;return`${a>0?"+":""}${m(a)}${n} к прошлому разу`}function gt(e){return e.image?`<img src="${e.image}" alt="" />`:`<span>${e.icon||"🏋️"}</span>`}function ke(e=18){"vibrate"in navigator&&navigator.vibrate(e)}function pe(e,t=""){we={text:e,tone:t},window.clearTimeout(rt),rt=window.setTimeout(()=>{we=null,y()},1800)}function y(){F=[];const e=document.querySelector("#app");e.innerHTML=`
    <div class="shell">
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="На главную">
          <span class="brand-mark">Ж</span>
          <span><strong>Силовой журнал</strong><small>локально на устройстве</small></span>
        </button>
        <button class="install-button" data-action="install" hidden>Установить</button>
      </header>
      <main>${Ft()}</main>
      ${ve?Pt():""}
      ${we?`<div class="toast ${we.tone||""}">${we.text}</div>`:""}
      <nav class="bottom-nav">
        <button class="${R.name==="home"?"active":""}" data-action="home">Упр.</button>
        <button class="${R.name==="progress"?"active":""}" data-action="progress">Прогресс</button>
        <button class="${R.name==="history"?"active":""}" data-action="history">История</button>
        <button class="${R.name==="settings"?"active":""}" data-action="settings">Ещё</button>
      </nav>
    </div>
  `,fn(e),bt()}function Ft(){return R.name==="exercise"?Wt(R.id):R.name==="progress"?ln(R.id):R.name==="history"?pn():R.name==="settings"?hn():Kt()}function Kt(){const e=$.sets.length,t=$.sets.filter(l=>N(l.createdAt)===N(Date.now())).length,n=et().get(N(Date.now()))||[],a=tt(n),s=Oe.trim().toLowerCase(),i=l=>!s||`${l.name} ${ce($e,l.equipmentType)} ${ce(Ne,l.category)}`.toLowerCase().includes(s),o=new Set($.sets.map(l=>l.exerciseId)),c=$.exercises.filter(l=>o.has(l.id)&&i(l)).sort((l,u)=>{var g,h;return(((g=ze(u.id).last)==null?void 0:g.date)||0)-(((h=ze(l.id).last)==null?void 0:h.date)||0)}),d=Ne.map(([l,u])=>[l,u,$.exercises.filter(g=>g.category===l&&i(g))]);return`
    <section class="hero home-hero">
      <div>
        <p class="eyebrow">Ручной режим</p>
        <h1>Упражнения</h1>
      </div>
      <div class="hero-stats">
        <div><strong>${$.exercises.length}</strong><span>упражнений</span></div>
        <div><strong>${e}</strong><span>подходов</span></div>
        <div><strong>${t}</strong><span>сегодня</span></div>
      </div>
    </section>
    ${n.length?`
      <section class="panel compact-day">
        <div class="section-head">
          <h2>Сегодня</h2>
          <button data-action="history-day" data-day="${N(Date.now())}">Открыть день</button>
        </div>
        <div class="mini-metrics">
          <span>${a.exerciseCount} упр.</span>
          <span>${a.workCount} рабочих</span>
          <span>${m(a.tonnage)} кг×повт</span>
          ${a.cardioCount?`<span>${H(a.distanceKm)} кардио</span>`:""}
        </div>
      </section>
    `:""}
    <section class="toolbar">
      <input type="search" id="search" placeholder="Найти упражнение" autocomplete="off" value="${Oe}" />
      <button class="primary" data-action="toggle-form">Новое</button>
    </section>
    ${xe?ht():""}
    <section class="exercise-groups">
      ${c.length?`
        <div class="group active-group ${s||me.has("active")?"expanded":"collapsed"}">
          <button class="group-title" data-action="toggle-exercise-group" data-group="active">
            <h2>В работе</h2>
            <span>${c.length}</span>
          </button>
          <div class="exercise-list">
            ${c.map(it).join("")}
          </div>
        </div>
      `:""}
      ${d.filter(([,,l])=>l.length).map(([l,u,g])=>`
          <div class="group ${l==="cardio"?"cardio-group":""} ${s||me.has(l)?"expanded":"collapsed"}">
            <button class="group-title" data-action="toggle-exercise-group" data-group="${l}">
              <h2>${u}</h2>
              <span>${g.length}</span>
            </button>
            <div class="exercise-list">
              ${g.map(it).join("")}
            </div>
          </div>
        `).join("")}
    </section>
  `}function it(e){const{last:t,prev:n,sessions:a}=ze(e.id),s=ae(e.id).length,i=le(e),o=te(e),c=!i&&t&&n&&t.bestSessionE1RM&&n.bestSessionE1RM?t.bestSessionE1RM-n.bestSessionE1RM:null,d=i&&t&&n?t.score-n.score:null,l=i?d:c,u=l==null||Math.abs(l)<.05?"":l>0?"good":"bad",g=t?i?o&&t.pace500Sec?`${b(t.pace500Sec)} /500 м`:m(t.performanceScore||t.score):t.bestSessionE1RM?`${m(t.bestSessionE1RM)} кг`:"—":"Нет истории",h=t?i?o?"темп последней":"производительность":"расч. максимум":`${ce($e,e.equipmentType)} · нет истории`,S=t?l==null?`${a.length} трен. · ${s} подх.`:i?P(t.score,n.score):Re(t,n):"";return`
    <article class="exercise-card ${t?"has-history":"empty-history"}" data-open-exercise="${e.id}">
      <div class="exercise-icon">${gt(e)}</div>
      <div class="exercise-main">
        <h3>${e.name}</h3>
        <p>${h}</p>
      </div>
      <div class="exercise-score ${u}">
        <strong>${g}</strong>
        <span>${S}</span>
      </div>
    </article>
  `}function ht(e=null){return`
    <form class="panel exercise-form" data-form="exercise" ${e?`data-id="${e.id}"`:""}>
      <h2>${e?"Редактировать упражнение":"Новое упражнение"}</h2>
      <div class="form-grid">
        <label>Название<input name="name" required value="${(e==null?void 0:e.name)||""}" /></label>
        <label>Иконка<input name="icon" maxlength="4" value="${(e==null?void 0:e.icon)||"🏋️"}" /></label>
        <label>Группа<select name="category">${Ne.map(([t,n])=>`<option value="${t}" ${(e==null?void 0:e.category)===t?"selected":""}>${n}</option>`).join("")}</select></label>
        <label>Оборудование<select name="equipmentType">${$e.map(([t,n])=>`<option value="${t}" ${(e==null?void 0:e.equipmentType)===t?"selected":""}>${n}</option>`).join("")}</select></label>
        <label class="wide">Своя картинка<input type="file" name="image" accept="image/*" /></label>
      </div>
      <div class="actions">
        <button class="primary" type="submit">${e?"Сохранить":"Добавить"}</button>
        <button type="button" data-action="toggle-form">Закрыть</button>
      </div>
    </form>
  `}function Pt(){const e=$.exercises.find(t=>t.id===ve);return e?`
    <div class="modal-backdrop" data-action="close-exercise-editor">
      <div class="modal-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        ${ht(e)}
        <button class="danger-zone" data-action="delete-exercise" data-id="${e.id}">Удалить упражнение</button>
      </div>
    </div>
  `:""}function Wt(e){const t=$.exercises.find(h=>h.id===e);if(!t)return'<section class="panel"><h1>Упражнение не найдено</h1></section>';const n=le(t),a=ae(e),s=a.filter(h=>N(h.createdAt)===N(Date.now())),i=_(e),o=i.at(-1),c=i.at(-2),d=$.sets.find(h=>h.id===q&&h.exerciseId===e),l=s.filter(h=>!I(h)&&!h.warmup),u=!n&&o&&c&&o.bestSessionE1RM&&c.bestSessionE1RM?o.bestSessionE1RM-c.bestSessionE1RM:null,g=d?{weight:String(d.weight),reps:String(d.reps),reserve:E(d),warmup:d.warmup}:k;return`
    <section class="exercise-header">
      <button data-action="home" class="ghost">← Назад</button>
      <div class="exercise-title">
        <div class="exercise-icon large">${gt(t)}</div>
        <div><h1>${t.name}</h1><p>${ce(Ne,t.category)} · ${ce($e,t.equipmentType)}</p></div>
      </div>
      <button data-action="edit-exercise" data-id="${t.id}">Править</button>
    </section>
    <section class="metrics-row">
      <div><span>Сегодня</span><strong>${n?s.length:l.length?`${l.length} раб.`:"0"}</strong></div>
      <div><span>${n?"Всего сегодня":"Расч. максимум"}</span><strong>${n?b(s.reduce((h,S)=>h+U(S),0)):o!=null&&o.bestSessionE1RM?`${m(o.bestSessionE1RM)} кг`:"—"}</strong></div>
      <div class="${u==null?"":u>=0?"good":"bad"}"><span>Динамика</span><strong>${n?o&&c?P(o.score,c.score):"—":u==null?"—":Re(o,c)}</strong></div>
    </section>
    ${n?Ot(t,d):Bt(t,d,g,a,c)}
    <section class="panel">
      <div class="section-head"><h2>Подходы сегодня</h2><span>${w(Date.now())}</span></div>
      ${s.length?`<div class="sets-list today-sets">${s.map((h,S)=>I(h)?$t(h):Jt(h,S)).join("")}</div>`:'<p class="muted">Сегодня по этому упражнению ещё нет подходов.</p>'}
    </section>
    ${_t(t)}
  `}function Bt(e,t,n,a,s){const i=vt(n),o=T!=null&&L&&!t;return`
    <form class="set-entry ${t?"editing":""}" data-form="set" data-id="${e.id}" data-kind="strength">
      ${t?'<div class="edit-banner"><strong>Редактирование подхода</strong><button type="button" data-action="cancel-edit">Отмена</button></div>':""}
      ${Yt(e.id,a,s)}
      <div class="input-pair">
        <label class="number-control"><span>Вес вместе со штангой</span><div><button type="button" data-step-field="weight" data-delta="-2.5">−</button><input inputmode="${V?"decimal":"none"}" name="weight" min="1" required value="${n.weight}" placeholder="80" ${V?"":"readonly"} data-set-field="weight" class="${ee==="weight"?"active":""}" /><button type="button" data-step-field="weight" data-delta="2.5">+</button></div></label>
        <label class="number-control"><span>Повторы</span><div><button type="button" data-step-field="reps" data-delta="-1">−</button><input inputmode="${V?"numeric":"none"}" name="reps" min="1" required value="${n.reps}" placeholder="8" ${V?"":"readonly"} data-set-field="reps" class="${ee==="reps"?"active":""}" /><button type="button" data-step-field="reps" data-delta="1">+</button></div></label>
      </div>
      ${Y?zt():""}
      <label class="effort-label"><span>Запас повторов: <strong id="reserveText">${z(n.reserve)}</strong></span><input class="effort-slider" type="range" name="reserve" min="0" max="10" value="${n.reserve}" /></label>
      <div class="rir-chips">
        ${[0,1,2,3,5,10].map(c=>`<button type="button" data-action="set-reserve-only" data-reserve="${c}" class="${Number(n.reserve)===c?"active":""}">${c===0?"0 отказ":c}</button>`).join("")}
      </div>
      <label class="warmup-toggle"><input type="checkbox" name="warmup" ${n.warmup?"checked":""} /> <span>Разминка</span></label>
      <p class="muted warmup-note">${n.warmup?"Разминка не влияет на прогресс.":"Рабочий подход влияет на прогресс."}</p>
      ${o?`<button type="button" class="ghost apply-suggestion" data-action="apply-suggestion" data-warmup="${T?"true":"false"}">${T?"Подставить разминку":"Подставить рабочий"}</button>`:""}
      ${ft(e.id,n)}
      ${G||i?`<p class="form-error">${G||i}</p>`:""}
      <button class="primary save-set" type="submit" ${i?"disabled":""}>${t?"Сохранить изменения":"Записать подход"}</button>
    </form>
  `}function Ot(e,t){const n=t&&I(t)?{minutes:String(Math.floor(U(t)/60)||""),seconds:String(U(t)%60||""),distanceM:String(Math.round(ne(t))||""),setting:String(t.setting||"")}:oe,a=te(e),s=Tt(e);return`
    <form class="set-entry ${t?"editing":""}" data-form="set" data-id="${e.id}" data-kind="cardio">
      ${t?'<div class="edit-banner"><strong>Редактирование кардио</strong><button type="button" data-action="cancel-edit">Отмена</button></div>':""}
      <div class="quick-row">
        ${a?'<button type="button" data-action="cardio-distance" data-distance="3000">3000 м тест</button><button type="button" data-action="cardio-setting" data-setting="9">Заслонка 9</button>':""}
        ${s?'<button type="button" data-action="cardio-duration" data-minutes="8" data-seconds="0">8 мин разогрев</button>':""}
        <button type="button" data-action="cardio-duration" data-minutes="10" data-seconds="0">10 мин</button>
        <button type="button" data-action="cardio-duration" data-minutes="20" data-seconds="0">20 мин</button>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Минуты</span><input inputmode="numeric" name="minutes" min="0" required value="${n.minutes}" placeholder="13" /></label>
        <label class="number-control"><span>Секунды</span><input inputmode="numeric" name="seconds" min="0" max="59" value="${n.seconds}" placeholder="30" /></label>
      </div>
      <div class="input-pair cardio-pair">
        <label class="number-control"><span>Дистанция, м</span><input inputmode="numeric" name="distanceM" min="1" required value="${n.distanceM}" placeholder="${a?"3000":"1500"}" /></label>
        <label class="number-control cardio-setting"><span>Настройка тренажёра</span><input inputmode="decimal" name="setting" value="${n.setting||""}" placeholder="например 9" /></label>
      </div>
      <div class="cardio-context">
        ${a?`<strong>Гребля</strong><span>3000 м - быстрый пресет для рабочего фит-теста, обычные тренировки можно писать с любой дистанцией.</span><span>${Ye()}</span><span>Настройка тренажёра сохраняется только в истории и не участвует в расчёте прогресса.</span>`:""}
        ${s?"<strong>Эллипс: спокойное кардио</strong><span>Здесь важны время, дистанция и ровная привычка разогрева, без оценки тяжести.</span>":""}
        ${!a&&!s?"<span>Настройка сохраняется как контекст. Она не считается сложностью и не влияет на прогресс.</span>":""}
      </div>
      ${G?`<p class="form-error">${G}</p>`:""}
      <button class="primary save-set" type="submit">${t?"Сохранить изменения":"Записать кардио"}</button>
    </form>
  `}function ft(e,t){const n=!!t.warmup,a=It(e,n),s=Ge(e,n),i=s[a]||null;if(t.warmup)return i?`
      <div class="comparison muted">
        <span>Прошлая разминка №${a+1}: ${m(i.weight)} кг × ${i.reps}, ${z(E(i))}</span>
        <strong>Не влияет на прогресс</strong>
      </div>
    `:s.length?`<div class="comparison muted">В прошлой тренировке было только ${s.length} разм. подх. Разминка №${a+1} новая и не влияет на прогресс.</div>`:'<div class="comparison muted">Прошлых разминочных подходов пока нет. Разминка не влияет на прогресс.</div>';if(!i)return s.length?`<div class="comparison muted">В прошлой тренировке было только ${s.length} раб. подх. Рабочий №${a+1} новый, сравнение не строю.</div>`:'<div class="comparison muted">Прошлых рабочих подходов пока нет.</div>';const o=Number(String(t.weight||0).replace(",",".")),c=Number(t.reps||0),l=Number.isFinite(o)&&o>0&&Number.isFinite(c)&&c>0?Ie({weight:o,reps:c,reserve:Number(t.reserve||0),warmup:!1}):null,u=Ie(i),g=l==null?null:l-u;return`
    <div class="comparison ${g==null?"":g>=0?"good":"bad"}">
      <span>Прошлый рабочий №${a+1}: ${m(i.weight)} кг × ${i.reps}, ${z(E(i))}</span>
      <strong>${g==null?"Введите вес и повторы":P(l,u)}</strong>
    </div>
  `}function Ut(e){var t,n,a,s;return{weight:((t=e.elements.weight)==null?void 0:t.value)||"",reps:((n=e.elements.reps)==null?void 0:n.value)||"",reserve:Number(((a=e.elements.reserve)==null?void 0:a.value)||0),warmup:!!((s=e.elements.warmup)!=null&&s.checked)}}function J(e){const t=e.querySelector("[data-form='set'][data-kind='strength']"),n=t==null?void 0:t.querySelector(".comparison");!t||!n||(n.outerHTML=ft(t.dataset.id,Ut(t)))}function Ke(){const e=Le;if(q=null,Le=null,(e==null?void 0:e.name)==="history"){he=e.activeHistoryDay||he,K=e.historyCursor?new Date(e.historyCursor):K,R={name:"history"};return}}function ot(e){var o,c,d,l;const t=e.querySelector("[data-form='set'][data-kind='strength']");if(!t)return;const n=!!((o=t.elements.warmup)!=null&&o.checked),a=Number(((c=t.elements.reserve)==null?void 0:c.value)||0),s=n?Math.max(6,a||6):a>=6?2:a||2,i=Fe(t.dataset.id,{weight:((d=t.elements.weight)==null?void 0:d.value)||"",reps:((l=t.elements.reps)==null?void 0:l.value)||"8",reserve:s,warmup:n});t.elements.weight.value=i.weight,t.elements.reps.value=i.reps,t.elements.reserve.value=i.reserve,q||(k={...k,...i}),L=!1,T=null,e.querySelector("#reserveText").textContent=z(i.reserve),J(e)}function $t(e){if(I(e)){const t=Ct(e),n=$.exercises.find(s=>s.id===e.exerciseId),a=te(n);return`
      <div class="set-row cardio-row ${e.id===X?"just-saved":""}" data-action="edit-set" data-id="${e.id}">
        <strong>${b(U(e))} · ${ut(ne(e))}</strong>
        <span>${a?`Темп /500 м ${b(ge(e))} · ${Ee(e)}`:`${m(dt(e))} км/ч · ${je(t)}`}${e.setting?` · настройка ${e.setting}`:""} · ${He(e.createdAt)}</span>
        <div class="set-actions">
          <button data-action="edit-set" data-id="${e.id}" aria-label="Редактировать кардио">✎</button>
          <button data-action="delete-set" data-id="${e.id}" aria-label="Удалить запись">×</button>
        </div>
      </div>
    `}return`
    <div class="set-row ${e.id===X?"just-saved":""}" data-action="edit-set" data-id="${e.id}">
      <strong>${m(e.weight)} кг × ${e.reps}</strong>
      <span>${e.warmup?"Разминка":"Рабочий"} · ${z(E(e))}${!e.warmup&&!Me(e)?" · e1RM не считается: reps+RIR > 15":""} · ${He(e.createdAt)}</span>
      <div class="set-actions">
        <button data-action="edit-set" data-id="${e.id}" aria-label="Редактировать подход">✎</button>
        <button data-action="delete-set" data-id="${e.id}" aria-label="Удалить подход">×</button>
      </div>
    </div>
  `}function vt(e){const t=Number(String(e.weight||"").replace(",",".")),n=Number(e.reps||0),a=Number(e.reserve);return!Number.isFinite(t)||t<=0?"Вес должен быть больше 0":!Number.isInteger(n)||n<=0?"Повторы должны быть больше 0":!Number.isFinite(a)||a<0?"Запас должен быть 0 или больше":""}function Ht(e){const t=E({reserve:e});return t<=1?"очень тяжело":t<=3?"тяжело":t<=5?"средне":"легко"}function Jt(e,t){const n=Me(e),a=n?Se(e):null;return`
    <div class="set-row strength-today ${e.id===X?"just-saved":""}" data-action="use-set" data-id="${e.id}">
      <strong>${t+1}. ${e.warmup?"Разм.":"Раб."} ${m(e.weight)} × ${e.reps} · <span class="rir-badge">RIR ${E(e)}</span></strong>
      <span>${Ht(E(e))}${e.warmup?"":n?` · e1RM ${m(a)}`:" · e1RM не считается: reps + RIR > 15"} · ${He(e.createdAt)}</span>
      <div class="set-actions">
        <button data-action="edit-set" data-id="${e.id}" aria-label="Редактировать подход">✎</button>
        <button data-action="delete-set" data-id="${e.id}" aria-label="Удалить подход">×</button>
      </div>
    </div>
  `}function Yt(e,t,n){const a=[],s=t.filter(c=>!I(c)).at(-1);s&&a.push(`<button type="button" data-action="apply-set-chip" data-weight="${s.weight}" data-reps="${s.reps}" data-reserve="${E(s)}" data-warmup="${!!s.warmup}">Повторить последний: ${m(s.weight)} × ${s.reps}</button>`),n!=null&&n.top&&!I(n.top)&&a.push(`<button type="button" data-action="apply-set-chip" data-weight="${n.top.weight}" data-reps="${n.top.reps}" data-reserve="${E(n.top)}" data-warmup="false">Лучший прошлый: ${m(n.top.weight)} × ${n.top.reps}</button>`);const i=Ge(e,!1).at(-1),o=Ge(e,!0).at(-1);return a.push(`<button type="button" data-action="set-reserve-only" data-reserve="${i?E(i):2}">Рабочий запас ${i?E(i):2}</button>`),a.push(`<button type="button" data-action="set-reserve-only" data-reserve="${o?E(o):6}">Разминка запас ${o?E(o):6}</button>`),`<div class="quick-row">${a.slice(0,4).join("")}</div>`}function zt(){const e=ee==="reps"?"disabled":"";return`
    <div class="keypad" aria-label="Цифровой ввод">
      ${["1","2","3","4","5","6","7","8","9"].map(t=>`<button type="button" data-key="${t}">${t}</button>`).join("")}
      <button type="button" data-key="clear">C</button>
      <button type="button" data-key="0">0</button>
      <button type="button" data-key="dot" ${e}>,</button>
      <button type="button" data-key="back" class="wide-key">⌫</button>
      <button type="button" data-action="toggle-keyboard" class="wide-key ${V?"active":""}">${V?"Скрыть клавиатуру":"Клавиатура"}</button>
    </div>
  `}function Gt(e){const t=e.filter(l=>Number.isFinite(Number(l))).slice(-6);if(t.length<2)return'<div class="sparkline empty"></div>';const n=180,a=42,s=Math.max(...t),i=Math.min(...t),o=s-i||1,c=t.map((l,u)=>{const g=t.length===1?n/2:u/(t.length-1)*n,h=a-(l-i)/o*(a-8)-4;return{x:g,y:h}}),d=c.map(({x:l,y:u})=>`${m(l).replace(",",".")},${m(u).replace(",",".")}`).join(" ");return`
    <svg class="sparkline" viewBox="0 0 ${n} ${a}" role="img" aria-label="Короткий график прогресса">
      <polyline points="${d}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      ${c.map(({x:l,y:u},g)=>`<circle cx="${m(l).replace(",",".")}" cy="${m(u).replace(",",".")}" r="${g===c.length-1?"4.8":"3.6"}" />`).join("")}
    </svg>
  `}function _t(e){const t=_(e.id),n=t.at(-1),a=t.at(-2),s=le(e),i=s?t.map(d=>d.score):t.map(d=>d.bestSessionE1RM).filter(Boolean),o=s?n?`Производительность ${m(n.performanceScore||n.score)}`:"Недостаточно данных":n!=null&&n.bestSessionE1RM?`Расч. максимум ${m(n.bestSessionE1RM)} кг`:"Недостаточно данных",c=t.length<2?"Недостаточно данных для тренда":t.length===2?"Тренд предварительный":s?P(n.score,a.score):Re(n,a);return`
    <section class="panel compact-progress-card">
      <div>
        <span>Прогресс упражнения</span>
        <strong>${o}</strong>
        <small>${c}</small>
      </div>
      ${Gt(i)}
      <button data-action="progress-exercise" data-id="${e.id}">Подробнее</button>
    </section>
  `}function Re(e,t){if(!e)return"Недостаточно данных";if(!t)return"первая тренировка";if(!t.bestSessionE1RM)return"нет корректного сравнения";const n=e.bestSessionE1RM-t.bestSessionE1RM;return Math.abs(n)<.05?"без изменений к прошлой тренировке":`${n>0?"+":"−"}${m(Math.abs(n))} кг к прошлой тренировке`}function Qt(e,t){if(!e||!t||!t.bestSessionE1RM)return"";const n=e.bestSessionE1RM-t.bestSessionE1RM;return Math.abs(n)<.05?"":n>0?"good":"bad"}function ct(e){return e.length<=1?"Пока есть только одна тренировка. Тренд появится после следующей.":e.length===2?"Тренд предварительный: всего 2 тренировки. Линия показывает только изменение между двумя точками, а не устойчивую тенденцию.":"Тренд считается по истории упражнения."}function Vt(e,t,n){if(!t)return"Есть первая точка. Следующая тренировка даст сравнение силы, тяжёлых подходов, тоннажа и запаса.";const a=[];if(e.bestSessionE1RM&&t.bestSessionE1RM){const c=e.bestSessionE1RM-t.bestSessionE1RM;c>.05?a.push(`Сила выросла: расчётный максимум +${m(c)} кг.`):c<-.05?a.push(`Расчётный максимум снизился на ${m(Math.abs(c))} кг. Это может быть усталость, меньший запас или обычное колебание.`):a.push("Расчётный максимум почти не изменился.")}else a.push("Для корректного сравнения силы пока не хватает валидных подходов.");const s=e.hardSets-t.hardSets;s>0?a.push(`Качественный объём вырос: +${s} тяж. подх.`):s<0&&a.push(`Тяжёлых подходов меньше: ${s} к прошлой тренировке.`);const i=e.tonnage-t.tonnage;i>0?a.push(`Тоннаж вырос на ${m(i)} кг.`):i<0&&a.push(`Тоннаж ниже на ${m(Math.abs(i))} кг.`);const o=e.avgReserve-t.avgReserve;return o<-.05?a.push(`Средний запас снизился до ${m(e.avgReserve)} RIR — работа стала ближе к отказу.`):o>.05&&a.push(`Средний запас вырос до ${m(e.avgReserve)} RIR — тренировка была дальше от отказа.`),n.length===2&&a.push("Вывод предварительный: истории пока мало."),a.join(" ")}function Xt(e,t){const n={strength:{title:"Расчётный максимум",subtitle:"Лучший e1RM за тренировку.",type:"line",values:t.map(a=>a.bestSessionE1RM),details:t.map(a=>`${w(a.date)} · e1RM ${a.bestSessionE1RM?m(a.bestSessionE1RM):"—"} кг`)},hard:{title:"Тяжёлые подходы",subtitle:"Рабочие подходы с запасом 0–3 RIR.",type:"bar",values:t.map(a=>a.hardSets),details:t.map(a=>`${w(a.date)} · ${a.hardSets} тяж. подх.`)},tonnage:{title:"Тоннаж",subtitle:"Сумма вес × повторения без разминки.",type:"bar",values:t.map(a=>a.tonnage),details:t.map(a=>`${w(a.date)} · ${m(a.tonnage)} кг`)},rir:{title:"Средний запас",subtitle:"Меньше = ближе к отказу. Само по себе снижение не является ухудшением.",type:"line",values:t.map(a=>a.avgReserve),details:t.map(a=>`${w(a.date)} · ${m(a.avgReserve)} RIR`)}};return n[e]||n.strength}function Zt(e){return`<div class="progress-tabs">${[["strength","Сила"],["hard","Тяжёлые подходы"],["tonnage","Тоннаж"],["rir","Запас"]].map(([n,a])=>`<button class="${e===n?"active":""}" data-action="progress-tab" data-tab="${n}">${a}</button>`).join("")}</div>`}function en(e){var i;const t=`${e.date}:${((i=e.top)==null?void 0:i.exerciseId)||""}`,n=Te.has(t),a=e.workingSets.map(o=>{const c=!Me(o);return`<li>${m(o.weight)} × ${o.reps} @RIR ${E(o)}${c?" <small>e1RM не считается: reps+RIR &gt; 15</small>":""}</li>`}).join(""),s=e.warmupSets.map(o=>`<li>${m(o.weight)} × ${o.reps} @RIR ${E(o)}</li>`).join("");return`
    <article class="session-summary strength-session">
      <div>
        <strong>${w(e.date)}</strong>
        <span>e1RM: ${e.bestSessionE1RM?`${m(e.bestSessionE1RM)} кг`:"—"} · тяжёлые: ${e.hardSets} · тоннаж: ${m(e.tonnage)} кг · запас: ${m(e.avgReserve)} RIR</span>
      </div>
      <ul class="set-compact-list">${a||"<li>Рабочих подходов нет.</li>"}</ul>
      ${e.warmupSets.length?`<button class="ghost compact-toggle" data-action="toggle-progress-warmup" data-key="${t}">${n?"Скрыть разминку":"Показать разминку"}</button>`:""}
      ${n?`<ul class="set-compact-list warmup-list">${s}</ul>`:""}
    </article>
  `}function tn(e,t){const n=_(e.id),a=n.at(-1),s=n.at(-2),i=n.filter(d=>ye!=="strength"||d.bestSessionE1RM>0),o=Xt(ye,i),c=`chart-${F.length}`;return i.length&&F.push({id:c,values:o.values,labels:i.map(d=>w(d.date)),type:o.type,neutral:ye!=="strength",details:o.details}),`
    <section class="progress-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>${e.name}</h1>
        <div class="progress-subline">
          <span>${n.length} трен.</span>
          <span>${ae(e.id).length} подх.</span>
          <span>${ce($e,e.equipmentType)}</span>
        </div>
      </div>
      <div class="progress-score ${Qt(a,s)}">
        <span>Расчётный максимум</span>
        <strong>${a!=null&&a.bestSessionE1RM?`${m(a.bestSessionE1RM)} кг`:"—"}</strong>
        <small>${Re(a,s)}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${t.length} с историей</span></div>
      <div class="progress-picker">
        ${t.map(({exercise:d,sessions:l})=>{const u=l.at(-1),g=l.at(-2);return`
            <button class="${d.id===e.id?"active":""}" data-action="select-progress-card" data-id="${d.id}">
              <span>${d.name}</span>
              <strong>${u?le(d)?m(u.score):u.bestSessionE1RM?`${m(u.bestSessionE1RM)} кг`:"—":"—"}</strong>
              <small>${le(d)?u&&g?P(u.score,g.score):`${l.length} трен.`:Re(u,g)}</small>
            </button>
          `}).join("")}
      </div>
    </section>
    <section class="progress-mosaic">
      <div class="metric-tile strength"><span>Макс. вес</span><strong>${a?`${m(a.maxWorkingWeight)} кг`:"—"}</strong><p>Среди рабочих подходов.</p></div>
      <div class="metric-tile volume"><span>Тяжёлые подходы</span><strong>${a?a.hardSets:"—"}</strong><p>Рабочие подходы с запасом 0–3.</p></div>
      <div class="metric-tile reserve"><span>Средний запас</span><strong>${a?`${m(a.avgReserve)} RIR`:"—"}</strong><p>Меньше = ближе к отказу.</p></div>
      <div class="metric-tile stability"><span>Тоннаж</span><strong>${a?`${m(a.tonnage)} кг`:"—"}</strong><p>Без разминки.</p></div>
    </section>
    ${a?`<section class="panel progress-note"><h2>Вывод</h2><p>${Vt(a,s,n)}</p>${a.strengthRetention!=null?`<p class="muted">Сохранение силы: ${m(a.strengthRetention)}%. Показывает, насколько последний рабочий подход сохранил силу относительно лучшего подхода сессии.</p>`:'<p class="muted">Недостаточно рабочих подходов для оценки сохранения силы.</p>'}</section>`:""}
    <section class="chart-panel primary-chart">
      <div class="section-head"><h2>${o.title}</h2><span class="legend-dot">${o.subtitle}</span></div>
      ${Zt(ye)}
      ${i.length>1?`<canvas class="chart" id="${c}" height="250"></canvas><p class="muted">${ct(n)}</p>`:`<p class="muted">${ct(n)}</p>`}
    </section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${n.length?`<div class="session-list">${n.slice(-6).reverse().map(en).join("")}</div>`:'<p class="muted">Нет данных.</p>'}
    </section>
  `}function nn(e){return e.length<=1?"Пока есть только одна тренировка. Сравнение появится после следующей.":e.length===2?"Тренд предварительный: всего 2 тренировки. Линия показывает только изменение между двумя точками, а не устойчивую тенденцию.":""}function an(e,t,n){const a=H(e.distanceKm),s=b(e.durationSec),i=b(e.pace500Sec),o=b(e.projected3000Sec);if(!t)return`Первая точка по гребле: ${a} за ${s}, средний темп ${i}/500 м. 3000 м по этому темпу — ${o}. Сравнение появится после следующей тренировки.`;const c=[],d=e.performanceScore-t.performanceScore;Math.abs(d)<.05?c.push("Производительность почти не изменилась."):c.push(`Производительность ${d>0?"выросла":"снизилась"} на ${m(Math.abs(d))}.`);const l=e.pace500Sec-t.pace500Sec;Math.abs(l)>=.5?c.push(`Темп ${l<0?"улучшился":"стал медленнее"} на ${Math.round(Math.abs(l))} сек/500 м.`):c.push("Темп почти не изменился.");const u=e.distanceM-t.distanceM;Math.abs(u)>=1&&c.push(`Дистанция ${u>0?"выросла":"стала меньше"} на ${ut(Math.abs(u))}.`);const g=e.projected3000Sec-t.projected3000Sec;return Math.abs(g)>=.5&&c.push(`Расчётные 3000 м ${g<0?"быстрее":"медленнее"} на ${Math.round(Math.abs(g))} сек.`),n.length===2&&c.push("Тренд предварительный: всего 2 тренировки."),c.join(" ")}function rn(e,t){const n={performance:{title:"Производительность",subtitle:"Больше = лучше.",type:"line",values:t.map(a=>a.performanceScore),details:t.map(a=>`${w(a.date)} · производительность ${m(a.performanceScore)} · ${H(a.distanceKm)}`),yFormat:m},pace:{title:"Темп /500 м",subtitle:"Ниже = быстрее.",type:"line",invert:!0,values:t.map(a=>a.pace500Sec),details:t.map(a=>`${w(a.date)} · темп ${b(a.pace500Sec)}/500 м · ${b(a.durationSec)}`),yFormat:b},distance:{title:"Дистанция",subtitle:"Дистанция за сессию.",type:"bar",neutral:!0,values:t.map(a=>a.distanceKm),details:t.map(a=>`${w(a.date)} · ${H(a.distanceKm)} · ${b(a.durationSec)}`),yFormat:a=>`${m(a)} км`},projected3000:{title:"3000 м",subtitle:"Расчётное время на 3000 м по текущему среднему темпу. Ниже = лучше.",type:"line",invert:!0,values:t.map(a=>a.projected3000Sec),details:t.map(a=>`${w(a.date)} · 3000 м по темпу ${b(a.projected3000Sec)} · темп ${b(a.pace500Sec)}/500 м`),yFormat:b}};return n[e]||n.performance}function sn(e){return`<div class="progress-tabs rowing-tabs">${[["performance","Производительность"],["pace","Темп"],["distance","Дистанция"],["projected3000","3000 м"]].map(([n,a])=>`<button class="${e===n?"active":""}" data-action="cardio-progress-tab" data-tab="${n}">${a}</button>`).join("")}</div>`}function on(e){const t=_(e.top.exerciseId),n=Math.max(...t.map(i=>i.performanceScore)),a=Math.abs(e.performanceScore-n)<.05,s=e.settings.length?`настройка ${e.settings.join(", ")}`:"настройка не указана";return`
    <article class="session-summary rowing-session">
      <div>
        <strong>${w(e.date)}${a?" · лучший":""}</strong>
        <span>${e.count} зап. · ${s}</span>
      </div>
      <div>
        <strong>${H(e.distanceKm)} · ${b(e.durationSec)} · темп ${b(e.pace500Sec)}/500 м</strong>
        <span>3000 м по темпу: ${b(e.projected3000Sec)} · Производительность: ${m(e.performanceScore)}</span>
      </div>
    </article>
  `}function cn(e,t){const n=_(e.id),a=n.at(-1),s=n.at(-2),i=a&&s?a.performanceScore-s.performanceScore:null,o=n.filter(l=>Number.isFinite(Number(l.performanceScore))),c=rn(ue,o),d=`chart-${F.length}`;return o.length&&F.push({id:d,values:c.values,labels:o.map(l=>w(l.date)),type:c.type,invert:c.invert,neutral:c.neutral,details:c.details,yFormat:c.yFormat}),`
    <section class="progress-hero rowing-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>Гребля</h1>
        <div class="progress-subline">
          <span>${n.length} трен.</span>
          <span>${ae(e.id).length} зап.</span>
          <span>Кардио</span>
        </div>
      </div>
      <div class="progress-score ${st(i)}">
        <span>Производительность</span>
        <strong>${a?m(a.performanceScore):"—"}</strong>
        <small class="${st(i)}">${Nt(a,s)}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${t.length} с историей</span></div>
      <div class="progress-picker">
        ${t.map(({exercise:l,sessions:u})=>{const g=u.at(-1),h=u.at(-2),S=g&&h?g.score-h.score:null;return`
            <button class="${l.id===e.id?"active":""}" data-action="select-progress-card" data-id="${l.id}">
              <span>${l.name}</span>
              <strong>${g?m(g.performanceScore||g.score):"—"}</strong>
              <small>${S==null?`${u.length} трен.`:P(g.score,h.score)}</small>
            </button>
          `}).join("")}
      </div>
    </section>
    <section class="progress-mosaic rowing-metrics">
      <div class="metric-tile strength"><span>Дистанция</span><strong>${a?H(a.distanceKm):"—"}</strong><p>за последнюю сессию</p></div>
      <div class="metric-tile volume"><span>Время</span><strong>${a?b(a.durationSec):"—"}</strong><p>мин:сек работы</p></div>
      <div class="metric-tile reserve"><span>Темп /500 м</span><strong>${a?b(a.pace500Sec):"—"}</strong><p>ниже = быстрее</p></div>
      <div class="metric-tile stability"><span>3000 м</span><strong>${a?b(a.projected3000Sec):"—"}</strong><p>по текущему среднему темпу</p></div>
    </section>
    ${a?`<section class="panel progress-note"><h2>Вывод</h2><p>${an(a,s,n)}</p><p class="muted">Производительность — условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.</p></section>`:""}
    <section class="chart-panel primary-chart">
      <div class="section-head"><h2>${c.title}</h2><span class="legend-dot">${c.subtitle}</span></div>
      ${sn(ue)}
      ${o.length?`<canvas class="chart" id="${d}" height="250"></canvas><p class="muted">${ue==="pace"?"Средний темп на 500 м. В гребле меньшее время означает более высокую скорость.":ue==="projected3000"?"Если бы ты держал этот же темп 3000 м, получилось бы примерно такое время.":ue==="performance"?"Условный индекс: больше = лучше. Учитывает дистанцию и среднюю скорость.":"Дистанция не окрашивается как хорошо или плохо: цели сессий могут отличаться."}</p>`:'<p class="muted">Нет данных.</p>'}
    </section>
    ${o.length<=2?`<section class="panel trend-warning"><p>${nn(o)}</p></section>`:""}
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${n.length?`<div class="session-list">${n.slice(-6).reverse().map(on).join("")}</div>`:'<p class="muted">Нет данных.</p>'}
    </section>
  `}function ln(e){var D,A;const t=xt(),n=((D=t.find(r=>r.exercise.id===e))==null?void 0:D.exercise)||((A=t[0])==null?void 0:A.exercise);if(!n)return`
      <section class="progress-hero empty-progress">
        <div>
          <p class="eyebrow">Прогресс</p>
          <h1>Здесь появится динамика после первых подходов</h1>
        </div>
        <button class="primary" data-action="home">Записать упражнение</button>
      </section>
    `;const a=le(n);if(!a)return tn(n,t);const s=te(n);if(s)return cn(n,t);const i=_(n.id),o=i.at(-1),c=i.at(-2),d=`chart-${F.length}`;F.push({id:d,values:i.map(r=>r.score),labels:i.map(r=>w(r.date)),type:"line",pointValues:a?null:i.map(r=>r.avgReserve),details:i.map(r=>a?`${w(r.date)} · ${m(r.score)} производительность · ${b(r.durationSec)}`:`${w(r.date)} · e1RM ${m(r.score)} кг · пик ${m(r.pureE1rm)} кг 1ПМ · ${r.workCount} рабочих`)});const l=`chart-${F.length}`;F.push({id:l,values:i.map(r=>a?r.distanceKm:r.tonnage),labels:i.map(r=>w(r.date)),type:"bar",details:i.map(r=>a?`${w(r.date)} · ${H(r.distanceKm)} · ${b(r.durationSec)}`:`${w(r.date)} · ${m(r.tonnage)} кг×повт · ${r.workCount} рабочих`)});const u=`chart-${F.length}`;F.push({id:u,values:i.map(r=>a?s?ge(r):r.speedKmh:r.avgReserve),labels:i.map(r=>w(r.date)),type:"line",invert:s,details:i.map(r=>a?s?`${w(r.date)} · Темп /500 м ${b(ge(r))} · ${Ee(r)}`:`${w(r.date)} · ${m(r.speedKmh)} км/ч · темп ${je(r.pace)}`:`${w(r.date)} · запас ${m(r.avgReserve)} · ${r.workCount} рабочих`)});const g=i.map(r=>r.fatigue).filter(r=>r!=null),h=`chart-${F.length}`,S=i.filter(r=>r.fatigue!=null);return F.push({id:h,values:g,labels:S.map(r=>w(r.date)),type:"line",invert:!0,details:S.map(r=>`${w(r.date)} · падение ${m(r.fatigue)} · меньше лучше`)}),`
    <section class="progress-hero">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1>${n.name}</h1>
        <div class="progress-subline">
          <span>${i.length} трен.</span>
          <span>${ae(n.id).length} ${a?"зап.":"подх."}</span>
          <span>${ce($e,n.equipmentType)}</span>
        </div>
      </div>
      <div class="progress-score">
        <span>Производительность</span>
        <strong>${o?m(o.score):"—"}</strong>
        <small>${o&&c?P(o.score,c.score):"Нужна ещё одна точка"}</small>
      </div>
    </section>
    <section class="progress-picker-shell">
      <div class="section-head"><h2>Выбор упражнения</h2><span class="legend-dot">${t.length} с историей</span></div>
      <div class="progress-picker">
        ${t.map(({exercise:r,sessions:p})=>{const f=p.at(-1),v=p.at(-2),j=f&&v?f.score-v.score:null;return`
            <button class="${r.id===n.id?"active":""}" data-action="select-progress-card" data-id="${r.id}">
              <span>${r.name}</span>
              <strong>${f?m(f.score):"—"}</strong>
              <small>${j==null?`${p.length} трен.`:P(f.score,v.score)}</small>
            </button>
          `}).join("")}
      </div>
    </section>
    <section class="progress-mosaic">
      <div class="metric-tile strength"><span>${a?"Дистанция":"Пик силы"}</span><strong>${o?a?H(o.distanceKm):`${m(o.pureE1rm)} кг`:"—"}</strong><p>${a?"за последнюю сессию":"лучший чистый 1ПМ"}</p></div>
      <div class="metric-tile volume"><span>${a?"Время":"Объём"}</span><strong>${o?a?b(o.durationSec):m(o.tonnage):"—"}</strong><p>${a?"мин:сек работы":"рабочие кг×повт"}</p></div>
      <div class="metric-tile reserve"><span>${a?s?"Темп /500 м":"Скорость":"Запас"}</span><strong>${o?a?s?b(ge(o)):`${m(o.speedKmh)} км/ч`:m(o.avgReserve):"—"}</strong><p>${a?s?"ниже = быстрее":"средняя":"средний RIR 0-10"}</p></div>
      <div class="metric-tile stability"><span>${a?s?"3000 м":"Темп":"Серия"}</span><strong>${o?a?s?b(Xe(o)):je(o.pace):o.fatigue!=null?m(o.fatigue):"—":"—"}</strong><p>${a?s?"эквивалент по темпу":"мин/км":"падение меньше = лучше"}</p></div>
    </section>
    ${o?`<section class="panel progress-note">${dn(o,c,n)}</section>`:""}
    <section class="chart-grid">
      <div class="chart-panel primary-chart"><div class="section-head"><h2>Производительность</h2><span class="legend-dot">дистанция + скорость</span></div>${i.length?`<canvas class="chart" id="${d}" height="250"></canvas><p class="muted">Условный индекс сессии: растёт, когда дистанция больше и/или средний темп быстрее. Используется только для сравнения своих тренировок между собой.</p>`:'<p class="muted">Нет данных.</p>'}</div>
      <div class="chart-panel"><div class="section-head"><h2>${a?"Дистанция":"Объём"}</h2><span class="legend-dot">${a?"км":"рабочие подходы"}</span></div>${i.length?`<canvas class="chart" id="${l}" height="210"></canvas><p class="muted">${a?"Сколько километров набрано за сессию.":"Сколько работы сделано за день."}</p>`:'<p class="muted">Нет данных.</p>'}</div>
      <div class="chart-panel"><div class="section-head"><h2>${a?s?"Темп /500 м":"Скорость":"Запас"}</h2><span class="legend-dot">${a?s?"ниже = быстрее":"км/ч":"0 отказ · 10 легко"}</span></div>${i.length?`<canvas class="chart" id="${u}" height="210"></canvas><p class="muted">${a?s?"Средний темп на 500 м. В гребле меньшее время означает более высокую скорость.":"Средняя скорость по времени и дистанции.":"Та же работа с большим запасом = прогресс."}</p>`:'<p class="muted">Нет данных.</p>'}</div>
      ${a?"":`<div class="chart-panel"><div class="section-head"><h2>Устойчивость</h2><span class="legend-dot">ниже лучше</span></div>${g.length?`<canvas class="chart" id="${h}" height="210"></canvas><p class="muted">Насколько проседает серия от первого рабочего подхода к последнему.</p>`:'<p class="muted">Нужны хотя бы два рабочих подхода в тренировке.</p>'}</div>`}
    </section>
    <section class="panel">
      <h2>Последние тренировки</h2>
      ${i.length?`<div class="session-list">${i.slice(-6).reverse().map(un).join("")}</div>`:'<p class="muted">Нет данных.</p>'}
    </section>
  `}function dn(e,t,n){if(e.type==="cardio"){const c=te(n)?Xe(e):null,d=te(n)?ge(e):null;if(!t)return`
        <h2>Вывод</h2>
        <p class="muted">${c?`Первая точка по гребле: Темп /500 м ${b(d)}, ${Ee(e)}. ${Ye()}`:"Есть первая кардио-точка. Следующая тренировка даст сравнение скорости, дистанции и времени."}</p>
      `;const l=e.speedKmh-t.speedKmh,u=e.distanceKm-t.distanceKm,g=e.durationSec-t.durationSec;return`
      <h2>Вывод</h2>
      <p>${l>=0?"средняя скорость выше":"средняя скорость ниже"}, ${u>=0?"дистанция выше":"дистанция ниже"}, ${g>=0?"времени больше":"времени меньше"}.</p>
      ${c?`<p class="muted">Гребля: Темп /500 м ${b(d)}, ${Ee(e)}. ${Ye()}</p>`:""}
      <div class="mini-metrics">
        <span>${P(e.speedKmh,t.speedKmh," км/ч")}</span>
        <span>${P(e.distanceKm,t.distanceKm," км")}</span>
        <span>${P(e.durationSec,t.durationSec," сек")}</span>
      </div>
    `}if(!t)return'<h2>Вывод</h2><p class="muted">Есть первая точка. Следующая тренировка даст сравнение.</p>';const a=e.score-t.score,s=e.tonnage-t.tonnage,i=e.avgReserve-t.avgReserve;return`
    <h2>Вывод</h2>
    <p>${[a>=0?"производительность выросла":"производительность снизилась",s>=0?"объём выше":"объём ниже",i>=0?"запаса больше":"запаса меньше"].join(", ")}.</p>
    <div class="mini-metrics">
      <span>${P(e.score,t.score)}</span>
      <span>${P(e.tonnage,t.tonnage," объём")}</span>
      <span>${P(e.avgReserve,t.avgReserve," запас")}</span>
    </div>
  `}function un(e){const t=e.score===Math.max(..._(e.top.exerciseId).map(n=>n.score));if(e.type==="cardio"){const n=$.exercises.find(s=>s.id===e.top.exerciseId),a=te(n);return`
      <article class="session-summary">
        <div>
          <strong>${w(e.date)}${t?" · лучший":""}</strong>
          <span>${e.count} зап. · ${b(e.durationSec)}</span>
        </div>
        <div>
          <strong>${H(e.distanceKm)} · ${a?`Темп /500 м ${b(ge(e))}`:`${m(e.speedKmh)} км/ч`}</strong>
          <span>${a?Ee(e):`${m(e.score)} производительность · темп ${je(e.pace)}`}</span>
        </div>
      </article>
    `}return`
    <article class="session-summary">
      <div>
        <strong>${w(e.date)}${t?" · лучший":""}</strong>
        <span>${e.count} подх. · запас ${m(e.avgReserve)}</span>
      </div>
      <div>
        <strong>${m(e.top.weight)} кг × ${e.top.reps}</strong>
        <span>e1RM ${m(e.score)} · ${m(e.tonnage)} объём</span>
      </div>
    </article>
  `}function pn(){const e=et(),t=[...e.entries()].filter(([n])=>n.startsWith(Rt(K))).sort((n,a)=>a[0].localeCompare(n[0]));return`
    <section class="progress-top history-top">
      <h1>История</h1>
      <div class="month-controls">
        <button data-action="history-month" data-delta="-1">←</button>
        <strong>${qt(K)}</strong>
        <button data-action="history-month" data-delta="1">→</button>
      </div>
    </section>
    <section class="panel">
      ${mn(e)}
    </section>
    ${$.sets.length?t.length?t.map(([n,a])=>gn(n,a)).join(""):'<section class="panel"><p class="muted">В этом месяце тренировок нет.</p></section>':'<section class="panel"><p class="muted">История пока пустая.</p></section>'}
  `}function mn(e){const t=new Date(K.getFullYear(),K.getMonth(),1),n=new Date(K.getFullYear(),K.getMonth()+1,0),a=(t.getDay()+6)%7,s=[];for(let o=0;o<a;o+=1)s.push(null);for(let o=1;o<=n.getDate();o+=1)s.push(new Date(K.getFullYear(),K.getMonth(),o));return`
    <div class="calendar">
      ${["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(o=>`<span class="weekday">${o}</span>`).join("")}
      ${s.map(o=>{if(!o)return"<span></span>";const c=N(o.getTime()),d=e.get(c)||[],l=tt(d);return`
          <button class="calendar-day ${d.length?"has-training":""} ${he===c?"selected":""}" data-action="history-day" data-day="${c}">
            <strong>${o.getDate()}</strong>
            ${d.length?`<small>${l.exerciseCount} упр.</small>`:""}
          </button>
        `}).join("")}
    </div>
  `}function gn(e,t){const n=he===e,a=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",weekday:"long"}).format(new Date(t[0].createdAt)),s=tt(t);return Ze(t),`
    <section class="panel history-day">
      <button class="day-toggle" data-action="history-day" data-day="${e}">
        <span><strong>${a}</strong><small>${s.exerciseCount} упр. · ${s.workCount} рабочих · ${m(s.tonnage)} кг×повт${s.cardioCount?` · ${H(s.distanceKm)}`:""}</small></span>
        <span>${n?"Свернуть":"Открыть"}</span>
      </button>
      ${n?Lt(t).map(({exerciseId:i,exercise:o,sets:c,metrics:d})=>{const l=`${e}:${i}`,u=Ae.has(l),g=d.type==="cardio";return`
          <article class="history-exercise">
            <button class="exercise-toggle" data-action="history-exercise" data-key="${l}">
              <span>${(o==null?void 0:o.name)||"Удалённое упражнение"}</span>
              <small>${g?`${d.count} зап. · ${b(d.durationSec)} · ${H(d.distanceKm)}`:`${d.workCount} раб. · ${m(d.tonnage)} объём · ${d.top?`${m(d.top.weight)} × ${d.top.reps}`:"нет рабочих"}`}</small>
            </button>
            ${u?`<div class="sets-list">${c.map($t).join("")}</div>`:""}
          </article>
        `}).join(""):""}
    </section>
  `}function hn(){const e=et().size,t=Math.round(new Blob([JSON.stringify($)]).size/1024);return`
    <section class="progress-top">
      <h1>Данные</h1>
      <button data-action="check-update">Проверить обновления</button>
    </section>
    <section class="insight-grid">
      <div class="insight"><span>Версия данных</span><strong>${$.schemaVersion||Pe}</strong><p>Миграции применяются автоматически</p></div>
      <div class="insight"><span>Дней</span><strong>${e}</strong><p>Дни с записанными подходами</p></div>
      <div class="insight"><span>Подходов</span><strong>${$.sets.length}</strong><p>Все записи хранятся локально</p></div>
      <div class="insight"><span>Размер</span><strong>${t} КБ</strong><p>Примерно в памяти браузера</p></div>
    </section>
    <section class="panel">
      <h2>Резервная копия</h2>
      <p class="muted">Экспорт сохраняет упражнения, подходы, картинки и настройки в один JSON-файл.</p>
      <div class="actions settings-actions">
        <button class="primary" data-action="export">Скачать JSON</button>
        <label class="file-action">
          <span>Импорт JSON</span>
          <input type="file" accept="application/json,.json" data-action="import-file" />
        </label>
      </div>
    </section>
    <section class="panel">
      <h2>PWA</h2>
      <div class="settings-list">
        <div><strong>Установка</strong><span>Кнопка установки появляется, когда браузер разрешает установку.</span></div>
        <div><strong>Обновления</strong><span>Приложение проверяет новый service worker при запуске и раз в минуту.</span></div>
        <div><strong>Оффлайн</strong><span>Последняя загруженная версия открывается без сети, данные остаются на устройстве.</span></div>
      </div>
    </section>
  `}function fn(e){var t,n,a,s,i,o,c,d,l,u,g,h,S,D,A;e.addEventListener("click",r=>{R.name==="exercise"&&Y&&!r.target.closest("[data-form='set'][data-kind='strength']")&&(Y=!1,y())}),e.querySelectorAll("[data-action='home']").forEach(r=>r.addEventListener("click",()=>se({name:"home"}))),e.querySelectorAll("[data-action='progress']").forEach(r=>r.addEventListener("click",()=>se({name:"progress"}))),e.querySelectorAll("[data-action='history']").forEach(r=>r.addEventListener("click",()=>se({name:"history"}))),e.querySelectorAll("[data-action='settings']").forEach(r=>r.addEventListener("click",()=>se({name:"settings"}))),(t=e.querySelector("[data-action='toggle-form']"))==null||t.addEventListener("click",()=>{xe=!xe,y()}),e.querySelectorAll("[data-action='history-day']").forEach(r=>r.addEventListener("click",()=>{const p=r.dataset.day;he=p,R.name!=="history"&&(R={name:"history"});const[f,v]=p.split("-").map(Number);K=new Date(f,v-1,1),y()})),e.querySelectorAll("[data-action='history-exercise']").forEach(r=>r.addEventListener("click",()=>{const p=r.dataset.key;Ae.has(p)?Ae.delete(p):Ae.add(p),y()})),e.querySelectorAll("[data-action='history-month']").forEach(r=>r.addEventListener("click",()=>{K=Dt(K,Number(r.dataset.delta)),y()})),e.querySelectorAll("[data-action='toggle-exercise-group']").forEach(r=>r.addEventListener("click",()=>{const p=r.dataset.group;me.has(p)?me.delete(p):me.add(p),y()})),e.querySelectorAll("[data-open-exercise]").forEach(r=>r.addEventListener("click",()=>{const p=$.exercises.find(f=>f.id===r.dataset.openExercise);k=p&&!le(p)?Fe(p.id):{weight:"",reps:"8",reserve:2,warmup:!1},L=!1,T=null,Y=!1,G="",se({name:"exercise",id:r.dataset.openExercise})})),(n=e.querySelector("#search"))==null||n.addEventListener("input",r=>{Oe=r.target.value,y(),window.setTimeout(()=>{const p=document.querySelector("#search");p==null||p.focus(),p==null||p.setSelectionRange(p.value.length,p.value.length)},0)}),(a=e.querySelector("[data-form='exercise']"))==null||a.addEventListener("submit",vn),(s=e.querySelector("[data-form='set']"))==null||s.addEventListener("submit",bn),(i=e.querySelector("[name='reserve']"))==null||i.addEventListener("input",r=>{q||(k.reserve=Number(r.target.value)),L=!0,T=null,e.querySelector("#reserveText").textContent=z(Number(r.target.value)),r.target.style.setProperty("--thumb-color",lt(Number(r.target.value))),J(e)}),(o=e.querySelector("[name='warmup']"))==null||o.addEventListener("change",r=>{const p=r.target.checked;if(q||(k.warmup=p),L&&!q){T=p,y();return}ot(e),L=!1,T=null,J(e)}),e.querySelectorAll("[data-set-field]").forEach(r=>{let p=null;r.addEventListener("focus",()=>{ee=r.dataset.setField,Y=!0,e.querySelectorAll("[data-set-field]").forEach(f=>f.classList.toggle("active",f===r)),y()}),r.addEventListener("click",()=>{ee=r.dataset.setField,Y=!0,e.querySelectorAll("[data-set-field]").forEach(f=>f.classList.toggle("active",f===r))}),r.addEventListener("input",()=>{q||(k[r.dataset.setField]=r.value),L=!0,T=null,J(e)}),r.addEventListener("pointerdown",()=>{const f=r.dataset.setField;p=window.setTimeout(()=>{const v=document.querySelector(`[data-set-field='${f}']`);v&&(v.value=""),q||(k[f]=""),L=!0,T=null,ke(18),y()},520)}),["pointerup","pointerleave","pointercancel"].forEach(f=>{r.addEventListener(f,()=>window.clearTimeout(p))})}),e.querySelectorAll("[data-step-field]").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector(`[name='${r.dataset.stepField}']`),f=Number(String(p.value||0).replace(",",".")),v=Math.max((r.dataset.stepField==="weight",1),f+Number(r.dataset.delta));p.value=r.dataset.stepField==="weight"?m(v).replace(",","."):String(Math.round(v)),q||(k[r.dataset.stepField]=p.value),L=!0,T=null,J(e)})),e.querySelectorAll("[data-key]").forEach(r=>r.addEventListener("click",()=>{$n(r.dataset.key),J(e)})),(c=e.querySelector("[data-action='toggle-keyboard']"))==null||c.addEventListener("click",()=>{V=!V,Y=!0,y(),window.setTimeout(()=>{var r;return(r=document.querySelector(`[data-set-field='${ee}']`))==null?void 0:r.focus()},30)}),e.querySelectorAll("[data-action='set-reserve']").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector("[data-form='set']"),f=Number(r.dataset.reserve);p&&(p.elements.reserve.value=f,p.elements.warmup.checked=f>=6,q||(k.reserve=f,k.warmup=f>=6),e.querySelector("#reserveText").textContent=z(f),ot(e),J(e))})),e.querySelectorAll("[data-action='set-reserve-only']").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector("[data-form='set'][data-kind='strength']"),f=Number(r.dataset.reserve);p&&(p.elements.reserve.value=f,q||(k.reserve=f),L=!0,T=null,e.querySelector("#reserveText").textContent=z(f),J(e))})),e.querySelectorAll("[data-action='cardio-duration']").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector("[data-form='set'][data-kind='cardio']");p&&(p.elements.minutes.value=r.dataset.minutes||"0",p.elements.seconds.value=r.dataset.seconds||"0",q||(oe.minutes=p.elements.minutes.value,oe.seconds=p.elements.seconds.value))})),e.querySelectorAll("[data-action='cardio-distance']").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector("[data-form='set'][data-kind='cardio']");p&&(p.elements.distanceM.value=r.dataset.distance,q||(oe.distanceM=r.dataset.distance))})),e.querySelectorAll("[data-action='cardio-setting']").forEach(r=>r.addEventListener("click",()=>{const p=e.querySelector("[data-form='set'][data-kind='cardio']");p&&(p.elements.setting.value=r.dataset.setting,q||(oe.setting=r.dataset.setting))})),e.querySelectorAll("[name='minutes'], [name='seconds'], [name='distanceM'], [name='setting']").forEach(r=>r.addEventListener("input",()=>{!r.closest("[data-form='set'][data-kind='cardio']")||q||(oe[r.name]=r.value)})),e.querySelectorAll("[data-action='repeat-last'], [data-action='repeat-best'], [data-action='apply-set-chip']").forEach(r=>r.addEventListener("click",()=>{var f;const p=e.querySelector("[data-form='set']");p.elements.weight.value=r.dataset.weight,p.elements.reps.value=r.dataset.reps,p.elements.reserve.value=r.dataset.reserve,p.elements.warmup&&r.dataset.warmup!=null&&(p.elements.warmup.checked=r.dataset.warmup==="true"),k={...k,weight:r.dataset.weight,reps:r.dataset.reps,reserve:Number(r.dataset.reserve),warmup:((f=p.elements.warmup)==null?void 0:f.checked)||!1},L=!1,T=null,e.querySelector("#reserveText").textContent=z(k.reserve),J(e)})),e.querySelectorAll("[data-action='use-set']").forEach(r=>r.addEventListener("click",()=>{const p=$.sets.find(v=>v.id===r.dataset.id),f=e.querySelector("[data-form='set'][data-kind='strength']");!p||!f||(f.elements.weight.value=p.weight,f.elements.reps.value=p.reps,f.elements.reserve.value=E(p),f.elements.warmup.checked=!!p.warmup,k={weight:String(p.weight),reps:String(p.reps),reserve:E(p),warmup:!!p.warmup},L=!1,T=null,e.querySelector("#reserveText").textContent=z(k.reserve),J(e))})),(d=e.querySelector("[data-action='apply-suggestion']"))==null||d.addEventListener("click",r=>{const p=r.currentTarget.dataset.warmup==="true";k=Fe(r.currentTarget.closest("[data-form='set']").dataset.id,{warmup:p}),L=!1,T=null,y()}),e.querySelectorAll("[data-action='delete-set']").forEach(r=>r.addEventListener("click",p=>{p.stopPropagation(),yn(r.dataset.id)})),e.querySelectorAll("[data-action='edit-set']").forEach(r=>r.addEventListener("click",p=>{p.stopPropagation(),Sn(r.dataset.id)})),(l=e.querySelector("[data-action='cancel-edit']"))==null||l.addEventListener("click",()=>{Ke(),y()}),e.querySelectorAll("[data-action='progress-exercise']").forEach(r=>r.addEventListener("click",()=>se({name:"progress",id:r.dataset.id}))),e.querySelectorAll("[data-action='select-progress-card']").forEach(r=>r.addEventListener("click",()=>se({name:"progress",id:r.dataset.id}))),e.querySelectorAll("[data-action='progress-tab']").forEach(r=>r.addEventListener("click",()=>{ye=r.dataset.tab||"strength",y()})),e.querySelectorAll("[data-action='cardio-progress-tab']").forEach(r=>r.addEventListener("click",()=>{ue=r.dataset.tab||"performance",y()})),e.querySelectorAll("[data-action='toggle-progress-warmup']").forEach(r=>r.addEventListener("click",()=>{const p=r.dataset.key;Te.has(p)?Te.delete(p):Te.add(p),y()})),(u=e.querySelector("[data-action='edit-exercise']"))==null||u.addEventListener("click",r=>wn(r.currentTarget.dataset.id)),(g=e.querySelector("[data-action='close-exercise-editor']"))==null||g.addEventListener("click",()=>{ve=null,y()}),(h=e.querySelector("[data-action='delete-exercise']"))==null||h.addEventListener("click",r=>Mn(r.currentTarget.dataset.id)),(S=e.querySelector("[data-action='export']"))==null||S.addEventListener("click",kn),(D=e.querySelector("[data-action='import-file']"))==null||D.addEventListener("change",Rn),(A=e.querySelector("[data-action='check-update']"))==null||A.addEventListener("click",qn)}function $n(e){var s;const t=ee==="reps"?"reps":"weight",n=document.querySelector("[data-form='set']");let a=String(((s=n==null?void 0:n.elements[t])==null?void 0:s.value)||k[t]||"");if(e==="clear")a="";else if(e==="back")a=a.slice(0,-1);else if(e==="dot")t==="weight"&&!a.includes(".")&&(a=a?`${a}.`:"0.");else if(/^\d$/.test(e))if(t==="reps")a=`${a}${e}`.replace(/^0+(?=\d)/,"").slice(0,3);else{const i=`${a}${e}`,[o,c=""]=i.split(".");a=`${o.slice(0,3)}${i.includes(".")?`.${c.slice(0,1)}`:""}`}n?(n.elements[t].value=a,q||(k[t]=a)):k[t]=a,L=!0,T=null}async function vn(e){e.preventDefault();const t=e.currentTarget,n=new FormData(t),a=n.get("image"),s=a&&a.size?await En(a):"",i=t.dataset.id?$.exercises.find(o=>o.id===t.dataset.id):null;i?(i.name=String(n.get("name")).trim()||i.name,i.icon=String(n.get("icon")).trim()||i.icon||"🏋️",i.category=n.get("category"),i.equipmentType=n.get("equipmentType"),s&&(i.image=s),ve=null):$.exercises.push({id:Z(),name:String(n.get("name")).trim(),icon:String(n.get("icon")).trim()||"🏋️",image:s,category:n.get("category"),equipmentType:n.get("equipmentType"),createdAt:Date.now()}),xe=!1,fe(),ke(12),pe(i?"Упражнение обновлено":"Упражнение добавлено"),y()}function bn(e){var l;e.preventDefault();const t=e.currentTarget;(l=t.querySelector(".save-set"))==null||l.classList.add("is-saving");const n=new FormData(t),a=$.sets.find(u=>u.id===q);if(t.dataset.kind==="cardio"){const u=Number(n.get("minutes")),g=Number(n.get("seconds")||0),h=Number(n.get("distanceM")),S=u*60+g,D=String(n.get("setting")||"").trim();if(!Number.isInteger(u)||!Number.isInteger(g)||u<0||g<0||g>59||S<=0||!Number.isFinite(h)||h<=0){G=S<=0?"Время должно быть больше 0":"Дистанция должна быть больше 0",y();return}if(a)a.type="cardio",a.durationSec=S,a.distanceM=Math.round(h),a.setting=D,delete a.durationMin,delete a.distanceKm,delete a.weight,delete a.reps,delete a.reserve,delete a.effort,delete a.warmup,a.updatedAt=Date.now(),X=a.id,Ke(),pe("Кардио изменено","success");else{const A=Z();$.sets.push({id:A,type:"cardio",exerciseId:t.dataset.id,durationSec:S,distanceM:Math.round(h),setting:D,createdAt:Date.now()}),X=A,oe={minutes:String(u),seconds:String(g),distanceM:String(Math.round(h)),setting:D},pe("Кардио записано","success")}ke([12,30,12]),G="",fe(),y();return}const s=Number(String(n.get("weight")).replace(",",".")),i=Number(n.get("reps")),o=Number(n.get("reserve")),c=n.get("warmup")==="on",d=vt({weight:n.get("weight"),reps:n.get("reps"),reserve:o});if(d){G=d,y();return}if(a)a.type="strength",a.weight=s,a.reps=i,a.reserve=o,delete a.durationSec,delete a.distanceM,delete a.durationMin,delete a.distanceKm,delete a.setting,delete a.effort,a.warmup=c,a.updatedAt=Date.now(),X=a.id,Ke(),L=!1,T=null,Y=!1,pe("Подход изменён","success");else{const u=Z();$.sets.push({id:u,type:"strength",exerciseId:t.dataset.id,weight:s,reps:i,reserve:o,warmup:c,createdAt:Date.now()}),X=u,k=Fe(t.dataset.id,{weight:String(s),reps:String(i),reserve:o,warmup:c}),L=!1,T=null,Y=!1,pe(c?"Разминка записана":"Подход записан","success")}ke([12,30,12]),G="",fe(),y()}function yn(e){confirm("Удалить запись?")&&($.sets=$.sets.filter(t=>t.id!==e),q===e&&Ke(),fe(),ke(20),pe("Запись удалена"),y())}function Sn(e){const t=$.sets.find(n=>n.id===e);t&&(Le=R.name==="history"?{name:"history",activeHistoryDay:he,historyCursor:K.toISOString()}:null,q=e,ee="weight",X=e,R={name:"exercise",id:t.exerciseId},window.scrollTo({top:0,behavior:"instant"}),y())}function wn(e){ve=e,y()}function Mn(e){$.sets.some(n=>n.exerciseId===e)&&!confirm("У упражнения есть история. Удалить упражнение и все его подходы?")||($.exercises=$.exercises.filter(n=>n.id!==e),$.sets=$.sets.filter(n=>n.exerciseId!==e),ve=null,R.name==="exercise"&&R.id===e&&(R={name:"home"}),fe(),y())}function En(e){return new Promise((t,n)=>{const a=new FileReader;a.onload=()=>t(a.result),a.onerror=n,a.readAsDataURL(e)})}function kn(){const e={...$,schemaVersion:Pe,exportedAt:new Date().toISOString()},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(t),a=document.createElement("a");a.href=n,a.download=`training-log-${N(Date.now())}.json`,a.click(),URL.revokeObjectURL(n)}async function Rn(e){var n;const t=(n=e.target.files)==null?void 0:n[0];if(t)try{const a=JSON.parse(await t.text()),s=Ue(a);if(!confirm("Заменить текущие локальные данные импортированным файлом?"))return;$=s,fe(),R={name:"settings"},y()}catch{alert("Не удалось прочитать JSON-файл.")}finally{e.target.value=""}}async function qn(){if(!be){alert("Service worker ещё не зарегистрирован.");return}await be.update(),be.waiting?Qe(be.waiting):alert("Новая версия пока не найдена.")}function bt(){F.forEach(e=>{const{id:t,values:n,labels:a,type:s,invert:i,pointValues:o,neutral:c,yFormat:d}=e,l=document.getElementById(t);if(!l||!n.length)return;const u=l.getBoundingClientRect(),g=window.devicePixelRatio||1,h=Math.max(320,u.width||l.clientWidth||0),S=Number(l.getAttribute("height"));l.width=h*g,l.height=S*g;const D=l.getContext("2d");D.scale(g,g),Dn(D,h,S,n,a,s,i,o,c,d),Tn(l,e)})}function yt(e,t,n,a){const s={l:54,r:38,t:26,b:36},i=Math.max(80,e-s.l-s.r),o=Math.max(80,t-s.t-s.b),c=Math.max(...n,1),d=a==="bar"?0:Math.min(...n),l=c-d||1;return{pad:s,chartW:i,chartH:o,max:c,min:d,range:l}}function ie(e,t,n){return Math.max(t,Math.min(n,e))}function Dn(e,t,n,a,s,i,o=!1,c=null,d=!1,l=m){const{pad:u,chartW:g,chartH:h,max:S,min:D,range:A}=yt(t,n,a,i);e.clearRect(0,0,t,n),e.font="12px system-ui",e.strokeStyle="rgba(105, 115, 108, 0.18)",e.fillStyle="#69736c";for(let f=0;f<5;f+=1){const v=u.t+h*f/4;e.beginPath(),e.moveTo(u.l,v),e.lineTo(t-u.r,v),e.stroke(),e.fillText(l(S-A*f/4),4,v+4)}const r=a.length<2||(o?a.at(-1)<=a.at(-2):a.at(-1)>=a.at(-2)),p=d?"#315d4f":r?"#1d775d":"#c8543f";if(i==="bar"){const f=g/a.length;a.forEach((v,j)=>{const C=(v-D)/A*h,W=u.l+f*j+f*.18,O=u.t+h-C,M=7;e.fillStyle=d?"#315d4f":j===a.length-1?"#d99a32":"#315d4f",An(e,W,O,f*.64,C,M),e.fill()})}else{const f=e.createLinearGradient(0,u.t,0,u.t+h);f.addColorStop(0,`${p}2b`),f.addColorStop(1,`${p}00`);const v=new Path2D;a.forEach((j,C)=>{const W=ie(u.l+g*C/Math.max(1,a.length-1),u.l+7,u.l+g-7),O=ie(u.t+h-(j-D)/A*h,u.t+8,u.t+h-8);C===0&&v.moveTo(W,u.t+h),v.lineTo(W,O),C===a.length-1&&v.lineTo(W,u.t+h)}),v.closePath(),e.fillStyle=f,e.fill(v),e.strokeStyle=p,e.lineWidth=3.5,e.lineJoin="round",e.lineCap="round",e.beginPath(),a.forEach((j,C)=>{const W=ie(u.l+g*C/Math.max(1,a.length-1),u.l+7,u.l+g-7),O=ie(u.t+h-(j-D)/A*h,u.t+8,u.t+h-8);C===0?e.moveTo(W,O):e.lineTo(W,O)}),e.stroke(),a.forEach((j,C)=>{const W=ie(u.l+g*C/Math.max(1,a.length-1),u.l+7,u.l+g-7),O=ie(u.t+h-(j-D)/A*h,u.t+8,u.t+h-8);e.fillStyle=c?lt(c[C]):C===a.length-1?"#f4f7f2":p,e.strokeStyle="#fff",e.lineWidth=2.5,e.beginPath(),e.arc(W,O,C===a.length-1?6.5:5.5,0,Math.PI*2),e.fill(),e.stroke()})}e.fillStyle="#69736c",s.forEach((f,v)=>{if(v!==0&&v!==s.length-1&&v%Math.ceil(s.length/4)!==0)return;const j=u.l+g*v/Math.max(1,s.length-1);e.textAlign=v===0?"left":v===s.length-1?"right":"center",e.fillText(f,ie(j,u.l,u.l+g),n-10)}),e.textAlign="left"}function An(e,t,n,a,s,i){const o=Math.min(i,a/2,Math.abs(s)/2);e.beginPath(),e.moveTo(t+o,n),e.arcTo(t+a,n,t+a,n+s,o),e.arcTo(t+a,n+s,t,n+s,o),e.arcTo(t,n+s,t,n,o),e.arcTo(t,n,t+a,n,o),e.closePath()}function Tn(e,t){e.onclick=n=>{var o;const a=e.getBoundingClientRect(),s=n.clientX-a.left,i=Cn(s,a.width,t.values,t.type);i!=null&&Nn(e,((o=t.details)==null?void 0:o[i])||`${t.labels[i]} · ${m(t.values[i])}`)}}function Cn(e,t,n,a){if(!n.length)return null;const{pad:s,chartW:i}=yt(t,220,n,a);if(a==="bar"){const c=i/n.length;return Math.max(0,Math.min(n.length-1,Math.floor((e-s.l)/c)))}const o=(e-s.l)/Math.max(1,i);return Math.max(0,Math.min(n.length-1,Math.round(o*(n.length-1))))}function Nn(e,t){B==null||B.remove();const n=e.getBoundingClientRect();B=document.createElement("div"),B.className="chart-tooltip",B.textContent=t,B.style.left=`${Math.min(window.innerWidth-18,Math.max(8,n.left+12))}px`,B.style.top=`${Math.max(8,n.top+window.scrollY+12)}px`,document.body.append(B),window.setTimeout(()=>B==null?void 0:B.remove(),3200)}let Ce=null;window.addEventListener("beforeinstallprompt",e=>{var t;e.preventDefault(),Ce=e,(t=document.querySelector(".install-button"))==null||t.removeAttribute("hidden")});document.addEventListener("click",async e=>{!e.target.matches("[data-action='install']")||!Ce||(Ce.prompt(),Ce=null)});window.addEventListener("resize",bt);"serviceWorker"in navigator&&window.addEventListener("load",xn);y();async function xn(){const e=await navigator.serviceWorker.register("./sw.js");be=e,e.waiting&&Qe(e.waiting),e.addEventListener("updatefound",()=>{const n=e.installing;n&&n.addEventListener("statechange",()=>{n.state==="installed"&&navigator.serviceWorker.controller&&Qe(n)})});let t=!1;navigator.serviceWorker.addEventListener("controllerchange",()=>{t||(t=!0,window.location.reload())}),setInterval(()=>e.update(),6e4)}function Qe(e){De=e;let t=document.querySelector(".update-prompt");t||(t=document.createElement("div"),t.className="update-prompt",t.innerHTML=`
      <span>Доступна новая версия</span>
      <button type="button">Обновить</button>
    `,document.body.append(t),t.querySelector("button").addEventListener("click",()=>{De==null||De.postMessage({type:"SKIP_WAITING"})})),t.hidden=!1}
