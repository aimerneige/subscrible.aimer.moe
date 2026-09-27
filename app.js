import { cycles, currencies, sections, sectionFor, paymentPresets, validatePaymentMethods, monthly, nextPayment, dateKey, parseDate, validate, calculateSpending } from './model.js';
const $ = s => document.querySelector(s);
const paths = {
server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.1M7 17.5h.1M12 6.5h5M12 17.5h5"/>',
game:'<path d="M7 7h10c3 0 5 9 3 11-2 2-5-3-5-3H9s-3 5-5 3C2 16 4 7 7 7ZM8 9v5m-2.5-2.5h5M16 10h.1M18 13h.1"/>',
phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/>',
home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
layers:'<rect x="6" y="3" width="15" height="15" rx="3"/><path d="M15 21H5a2 2 0 0 1-2-2V9M10 8h7m-7 4h5"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/>',
shield:'<path d="m12 3-9 4v5c0 5 9 10 9 10s9-5 9-10V7zM8 12l3 3 5-6"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M17 6V3L5 6m16 5h-6v5h6"/>',
search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',
list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',
lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
leaf:'<path d="M20 3C6 2 1 9 6 16c5 6 15 1 14-13ZM4 21 16 8"/>',
sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
upload:'<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
card:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h4"/>',
globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
mail:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="m3 7 9 7 9-7"/>',
spotify:'<circle cx="12" cy="12" r="10"/><path d="M6 9q6-3 12 1M7 13q5-2 10 1M8 17q4-2 8 .5"/>',
chatgpt:'<path d="m12 2 8.7 5v10L12 22l-8.7-5V7zm0 5 4.3 2.5v5L12 17l-4.3-2.5v-5zM12 2v5m8.7 0-4.4 2.5m4.4 7.5-4.4-2.5M12 22v-5m-8.7 0 4.4-2.5M3.3 7l4.4 2.5"/>'
};
paths.grid=paths.dashboard;
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.layers}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML=icon(el.dataset.icon); });
const esc = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='subscrible.subscriptions.v1';
const METHODS_KEY='subscrible.paymentMethods.v1';
let paymentHistory=[],paymentHistoryWarning='',activeSection='all';
function readPaymentHistory(){
 try {paymentHistory=validatePaymentMethods(JSON.parse(localStorage.getItem(METHODS_KEY)||'[]'));paymentHistoryWarning='';}
 catch {paymentHistoryWarning='无法读取曾用付款方式，仍可手动填写；原记录未被覆盖。';}
}
readPaymentHistory();
function rememberPaymentMethods(methods){
 readPaymentHistory();
 if(paymentHistoryWarning)return;
 const merged=[...new Set([...methods,...paymentHistory].map(method=>method.trim()).filter(Boolean))].filter(method=>!paymentPresets.includes(method)).slice(0,100);
 try {localStorage.setItem(METHODS_KEY,JSON.stringify(merged));paymentHistory=merged;}
 catch {paymentHistoryWarning='订阅已保存，但曾用付款方式未能保存，请检查浏览器存储权限或空间。';}
}
function renderPaymentOptions(){
 const previous=[...new Set([...paymentHistory,...items.map(s=>s.method.trim())])].filter(method=>method&&!paymentPresets.includes(method));
 $('#payment-preset').innerHTML='<option value="">选择常用 / 曾用方式，或在下方自定义</option>'+`<optgroup label="常用付款方式">${paymentPresets.map(method=>`<option value="${esc(method)}">${esc(method)}</option>`).join('')}</optgroup>`+(previous.length?`<optgroup label="曾用自定义方式">${previous.map(method=>`<option value="${esc(method)}">${esc(method)}</option>`).join('')}</optgroup>`:'');
 syncPaymentPreset();
 $('#payment-history-status').textContent=paymentHistoryWarning;
}
function syncPaymentPreset(){
 const method=$('#subscription-form').elements.namedItem('method').value;
 $('#payment-preset').value=[...$('#payment-preset').options].some(option=>option.value===method)?method:'';
}
let today=parseDate(dateKey(new Date())), calendarMonth=new Date(today.getFullYear(),today.getMonth(),1);
const samples = () => [
['Netflix',2290,'JPY','monthly','影音娱乐','Visa',2],['Spotify',1080,'JPY','monthly','影音娱乐','Visa',5],['ChatGPT',19.99,'USD','monthly','效率工具','Mastercard',9],['Google One',199.99,'USD','yearly','云端存储','Visa',16],['Domain aimer.moe',13.99,'USD','yearly','域名服务','PayPal',24],['QQ 邮箱会员',22,'CNY','monthly','效率工具','支付宝',12]
].map(([name,amount,currency,cycle,category,method,offset],i) => { const date=new Date(today); date.setDate(date.getDate()+offset); return {id:`demo-${i}`,name,amount,currency,cycle,category,method,date:dateKey(date),status:'active',notes:''}; });
let items=[],demo=true,filter='all',view='overview',list=false,blocked=false,startupError='';
try { const stored=localStorage.getItem(KEY); if(stored!==null){items=validate(JSON.parse(stored));demo=false;} }
catch {demo=false;blocked=true;startupError='无法读取本地数据。为保护原数据，已停止写入；请检查浏览器存储权限或导入有效备份。';}
const displayed=()=>demo?samples():items;
const money=(amount,currency)=>new Intl.NumberFormat('zh-CN',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:['JPY','KRW'].includes(currency)?0:2,maximumFractionDigits:2}).format(amount);
const daysUntil=d=>Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);
const nextEntries=()=>displayed().filter(s=>s.status==='active'&&s.date).map(s=>({s,date:nextPayment(s,today)})).sort((a,b)=>a.date-b.date);
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').hidden=true;},6000);}
function save(next,recovery=false){
 if(blocked&&!recovery){toast(startupError);return false;}
 try {const clean=validate(next);localStorage.setItem(KEY,JSON.stringify(clean));rememberPaymentMethods([...clean,...items].map(s=>s.method));items=clean;demo=false;blocked=false;render();return true;}
 catch(error){toast(`未能保存：${error.message}。请检查浏览器存储空间或权限。`);return false;}
}
function logo(s){
 const name=s.name.toLowerCase();let type='',content=esc(s.name.slice(0,1).toUpperCase());
 if(s.category==='服务器托管')return `<div class="service-logo" aria-hidden="true">${icon('server')}</div>`;
 if(s.category==='游戏服务')return `<div class="service-logo" aria-hidden="true">${icon('game')}</div>`;
 if(s.category==='住房租金'){type='home';content=icon('home');}else if(s.category==='通讯网络'){type='phone';content=icon('phone');}else if(s.category==='保险保障'){type='insurance';content=icon('shield');}else if(name.includes('netflix')){type='netflix';content='N';}else if(name.includes('spotify')){type='spotify';content=icon('spotify');}else if(name.includes('chatgpt')){type='chatgpt';content=icon('chatgpt');}else if(name.includes('google')){type='google';content='G';}else if(s.category==='域名服务'){type='domain';content=icon('globe');}else if(name.includes('邮箱')){type='mail';content=icon('mail');}
 return `<div class="service-logo logo-${type}" aria-hidden="true">${content}</div>`;
}
function render(){
 const all=displayed(),active=all.filter(s=>s.status==='active'),upcoming=nextEntries();
 $('#demo-banner').hidden=!demo;$('#nav-count').textContent=all.length;$('#active-count').textContent=active.length;$('#category-count').textContent=`覆盖 ${new Set(active.map(s=>s.category)).size} 个生活场景`;
 $('#upcoming-count').textContent=upcoming.filter(({date})=>daysUntil(date)<7).length;
 const totals=new Map();active.forEach(s=>totals.set(s.currency,(totals.get(s.currency)||0)+monthly(s)));
 $('#monthly-totals').innerHTML=`<div class="totals">${totals.size?[...totals].map(([currency,amount])=>`<div class="total"><strong>${money(amount,currency)}</strong><small>${currency}</small></div>`).join(''):'<div class="total"><strong>—</strong><small>添加订阅后开始统计</small></div>'}</div>`;
 $('#today-label').textContent=`${today.getMonth()+1} 月 ${today.getDate()} 日`;
 $('#upcoming-list').innerHTML=upcoming.slice(0,4).map(({s,date})=>`<div class="upcoming-item"><div class="date-tile"><small>${date.getMonth()+1} 月</small><strong>${date.getDate()}</strong></div><div><div class="upcoming-name">${esc(s.name)}</div><div class="upcoming-detail">${daysUntil(date)===0?'今天':`${daysUntil(date)} 天后`} · ${cycles[s.cycle]}</div></div><div class="upcoming-price">${money(s.amount,s.currency)}</div></div>`).join('')||'<p class="muted">暂无待扣款订阅。添加付款日期后，即可在这里查看。</p>';
 renderCards();if(view==='calendar')renderCalendar();
}
function renderSpendingSummary(spendingList){
 const el=$('#section-spending');
 if(!el)return;
 if(!spendingList.length){
  el.innerHTML='<span class="spending-label">总支出</span><span class="spending-empty">—</span>';
  return;
 }
 const pills=spendingList.map(item=>{
  if(item.type==='yearly'){
   return `<span class="spending-pill"><strong>${money(item.yearly,item.currency)}</strong><small>/年</small><span class="spending-sub">月均 ${money(item.monthly,item.currency)}</span></span>`;
  }
  if(item.type==='monthly'){
   return `<span class="spending-pill"><strong>${money(item.monthly,item.currency)}</strong><small>/月</small><span class="spending-sub">年折合 ${money(item.yearly,item.currency)}</span></span>`;
  }
  return `<span class="spending-pill"><strong>${money(item.monthly,item.currency)}</strong><small>月均</small><span class="spending-sub">年折合 ${money(item.yearly,item.currency)}</span></span>`;
 }).join('');
 el.innerHTML=`<span class="spending-label">总支出</span><div class="spending-pills">${pills}</div>`;
}
function renderCards(){
 const query=$('#search').value.trim().toLocaleLowerCase();
 const all=displayed();
 const filtered=all.filter(s=>(activeSection==='all'||sectionFor(s.category).id===activeSection)&&(filter==='all'||(filter==='paused'?s.status==='paused':s.cycle===filter&&s.status==='active'))&&`${s.name} ${s.method} ${s.category}`.toLocaleLowerCase().includes(query));
 $('#list-count').textContent=filtered.length;
 const targetItems=filtered.filter(s=>filter==='paused'?s.status==='paused':s.status==='active');
 renderSpendingSummary(calculateSpending(targetItems));
 $('#section-navigation').innerHTML=`<button class="section-tab ${activeSection==='all'?'selected':''}" data-section="all" aria-pressed="${activeSection==='all'}">全部 <span>${all.length}</span></button>`+sections.map(section=>`<button class="section-tab ${activeSection===section.id?'selected':''}" data-section="${section.id}" aria-pressed="${activeSection===section.id}">${icon(section.icon)}${section.name}<span>${all.filter(s=>sectionFor(s.category).id===section.id).length}</span></button>`).join('');
 $('#subscription-grid').innerHTML=sections.filter(section=>activeSection==='all'||activeSection===section.id).map(section=>{
   const entries=filtered.filter(s=>sectionFor(s.category).id===section.id);
   if(!entries.length&&(query||filter!=='all'||(section.id==='other'&&activeSection==='all')))return '';
   return `<section class="subscription-section" aria-labelledby="section-${section.id}"><div class="group-heading"><div><h3 id="section-${section.id}">${icon(section.icon)}${section.name}<span>${entries.length}</span></h3><p>${section.hint}</p></div><button class="button text-button" data-add-section="${section.id}" aria-label="添加${section.name}">${icon('plus')}添加</button></div><div class="subscription-grid ${list?'list':''}">${entries.map(renderCard).join('')||`<button class="section-empty" data-add-section="${section.id}">${icon('plus')}添加第一项${section.name}</button>`}</div></section>`;
 }).join('')||'<div class="empty-state">没有找到匹配的订阅<br>试试其他关键词、分区或筛选条件。</div>';
}
function renderCard(s){
 const next=s.status==='active'?nextPayment(s,today):null,days=next?daysUntil(next):null;
 const due=s.status==='paused'?'已暂停':!next?'未设置付款日':days===0?'今天扣款':days<7?`${days} 天后扣款`:`${next.getMonth()+1} 月 ${next.getDate()} 日扣款`;
 return `<button class="subscription-card ${s.status==='paused'?'paused':''}" data-edit="${esc(s.id)}" aria-label="编辑 ${esc(s.name)}"><div class="card-top">${logo(s)}<div><div class="card-name">${esc(s.name)}</div><div class="card-category">${esc(s.category)}</div></div><span class="card-more" aria-hidden="true">···</span></div><div class="card-price">${money(s.amount,s.currency)}<small>${s.currency} / ${{monthly:'月',yearly:'年',quarterly:'季',weekly:'周'}[s.cycle]}</small></div><div class="card-bottom"><span class="payment-method">${icon('card')}<span>${esc(s.method||'未设置付款方式')}</span></span><span class="due-badge ${next&&days<7?'soon':''}">${due}</span></div></button>`;
}
const titles={overview:['每一份订阅，都心中有数。','数字订阅、房租、话费与保险，让每一笔固定支出清晰可见。','总览'],subscriptions:['我的订阅','集中管理数字服务、房租、话费与保险等周期性支出。','我的订阅'],calendar:['扣款日历','提前看见每一笔支出，安排好你的订阅生活。','扣款日历'],data:['数据与备份','你的订阅，你来掌握。给重要的数据留一份备份。','数据与备份']};
function setView(next){
 view=next;$('#page-title').textContent=titles[view][0];$('#page-subtitle').textContent=titles[view][1];$('#breadcrumb-title').textContent=titles[view][2];
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
 $('#overview-content').hidden=view!=='overview';$('#main-content').hidden=!['overview','subscriptions'].includes(view);$('.right-column').hidden=view!=='overview';$('#main-content').classList.toggle('only-subscriptions',view==='subscriptions');
 $('#calendar-content').hidden=view!=='calendar';$('#data-content').hidden=view!=='data';if(view==='calendar')renderCalendar();
}
function renderCalendar(){
 const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();$('#calendar-title').textContent=`${year} 年 ${month+1} 月`;
 const events=new Map();displayed().filter(s=>s.status==='active'&&s.date).forEach(s=>{let date=nextPayment(s,calendarMonth);while(date.getFullYear()===year&&date.getMonth()===month){const key=date.getDate();events.set(key,[...(events.get(key)||[]),s]);const after=new Date(date);after.setDate(after.getDate()+1);date=nextPayment(s,after);}});
 let html=['一','二','三','四','五','六','日'].map(d=>`<div class="weekday">${d}</div>`).join('');
 const offset=(calendarMonth.getDay()+6)%7,count=new Date(year,month+1,0).getDate();
 for(let i=0;i<Math.ceil((offset+count)/7)*7;i++){const day=i-offset+1,valid=day>0&&day<=count;html+=`<div class="calendar-day ${valid&&dateKey(new Date(year,month,day))===dateKey(today)?'today':''}">${valid?`<span>${day}</span>${(events.get(day)||[]).map(s=>`<button class="calendar-event" data-edit="${esc(s.id)}">${esc(s.name)}<small>${money(s.amount,s.currency)} ${s.currency}</small></button>`).join('')}`:''}</div>`;}
 $('#calendar-grid').innerHTML=html;
}
function updateEditorSection(category){
 const section=sections.find(section=>section.id===$('#editor-section').value);
 $('#category-options').innerHTML=section.categories.map(c=>`<option>${c}</option>`).join('');
 if(category&&section.categories.includes(category))$('#category-options').value=category;
 $('#section-help').textContent=section.hint;
 $('#subscription-form').elements.namedItem('name').placeholder=section.placeholder;
}
function edit(id,sectionId=activeSection==='all'?'app':activeSection){
 if(demo&&id){toast('当前为示例预览。可在「数据与备份」载入示例后编辑，或添加自己的订阅。');return;}
 const form=$('#subscription-form');form.reset();$('#form-error').textContent='';const item=items.find(s=>s.id===id);
 $('#editor-section').value=item?sectionFor(item.category).id:sectionId;
 updateEditorSection(item?.category);
 $('#editor-title').textContent=item?'编辑订阅':'添加订阅';$('#delete-button').hidden=!item;
 if(item)Object.entries(item).forEach(([key,value])=>{if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;});
 else{form.elements.namedItem('id').value='';form.elements.namedItem('currency').value='CNY';}
 readPaymentHistory();renderPaymentOptions();$('#editor').showModal();
}
let onConfirm;
function confirmAction(message,action){$('#confirm-message').textContent=message;onConfirm=action;$('#confirm-dialog').showModal();}
$('#confirm-ok').onclick=()=>{$('#confirm-dialog').close();onConfirm?.();onConfirm=null;};
$('#confirm-cancel').onclick=()=>{$('#confirm-dialog').close();onConfirm=null;};
$('#currency-options').innerHTML=currencies.map(c=>`<option>${c}</option>`).join('');
$('#cycle-options').innerHTML=Object.entries(cycles).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
$('#editor-section').innerHTML=sections.map(section=>`<option value="${section.id}">${section.name}</option>`).join('');
$('#editor-section').onchange=()=>updateEditorSection();
$('#payment-preset').onchange=()=>{$('#subscription-form').elements.namedItem('method').value=$('#payment-preset').value;};
$('#subscription-form').elements.namedItem('method').addEventListener('input',syncPaymentPreset);
$('#add-button').onclick=()=>edit();$('#close-editor').onclick=$('#cancel-editor').onclick=()=>$('#editor').close();
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-edit]');if(target)edit(target.dataset.edit);
 const add=event.target.closest('[data-add-section]');if(add)edit(undefined,add.dataset.addSection);
 const section=event.target.closest('[data-section]');if(section){activeSection=section.dataset.section;renderCards();$(`[data-section="${activeSection}"]`).focus();}
});
document.querySelectorAll('[data-view]').forEach(button=>{button.onclick=()=>setView(button.dataset.view);});
$('#calendar-button').onclick=()=>setView('calendar');$('#privacy-button').onclick=()=>setView('data');
document.querySelectorAll('[data-filter]').forEach(button=>{button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderCards();};});
$('#search').addEventListener('input',renderCards);
for(const mode of ['grid','list'])$(`#${mode}-view`).onclick=()=>{list=mode==='list';for(const other of ['grid','list']){$(`#${other}-view`).classList.toggle('selected',other===mode);$(`#${other}-view`).setAttribute('aria-pressed',String(other===mode));}renderCards();};
$('#subscription-form').onsubmit=event=>{
 event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));data.amount=Number(data.amount);data.name=data.name.trim();data.method=data.method.trim();data.id ||= crypto.randomUUID();
 try{validate([data]);}catch(error){$('#form-error').textContent=error.message;return;}
 const next=items.some(s=>s.id===data.id)?items.map(s=>s.id===data.id?data:s):[...items,data];
 if(save(next)){$('#editor').close();toast(paymentHistoryWarning||'订阅已保存在此浏览器');}
};
$('#delete-button').onclick=()=>{const id=$('#subscription-form').elements.namedItem('id').value;confirmAction('确定删除这项订阅吗？此操作无法撤销。',()=>{if(save(items.filter(s=>s.id!==id))){$('#editor').close();toast('订阅已删除');}});};
$('#start-empty').onclick=()=>{if(save([]))toast('准备好了，添加你的第一项订阅吧');};
$('#load-demo').onclick=()=>confirmAction('载入 6 项示例订阅将替换当前订阅。建议先导出备份，是否继续？',()=>{if(save(samples())){setView('overview');toast('示例订阅已载入，现在可以自由编辑');}});
$('#export-button').onclick=()=>{
 if(blocked){toast('现有存储无法读取，无法导出有效备份。请先检查浏览器存储。');return;}
 readPaymentHistory();
 const paymentMethods=[...new Set([...paymentHistory,...items.map(s=>s.method.trim())])].filter(Boolean).filter(method=>!paymentPresets.includes(method)).slice(0,100);
 const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),subscriptions:items,paymentMethods},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`subscrible-${dateKey(today)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(demo?'已导出个人数据（示例预览不在备份中）':'备份已导出，请妥善保管');
};
$('#import-button').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>5*1024*1024)throw new Error('备份文件不能超过 5 MB');const backup=JSON.parse(await file.text());if(backup.version!==1)throw new Error('不支持的备份版本');const restored=validate(backup.subscriptions);const methods=validatePaymentMethods(backup.paymentMethods??[]);confirmAction(`将使用备份中的 ${restored.length} 项订阅替换当前数据，是否继续？`,()=>{if(save(restored,true)){rememberPaymentMethods([...methods,...restored.map(s=>s.method)]);toast(paymentHistoryWarning||'备份已导入');}});}catch(error){toast(`导入失败：${error.message}`);}};
$('#previous-month').onclick=()=>{if(calendarMonth.getFullYear()>1900){calendarMonth.setMonth(calendarMonth.getMonth()-1);renderCalendar();}};
$('#next-month').onclick=()=>{if(calendarMonth.getFullYear()<9999){calendarMonth.setMonth(calendarMonth.getMonth()+1);renderCalendar();}};
$('#current-month').onclick=()=>{calendarMonth=new Date(today.getFullYear(),today.getMonth(),1);renderCalendar();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){today=parseDate(dateKey(new Date()));render();}});
window.addEventListener('storage',event=>{if(event.key===METHODS_KEY||event.key===null){readPaymentHistory();if($('#editor').open)renderPaymentOptions();}if(event.key!==KEY&&event.key!==null)return;try{const stored=localStorage.getItem(KEY);items=stored===null?[]:validate(JSON.parse(stored));demo=stored===null;blocked=false;$('#editor').close();render();toast('已同步此浏览器其他标签页的变更');}catch{blocked=true;startupError='其他标签页写入的数据无法读取，已停止写入以保护数据。';toast(startupError);}});
render();if(startupError)toast(startupError);
