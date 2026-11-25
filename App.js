let gasUrl='';
try{gasUrl=localStorage.getItem('COACHING_GAS_API_URL')||'';}catch(e){}
let appData={batches:[],students:[],attendanceMap:{},attendanceRemarks:{},unmarkedDates:[],recentFees:[],tests:[],testMarks:[],summary:{}};
let localAttendance={},localRemarks={},currentFeeSubTab='pending',currentAttSubTab='mark',activeDetailStudentId=null,activeTestId=null,currentTestTab='all';
let editingBatch=null;
const nowD=new Date();
const fmtD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayISO=fmtD(nowD),yestD=new Date(nowD.getTime()-86400000),yestISO=fmtD(yestD);

const demoDB={
  instituteName:'Apex Coaching Academy',
  batches:[{id:'BAT-001',name:'Batch 1 (Class 10th)',timing:'4:00 PM - 5:00 PM',defaultFee:1500,subject:'Math & Science'},{id:'BAT-002',name:'Batch 2 (Class 12th)',timing:'5:30 PM - 6:30 PM',defaultFee:2000,subject:'Physics & Math'}],
  students:[
    {id:'STU-001',name:'Aarav Sharma',batch:'Batch 1 (Class 10th)',joinedClass:'Class 8th',joiningDate:'2026-10-01',studentPhone:'9876543210',fatherName:'Rajesh Sharma',fatherPhone:'9876543210',motherName:'Sunita Sharma',motherPhone:'',monthlyFee:1500,totalPayable:1500,manualPayable:0,discount:0,totalPaid:0,pendingFee:1500,nextDueDate:'2026-11-01',isOverdue:true,presentDays:22,absentDays:1,leaveDays:2,address:'Sector 14'},
    {id:'STU-002',name:'Priya Verma',batch:'Batch 1 (Class 10th)',joinedClass:'Class 9th',joiningDate:'2026-11-01',studentPhone:'9876501234',fatherName:'Anil Verma',fatherPhone:'9876501234',motherName:'Meena Verma',motherPhone:'',monthlyFee:1500,totalPayable:0,manualPayable:0,discount:0,totalPaid:0,pendingFee:0,nextDueDate:'2026-12-01',isOverdue:false,presentDays:24,absentDays:0,leaveDays:1,address:'DLF'},
    {id:'STU-003',name:'Rohan Gupta',batch:'Batch 2 (Class 12th)',joinedClass:'Class 11th',joiningDate:'2026-10-05',studentPhone:'9811223344',fatherName:'Suresh Gupta',fatherPhone:'9811223344',motherName:'Kavita Gupta',motherPhone:'',monthlyFee:2000,totalPayable:2000,manualPayable:0,discount:0,totalPaid:2000,pendingFee:0,nextDueDate:'2026-12-05',isOverdue:false,presentDays:18,absentDays:4,leaveDays:0,address:'Civil Lines'}
  ],
  attendanceByDate:{[todayISO]:{'STU-001':'Present','STU-002':'Leave','STU-003':'Absent'}},
  remarksByDate:{[todayISO]:{'STU-002':'Out of Station'}},
  recentFees:[{date:todayISO,studentId:'STU-003',studentName:'Rohan Gupta',month:'October 2026',amount:2000,mode:'UPI / Online',receiptNo:'REC-842190'}],
  tests:[{testId:'TST-001',date:todayISO,testName:'Math Unit Test',subject:'Mathematics',batch:'Batch 1 (Class 10th)',maxMarks:50}],
  testMarks:[{testId:'TST-001',date:todayISO,testName:'Math Unit Test',studentId:'STU-001',studentName:'Aarav Sharma',obtained:16,maxMarks:50},{testId:'TST-001',date:todayISO,testName:'Math Unit Test',studentId:'STU-002',studentName:'Priya Verma',obtained:46,maxMarks:50}]
};

function buildDemo(d){
  const am=demoDB.attendanceByDate[d]||{},rm=demoDB.remarksByDate[d]||{};
  let tc=0,tp=0,ov=0,p=0,a=0,l=0;
  demoDB.students.forEach(s=>{s.pendingFee=Math.max(0,s.totalPayable-s.discount-s.totalPaid);s.isOverdue=s.pendingFee>0&&todayISO>=s.nextDueDate;tc+=s.totalPaid;if(s.pendingFee>0)tp+=s.pendingFee;if(s.isOverdue)ov++;if(am[s.id]==='Present')p++;else if(am[s.id]==='Absent')a++;else if(am[s.id]==='Leave')l++;});
  const un=[];if(!demoDB.attendanceByDate[yestISO]&&yestD.getDay()!==0)un.push(yestISO);
  return{instituteName:demoDB.instituteName,todayStr:todayISO,selectedDate:d,batches:JSON.parse(JSON.stringify(demoDB.batches)),students:JSON.parse(JSON.stringify(demoDB.students)),attendanceMap:{...am},attendanceRemarks:{...rm},unmarkedDates:un,isSelectedDateMarked:!!demoDB.attendanceByDate[d],recentFees:JSON.parse(JSON.stringify(demoDB.recentFees)),tests:JSON.parse(JSON.stringify(demoDB.tests)),testMarks:JSON.parse(JSON.stringify(demoDB.testMarks)),summary:{totalStudents:demoDB.students.length,totalCollected:tc,totalPending:tp,overdueCount:ov,todayPresent:p,todayAbsent:a,todayLeave:l}};
}

async function callApi(action,body){
  if(action==='getAppData'){const r=await fetch(gasUrl+'?action=getAppData&date='+encodeURIComponent(body.date||''));const j=await r.json();if(!j.ok)throw new Error(j.error||'Load failed');return j.data;}
  const r=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...body})});
  const j=await r.json();if(!j.ok)throw new Error(j.error||'Failed');return j.data;
}

