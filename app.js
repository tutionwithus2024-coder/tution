let gasUrl=localStorage.getItem('AK_LH_GAS_URL')||'';
let authToken=localStorage.getItem('AK_LH_TOKEN')||'';
let DB={students:[],batches:[],fees:[],attendance:[],tests:[],testMarks:[],todayStr:''};
let curSec='dashboard',feeB='ALL',feeSub='unpaid',attB='ALL',attSub='mark',attDate='',attLoc={},testB='ALL';
const $=i=>document.getElementById(i),fmt=n=>'₹'+Number(n||0).toLocaleString('en-IN');
function today(){if(DB.todayStr)return DB.todayStr;const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function curYM(){return today().slice(0,7);}
function openM(i){window.scrollTo(0,0);$(i).classList.remove('hidden');}
function closeM(i){$(i).classList.add('hidden');}
function load(s){$('loader').classList.toggle('hidden',!s);$('loader').classList.toggle('flex',s);}
function toast(m,err=false){$('toast-msg').innerText=m;$('toast-icon').className=err?'fa-solid fa-circle-exclamation text-rose-400':'fa-solid fa-circle-check text-emerald-400';$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),3000);}

async function api(action,extra={}){
  if(!gasUrl){openConnectModal();throw new Error('Connect Google Sheet first');}
  let res=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:authToken,...extra})});
  let j=await res.json();
  if(j.authError){
    const lr=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'login',username:'admin',password:'ak1234'})});
    const lj=await lr.json();
    if(lj.ok){authToken=lj.token;localStorage.setItem('AK_LH_TOKEN',authToken);res=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:authToken,...extra})});j=await res.json();}
    else{openConnectModal();throw new Error(lj.error||'Auth failed');}
  }
  if(!j.ok)throw new Error(j.error||'Failed');
  return j.data;
}

function openConnectModal(){$('inp-url').value=gasUrl;openM('modal-connect');}
async function saveUrlConnect(){
  const u=$('inp-url').value.trim();if(!u.startsWith('https://script.google.com/'))return toast('Invalid /exec URL',true);
  gasUrl=u;localStorage.setItem('AK_LH_GAS_URL',u);closeM('modal-connect');initLoad();
}

async function initLoad(){
  if(!gasUrl)return openConnectModal();
  load(true);
  try{DB=await api('getAllData');attDate=today();syncAtt();render();}
  catch(e){toast(e.message,true);}finally{load(false);}
}
document.addEventListener('DOMContentLoaded',initLoad);

const mColors={
  dashboard:'text-violet-700 bg-violet-50',
  fees:'text-emerald-700 bg-emerald-50',
  attendance:'text-teal-700 bg-teal-50',
  batches:'text-blue-700 bg-blue-50',
  tests:'text-purple-700 bg-purple-50',
  reports:'text-rose-700 bg-rose-50'
};

function navTo(sec){
  curSec=sec;
  ['dashboard','fees','attendance','batches','tests','reports'].forEach(t=>{
    $('sec-'+t).classList.toggle('hidden',t!==sec);
    const dt=$('dtab-'+t),mt=$('mtab-'+t);
    if(dt)dt.className=t===sec?'py-2.5 tab-on':'py-2.5';
    if(mt)mt.className=t===sec?`flex flex-col items-center py-1 rounded-xl text-[9px] font-bold ${mColors[t]}`:'flex flex-col items-center py-1 rounded-xl text-[9px] font-semibold text-slate-400';
  });
  render();window.scrollTo(0,0);
}

function monthSpan(s,e){
  if(!s||!e||s>e)return[];const r=[];let[y,m]=s.split('-').map(Number),[ey,em]=e.split('-').map(Number),g=0;
  while((y<ey||(y===ey&&m<=em))&&g<120){r.push(y+'-'+String(m).padStart(2,'0'));if(++m>12){m=1;y++;}g++;}
  return r;
}

function feeStats(){
  const cm=curYM();let tExp=0,tRec=0,tPend=0,pCnt=0,uCnt=0;
  const stus=DB.students.map(s=>{
    const st=s.joiningDate?s.joiningDate.slice(0,7):cm;
    const en=(s.status==='Left'&&s.leavingDate&&s.leavingDate.slice(0,7)<cm)?s.leavingDate.slice(0,7):cm;
    const ms=monthSpan(st,en),exp=ms.length*s.monthlyFee;
    const pays=DB.fees.filter(f=>f.admNo===s.admNo),rec=pays.reduce((a,b)=>a+b.amount,0),pend=Math.max(0,exp-rec);
    tExp+=exp;tRec+=rec;tPend+=pend;
    if(pend>0)uCnt++;else if(exp>0)pCnt++;
    return{...s,exp,rec,pend,lastPay:pays[0]?pays[0].paymentDate:'-'};
  });
  return{stus,tExp,tRec,tPend,pCnt,uCnt};
}