const Backend={
  getAppData:(d,ok,err)=>!gasUrl?ok(buildDemo(d)):callApi('getAppData',{date:d}).then(ok).catch(()=>err(new Error('Connection failed! Check /exec URL & Anyone access.'))),
  addBatch:(p,ok,err)=>{if(!gasUrl){demoDB.batches.push({id:'BAT-'+Date.now(),name:p.name,timing:p.timing,defaultFee:Number(p.defaultFee)||0,subject:p.subject});return ok(buildDemo(p.currentDate));}callApi('addBatch',{payload:p}).then(ok).catch(err);},
  editBatch:(p,ok,err)=>{
    if(!gasUrl){
      let b=demoDB.batches.find(x=>(p.id!=='AUTO'&&x.id===p.id)||x.name===p.oldName);
      if(b){b.name=p.name;b.timing=p.timing;b.defaultFee=Number(p.defaultFee)||0;b.subject=p.subject;}
      else demoDB.batches.push({id:'BAT-'+Date.now(),name:p.name,timing:p.timing,defaultFee:Number(p.defaultFee)||0,subject:p.subject});
      if(p.oldName!==p.name){demoDB.students.forEach(s=>{if(s.batch===p.oldName)s.batch=p.name;});demoDB.tests.forEach(t=>{if(t.batch===p.oldName)t.batch=p.name;});}
      return ok(buildDemo(p.currentDate));
    }
    callApi('editBatch',{payload:p}).then(ok).catch(err);
  },
  deleteBatch:(id,name,d,ok,err)=>{
    if(!gasUrl){demoDB.batches=demoDB.batches.filter(b=>b.id!==id&&b.name!==name);demoDB.students.forEach(s=>{if(s.batch===name)s.batch='General';});return ok(buildDemo(d));}
    callApi('deleteBatch',{batchId:id,batchName:name,currentDate:d}).then(ok).catch(err);
  },
  addStudent:(p,ok,err)=>{
    if(!gasUrl){const id='STU-'+String(demoDB.students.length+1).padStart(3,'0'),m=Number(p.monthlyFee)||0,pay=Number(p.openingPayable)||0;demoDB.students.push({id,name:p.name,batch:p.batch,joinedClass:p.joinedClass||p.batch,joiningDate:p.joiningDate,studentPhone:p.fatherPhone,fatherName:p.fatherName,fatherPhone:p.fatherPhone,motherName:p.motherName,motherPhone:p.motherPhone,monthlyFee:m,totalPayable:pay,manualPayable:pay,discount:0,totalPaid:0,pendingFee:pay,nextDueDate:p.joiningDate,isOverdue:pay>0,presentDays:0,absentDays:0,leaveDays:0,address:p.address});return ok(buildDemo(p.currentDate));}
    callApi('addStudent',{payload:p}).then(ok).catch(err);
  },
  saveAttendance:(d,recs,ok,err)=>{
    if(!gasUrl){if(!demoDB.attendanceByDate[d])demoDB.attendanceByDate[d]={};if(!demoDB.remarksByDate[d])demoDB.remarksByDate[d]={};recs.forEach(r=>{const pv=demoDB.attendanceByDate[d][r.id],s=demoDB.students.find(x=>x.id===r.id);if(s&&pv!==r.status){if(pv==='Present')s.presentDays=Math.max(0,s.presentDays-1);if(pv==='Absent')s.absentDays=Math.max(0,s.absentDays-1);if(pv==='Leave')s.leaveDays=Math.max(0,s.leaveDays-1);if(r.status==='Present')s.presentDays++;if(r.status==='Absent')s.absentDays++;if(r.status==='Leave')s.leaveDays++;}demoDB.attendanceByDate[d][r.id]=r.status;demoDB.remarksByDate[d][r.id]=r.remark||'';});return ok(buildDemo(d));}
    callApi('saveAttendance',{dateStr:d,records:recs}).then(ok).catch(err);
  },
  markLeaveRange:(p,ok,err)=>{
    if(!gasUrl){const [y1,m1,d1]=p.fromDate.split('-').map(Number),[y2,m2,d2]=p.toDate.split('-').map(Number);let cur=new Date(y1,m1-1,d1),end=new Date(y2,m2-1,d2);while(cur<=end){const ds=fmtD(cur);if(!demoDB.attendanceByDate[ds])demoDB.attendanceByDate[ds]={};if(!demoDB.remarksByDate[ds])demoDB.remarksByDate[ds]={};demoDB.attendanceByDate[ds][p.studentId]='Leave';demoDB.remarksByDate[ds][p.studentId]=p.remark;const s=demoDB.students.find(x=>x.id===p.studentId);if(s)s.leaveDays++;cur.setDate(cur.getDate()+1);}return ok(buildDemo(p.currentDate));}
    callApi('markLeaveRange',{payload:p}).then(ok).catch(err);
  },
  recordFee:(p,ok,err)=>{
    if(!gasUrl){const amt=Number(p.amount)||0,s=demoDB.students.find(x=>x.id===p.studentId);if(s)s.totalPaid+=amt;const rec={date:p.date,studentId:p.studentId,studentName:p.studentName,month:p.month,amount:amt,mode:p.mode,receiptNo:'REC-'+Math.floor(1e5+Math.random()*9e5)};demoDB.recentFees.unshift(rec);const res=buildDemo(p.currentDate);res.lastReceipt=rec;return ok(res);}
    callApi('recordFee',{payload:p}).then(ok).catch(err);
  },
  billNewMonth:(b,d,ok,err)=>{if(!gasUrl){let c=0;demoDB.students.forEach(s=>{if((b==='ALL'||s.batch===b)&&s.monthlyFee>0){s.totalPayable+=s.monthlyFee;c++;}});const r=buildDemo(d);r.billedCount=c;return ok(r);}callApi('billNewMonth',{batch:b,currentDate:d}).then(ok).catch(err);},
  updateStudentBilling:(id,pay,disc,d,ok,err)=>{if(!gasUrl){const s=demoDB.students.find(x=>x.id===id);if(s){s.totalPayable=Number(pay)||0;s.discount=Number(disc)||0;}return ok(buildDemo(d));}callApi('updateStudentBilling',{studentId:id,newPayable:pay,newDiscount:disc,currentDate:d}).then(ok).catch(err);},
  deleteStudent:(id,d,ok,err)=>{if(!gasUrl){demoDB.students=demoDB.students.filter(x=>x.id!==id);return ok(buildDemo(d));}callApi('deleteStudent',{studentId:id,currentDate:d}).then(ok).catch(err);},
  saveTestWithMarks:(p,ok,err)=>{if(!gasUrl){const tId='TST-'+String(demoDB.tests.length+1).padStart(3,'0');demoDB.tests.unshift({testId:tId,date:p.date,testName:p.testName,subject:p.subject,batch:p.batch,maxMarks:Number(p.maxMarks)});p.marksList.forEach(m=>demoDB.testMarks.push({testId:tId,date:p.date,testName:p.testName,studentId:m.studentId,studentName:m.studentName,obtained:Number(m.obtained)||0,maxMarks:Number(p.maxMarks)}));return ok(buildDemo(p.currentDate));}callApi('saveTestWithMarks',{payload:p}).then(ok).catch(err);},
  deleteTest:(tId,d,ok,err)=>{if(!gasUrl){demoDB.tests=demoDB.tests.filter(t=>t.testId!==tId);demoDB.testMarks=demoDB.testMarks.filter(m=>m.testId!==tId);return ok(buildDemo(d));}callApi('deleteTest',{testId:tId,currentDate:d}).then(ok).catch(err);},
  saveInstituteName:(n,d,ok,err)=>{if(!gasUrl){demoDB.instituteName=n;return ok(buildDemo(d));}callApi('saveInstituteName',{name:n,currentDate:d}).then(ok).catch(err);}
};

function switchTab(tab){
  const cols={dashboard:'bg-indigo-50 text-indigo-600',fees:'bg-emerald-50 text-emerald-600',attendance:'bg-teal-50 text-teal-600',batches:'bg-sky-50 text-sky-600',students:'bg-blue-50 text-blue-600',tests:'bg-purple-50 text-purple-600',reports:'bg-rose-50 text-rose-600'};
  ['dashboard','fees','attendance','batches','students','tests','reports'].forEach(t=>{
    const s=document.getElementById('sec-'+t),dt=document.getElementById('dtab-'+t),mt=document.getElementById('mtab-'+t);
    if(s)s.classList.toggle('hidden',t!==tab);
    if(dt)dt.classList.toggle('tab-active',t===tab);
    if(mt)mt.className=t===tab?`flex flex-col items-center py-1 rounded-lg text-[9px] font-bold ${cols[t]}`:'flex flex-col items-center py-1 rounded-lg text-[9px] font-bold text-slate-400';
  });
  window.scrollTo(0,0);
}
function openModal(id){window.scrollTo(0,0);document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
function showLoader(s){const e=document.getElementById('loader');e.classList.toggle('hidden',!s);e.classList.toggle('flex',s);}
function showToast(m,err=false){const t=document.getElementById('toast');document.getElementById('toast-msg').innerText=m;document.getElementById('toast-icon').className=err?'fa-solid fa-circle-exclamation text-rose-400':'fa-solid fa-circle-check text-emerald-400';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3200);}
function formatINR(n){return '₹'+Number(n||0).toLocaleString('en-IN');}
function calcTenure(j){if(!j)return'Not Set';const p=j.split('-').map(Number),d=Math.max(0,Math.floor((new Date()-new Date(p[0],p[1]-1,p[2]))/86400000)),y=Math.floor(d/365),m=Math.floor((d%365)/30);return y>0?`${y}Y ${m}M`:(m>0?`${m} Mo`:`${d} Days`);}