function render(){
  if(curSec==='dashboard')renderDash();
  else if(curSec==='fees')renderFees();
  else if(curSec==='attendance')renderAtt();
  else if(curSec==='batches')renderBatches();
  else if(curSec==='tests')renderTests();
  else if(curSec==='reports')renderReports();
}

function renderDash(){
  const fs=feeStats(),unpaid=fs.stus.filter(s=>s.pend>0),act=DB.students.filter(s=>s.status==='Active').length;
  $('sec-dashboard').innerHTML=`
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
    <div onclick="navTo('batches')" class="c-blue text-white p-4 rounded-2xl shadow-md cursor-pointer">
      <div class="flex justify-between"><span class="text-[10px] font-bold uppercase text-blue-100">Total Students</span><i class="fa-solid fa-users bg-white/20 p-1.5 rounded-lg text-xs"></i></div>
      <h3 class="text-2xl font-extrabold mt-1">${act}</h3>
      <p class="text-[11px] text-blue-100">${DB.batches.length} Batches →</p>
    </div>
    <div onclick="navTo('fees');feeSub='paid';render()" class="c-green text-white p-4 rounded-2xl shadow-md cursor-pointer">
      <div class="flex justify-between"><span class="text-[10px] font-bold uppercase text-emerald-100">Fees Received</span><i class="fa-solid fa-wallet bg-white/20 p-1.5 rounded-lg text-xs"></i></div>
      <h3 class="text-xl font-extrabold mt-1">${fmt(fs.tRec)}</h3>
      <p class="text-[11px] text-emerald-100">${fs.pCnt} Students Paid →</p>
    </div>
    <div onclick="navTo('fees');feeSub='unpaid';render()" class="c-rose text-white p-4 rounded-2xl shadow-md cursor-pointer col-span-2 sm:col-span-1">
      <div class="flex justify-between"><span class="text-[10px] font-bold uppercase text-rose-100">Fees Pending</span><i class="fa-solid fa-clock bg-white/20 p-1.5 rounded-lg text-xs"></i></div>
      <h3 class="text-xl font-extrabold mt-1">${fmt(fs.tPend)}</h3>
      <p class="text-[11px] text-rose-100 font-semibold">${fs.uCnt} Students Unpaid →</p>
    </div>
  </div>

  <div class="grid grid-cols-4 gap-2">
    <button type="button" onclick="navTo('fees')" class="card p-2.5 rounded-2xl text-center hover:border-emerald-400"><i class="fa-solid fa-indian-rupee-sign text-emerald-600 text-base block mb-1"></i><span class="text-[11px] font-bold">Fees</span></button>
    <button type="button" onclick="navTo('attendance')" class="card p-2.5 rounded-2xl text-center hover:border-teal-400"><i class="fa-solid fa-calendar-check text-teal-600 text-base block mb-1"></i><span class="text-[11px] font-bold">Attend</span></button>
    <button type="button" onclick="navTo('tests')" class="card p-2.5 rounded-2xl text-center hover:border-purple-400"><i class="fa-solid fa-file-pen text-purple-600 text-base block mb-1"></i><span class="text-[11px] font-bold">Tests</span></button>
    <button type="button" onclick="navTo('reports')" class="card p-2.5 rounded-2xl text-center hover:border-rose-400"><i class="fa-solid fa-chart-simple text-rose-600 text-base block mb-1"></i><span class="text-[11px] font-bold">Reports</span></button>
  </div>

  <div class="card rounded-2xl overflow-hidden">
    <div class="px-4 py-3 border-b bg-rose-50/70 flex justify-between items-center"><h3 class="font-bold text-sm text-rose-900">Pending Fees (${unpaid.length} Students)</h3><button type="button" onclick="navTo('fees')" class="text-xs font-bold text-rose-600">Batch Wise →</button></div>
    <div class="divide-y max-h-72 overflow-y-auto">${unpaid.length?unpaid.map(s=>`<div class="px-4 py-2.5 flex justify-between items-center gap-2"><div><p onclick="openStudentModal('${s.admNo}')" class="font-bold text-xs cursor-pointer">${s.name} <span class="text-violet-600">(${s.batches.join(', ')||'No Batch'})</span></p><p class="text-[10px] text-slate-500">Paid: ${fmt(s.rec)} • Due: <b class="text-rose-600">${fmt(s.pend)}</b></p></div><div class="flex gap-1.5"><button type="button" onclick="openFeeModal('${s.admNo}')" class="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">Pay</button><button type="button" onclick="waFee('${s.admNo}',${s.pend})" class="bg-green-100 text-green-700 p-1.5 rounded-lg text-xs"><i class="fa-brands fa-whatsapp"></i></button></div></div>`).join(''):'<p class="p-6 text-center text-xs text-slate-400">All student fees are clear!</p>'}</div>
  </div>`;
}