function saveGasUrl(){
  const u=document.getElementById('inp-gas-url').value.trim();
  if(!u.startsWith('https://script.google.com/'))return showToast('Enter valid https://script.google.com/.../exec URL',true);
  gasUrl=u;try{localStorage.setItem('COACHING_GAS_API_URL',u);}catch(e){}
  document.getElementById('demo-banner').classList.add('hidden');closeModal('modal-connect');fetchData(document.getElementById('att-date').value);
}
function useDemoMode(){gasUrl='';try{localStorage.removeItem('COACHING_GAS_API_URL');}catch(e){}document.getElementById('demo-banner').classList.remove('hidden');closeModal('modal-connect');fetchData(document.getElementById('att-date').value);}
function fetchData(d){showLoader(true);Backend.getAppData(d,data=>{appData=data;localAttendance={...data.attendanceMap};localRemarks={...data.attendanceRemarks};renderAll();showLoader(false);},e=>{showLoader(false);showToast(e.message,true);});}
function loadDateAttendance(){fetchData(document.getElementById('att-date').value);}

function renderAll(){
  document.getElementById('inst-title').innerText=appData.instituteName;
  const bNames=[...new Set([...(appData.batches||[]).map(b=>b.name),...appData.students.map(s=>s.batch)])].filter(Boolean).sort();
  ['att-batch-filter','stu-batch-filter','fee-batch-filter','bill-batch-select','inp-test-batch','test-batch-filter'].forEach(id=>{
    const s=document.getElementById(id),p=s.value;
    s.innerHTML='<option value="ALL">All Batches</option>'+bNames.map(b=>`<option value="${b}">${b}</option>`).join('');
    if(bNames.includes(p))s.value=p;
  });
  renderDashboard();renderAttendanceView();renderFeesTab();renderBatches();renderStudentsList();renderTestsList();renderReports();
}

function getMonthlyStats(){
  const now=new Date(),ms=[],sh=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1),ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label=sh[d.getMonth()]+' '+String(d.getFullYear()).slice(-2);
    let feeSum=0,stuCount=0;
    appData.recentFees.forEach(f=>{if(f.date&&f.date.startsWith(ym))feeSum+=f.amount;});
    appData.students.forEach(s=>{if(!s.joiningDate||s.joiningDate.slice(0,7)<=ym)stuCount++;});
    ms.push({ym,label,feeSum,stuCount});
  }
  return ms;
}

function renderDashboard(){
  const unpaid=appData.students.filter(s=>s.pendingFee>0).sort((a,b)=>b.pendingFee-a.pendingFee);
  const s=appData.summary,ms=getMonthlyStats(),tm=ms[5],lm=ms[4];
  document.getElementById('btn-fee-collected').innerText=formatINR(s.totalCollected)+' Paid';
  document.getElementById('btn-fee-pending').innerText=formatINR(s.totalPending)+' Pending →';
  document.getElementById('btn-att-main').innerText=s.todayPresent+' Present';
  document.getElementById('btn-att-sub').innerText=`${s.todayAbsent} Abs • ${s.todayLeave} Leave →`;
  document.getElementById('btn-stu-count').innerText=s.totalStudents+' Students';
  document.getElementById('btn-bat-count').innerText=(appData.batches||[]).length+' Batches';
  document.getElementById('btn-test-count').innerText=appData.tests.length+' Tests';
  document.getElementById('btn-rep-month').innerText=formatINR(tm.feeSum);

  const ab=document.getElementById('dash-unmarked-alert');
  if(appData.unmarkedDates&&appData.unmarkedDates.length){
    ab.classList.remove('hidden');
    document.getElementById('dash-unmarked-text').innerText=appData.unmarkedDates.length+' day(s) attendance pending:';
    document.getElementById('dash-unmarked-btns').innerHTML=appData.unmarkedDates.map(d=>`<button type="button" onclick="jumpToAttDate('${d}')" class="bg-amber-400 text-amber-950 px-2.5 py-1 rounded-xl text-[11px] font-extrabold">Mark ${d}</button>`).join('');
  }else ab.classList.add('hidden');

  document.getElementById('dash-pending-title').innerText=`Pending Fees (${unpaid.length} Students)`;
  document.getElementById('dash-pending-list').innerHTML=unpaid.length?unpaid.map(x=>`
    <div class="px-3.5 py-2.5 flex justify-between items-center gap-2 ${x.isOverdue?'bg-rose-50/70':''}">
      <div class="min-w-0">
        <p onclick="openStudentDetail('${x.id}')" class="font-bold text-xs truncate cursor-pointer ${x.isOverdue?'text-rose-800':'text-slate-800'}">${x.name} ${x.isOverdue?'<span class="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded ml-1">OVERDUE</span>':''}</p>
        <p class="text-[10px] text-slate-500">${x.batch} • Due: ${x.nextDueDate||'Now'}</p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="font-extrabold text-xs text-rose-600">${formatINR(x.pendingFee)}</span>
        <button type="button" onclick="openFeeModal('${x.id}')" class="bg-emerald-600 text-white px-2 py-1 rounded-lg text-[11px] font-bold">Pay</button>
        <button type="button" onclick="sendWhatsApp('${x.id}','fee')" class="bg-green-50 text-green-600 p-1.5 rounded-lg text-xs"><i class="fa-brands fa-whatsapp"></i></button>
      </div>
    </div>
  `).join(''):'<p class="p-5 text-center text-xs text-slate-400">All student fees are clear!</p>';

  document.getElementById('dash-this-month-fee').innerText=formatINR(tm.feeSum);
  document.getElementById('dash-last-month-fee').innerText='Last mo: '+formatINR(lm.feeSum);
  document.getElementById('dash-this-month-stu').innerText=tm.stuCount+' Students';
  document.getElementById('dash-last-month-stu').innerText='Last mo: '+lm.stuCount;
  const tb=s.totalCollected+s.totalPending,pct=tb>0?Math.round((s.totalCollected/tb)*100):100;
  document.getElementById('dash-recovery-pct').innerText=pct+'%';
  document.getElementById('dash-recovery-bar').style.width=pct+'%';

  let h='';
  appData.students.filter(st=>appData.attendanceMap[st.id]==='Leave').forEach(st=>{h+=`<div class="px-3.5 py-2.5 bg-amber-50/50 flex justify-between text-xs"><div><b>${st.name} (Leave)</b><p class="text-[10px] text-amber-700">${appData.attendanceRemarks[st.id]||'Leave'}</p></div><span class="text-[10px] font-bold text-amber-800">${appData.selectedDate}</span></div>`;});
  appData.tests.slice(0,4).forEach(t=>{h+=`<div onclick="openTestView('${t.testId}')" class="px-3.5 py-2.5 flex justify-between items-center cursor-pointer"><div><p class="font-bold text-xs">${t.testName}</p><p class="text-[10px] text-slate-400">${t.date} • ${t.batch}</p></div><span class="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Max ${t.maxMarks}</span></div>`;});
  document.getElementById('dash-tests-leaves').innerHTML=h||'<p class="p-5 text-center text-xs text-slate-400">No tests or leaves today.</p>';
}

function jumpToAttDate(d){document.getElementById('att-date').value=d;switchTab('attendance');fetchData(d);}

function setAttSubTab(sub){
  currentAttSubTab=sub;
  const base={mark:'g-indigo',Present:'g-emerald',Absent:'g-rose',Leave:'g-amber'};
  const rings={mark:'ring-4 ring-indigo-300',Present:'ring-4 ring-emerald-300',Absent:'ring-4 ring-rose-300',Leave:'ring-4 ring-amber-300'};
  ['mark','Present','Absent','Leave'].forEach(t=>{document.getElementById('asub-'+t).className=`${base[t]} text-white p-2.5 rounded-2xl text-left shadow ${t===sub?rings[t]:'opacity-75'}`;});
  renderAttendanceView();
}

function renderAttendanceView(){
  document.getElementById('att-status-badge').innerHTML=appData.isSelectedDateMarked?'<span class="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg">Marked</span>':'<span class="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">Not Marked</span>';
  const b=document.getElementById('att-batch-filter').value,all=appData.students.filter(s=>b==='ALL'||s.batch===b);
  let p=0,a=0,l=0;
  all.forEach(s=>{const st=localAttendance[s.id]||'Present';if(st==='Present')p++;else if(st==='Absent')a++;else if(st==='Leave')l++;});
  document.getElementById('att-cnt-total').innerText=all.length;
  document.getElementById('att-cnt-Present').innerText=p;
  document.getElementById('att-cnt-Absent').innerText=a;
  document.getElementById('att-cnt-Leave').innerText=l;

  const list=currentAttSubTab==='mark'?all:all.filter(s=>(localAttendance[s.id]||'Present')===currentAttSubTab);
  const box=document.getElementById('attendance-list');
  if(!list.length)return box.innerHTML=`<div class="col-span-full bg-white p-8 rounded-2xl text-center text-xs text-slate-400">No students in "${currentAttSubTab}" list.</div>`;

  box.innerHTML=list.map(s=>{
    const st=localAttendance[s.id]||'Present',rem=localRemarks[s.id]||'';
    const bg=st==='Absent'?'border-rose-300 bg-rose-50/40':(st==='Leave'?'border-amber-300 bg-amber-50/40':'border-emerald-200 bg-white');
    return`<div class="p-3.5 rounded-2xl border ${bg} space-y-2"><div class="flex justify-between items-center gap-2"><div class="min-w-0"><h4 class="font-bold text-sm truncate">${s.name}</h4><p class="text-[11px] text-slate-500">${s.batch} • ${s.absentDays}A • ${s.leaveDays}L</p></div><div class="flex items-center gap-1">${st==='Absent'?`<button type="button" onclick="sendWhatsApp('${s.id}','absent')" class="bg-green-100 text-green-700 p-1.5 rounded-lg text-xs" title="Notify Parent"><i class="fa-brands fa-whatsapp"></i></button>`:''}<div class="flex bg-slate-100 p-1 rounded-xl gap-1"><button type="button" onclick="setAtt('${s.id}','Present')" class="px-2 py-1 rounded-lg text-[11px] font-bold ${st==='Present'?'bg-emerald-500 text-white':'text-slate-500'}">P</button><button type="button" onclick="setAtt('${s.id}','Absent')" class="px-2 py-1 rounded-lg text-[11px] font-bold ${st==='Absent'?'bg-rose-500 text-white':'text-slate-500'}">A</button><button type="button" onclick="setAtt('${s.id}','Leave')" class="px-2 py-1 rounded-lg text-[11px] font-bold ${st==='Leave'?'bg-amber-500 text-white':'text-slate-500'}">Leave</button></div></div></div>${st==='Leave'?`<input type="text" value="${rem}" onchange="localRemarks['${s.id}']=this.value" placeholder="Leave reason" class="w-full border border-amber-200 bg-white rounded-xl px-3 py-1.5 text-xs">`:''}</div>`;
  }).join('');
}
function setAtt(id,st){localAttendance[id]=st;renderAttendanceView();}
function markAllAttendance(st){const b=document.getElementById('att-batch-filter').value;appData.students.forEach(s=>{if(b==='ALL'||s.batch===b)localAttendance[s.id]=st;});renderAttendanceView();}
function submitAttendance(){const d=document.getElementById('att-date').value,b=document.getElementById('att-batch-filter').value,recs=appData.students.filter(s=>b==='ALL'||s.batch===b).map(s=>({id:s.id,name:s.name,batch:s.batch,status:localAttendance[s.id]||'Present',remark:localRemarks[s.id]||''}));showLoader(true);Backend.saveAttendance(d,recs,data=>{appData=data;localAttendance={...data.attendanceMap};localRemarks={...data.attendanceRemarks};renderAll();showLoader(false);showToast('Attendance saved!');},e=>{showLoader(false);showToast(e.message,true);});}
function openLeaveModal(){if(!appData.students.length)return showToast('Add students first',true);document.getElementById('inp-leave-student').innerHTML=appData.students.map(s=>`<option value="${s.id}">${s.name} (${s.batch})</option>`).join('');openModal('modal-leave');}
function submitLeaveRange(e){e.preventDefault();const id=document.getElementById('inp-leave-student').value,stu=appData.students.find(s=>s.id===id);closeModal('modal-leave');showLoader(true);Backend.markLeaveRange({studentId:id,studentName:stu.name,batch:stu.batch,fromDate:document.getElementById('inp-leave-from').value,toDate:document.getElementById('inp-leave-to').value,remark:document.getElementById('inp-leave-remark').value,currentDate:document.getElementById('att-date').value},data=>{appData=data;localAttendance={...data.attendanceMap};localRemarks={...data.attendanceRemarks};renderAll();showLoader(false);showToast('Leave saved!');},e=>{showLoader(false);showToast(e.message,true);});}

function openFeesTabFilter(sub){switchTab('fees');setFeeSubTab(sub);}
function setFeeSubTab(sub){
  currentFeeSubTab=sub;
  const rings={pending:'ring-4 ring-rose-300',paid:'ring-4 ring-emerald-300',ledger:'ring-4 ring-indigo-300'};
  const base={pending:'g-rose',paid:'g-emerald',ledger:'g-indigo'};
  ['pending','paid','ledger'].forEach(t=>{document.getElementById('fsub-'+t).className=`${base[t]} text-white text-left p-3 rounded-2xl shadow-md ${t===sub?rings[t]:'opacity-75'}`;});
  renderFeesTab();
}
function renderFeesTab(){
  const q=(document.getElementById('fee-search')?.value||'').toLowerCase(),bf=document.getElementById('fee-batch-filter')?.value||'ALL';
  const stuList=appData.students.filter(s=>(bf==='ALL'||s.batch===bf)&&(s.name.toLowerCase().includes(q)||(s.fatherPhone||'').includes(q)));
  const unpaid=stuList.filter(s=>s.pendingFee>0).sort((a,b)=>b.pendingFee-a.pendingFee),paid=stuList.filter(s=>s.pendingFee<=0);
  let tc=0,tp=0;stuList.forEach(s=>{tc+=s.totalPaid;if(s.pendingFee>0)tp+=s.pendingFee;});
  document.getElementById('fee-tab-total').innerText=formatINR(tc+tp);document.getElementById('fee-tab-collected').innerText=formatINR(tc);document.getElementById('fee-tab-pending').innerText=formatINR(tp);
  document.getElementById('fee-cnt-pending').innerText=unpaid.length+' Unpaid';document.getElementById('fee-amt-pending').innerText=formatINR(tp)+' Due';
  document.getElementById('fee-cnt-paid').innerText=paid.length+' Paid';document.getElementById('fee-amt-paid').innerText=formatINR(tc)+' Paid';
  const receipts=appData.recentFees.filter(f=>{const st=appData.students.find(x=>x.id===f.studentId);return(bf==='ALL'||(st&&st.batch===bf))&&(f.studentName.toLowerCase().includes(q)||f.receiptNo.toLowerCase().includes(q));});
  document.getElementById('fee-cnt-ledger').innerText=receipts.length+' Receipts';

  const box=document.getElementById('fee-subtab-content');
  if(currentFeeSubTab==='pending'){
    box.innerHTML=unpaid.length?unpaid.map(s=>`
      <div class="rounded-2xl border p-3.5 shadow-sm space-y-2 ${s.isOverdue?'border-rose-400 bg-rose-50/60':'border-amber-200 bg-white'}">
        <div class="flex justify-between items-start gap-2">
          <div><span class="text-[10px] font-bold px-2 py-0.5 rounded ${s.isOverdue?'bg-rose-600 text-white':'bg-amber-100 text-amber-800'}">${s.isOverdue?'OVERDUE':'DUE'} • ${s.batch}</span><h4 onclick="openStudentDetail('${s.id}')" class="font-extrabold text-sm mt-1 cursor-pointer">${s.name}</h4><p class="text-[11px] text-slate-500">Due Date: <b>${s.nextDueDate||'Now'}</b> • ${s.fatherPhone||'No Phone'}</p></div>
          <div class="text-right"><p class="text-[10px] text-slate-400 font-bold">PENDING</p><p class="text-base font-extrabold text-rose-600">${formatINR(s.pendingFee)}</p></div>
        </div>
        <div class="flex gap-2"><button type="button" onclick="openFeeModal('${s.id}')" class="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold">+ Pay Fee</button><button type="button" onclick="sendWhatsApp('${s.id}','fee')" class="px-3 bg-green-100 text-green-700 py-2 rounded-xl text-xs font-bold"><i class="fa-brands fa-whatsapp mr-1"></i>Remind</button></div>
      </div>`).join(''):'<p class="bg-white p-6 rounded-2xl text-center text-xs text-slate-400">No pending fees!</p>';
  }else if(currentFeeSubTab==='paid'){
    box.innerHTML=paid.length?paid.map(s=>{
      const lp=appData.recentFees.find(f=>f.studentId===s.id);
      return`<div class="bg-white rounded-2xl border border-emerald-200 p-3.5 flex justify-between items-center gap-2"><div><span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">${s.batch}</span><h4 onclick="openStudentDetail('${s.id}')" class="font-extrabold text-sm mt-1 cursor-pointer">${s.name}</h4><p class="text-[11px] text-slate-500">${lp?`Last Paid: <b>${lp.date}</b> (${lp.month} • ${lp.mode})`:`Running • Next Due: ${s.nextDueDate||'N/A'}`}</p></div><span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-xs font-extrabold">${formatINR(s.totalPaid)} Paid</span></div>`;
    }).join(''):'<p class="bg-white p-6 rounded-2xl text-center text-xs text-slate-400">No paid students yet.</p>';
  }else{
    box.innerHTML=receipts.length?receipts.map(f=>`
      <div onclick="showReceiptModal(${JSON.stringify(f).replace(/"/g,'&quot;')})" class="bg-white rounded-2xl border p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50">
        <div><h4 class="font-bold text-sm">${f.studentName}</h4><p class="text-[11px] text-slate-500">${f.date} • ${f.month} • ${f.mode}</p><p class="text-[10px] text-indigo-600 font-bold">${f.receiptNo} (Tap for Receipt)</p></div>
        <span class="font-extrabold text-sm text-emerald-600">+${formatINR(f.amount)}</span>
      </div>`).join(''):'<p class="bg-white p-6 rounded-2xl text-center text-xs text-slate-400">No receipts yet.</p>';
  }
}