function batchPills(sel,fn){
  const bs=DB.batches.map(b=>b.name);
  return`<div class="flex flex-wrap gap-1.5"><button type="button" onclick="${fn}='ALL';render()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${sel==='ALL'?'top-grad text-white shadow':'bg-white border text-slate-600'}">All</button>${bs.map(b=>`<button type="button" onclick="${fn}=decodeURIComponent('${encodeURIComponent(b)}');render()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${sel===b?'top-grad text-white shadow':'bg-white border text-slate-600'}">${b}</button>`).join('')}</div>`;
}

function renderFees(){
  const fs=feeStats(),list=fs.stus.filter(s=>feeB==='ALL'||s.batches.includes(feeB));
  const unpaid=list.filter(s=>s.pend>0),paid=list.filter(s=>s.pend<=0);
  const bRec=list.reduce((a,b)=>a+b.rec,0),bPend=list.reduce((a,b)=>a+b.pend,0);
  const show=feeSub==='unpaid'?unpaid:paid;
  $('sec-fees').innerHTML=`
  ${batchPills(feeB,'feeB')}
  <div class="grid grid-cols-2 gap-2.5 text-center">
    <div class="c-green text-white p-3 rounded-2xl shadow-sm"><p class="text-[10px] font-bold text-emerald-100">COLLECTED</p><b class="text-lg">${fmt(bRec)}</b></div>
    <div class="c-rose text-white p-3 rounded-2xl shadow-sm"><p class="text-[10px] font-bold text-rose-100">PENDING</p><b class="text-lg">${fmt(bPend)}</b></div>
  </div>
  <div class="grid grid-cols-2 gap-2">
    <button type="button" onclick="feeSub='unpaid';render()" class="py-2.5 rounded-xl text-xs font-bold ${feeSub==='unpaid'?'bg-rose-600 text-white shadow':'card text-rose-600'}">Unpaid (${unpaid.length})</button>
    <button type="button" onclick="feeSub='paid';render()" class="py-2.5 rounded-xl text-xs font-bold ${feeSub==='paid'?'bg-emerald-600 text-white shadow':'card text-emerald-600'}">Paid (${paid.length})</button>
  </div>
  <div class="space-y-2">${show.length?show.map(s=>`<div class="card p-3.5 rounded-2xl flex justify-between items-center gap-2"><div><h4 onclick="openStudentModal('${s.admNo}')" class="font-bold text-sm cursor-pointer">${s.name}</h4><p class="text-[11px] text-violet-600 font-medium">${s.batches.join(', ')||'No Batch'} • ${fmt(s.monthlyFee)}/mo</p><p class="text-[11px]">Paid: <b class="text-emerald-600">${fmt(s.rec)}</b> • ${s.pend>0?`Pending: <b class="text-rose-600">${fmt(s.pend)}</b>`:`Last Paid: ${s.lastPay}`}</p></div><div class="flex gap-1.5 shrink-0"><button type="button" onclick="openFeeModal('${s.admNo}')" class="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">+ Pay</button>${s.pend>0?`<button type="button" onclick="waFee('${s.admNo}',${s.pend})" class="bg-green-100 text-green-700 p-2 rounded-xl text-xs"><i class="fa-brands fa-whatsapp"></i></button>`:''}</div></div>`).join(''):'<div class="card p-8 rounded-2xl text-center text-xs text-slate-400">No students in this list.</div>'}</div>`;
}