function getMergedBatches(){
  const bMap={};
  (appData.batches||[]).forEach(b=>{bMap[b.name]={...b,count:0,pending:0};});
  appData.students.forEach(s=>{if(!bMap[s.batch])bMap[s.batch]={id:'AUTO',name:s.batch,timing:'',defaultFee:s.monthlyFee,subject:'',count:0,pending:0};bMap[s.batch].count++;bMap[s.batch].pending+=s.pendingFee;});
  return Object.values(bMap);
}

function renderBatches(){
  const list=getMergedBatches();
  document.getElementById('batches-grid').innerHTML=list.length?list.map(b=>{
    const enc=encodeURIComponent(b.name);
    return`<div class="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <div class="flex justify-between items-start gap-2">
        <div onclick="openBatchStudents('${enc}')" class="cursor-pointer min-w-0">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700">${b.timing||'Batch'}</span>
          <h3 class="font-extrabold text-base mt-1 text-slate-800 truncate">${b.name}</h3>
          <p class="text-[11px] text-slate-400 truncate">${b.subject||'General'}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" onclick="openBatchModal('${enc}')" class="bg-indigo-50 text-indigo-600 p-2 rounded-xl text-xs" title="Edit Batch"><i class="fa-solid fa-pen"></i></button>
          <button type="button" onclick="confirmDeleteBatch('${b.id}','${enc}')" class="bg-rose-50 text-rose-600 p-2 rounded-xl text-xs" title="Delete Batch"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl">
        <div><p class="text-[10px] text-slate-400">Students</p><b class="text-indigo-600">${b.count}</b></div>
        <div><p class="text-[10px] text-slate-400">Fee/Mo</p><b>${formatINR(b.defaultFee)}</b></div>
        <div><p class="text-[10px] text-slate-400">Pending</p><b class="text-rose-600">${formatINR(b.pending)}</b></div>
      </div>
      <button type="button" onclick="openBatchStudents('${enc}')" class="w-full bg-indigo-50 text-indigo-700 py-2 rounded-xl text-xs font-bold">View Students in Batch →</button>
    </div>`;
  }).join(''):'<div class="col-span-full bg-white p-8 rounded-2xl text-center text-xs text-slate-400">No batches yet. Tap "+ Create Batch"!</div>';
}

function openBatchStudents(encName){document.getElementById('stu-batch-filter').value=decodeURIComponent(encName);switchTab('students');renderStudentsList();}

function openBatchModal(encName){
  if(encName){
    const name=decodeURIComponent(encName),b=getMergedBatches().find(x=>x.name===name);
    editingBatch={id:b?b.id:'AUTO',oldName:name};
    document.getElementById('bat-modal-title').innerText='Edit Batch';
    document.getElementById('bat-submit-btn').innerText='Update Batch';
    document.getElementById('inp-bat-name').value=b?b.name:name;
    document.getElementById('inp-bat-time').value=b?(b.timing||''):'';
    document.getElementById('inp-bat-fee').value=b?(b.defaultFee||0):0;
    document.getElementById('inp-bat-sub').value=b?(b.subject||''):'';
  }else{
    editingBatch=null;
    document.getElementById('bat-modal-title').innerText='Create New Batch';
    document.getElementById('bat-submit-btn').innerText='Create Batch';
    ['inp-bat-name','inp-bat-time','inp-bat-fee','inp-bat-sub'].forEach(i=>document.getElementById(i).value='');
  }
  openModal('modal-batch');
}

function submitBatchForm(e){
  e.preventDefault();
  const p={name:document.getElementById('inp-bat-name').value,timing:document.getElementById('inp-bat-time').value,defaultFee:document.getElementById('inp-bat-fee').value,subject:document.getElementById('inp-bat-sub').value,currentDate:document.getElementById('att-date').value};
  closeModal('modal-batch');showLoader(true);
  if(editingBatch){p.id=editingBatch.id;p.oldName=editingBatch.oldName;Backend.editBatch(p,data=>{appData=data;renderAll();showLoader(false);showToast('Batch updated!');},err=>{showLoader(false);showToast(err.message,true);});}
  else{Backend.addBatch(p,data=>{appData=data;renderAll();showLoader(false);showToast('Batch created!');},err=>{showLoader(false);showToast(err.message,true);});}
}

function confirmDeleteBatch(id,encName){
  const name=decodeURIComponent(encName);
  if(!confirm(`Delete batch "${name}"? Students in this batch will be moved to "General".`))return;
  showLoader(true);
  Backend.deleteBatch(id,name,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast('Batch deleted');},err=>{showLoader(false);showToast(err.message,true);});
}

function renderStudentsList(){
  const q=document.getElementById('stu-search').value.toLowerCase(),bf=document.getElementById('stu-batch-filter').value,ff=document.getElementById('stu-fee-filter').value;
  const list=appData.students.filter(s=>(s.name.toLowerCase().includes(q)||s.fatherName.toLowerCase().includes(q)||s.fatherPhone.includes(q))&&(bf==='ALL'||s.batch===bf)&&(ff==='ALL'||(ff==='OVERDUE'&&s.isOverdue)||(ff==='PENDING'&&s.pendingFee>0)||(ff==='PAID'&&s.pendingFee<=0)));
  const box=document.getElementById('students-grid');
  if(!list.length)return box.innerHTML='<div class="bg-white p-8 rounded-2xl text-center text-xs text-slate-400">No students found.</div>';

  const groups={};
  list.forEach(s=>{if(!groups[s.batch])groups[s.batch]=[];groups[s.batch].push(s);});
  box.innerHTML=Object.keys(groups).sort().map(bName=>`
    <div class="space-y-2.5">
      <h3 class="font-extrabold text-xs uppercase tracking-wider text-indigo-700 px-1 flex items-center gap-1.5"><i class="fa-solid fa-layer-group"></i> ${bName} (${groups[bName].length})</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${groups[bName].map(s=>{
          const cardCls=s.isOverdue?'border-2 border-rose-400 bg-rose-50/70':'border border-slate-200 bg-white';
          const badge=s.isOverdue?`<span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-600 text-white">OVERDUE • Due ${s.nextDueDate}</span>`:(s.pendingFee>0?`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">DUE ${formatINR(s.pendingFee)}</span>`:`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">CLEAR • Next ${s.nextDueDate||'N/A'}</span>`);
          return`<div class="rounded-2xl p-3.5 shadow-sm space-y-2.5 ${cardCls}">
            <div class="flex justify-between items-start"><div class="min-w-0"><div class="flex flex-wrap gap-1">${badge} <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">${calcTenure(s.joiningDate)}</span></div><h4 onclick="openStudentDetail('${s.id}')" class="font-extrabold text-base mt-1 truncate cursor-pointer">${s.name}</h4><p class="text-[11px] text-slate-500">Joined: ${s.joiningDate||'N/A'} (${s.joinedClass||s.batch})</p><p class="text-[11px] text-slate-500 truncate">${s.fatherName||'Parent'}: <b>${s.fatherPhone||'N/A'}</b></p></div><button type="button" onclick="openStudentDetail('${s.id}')" class="p-2 bg-white/80 rounded-xl text-xs"><i class="fa-solid fa-eye"></i></button></div>
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center text-xs"><div><p class="text-[10px] text-slate-400">Paid</p><b class="text-emerald-600">${formatINR(s.totalPaid)}</b></div><div><p class="text-[10px] text-slate-400">Pending</p><b class="${s.pendingFee>0?'text-rose-600':'text-slate-600'}">${formatINR(s.pendingFee)}</b></div><div><p class="text-[10px] text-slate-400">Abs/Leave</p><b class="text-amber-600">${s.absentDays}A / ${s.leaveDays}L</b></div></div>
            <div class="flex gap-2"><button type="button" onclick="openFeeModal('${s.id}')" class="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold">+ Pay Fee</button>${s.pendingFee>0?`<button type="button" onclick="sendWhatsApp('${s.id}','fee')" class="px-3 bg-green-100 text-green-700 rounded-xl text-xs font-bold"><i class="fa-brands fa-whatsapp"></i></button>`:''}<button type="button" onclick="openStudentDetail('${s.id}')" class="px-3 bg-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold">Profile</button></div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

function openAdmissionModal(){
  const sel=document.getElementById('inp-stu-batch-sel'),bList=getMergedBatches();
  sel.innerHTML=bList.map(b=>`<option value="${b.name}" data-fee="${b.defaultFee||0}">${b.name}</option>`).join('')+'<option value="__NEW__">+ Create / Type New Batch</option>';
  onAdmissionBatchChange();openModal('modal-add-student');
}
function onAdmissionBatchChange(){
  const sel=document.getElementById('inp-stu-batch-sel'),cust=document.getElementById('inp-stu-batch-custom');
  if(sel.value==='__NEW__'){cust.classList.remove('hidden');cust.required=true;}
  else{cust.classList.add('hidden');cust.required=false;const opt=sel.options[sel.selectedIndex];if(opt&&opt.dataset.fee&&Number(opt.dataset.fee)>0)document.getElementById('inp-stu-fee').value=opt.dataset.fee;}
}

function openStudentDetail(id){
  activeDetailStudentId=id;const s=appData.students.find(x=>x.id===id);if(!s)return;
  document.getElementById('det-avatar').innerText=s.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('det-name').innerText=s.name;
  document.getElementById('det-meta').innerText=`${s.id} • ${s.batch} • ${calcTenure(s.joiningDate)}`;
  setDetTab('profile');openModal('modal-stu-detail');
}
function setDetTab(tab){
  ['profile','fees','tests'].forEach(t=>{document.getElementById('dmod-'+t).className=t===tab?'flex-1 py-2.5 bg-white text-indigo-600 border-b-2 border-indigo-600':'flex-1 py-2.5 text-slate-500';});
  const s=appData.students.find(x=>x.id===activeDetailStudentId),box=document.getElementById('det-content');
  if(tab==='profile'){
    box.innerHTML=`<div class="grid grid-cols-2 gap-2 text-xs"><div class="bg-indigo-50 p-2.5 rounded-xl"><p class="text-[10px] text-indigo-500 font-bold">JOINING DATE</p><b>${s.joiningDate||'Not Set'}</b></div><div class="bg-purple-50 p-2.5 rounded-xl"><p class="text-[10px] text-purple-500 font-bold">DURATION</p><b>${calcTenure(s.joiningDate)}</b></div><div class="bg-slate-50 p-2.5 rounded-xl"><p class="text-[10px] text-slate-400 font-bold">JOINED CLASS</p><b>${s.joinedClass||s.batch}</b></div><div class="bg-slate-50 p-2.5 rounded-xl"><p class="text-[10px] text-slate-400 font-bold">NEXT DUE DATE</p><b class="${s.isOverdue?'text-rose-600':''}">${s.nextDueDate||'N/A'}</b></div></div><div class="border rounded-xl p-3 text-xs space-y-1"><div><b>Father:</b> ${s.fatherName||'N/A'} (${s.fatherPhone||'N/A'})</div><div><b>Mother:</b> ${s.motherName||'N/A'} (${s.motherPhone||'N/A'})</div><div><b>Address:</b> ${s.address||'N/A'}</div></div><div class="flex gap-2"><button type="button" onclick="sendWhatsApp('${s.id}','fee')" class="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold">WhatsApp Parent</button><button type="button" onclick="confirmDeleteStudent('${s.id}')" class="px-4 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-bold">Remove</button></div>`;
  }else if(tab==='fees'){
    const mf=appData.recentFees.filter(f=>f.studentId===s.id);
    box.innerHTML=`<div class="grid grid-cols-3 gap-2 text-center text-xs"><div class="bg-slate-50 p-2 rounded-xl">Billed<br><b>${formatINR(s.totalPayable)}</b></div><div class="bg-emerald-50 p-2 rounded-xl">Paid<br><b class="text-emerald-600">${formatINR(s.totalPaid)}</b></div><div class="bg-rose-50 p-2 rounded-xl">Pending<br><b class="text-rose-600">${formatINR(s.pendingFee)}</b></div></div><div class="grid grid-cols-2 gap-2 text-xs"><div><label class="text-[10px] text-slate-400 font-bold">MANUAL PAYABLE ₹</label><input type="number" id="det-payable-inp" value="${s.manualPayable||0}" class="w-full border rounded-xl px-2.5 py-1.5 font-bold"></div><div><label class="text-[10px] text-slate-400 font-bold">DISCOUNT ₹</label><input type="number" id="det-discount-inp" value="${s.discount||0}" class="w-full border rounded-xl px-2.5 py-1.5 font-bold"></div></div><button type="button" onclick="saveUpdatedBilling()" class="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">Update Billing / Discount</button><div class="divide-y max-h-36 overflow-y-auto">${mf.length?mf.map(f=>`<div class="py-2 flex justify-between text-xs"><span>${f.date} • ${f.month}</span><b class="text-emerald-600">+${formatINR(f.amount)}</b></div>`).join(''):'<p class="text-center text-xs text-slate-400 py-3">No payments.</p>'}</div>`;
  }else{
    const mm=appData.testMarks.filter(m=>m.studentId===s.id);
    box.innerHTML=mm.length?`<div class="divide-y">${mm.map(m=>`<div class="py-2 flex justify-between text-xs"><div><b>${m.testName}</b><p class="text-[10px] text-slate-400">${m.date}</p></div><div class="text-right"><b class="text-purple-700">${m.obtained}/${m.maxMarks}</b><p class="text-[10px]">${Math.round((m.obtained/m.maxMarks)*100)}%</p></div></div>`).join('')}</div>`:'<p class="text-center text-xs text-slate-400 py-6">No test marks yet.</p>';
  }
}

function renderTestsList(){
  const df=document.getElementById('test-date-filter')?.value||'',bf=document.getElementById('test-batch-filter')?.value||'ALL';
  const list=appData.tests.filter(t=>(!df||t.date===df)&&(bf==='ALL'||t.batch===bf));
  document.getElementById('tests-grid').innerHTML=list.length?list.map(t=>{
    const m=appData.testMarks.filter(x=>x.testId===t.testId),avg=m.length?Math.round(m.reduce((a,b)=>a+b.obtained,0)/m.length):0;
    return`<div onclick="openTestView('${t.testId}')" class="bg-white rounded-2xl border p-4 cursor-pointer space-y-2"><span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">${t.subject} • ${t.batch}</span><div class="flex justify-between"><h3 class="font-extrabold text-sm">${t.testName}</h3><span class="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">Max ${t.maxMarks}</span></div><div class="pt-2 border-t flex justify-between text-xs font-bold text-slate-500"><span><i class="fa-regular fa-calendar mr-1"></i>${t.date}</span><span class="text-purple-600">Avg: ${avg}/${t.maxMarks} →</span></div></div>`;
  }).join(''):'<div class="col-span-full bg-white p-8 rounded-2xl text-center text-xs text-slate-400">No tests found for selected date/batch.</div>';
}
function openNewTestModal(){if(!appData.students.length)return showToast('Add students first',true);renderTestMarksInputs();openModal('modal-new-test');}
function renderTestMarksInputs(){const b=document.getElementById('inp-test-batch').value,list=appData.students.filter(s=>b==='ALL'||s.batch===b);document.getElementById('test-marks-inputs').innerHTML=list.map(s=>`<div class="flex justify-between items-center p-2"><span class="text-xs font-bold">${s.name}</span><input type="number" data-stuid="${s.id}" data-stuname="${s.name}" min="0" placeholder="Marks" class="test-mark-inp w-20 border rounded-lg px-2 py-1 text-xs font-bold text-center"></div>`).join('');}
function submitTestMarks(e){e.preventDefault();const ml=[];document.querySelectorAll('.test-mark-inp').forEach(i=>{if(i.value!=='')ml.push({studentId:i.dataset.stuid,studentName:i.dataset.stuname,obtained:Number(i.value)});});if(!ml.length)return showToast('Enter marks for at least 1 student',true);closeModal('modal-new-test');showLoader(true);Backend.saveTestWithMarks({testName:document.getElementById('inp-test-name').value,subject:document.getElementById('inp-test-sub').value,batch:document.getElementById('inp-test-batch').value,maxMarks:Number(document.getElementById('inp-test-max').value)||100,date:document.getElementById('inp-test-date').value,marksList:ml,currentDate:document.getElementById('att-date').value},data=>{appData=data;renderAll();e.target.reset();showLoader(false);showToast('Test saved!');},e=>{showLoader(false);showToast(e.message,true);});}