function syncAtt(){
  attLoc={};
  DB.attendance.filter(a=>a.date===attDate&&(attB==='ALL'||a.batchName===attB)).forEach(a=>{attLoc[a.admNo]=a.status;});
}
function renderAtt(){
  if(!attDate)attDate=today();
  const list=DB.students.filter(s=>s.status==='Active'&&(attB==='ALL'||s.batches.includes(attB)));
  let p=0,a=0,l=0;list.forEach(s=>{const st=attLoc[s.admNo]||'Present';if(st==='Present')p++;else if(st==='Absent')a++;else l++;});
  const show=attSub==='mark'?list:list.filter(s=>(attLoc[s.admNo]||'Present')===attSub);
  $('sec-attendance').innerHTML=`
  ${batchPills(attB,'attB')}
  <div class="card p-3 rounded-2xl flex justify-between items-center gap-2">
    <input type="date" value="${attDate}" onchange="attDate=this.value;syncAtt();render()" class="border rounded-xl px-2.5 py-1.5 text-xs font-bold">
    <button type="button" onclick="saveAttNow()" class="c-teal text-white px-4 py-2 rounded-xl text-xs font-bold shadow">Save Attendance</button>
  </div>
  <div class="grid grid-cols-4 gap-1.5">
    <button type="button" onclick="attSub='mark';render()" class="py-2 rounded-xl text-[11px] font-bold ${attSub==='mark'?'top-grad text-white':'card'}">All (${list.length})</button>
    <button type="button" onclick="attSub='Present';render()" class="py-2 rounded-xl text-[11px] font-bold ${attSub==='Present'?'bg-emerald-600 text-white':'card text-emerald-600'}">Pres (${p})</button>
    <button type="button" onclick="attSub='Absent';render()" class="py-2 rounded-xl text-[11px] font-bold ${attSub==='Absent'?'bg-rose-600 text-white':'card text-rose-600'}">Abs (${a})</button>
    <button type="button" onclick="attSub='Leave';render()" class="py-2 rounded-xl text-[11px] font-bold ${attSub==='Leave'?'bg-amber-500 text-white':'card text-amber-600'}">Leave (${l})</button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${show.length?show.map(s=>{const st=attLoc[s.admNo]||'Present';return`<div class="card p-3 rounded-2xl flex justify-between items-center gap-2"><div><h4 class="font-bold text-sm">${s.name}</h4><p class="text-[10px] text-slate-400">${s.studentClass} • ${s.batches.join(', ')}</p></div><div class="flex bg-slate-100 p-1 rounded-xl gap-1"><button type="button" onclick="attLoc['${s.admNo}']='Present';render()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Present'?'bg-emerald-500 text-white':'text-slate-500'}">P</button><button type="button" onclick="attLoc['${s.admNo}']='Absent';render()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Absent'?'bg-rose-500 text-white':'text-slate-500'}">A</button><button type="button" onclick="attLoc['${s.admNo}']='Leave';render()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Leave'?'bg-amber-500 text-white':'text-slate-500'}">L</button></div></div>`;}).join(''):'<div class="col-span-full card p-8 rounded-2xl text-center text-xs text-slate-400">No students found.</div>'}</div>`;
}
async function saveAttNow(){
  const bn=attB==='ALL'?'General':attB,list=DB.students.filter(s=>s.status==='Active'&&(attB==='ALL'||s.batches.includes(attB)));
  if(!list.length)return toast('No students',true);load(true);
  try{DB=await api('saveAttendance',{payload:{date:attDate,batchName:bn,records:list.map(s=>({admNo:s.admNo,studentName:s.name,status:attLoc[s.admNo]||'Present',remark:''}))}});render();toast('Attendance saved!');}catch(e){toast(e.message,true);}finally{load(false);}
}