function openTestView(tid){activeTestId=tid;setTestViewTab('all');openModal('modal-test-view');}
function setTestViewTab(tab){
  currentTestTab=tab;const t=appData.tests.find(x=>x.testId===activeTestId);if(!t)return;
  const allMarks=appData.testMarks.filter(m=>m.testId===activeTestId).sort((a,b)=>b.obtained-a.obtained);
  const passed=allMarks.filter(m=>(m.obtained/t.maxMarks)*100>=40),failed=allMarks.filter(m=>(m.obtained/t.maxMarks)*100<40);
  document.getElementById('vtab-all').innerText=`All (${allMarks.length})`;
  document.getElementById('vtab-pass').innerText=`Passed (${passed.length})`;
  document.getElementById('vtab-fail').innerText=`Low Score (${failed.length})`;
  document.getElementById('vtab-all').className=tab==='all'?'bg-indigo-600 text-white py-2 rounded-xl text-[11px] font-extrabold':'bg-white text-slate-600 py-2 rounded-xl text-[11px] font-extrabold';
  document.getElementById('vtab-pass').className=tab==='pass'?'bg-emerald-600 text-white py-2 rounded-xl text-[11px] font-extrabold':'bg-white text-emerald-700 py-2 rounded-xl text-[11px] font-extrabold';
  document.getElementById('vtab-fail').className=tab==='fail'?'bg-rose-600 text-white py-2 rounded-xl text-[11px] font-extrabold':'bg-white text-rose-600 py-2 rounded-xl text-[11px] font-extrabold';
  document.getElementById('vt-title').innerText=t.testName;
  document.getElementById('vt-meta').innerText=`${t.date} • ${t.subject} • Max ${t.maxMarks}`;
  const list=tab==='pass'?passed:(tab==='fail'?failed:allMarks);
  document.getElementById('vt-body').innerHTML=list.length?list.map((m,i)=>{
    const pct=Math.round((m.obtained/t.maxMarks)*100);
    return`<div class="py-2.5 flex justify-between items-center text-xs"><div><span class="px-1.5 py-0.5 rounded bg-slate-100 font-bold mr-1.5">#${i+1}</span><b>${m.studentName}</b></div><div class="flex items-center gap-2"><span class="font-extrabold ${pct>=40?'text-emerald-600':'text-rose-600'}">${m.obtained}/${t.maxMarks} (${pct}%)</span><button type="button" onclick="sendTestWhatsApp('${m.studentId}','${encodeURIComponent(t.testName)}',${m.obtained},${t.maxMarks})" class="bg-green-50 text-green-600 p-1.5 rounded-lg"><i class="fa-brands fa-whatsapp"></i></button></div></div>`;
  }).join(''):'<p class="p-6 text-center text-xs text-slate-400">No students in this list.</p>';
  document.getElementById('vt-del-btn').onclick=()=>{if(!confirm('Delete test?'))return;closeModal('modal-test-view');showLoader(true);Backend.deleteTest(activeTestId,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast('Deleted');},e=>{showLoader(false);showToast(e.message,true);});};
}

function renderReports(){
  const ms=getMonthlyStats(),tm=ms[5],lm=ms[4],fd=tm.feeSum-lm.feeSum,sd=tm.stuCount-lm.stuCount;
  document.getElementById('rep-this-fee').innerText=formatINR(tm.feeSum);document.getElementById('rep-last-fee').innerText=formatINR(lm.feeSum);
  document.getElementById('rep-fee-badge').innerText=(fd>=0?'+':'')+formatINR(fd);
  const mf=Math.max(...ms.map(m=>m.feeSum),1);
  document.getElementById('rep-fee-bars').innerHTML=ms.map(m=>`<div><div class="flex justify-between text-xs font-bold"><span>${m.label}</span><span>${formatINR(m.feeSum)}</span></div><div class="w-full h-2 bg-slate-100 rounded-full"><div class="h-full bg-emerald-500 rounded-full" style="width:${Math.round((m.feeSum/mf)*100)}%"></div></div></div>`).join('');
  document.getElementById('rep-this-stu').innerText=tm.stuCount;document.getElementById('rep-last-stu').innerText=lm.stuCount;
  document.getElementById('rep-stu-badge').innerText=(sd>=0?'+':'')+sd;
  const mstu=Math.max(...ms.map(m=>m.stuCount),1);
  document.getElementById('rep-stu-bars').innerHTML=ms.map(m=>`<div><div class="flex justify-between text-xs font-bold"><span>${m.label}</span><span>${m.stuCount}</span></div><div class="w-full h-2 bg-slate-100 rounded-full"><div class="h-full bg-indigo-500 rounded-full" style="width:${Math.round((m.stuCount/mstu)*100)}%"></div></div></div>`).join('');
}

function submitNewStudent(e){
  e.preventDefault();
  const sel=document.getElementById('inp-stu-batch-sel'),batchVal=sel.value==='__NEW__'?document.getElementById('inp-stu-batch-custom').value:sel.value;
  closeModal('modal-add-student');showLoader(true);
  Backend.addStudent({name:document.getElementById('inp-stu-name').value,batch:batchVal||'General',joinedClass:document.getElementById('inp-stu-jclass').value,joiningDate:document.getElementById('inp-stu-jdate').value,fatherName:document.getElementById('inp-stu-fname').value,fatherPhone:document.getElementById('inp-stu-fphone').value,motherName:document.getElementById('inp-stu-mname').value,motherPhone:document.getElementById('inp-stu-mphone').value,studentPhone:document.getElementById('inp-stu-fphone').value,monthlyFee:document.getElementById('inp-stu-fee').value,openingPayable:document.getElementById('inp-stu-payable').value,address:document.getElementById('inp-stu-addr').value,currentDate:document.getElementById('att-date').value},data=>{appData=data;renderAll();e.target.reset();document.getElementById('inp-stu-jdate').value=todayISO;document.getElementById('inp-stu-payable').value=0;showLoader(false);showToast('Admission saved!');},err=>{showLoader(false);showToast(err.message,true);});
}
function openFeeModal(id){if(!appData.students.length)return showToast('Add students first',true);const s=document.getElementById('inp-fee-student');s.innerHTML=appData.students.map(x=>`<option value="${x.id}">${x.name} (${x.batch}) - Due ₹${x.pendingFee}</option>`).join('');if(id)s.value=id;onFeeStudentSelect();openModal('modal-collect-fee');}
function onFeeStudentSelect(){const s=appData.students.find(x=>x.id===document.getElementById('inp-fee-student').value);if(s){document.getElementById('fee-stu-balance-hint').innerText=`Pending: ${formatINR(s.pendingFee)} | Monthly: ${formatINR(s.monthlyFee)}`;document.getElementById('inp-fee-amount').value=s.pendingFee>0?s.pendingFee:s.monthlyFee;}}
function submitFee(e){e.preventDefault();const id=document.getElementById('inp-fee-student').value,s=appData.students.find(x=>x.id===id);closeModal('modal-collect-fee');showLoader(true);Backend.recordFee({studentId:id,studentName:s?s.name:'',amount:document.getElementById('inp-fee-amount').value,mode:document.getElementById('inp-fee-mode').value,month:document.getElementById('inp-fee-month').value,date:document.getElementById('inp-fee-date').value,currentDate:document.getElementById('att-date').value},data=>{appData=data;renderAll();showLoader(false);showToast('Receipt saved!');if(data.lastReceipt)showReceiptModal(data.lastReceipt);},err=>{showLoader(false);showToast(err.message,true);});}

function showReceiptModal(r){
  document.getElementById('receipt-body').innerHTML=`
    <div class="text-center border-b pb-3"><h4 class="font-extrabold text-base text-slate-800">${appData.instituteName}</h4><p class="text-[11px] text-slate-400">Official Tuition Fee Receipt</p></div>
    <div class="space-y-1.5 bg-slate-50 p-3 rounded-xl">
      <div class="flex justify-between"><span>Receipt No:</span><b>${r.receiptNo}</b></div>
      <div class="flex justify-between"><span>Date:</span><b>${r.date}</b></div>
      <div class="flex justify-between"><span>Student:</span><b>${r.studentName}</b></div>
      <div class="flex justify-between"><span>Month:</span><b>${r.month}</b></div>
      <div class="flex justify-between"><span>Mode:</span><b>${r.mode}</b></div>
      <div class="flex justify-between text-sm pt-2 border-t"><b>Amount Paid:</b><b class="text-emerald-600">${formatINR(r.amount)}</b></div>
    </div>
    <button type="button" onclick="sendReceiptWhatsApp('${r.studentId}','${r.receiptNo}',${r.amount},'${encodeURIComponent(r.month)}','${r.date}')" class="w-full bg-green-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"><i class="fa-brands fa-whatsapp text-base"></i> Send Receipt on WhatsApp</button>
  `;
  openModal('modal-receipt');
}

function runMonthlyBilling(){const b=document.getElementById('bill-batch-select').value;if(!confirm('Add extra monthly fee to students?'))return;showLoader(true);Backend.billNewMonth(b,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast(`Billed ${data.billedCount} students!`);},e=>{showLoader(false);showToast(e.message,true);});}
function saveUpdatedBilling(){closeModal('modal-stu-detail');showLoader(true);Backend.updateStudentBilling(activeDetailStudentId,document.getElementById('det-payable-inp').value,document.getElementById('det-discount-inp').value,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast('Billing updated!');},e=>{showLoader(false);showToast(e.message,true);});}
function confirmDeleteStudent(id){if(!confirm('Remove student?'))return;closeModal('modal-stu-detail');showLoader(true);Backend.deleteStudent(id,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast('Removed');},e=>{showLoader(false);showToast(e.message,true);});}
function openEditInstitute(){const n=prompt('Institute Name:',appData.instituteName);if(n&&n.trim()){showLoader(true);Backend.saveInstituteName(n,document.getElementById('att-date').value,data=>{appData=data;renderAll();showLoader(false);showToast('Updated!');},e=>{showLoader(false);showToast(e.message,true);});}}

function getPhone(id){const s=appData.students.find(x=>x.id===id),rp=(s&&(s.fatherPhone||s.studentPhone||s.motherPhone))||'';let ph=rp.replace(/\D/g,'');if(ph.length===10)ph='91'+ph;return{s,ph};}
function sendWhatsApp(id,type){
  const {s,ph}=getPhone(id);if(!ph)return showToast('No phone saved',true);
  const msg=type==='absent'?`Hello, *${s.name}* (${s.batch}) is marked *ABSENT* today (${document.getElementById('att-date').value}) at *${appData.instituteName}*.`:`Hello, gentle fee reminder from *${appData.instituteName}* for *${s.name}* (${s.batch}).\nPending Fee: *₹${s.pendingFee}*\nDue Date: ${s.nextDueDate||'Immediate'}\nThank you!`;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,'_blank');
}
function sendReceiptWhatsApp(id,recNo,amt,encMo,dt){
  const {s,ph}=getPhone(id);if(!ph)return showToast('No phone saved',true);
  const msg=`*${appData.instituteName}*\nFee Receipt: *${recNo}*\nStudent: *${s?s.name:''}*\nAmount Paid: *₹${amt}*\nMonth: ${decodeURIComponent(encMo)}\nDate: ${dt}\nRemaining Balance: ₹${s?s.pendingFee:0}\nThank you!`;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,'_blank');
}
function sendTestWhatsApp(id,encTName,obt,max){
  const {s,ph}=getPhone(id);if(!ph)return showToast('No phone saved',true);
  const pct=Math.round((obt/max)*100);
  const msg=`*${appData.instituteName}* - Test Result\nStudent: *${s?s.name:''}*\nTest: *${decodeURIComponent(encTName)}*\nMarks: *${obt}/${max} (${pct}%)*`;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,'_blank');
}

document.addEventListener('DOMContentLoaded',()=>{
  ['att-date','inp-fee-date','inp-stu-jdate','inp-leave-from','inp-leave-to','inp-test-date'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=todayISO;});
  const m=["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById('inp-fee-month').value=m[nowD.getMonth()]+' '+nowD.getFullYear();
  if(!gasUrl){document.getElementById('demo-banner').classList.remove('hidden');fetchData(todayISO);openModal('modal-connect');}
  else{document.getElementById('inp-gas-url').value=gasUrl;fetchData(todayISO);}
});