function renderBatches(){
  $('sec-batches').innerHTML=`<div class="flex justify-between items-center"><h2 class="font-bold text-sm">Batches (${DB.batches.length})</h2><button type="button" onclick="openBatchModal(null)" class="c-teal text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow">+ Create Batch</button></div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${DB.batches.length?DB.batches.map(b=>{
    const cnt=DB.students.filter(s=>s.batches.includes(b.name)).length,enc=encodeURIComponent(b.name);
    return`<div class="card p-4 rounded-2xl space-y-3 border-t-4 border-t-violet-500"><div class="flex justify-between items-start"><div><h3 class="font-bold text-base">${b.name}</h3><p class="text-[11px] text-slate-500">${b.batchClass||''} • ${b.timing||''}</p></div><div class="flex gap-1"><button type="button" onclick="openBatchModal('${b.id}')" class="p-1.5 bg-violet-50 text-violet-600 rounded-lg text-xs"><i class="fa-solid fa-pen"></i></button><button type="button" onclick="delBatch('${b.id}',decodeURIComponent('${enc}'))" class="p-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button></div></div><div class="flex justify-between items-center bg-violet-50/70 p-2.5 rounded-xl text-xs font-bold"><span>Students: ${cnt}</span><button type="button" onclick="openBatchStus(decodeURIComponent('${enc}'))" class="text-violet-700">Add / View Students →</button></div></div>`;
  }).join(''):'<div class="col-span-full card p-8 rounded-2xl text-center text-xs text-slate-400">No batches yet. Tap "+ Create Batch"!</div>'}</div>`;
}
function openBatchStus(bn){
  const inB=DB.students.filter(s=>s.batches.includes(bn)),notIn=DB.students.filter(s=>!s.batches.includes(bn)&&s.status==='Active'),enc=encodeURIComponent(bn);
  $('mbs-title').innerText=`${bn} (${inB.length} Students)`;
  $('mbs-body').innerHTML=`<button type="button" onclick="closeM('modal-batch-stus');openStudentModal(null,decodeURIComponent('${enc}'))" class="w-full top-grad text-white py-2 rounded-xl font-bold">+ Add New Student to ${bn}</button>
  <div class="divide-y border rounded-xl">${inB.map(s=>`<div class="p-2.5 flex justify-between items-center"><span onclick="closeM('modal-batch-stus');openStudentModal('${s.admNo}')" class="font-bold cursor-pointer">${s.name} <span class="text-slate-400">(${s.studentClass})</span></span><div class="flex gap-2"><button type="button" onclick="closeM('modal-batch-stus');openStudentModal('${s.admNo}')" class="text-violet-600 font-bold">Edit</button><button type="button" onclick="togStuBat('${s.admNo}',decodeURIComponent('${enc}'),false)" class="text-rose-600 font-bold">Remove</button></div></div>`).join('')||'<p class="p-3 text-slate-400 text-center">No students in this batch.</p>'}</div>
  ${notIn.length?`<div class="flex gap-2 pt-1"><select id="mbs-add" class="flex-1 border rounded-xl px-2 py-2 bg-white">${notIn.map(s=>`<option value="${s.admNo}">${s.name}</option>`).join('')}</select><button type="button" onclick="togStuBat($('mbs-add').value,decodeURIComponent('${enc}'),true)" class="bg-emerald-600 text-white px-3 rounded-xl font-bold">+ Add Existing</button></div>`:''}`;
  openM('modal-batch-stus');
}
async function togStuBat(adm,bn,add){
  const s=DB.students.find(x=>x.admNo===adm);if(!s)return;
  let bs=[...s.batches];if(add&&!bs.includes(bn))bs.push(bn);if(!add)bs=bs.filter(x=>x!==bn);
  load(true);try{DB=await api('editStudent',{payload:{...s,batches:bs}});openBatchStus(bn);render();}catch(e){toast(e.message,true);}finally{load(false);}
}

function renderTests(){
  const list=DB.tests.filter(t=>testB==='ALL'||t.batch===testB);
  $('sec-tests').innerHTML=`<div class="flex justify-between items-center"><h2 class="font-bold text-sm">Batch-Wise Tests</h2><button type="button" onclick="openTestModal()" class="c-purple text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow">+ Add Test</button></div>
  ${batchPills(testB,'testB')}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${list.length?list.map(t=>{const ms=DB.testMarks.filter(m=>m.testId===t.testId),avg=ms.length?Math.round(ms.reduce((a,b)=>a+(b.obtained/t.maxMarks)*100,0)/ms.length):0;return`<div onclick="openTestDet('${t.testId}')" class="card p-4 rounded-2xl cursor-pointer space-y-2 border-t-4 border-t-purple-500"><div class="flex justify-between text-[10px] font-bold"><span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">${t.batch} • ${t.subject}</span><span class="text-slate-400">${t.testDate}</span></div><h3 class="font-bold text-sm">${t.testName}</h3><div class="flex justify-between text-xs pt-2 border-t"><span>${ms.length} Students</span><b class="text-purple-600">Avg ${avg}% →</b></div></div>`;}).join(''):'<div class="col-span-full card p-8 rounded-2xl text-center text-xs text-slate-400">No tests yet.</div>'}</div>`;
}

function renderReports(){
  const d=new Date(),cy=d.getFullYear(),ly=cy-1,cm=curYM();
  const lmD=new Date(d.getFullYear(),d.getMonth()-1,1),lm=lmD.getFullYear()+'-'+String(lmD.getMonth()+1).padStart(2,'0');
  const admCM=DB.students.filter(s=>s.joiningDate&&s.joiningDate.startsWith(cm)).length;
  const admLM=DB.students.filter(s=>
