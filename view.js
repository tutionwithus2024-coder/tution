// ===== 1. DASHBOARD =====
function renderDashboard() {
  const fs = computeFeeSystem();
  const today = todayLocal(), curYM = currentYM(), curYr = curYM.slice(0, 4);
  const activeStu = DB.students.filter(s => s.status === 'Active');
  const leftStu = DB.students.filter(s => s.status === 'Left');
  const admMonth = DB.students.filter(s => s.joiningDate && s.joiningDate.startsWith(curYM)).length;
  const admYear = DB.students.filter(s => s.joiningDate && s.joiningDate.startsWith(curYr)).length;
  const todayAtt = DB.attendance.filter(a => a.date === today);
  const tPres = todayAtt.filter(a => a.status === 'Present').length;
  const tAbs = todayAtt.filter(a => a.status === 'Absent').length;
  const tLeave = todayAtt.filter(a => a.status === 'Leave').length;

  $('sec-dashboard').innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div onclick="navTo('students',{stuStatus:'Active'})" class="navy-card text-white p-4 rounded-2xl cursor-pointer hover:opacity-95 transition">
        <div class="flex justify-between items-start"><span class="text-[11px] font-bold uppercase text-amber-300">Active Students</span><i class="fa-solid fa-user-graduate text-amber-400"></i></div>
        <h3 class="text-2xl font-extrabold mt-1">${activeStu.length}</h3>
        <p class="text-[11px] text-slate-300 mt-1">+${admMonth} this mo • ${admYear} this yr • ${leftStu.length} Left</p>
      </div>
      <div onclick="navTo('batches')" class="card-soft p-4 rounded-2xl cursor-pointer hover:border-amber-400 transition">
        <div class="flex justify-between items-start"><span class="text-[11px] font-bold uppercase text-slate-400">Total Batches</span><i class="fa-solid fa-layer-group text-[#0F172A]"></i></div>
        <h3 class="text-2xl font-extrabold mt-1 text-[#0F172A]">${DB.batches.length}</h3>
        <p class="text-[11px] text-slate-500 mt-1">${DB.batches.filter(b=>b.status==='Active').length} Active Batches →</p>
      </div>
      <div onclick="navTo('attendance')" class="card-soft p-4 rounded-2xl cursor-pointer hover:border-amber-400 transition">
        <div class="flex justify-between items-start"><span class="text-[11px] font-bold uppercase text-slate-400">Today's Attendance</span><i class="fa-solid fa-calendar-check text-sky-600"></i></div>
        <h3 class="text-2xl font-extrabold mt-1 text-emerald-600">${tPres} <span class="text-xs font-semibold text-slate-400">Pres</span></h3>
        <p class="text-[11px] text-slate-500 mt-1">${tAbs} Absent • ${tLeave} Leave →</p>
      </div>
      <div onclick="navTo('fees',{feeStatus:'ALL',feeSub:'records'})" class="card-soft p-4 rounded-2xl cursor-pointer hover:border-amber-400 transition">
        <div class="flex justify-between items-start"><span class="text-[11px] font-bold uppercase text-slate-400">Fees Overview</span><i class="fa-solid fa-indian-rupee-sign text-amber-500"></i></div>
        <h3 class="text-xl font-extrabold mt-1 text-emerald-600">${fmtINR(fs.totalReceived)}</h3>
        <p class="text-[11px] text-rose-600 font-semibold mt-1">Pending: ${fmtINR(fs.totalPending)} / Exp: ${fmtINR(fs.totalExpected)}</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <button type="button" onclick="navTo('fees',{feeStatus:'Paid',feeSub:'students'})" class="card-soft p-3 rounded-2xl text-left hover:border-emerald-400 transition">
        <span class="text-[10px] font-bold uppercase text-emerald-600">Paid Students</span>
        <p class="text-lg font-extrabold text-slate-800">${fs.paidCount}</p>
      </button>
      <button type="button" onclick="navTo('fees',{feeStatus:'Partial',feeSub:'students'})" class="card-soft p-3 rounded-2xl text-left hover:border-amber-400 transition">
        <span class="text-[10px] font-bold uppercase text-amber-600">Partial Paid</span>
        <p class="text-lg font-extrabold text-slate-800">${fs.partialCount}</p>
      </button>
      <button type="button" onclick="navTo('fees',{feeStatus:'Unpaid',feeSub:'students'})" class="card-soft p-3 rounded-2xl text-left hover:border-rose-400 transition">
        <span class="text-[10px] font-bold uppercase text-rose-600">Unpaid Students</span>
        <p class="text-lg font-extrabold text-slate-800">${fs.unpaidCount}</p>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div onclick="navTo('reports')" class="card-soft p-4 rounded-2xl cursor-pointer">
        <h3 class="font-bold text-sm text-[#0F172A] mb-3">Monthly Admissions (Last 6 Months)</h3>
        <div class="h-52"><canvas id="ch-dash-adm"></canvas></div>
      </div>
      <div onclick="navTo('fees')" class="card-soft p-4 rounded-2xl cursor-pointer">
        <h3 class="font-bold text-sm text-[#0F172A] mb-3">Monthly Fee Collection (Last 6 Months)</h3>
        <div class="h-52"><canvas id="ch-dash-fee"></canvas></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card-soft rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b flex justify-between items-center"><h3 class="font-bold text-sm">Recent Admissions</h3><button type="button" onclick="navTo('students')" class="text-xs font-bold text-amber-600">View All</button></div>
        <div class="divide-y max-h-60 overflow-y-auto">${DB.students.slice(-6).reverse().map(s => `<div onclick="openStudentProfile('${s.admNo}')" class="px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50"><div><p class="font-bold text-xs">${s.name} <span class="text-slate-400">(${s.admNo})</span></p><p class="text-[10px] text-slate-500">${s.studentClass} • Joined ${s.joiningDate}</p></div><span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">${s.status}</span></div>`).join('') || '<p class="p-6 text-center text-xs text-slate-400">No admissions yet.</p>'}</div>
      </div>
      <div class="card-soft rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b flex justify-between items-center"><h3 class="font-bold text-sm">Recent Fee Payments</h3><button type="button" onclick="navTo('fees',{feeSub:'receipts'})" class="text-xs font-bold text-amber-600">View All</button></div>
        <div class="divide-y max-h-60 overflow-y-auto">${DB.fees.slice(0, 6).map(f => `<div onclick="openStudentProfile('${f.admNo}')" class="px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50"><div><p class="font-bold text-xs">${f.studentName}</p><p class="text-[10px] text-slate-500">${f.paymentDate} • ${f.feeMonth} (${f.mode})</p></div><span class="font-extrabold text-xs text-emerald-600">+${fmtINR(f.amount)}</span></div>`).join('') || '<p class="p-6 text-center text-xs text-slate-400">No fee payments recorded yet.</p>'}</div>
      </div>
    </div>
  `;

  const now = new Date(), labels = [], admData = [], feeData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    labels.push(MONTHS_SHORT[d.getMonth()]);
    admData.push(DB.students.filter(s => s.joiningDate && s.joiningDate.startsWith(ym)).length);
    feeData.push(DB.fees.filter(f => f.paymentDate && f.paymentDate.startsWith(ym)).reduce((a, b) => a + b.amount, 0));
  }
  makeChart('ch-dash-adm', { type: 'bar', data: { labels, datasets: [{ label: 'Admissions', data: admData, backgroundColor: '#0F172A', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  makeChart('ch-dash-fee', { type: 'line', data: { labels, datasets: [{ label: 'Collected ₹', data: feeData, borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.18)', fill: true, tension: 0.35 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

// ===== 2. STUDENTS MANAGEMENT =====
function renderStudents() {
  const fs = computeFeeSystem();
  const classes = [...new Set(DB.students.map(s => s.studentClass).filter(Boolean))].sort();
  const batchNames = DB.batches.map(b => b.name);
  const filtered = fs.studentSummaries.filter(s => {
    const mq = !stuFilter.q || s.name.toLowerCase().includes(stuFilter.q) || s.admNo.toLowerCase().includes(stuFilter.q) || s.parentPhone.includes(stuFilter.q) || s.studentPhone.includes(stuFilter.q);
    const mc = stuFilter.cls === 'ALL' || s.studentClass === stuFilter.cls;
    const mb = stuFilter.batch === 'ALL' || s.batches.includes(stuFilter.batch);
    const ms = stuFilter.status === 'ALL' || s.status === stuFilter.status;
    return mq && mc && mb && ms;
  });

  $('sec-students').innerHTML = `
    <div class="card-soft p-3.5 rounded-2xl space-y-3">
      <div class="flex flex-col sm:flex-row gap-2">
        <input type="text" value="${stuFilter.q}" oninput="stuFilter.q=this.value.toLowerCase();renderStudents()" placeholder="Search name, admission no, phone..." class="flex-1 border rounded-xl px-3 py-2 text-xs">
        <div class="grid grid-cols-2 gap-2">
          <select onchange="stuFilter.cls=this.value;renderStudents()" class="border rounded-xl px-2.5 py-2 text-xs font-bold bg-white"><option value="ALL">All Classes</option>${classes.map(c=>`<option value="${c}" ${stuFilter.cls===c?'selected':''}>${c}</option>`).join('')}</select>
          <select onchange="stuFilter.status=this.value;renderStudents()" class="border rounded-xl px-2.5 py-2 text-xs font-bold bg-white"><option value="ALL" ${stuFilter.status==='ALL'?'selected':''}>All Status</option><option value="Active" ${stuFilter.status==='Active'?'selected':''}>Active</option><option value="Inactive" ${stuFilter.status==='Inactive'?'selected':''}>Inactive</option><option value="Left" ${stuFilter.status==='Left'?'selected':''}>Left</option></select>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button type="button" onclick="stuFilter.batch='ALL';renderStudents()" class="px-3 py-1 rounded-lg text-[11px] font-bold ${stuFilter.batch==='ALL'?'navy-bg text-white':'bg-slate-100 text-slate-600'}">All Batches (${DB.students.length})</button>
        ${batchNames.map(bn => {
          const cnt = DB.students.filter(s => s.batches.includes(bn)).length;
          return `<button type="button" onclick="stuFilter.batch='${bn.replace(/'/g,"\\'")}';renderStudents()" class="px-3 py-1 rounded-lg text-[11px] font-bold ${stuFilter.batch===bn?'navy-bg text-amber-300':'bg-slate-100 text-slate-600'}">${bn} (${cnt})</button>`;
        }).join('')}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${filtered.length ? filtered.map(s => {
        const att = getAttendanceStats(s.admNo);
        const stCol = s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : (s.status === 'Left' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600');
        const feeCol = s.totalPending > 0 ? 'text-rose-600' : 'text-emerald-600';
        return `<div class="card-soft rounded-2xl p-4 space-y-3 hover:border-amber-400 transition">
          <div class="flex justify-between items-start gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              ${s.photoUrl ? `<img src="${s.photoUrl}" class="w-10 h-10 rounded-xl object-cover shrink-0">` : `<div class="w-10 h-10 rounded-xl navy-bg text-amber-400 flex items-center justify-center font-extrabold text-xs shrink-0">${s.name.slice(0,2).toUpperCase()}</div>`}
              <div class="min-w-0">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded ${stCol}">${s.status}</span> <span class="text-[10px] font-bold text-slate-400">${s.admNo}</span>
                <h4 onclick="openStudentProfile('${s.admNo}')" class="font-bold text-sm truncate cursor-pointer hover:text-amber-600">${s.name}</h4>
                <p class="text-[11px] text-slate-500 truncate">${s.studentClass} • ${s.batches.join(', ') || 'No Batch'}</p>
              </div>
            </div>
            <button type="button" onclick="openStudentModal('${s.admNo}')" class="p-1.5 bg-slate-100 rounded-lg text-xs text-slate-600" title="Edit"><i class="fa-solid fa-pen"></i></button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 p-2 rounded-xl">
            <div><span class="text-slate-400 block text-[10px]">Paid</span><b class="text-emerald-600">${fmtINR(s.totalReceived)}</b></div>
            <div><span class="text-slate-400 block text-[10px]">Pending</span><b class="${feeCol}">${fmtINR(s.totalPending)}</b></div>
            <div><span class="text-slate-400 block text-[10px]">Attend</span><b>${att.pct}%</b></div>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="openStudentProfile('${s.admNo}')" class="flex-1 navy-bg text-white py-2 rounded-xl text-xs font-bold">Full Profile</button>
            <button type="button" onclick="openFeeModal('${s.admNo}')" class="px-3 gold-bg text-[#0F172A] rounded-xl text-xs font-extrabold">+ Fee</button>
          </div>
        </div>`;
      }).join('') : '<div class="col-span-full card-soft p-10 rounded-2xl text-center text-xs text-slate-400">No students match your filters. Tap "Add Student" to register!</div>'}
    </div>
  `;
}

let activeProfAdm = null, activeProfTab = 'overview';
function openStudentProfile(admNo, tab = 'overview') {
  activeProfAdm = admNo; activeProfTab = tab;
  const s = computeFeeSystem().studentSummaries.find(x => x.admNo === admNo);
  if (!s) return;
  $('prof-header').innerHTML = `
    <div class="flex items-center gap-3 min-w-0">
      ${s.photoUrl ? `<img src="${s.photoUrl}" class="w-12 h-12 rounded-xl object-cover">` : `<div class="w-12 h-12 rounded-xl gold-bg text-[#0F172A] flex items-center justify-center font-extrabold">${s.name.slice(0,2).toUpperCase()}</div>`}
      <div class="min-w-0"><h3 class="font-extrabold text-base truncate">${s.name}</h3><p class="text-[11px] text-amber-300">${s.admNo} • ${s.studentClass} • ${s.status}</p></div>
    </div>
    <button type="button" onclick="closeModal('modal-student-profile')"><i class="fa-solid fa-xmark text-lg"></i></button>
  `;
  $('prof-tabs').innerHTML = ['overview','fees','attendance','progress'].map(t => `<button type="button" onclick="openStudentProfile('${admNo}','${t}')" class="px-4 py-2.5 capitalize whitespace-nowrap ${t===tab?'bg-white text-[#0F172A] border-b-2 border-amber-500':'text-slate-500'}">${t==='progress'?'Tests & Progress':t}</button>`).join('');

  const body = $('prof-body');
  if (tab === 'overview') {
    body.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">FATHER</span><p class="font-bold">${s.fatherName||'-'}</p></div>
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">MOTHER</span><p class="font-bold">${s.motherName||'-'}</p></div>
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">PARENT PHONE</span><p class="font-bold">${s.parentPhone||'-'}</p></div>
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">STUDENT PHONE</span><p class="font-bold">${s.studentPhone||'-'}</p></div>
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">JOINING DATE</span><p class="font-bold">${s.joiningDate||'-'}</p></div>
        <div class="bg-slate-50 p-2.5 rounded-xl"><span class="text-[10px] text-slate-400 font-bold">MONTHLY FEE</span><p class="font-bold">${fmtINR(s.monthlyFee)}</p></div>
      </div>
      <div class="border rounded-xl p-3 text-xs space-y-1">
        <div><b>Batches:</b> ${s.batches.join(', ') || 'None'}</div>
        <div><b>Subjects:</b> ${s.subjects || '-'}</div>
        <div><b>Address:</b> ${s.address || '-'}</div>
        ${s.leavingDate ? `<div><b>Leaving Date:</b> ${s.leavingDate}</div>` : ''}
        ${s.notes ? `<div><b>Notes:</b> ${s.notes}</div>` : ''}
      </div>
      <div class="flex gap-2">
        <button type="button" onclick="closeModal('modal-student-profile');openStudentModal('${s.admNo}')" class="flex-1 navy-bg text-white py-2.5 rounded-xl text-xs font-bold">Edit Student</button>
        <button type="button" onclick="confirmDeleteStudent('${s.admNo}')" class="px-4 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-bold">Delete</button>
      </div>
    `;
  } else if (tab === 'fees') {
    const recs = computeFeeSystem().records.filter(r => r.admNo === admNo);
    const pays = DB.fees.filter(f => f.admNo === admNo);
    body.innerHTML = `
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-50 p-2.5 rounded-xl">Expected<br><b>${fmtINR(s.totalExpected)}</b></div>
        <div class="bg-emerald-50 p-2.5 rounded-xl">Received<br><b class="text-emerald-600">${fmtINR(s.totalReceived)}</b></div>
        <div class="bg-rose-50 p-2.5 rounded-xl">Pending<br><b class="text-rose-600">${fmtINR(s.totalPending)}</b></div>
      </div>
      <div class="space-y-1.5"><h4 class="font-bold text-xs">Month-Wise Status</h4>${recs.map(r => `<div class="flex justify-between items-center p-2 border rounded-xl text-xs"><div><b>${r.month}</b> <span class="text-slate-400">Exp ${fmtINR(r.expected)} • Paid ${fmtINR(r.received)}</span></div><div class="flex items-center gap-1.5"><span class="px-2 py-0.5 rounded font-bold text-[10px] ${r.status==='Paid'?'bg-emerald-100 text-emerald-700':(r.status==='Partial'?'bg-amber-100 text-amber-800':'bg-rose-100 text-rose-700')}">${r.status}</span>${r.remaining>0?`<button type="button" onclick="closeModal('modal-student-profile');openFeeModal('${admNo}','${r.month}')" class="bg-[#0F172A] text-white px-2 py-1 rounded text-[10px] font-bold">Pay</button>`:''}</div></div>`).join('') || '<p class="text-xs text-slate-400">No monthly fee generated.</p>'}</div>
      <div class="space-y-1.5"><h4 class="font-bold text-xs">All Payment Receipts</h4>${pays.map(p => `<div class="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-xs"><span>${p.paymentDate} • ${p.feeMonth} (${p.mode})</span><b class="text-emerald-600">+${fmtINR(p.amount)}</b></div>`).join('') || '<p class="text-xs text-slate-400">No receipts.</p>'}</div>
    `;
  } else if (tab === 'attendance') {
    const att = getAttendanceStats(admNo);
    body.innerHTML = `
      <div class="grid grid-cols-4 gap-2 text-center text-xs">
        <div class="bg-emerald-50 p-2.5 rounded-xl">Present<br><b class="text-emerald-600">${att.present}</b></div>
        <div class="bg-rose-50 p-2.5 rounded-xl">Absent<br><b class="text-rose-600">${att.absent}</b></div>
        <div class="bg-amber-50 p-2.5 rounded-xl">Leave<br><b class="text-amber-600">${att.leave}</b></div>
        <div class="bg-slate-100 p-2.5 rounded-xl">Rate<br><b>${att.pct}%</b></div>
      </div>
      <div class="divide-y max-h-60 overflow-y-auto">${att.rows.slice().reverse().map(r => `<div class="py-2 flex justify-between text-xs"><span><b>${r.date}</b> • ${r.batchName}</span><span class="font-bold ${r.status==='Present'?'text-emerald-600':(r.status==='Absent'?'text-rose-600':'text-amber-600')}">${r.status} ${r.remark?`(${r.remark})`:''}</span></div>`).join('') || '<p class="text-xs text-slate-400 py-4 text-center">No attendance history.</p>'}</div>
    `;
  } else {
    const prog = getStudentProgress(admNo);
    body.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-2">
        <div class="text-xs font-bold">Overall Trend: <span class="${prog.overallTrend>=0?'text-emerald-600':'text-rose-600'}">${prog.overallTrend>=0?'+':''}${prog.overallTrend}%</span></div>
        <div class="flex gap-1.5">
          <button type="button" onclick="downloadStudentProgressPDF('${admNo}')" class="navy-bg text-white px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-file-pdf mr-1 text-amber-400"></i>Download PDF</button>
          <button type="button" onclick="shareProgressWhatsApp('${admNo}')" class="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-brands fa-whatsapp mr-1"></i>Share</button>
        </div>
      </div>
      <div class="h-44 border rounded-xl p-2"><canvas id="ch-stu-prog"></canvas></div>
      <div class="flex flex-wrap gap-1.5">${prog.subjects.map(sb => `<span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100">${sb.subject}: ${sb.avgPct}% Avg</span>`).join('')}</div>
      <div class="divide-y">${prog.timeline.map(t => `<div class="py-2 flex justify-between items-center text-xs"><div><b>${t.testName}</b> (${t.subject})<p class="text-[10px] text-slate-400">${t.testDate}</p></div><div class="text-right"><b>${t.obtained}/${t.maxMarks} (${t.pct}%)</b> <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${t.pass?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}">${t.pass?'PASS':'FAIL'}</span>${t.diffPct!==null?`<p class="text-[10px] font-bold ${t.diffPct>=0?'text-emerald-600':'text-rose-600'}">${t.diffPct>=0?'↑ +':'↓ '}${t.diffPct}% vs prev</p>`:''}</div></div>`).join('') || '<p class="text-xs text-slate-400 py-4 text-center">No tests recorded yet.</p>'}</div>
    `;
    setTimeout(() => makeChart('ch-stu-prog', { type: 'line', data: { labels: prog.timeline.map(t => t.testName), datasets: [{ label: 'Score %', data: prog.timeline.map(t => t.pct), borderColor: '#0F172A', backgroundColor: 'rgba(212,175,55,0.2)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } } }), 50);
  }
  openModal('modal-student-profile');
}

// ===== 3. BATCH MANAGEMENT =====
function renderBatches() {
  $('sec-batches').innerHTML = `
    <div class="flex justify-between items-center"><p class="text-xs text-slate-500">Manage schedules, capacity & multi-batch assignments</p><button type="button" onclick="openBatchModal(null)" class="navy-bg text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow">+ Create Batch</button></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${DB.batches.length ? DB.batches.map(b => {
        const stus = DB.students.filter(s => s.batches.includes(b.name));
        return `<div class="card-soft rounded-2xl p-4 space-y-3">
          <div class="flex justify-between items-start gap-2">
            <div><span class="text-[10px] font-bold px-2 py-0.5 rounded ${b.status==='Active'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}">${b.status}</span> <span class="text-[10px] font-bold text-slate-400">${b.batchClass}</span><h3 class="font-bold text-base text-[#0F172A] mt-1">${b.name}</h3><p class="text-[11px] text-slate-500">${b.subjects||'All Subjects'} • ${b.timing} (${b.days.join(', ')})</p></div>
            <div class="flex gap-1 shrink-0"><button type="button" onclick="openBatchModal('${b.id}')" class="p-1.5 bg-slate-100 rounded-lg text-xs"><i class="fa-solid fa-pen"></i></button><button type="button" onclick="confirmDeleteBatch('${b.id}','${b.name.replace(/'/g,"\\'")}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button></div>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl flex justify-between text-xs font-bold"><span>Students: ${stus.length}${b.capacity?` / ${b.capacity}`:''}</span><button type="button" onclick="openBatchStudentsModal('${b.name.replace(/'/g,"\\'")}')" class="text-amber-600">Manage & Stats →</button></div>
        </div>`;
      }).join('') : '<div class="col-span-full card-soft p-10 rounded-2xl text-center text-xs text-slate-400">No batches created yet.</div>'}
    </div>
  `;
}

function openBatchStudentsModal(batchName) {
  const inBatch = DB.students.filter(s => s.batches.includes(batchName));
  const notIn = DB.students.filter(s => !s.batches.includes(batchName) && s.status === 'Active');
  const attRows = DB.attendance.filter(a => a.batchName === batchName);
  const attPct = attRows.length ? Math.round((attRows.filter(a => a.status === 'Present').length / attRows.length) * 100) : 0;
  const bTests = DB.tests.filter(t => t.batch === batchName);
  const bMarks = DB.testMarks.filter(m => bTests.some(t => t.testId === m.testId));
  const avgScore = bMarks.length ? Math.round(bMarks.reduce((s, m) => s + (m.obtained / m.maxMarks) * 100, 0) / bMarks.length) : 0;

  $('mbs-title').innerText = `${batchName} (${inBatch.length} Students)`;
  $('mbs-body').innerHTML = `
    <div class="grid grid-cols-2 gap-2 text-center"><div class="bg-sky-50 p-2.5 rounded-xl">Batch Attendance<br><b>${attPct}%</b></div><div class="bg-purple-50 p-2.5 rounded-xl">Avg Test Score<br><b>${avgScore}%</b></div></div>
    <h4 class="font-bold">Assigned Students</h4>
    <div class="divide-y border rounded-xl">${inBatch.map(s => `<div class="p-2.5 flex justify-between items-center"><span><b>${s.name}</b> (${s.admNo})</span><button type="button" onclick="toggleStudentBatch('${s.admNo}','${batchName.replace(/'/g,"\\'")}',false)" class="text-rose-600 font-bold">Remove</button></div>`).join('') || '<p class="p-3 text-slate-400 text-center">No students assigned.</p>'}</div>
    ${notIn.length ? `<h4 class="font-bold pt-2">Add Student to Batch</h4><div class="flex gap-2"><select id="mbs-add-sel" class="flex-1 border rounded-xl px-2.5 py-2 bg-white">${notIn.map(s=>`<option value="${s.admNo}">${s.name} (${s.studentClass})</option>`).join('')}</select><button type="button" onclick="toggleStudentBatch($('mbs-add-sel').value,'${batchName.replace(/'/g,"\\'")}',true)" class="navy-bg text-white px-4 rounded-xl font-bold">+ Add</button></div>` : ''}
  `;
  openModal('modal-batch-students');
}

// ===== 4. FEES MANAGEMENT =====
function renderFees() {
  const fs = computeFeeSystem();
  const months = [...new Set(fs.records.map(r => r.month))].sort().reverse();
  const years = [...new Set(months.map(m => m.slice(0, 4)))].sort().reverse();

  const filtRecs = fs.records.filter(r =>
    (feeFilter.month === 'ALL' || r.month === feeFilter.month) &&
    (feeFilter.year === 'ALL' || r.month.startsWith(feeFilter.year)) &&
    (feeFilter.status === 'ALL' || r.status === feeFilter.status) &&
    (!feeFilter.q || r.studentName.toLowerCase().includes(feeFilter.q) || r.admNo.toLowerCase().includes(feeFilter.q))
  );

  let bodyHtml = '';
  if (feeFilter.sub === 'records') {
    bodyHtml = filtRecs.length ? filtRecs.map(r => `<div class="card-soft p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><span class="text-[10px] font-bold px-2 py-0.5 rounded ${r.status==='Paid'?'bg-emerald-100 text-emerald-700':(r.status==='Partial'?'bg-amber-100 text-amber-800':'bg-rose-100 text-rose-700')}">${r.status}</span> <b class="text-xs ml-1">${r.month}</b><h4 onclick="openStudentProfile('${r.admNo}','fees')" class="font-bold text-sm mt-1 cursor-pointer">${r.studentName} <span class="text-xs font-normal text-slate-400">(${r.admNo})</span></h4><p class="text-[11px] text-slate-500">Expected: ${fmtINR(r.expected)} • Received: <b class="text-emerald-600">${fmtINR(r.received)}</b> • Balance: <b class="text-rose-600">${fmtINR(r.remaining)}</b> • Last Paid: ${r.paymentDate}</p></div>${r.remaining>0?`<button type="button" onclick="openFeeModal('${r.admNo}','${r.month}')" class="navy-bg text-white px-3 py-2 rounded-xl text-xs font-bold shrink-0">+ Pay Balance</button>`:''}</div>`).join('') : '<div class="card-soft p-8 rounded-2xl text-center text-xs text-slate-400">No fee records match filter.</div>';
  } else if (feeFilter.sub === 'students') {
    const stus = fs.studentSummaries.filter(s => (feeFilter.status === 'ALL' || s.feeStatus === feeFilter.status) && (!feeFilter.q || s.name.toLowerCase().includes(feeFilter.q)));
    bodyHtml = stus.length ? stus.map(s => `<div class="card-soft p-3.5 rounded-2xl flex justify-between items-center gap-2"><div><span class="text-[10px] font-bold px-2 py-0.5 rounded ${s.feeStatus==='Paid'?'bg-emerald-100 text-emerald-700':(s.feeStatus==='Partial'?'bg-amber-100 text-amber-800':'bg-rose-100 text-rose-700')}">${s.feeStatus}</span><h4 onclick="openStudentProfile('${s.admNo}','fees')" class="font-bold text-sm mt-1 cursor-pointer">${s.name}</h4><p class="text-[11px] text-slate-500">Total Pending: <b class="text-rose-600">${fmtINR(s.totalPending)}</b> (Prev Dues: ${fmtINR(s.prevDues)})</p></div><button type="button" onclick="openFeeModal('${s.admNo}')" class="gold-bg text-[#0F172A] px-3 py-2 rounded-xl text-xs font-extrabold">+ Pay</button></div>`).join('') : '<div class="card-soft p-8 rounded-2xl text-center text-xs text-slate-400">No students found.</div>';
  } else {
    bodyHtml = DB.fees.length ? DB.fees.map(f => `<div class="card-soft p-3.5 rounded-2xl flex justify-between items-center gap-2"><div><p class="font-bold text-sm">${f.studentName} <span class="text-xs text-slate-400">(${f.receiptNo})</span></p><p class="text-[11px] text-slate-500">${f.paymentDate} • Month: ${f.feeMonth} • ${f.mode}</p></div><div class="flex items-center gap-2"><b class="text-emerald-600">+${fmtINR(f.amount)}</b><button type="button" onclick="confirmDeleteFee('${f.receiptNo}')" class="text-rose-500 p-1.5 text-xs"><i class="fa-solid fa-trash"></i></button></div></div>`).join('') : '<div class="card-soft p-8 rounded-2xl text-center text-xs text-slate-400">No receipts yet.</div>';
  }

  $('sec-fees').innerHTML = `
    <div class="grid grid-cols-3 gap-2.5 text-center">
      <div class="card-soft p-3 rounded-2xl"><p class="text-[10px] font-bold text-slate-400 uppercase">Expected</p><p class="text-base font-extrabold">${fmtINR(fs.totalExpected)}</p></div>
      <div class="card-soft p-3 rounded-2xl"><p class="text-[10px] font-bold text-emerald-600 uppercase">Received</p><p class="text-base font-extrabold text-emerald-600">${fmtINR(fs.totalReceived)}</p></div>
      <div class="card-soft p-3 rounded-2xl"><p class="text-[10px] font-bold text-rose-600 uppercase">Pending</p><p class="text-base font-extrabold text-rose-600">${fmtINR(fs.totalPending)}</p></div>
    </div>
    <div class="card-soft p-3 rounded-2xl space-y-2.5">
      <div class="flex flex-wrap gap-1.5">
        <button type="button" onclick="feeFilter.sub='records';renderFees()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${feeFilter.sub==='records'?'navy-bg text-white':'bg-slate-100'}">Month-Wise Records</button>
        <button type="button" onclick="feeFilter.sub='students';renderFees()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${feeFilter.sub==='students'?'navy-bg text-white':'bg-slate-100'}">Student Summary (${fs.paidCount}P / ${fs.partialCount}Pt / ${fs.unpaidCount}U)</button>
        <button type="button" onclick="feeFilter.sub='receipts';renderFees()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${feeFilter.sub==='receipts'?'navy-bg text-white':'bg-slate-100'}">All Receipts (${DB.fees.length})</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input type="text" value="${feeFilter.q}" oninput="feeFilter.q=this.value.toLowerCase();renderFees()" placeholder="Search student..." class="border rounded-xl px-3 py-1.5 text-xs">
        <select onchange="feeFilter.month=this.value;renderFees()" class="border rounded-xl px-2 py-1.5 text-xs bg-white font-bold"><option value="ALL">All Months</option>${months.map(m=>`<option value="${m}" ${feeFilter.month===m?'selected':''}>${m}</option>`).join('')}</select>
        <select onchange="feeFilter.year=this.value;renderFees()" class="border rounded-xl px-2 py-1.5 text-xs bg-white font-bold"><option value="ALL">All Years</option>${years.map(y=>`<option value="${y}" ${feeFilter.year===y?'selected':''}>${y}</option>`).join('')}</select>
        <select onchange="feeFilter.status=this.value;renderFees()" class="border rounded-xl px-2 py-1.5 text-xs bg-white font-bold"><option value="ALL" ${feeFilter.status==='ALL'?'selected':''}>All Status</option><option value="Paid" ${feeFilter.status==='Paid'?'selected':''}>Paid</option><option value="Partial" ${feeFilter.status==='Partial'?'selected':''}>Partial</option><option value="Unpaid" ${feeFilter.status==='Unpaid'?'selected':''}>Unpaid</option></select>
      </div>
    </div>
    <div class="space-y-2.5">${bodyHtml}</div>
  `;
}

// ===== 5. ATTENDANCE MANAGEMENT =====
function syncLocalAttFromDB() {
  attState.local = {}; attState.remarks = {};
  DB.attendance.filter(a => a.date === attState.date && (attState.batch === 'ALL' || a.batchName === attState.batch)).forEach(a => {
    attState.local[a.admNo] = a.status;
    attState.remarks[a.admNo] = a.remark;
  });
}

function renderAttendance() {
  if (!attState.date) attState.date = todayLocal();
  if (!Object.keys(attState.local).length) syncLocalAttFromDB();
  const classes = [...new Set(DB.students.map(s => s.studentClass).filter(Boolean))].sort();
  const stus = DB.students.filter(s => s.status === 'Active' && (attState.batch === 'ALL' || s.batches.includes(attState.batch)) && (attState.cls === 'ALL' || s.studentClass === attState.cls));
  let p = 0, a = 0, l = 0;
  stus.forEach(s => { const st = attState.local[s.admNo] || 'Present'; if (st === 'Present') p++; else if (st === 'Absent') a++; else l++; });

  let content = '';
  if (attState.sub === 'summary') {
    const ym = attState.date.slice(0, 7);
    content = `
      <div class="card-soft rounded-2xl p-4 space-y-3">
        <h3 class="font-bold text-sm">Monthly Attendance Summary (${ym})</h3>
        <div class="divide-y">${DB.students.filter(s=>s.status==='Active').map(s => { const st = getAttendanceStats(s.admNo, ym); return `<div onclick="openStudentProfile('${s.admNo}','attendance')" class="py-2.5 flex justify-between items-center text-xs cursor-pointer"><div><b>${s.name}</b> (${s.studentClass})</div><div><span class="text-emerald-600 font-bold">${st.present}P</span> • <span class="text-rose-600 font-bold">${st.absent}A</span> • <span class="text-amber-600 font-bold">${st.leave}L</span> <b class="ml-2">${st.pct}%</b></div></div>`; }).join('') || '<p class="text-xs text-slate-400">No students.</p>'}</div>
      </div>
    `;
  } else {
    const showList = attState.sub === 'mark' ? stus : stus.filter(s => (attState.local[s.admNo] || 'Present') === attState.sub);
    content = `<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">${showList.map(s => {
      const st = attState.local[s.admNo] || 'Present', rem = attState.remarks[s.admNo] || '';
      return `<div class="card-soft p-3.5 rounded-2xl space-y-2"><div class="flex justify-between items-center gap-2"><div><h4 class="font-bold text-sm">${s.name}</h4><p class="text-[10px] text-slate-400">${s.admNo} • ${s.studentClass}</p></div><div class="flex bg-slate-100 p-1 rounded-xl gap-1"><button type="button" onclick="attState.local['${s.admNo}']='Present';renderAttendance()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Present'?'bg-emerald-600 text-white':'text-slate-500'}">P</button><button type="button" onclick="attState.local['${s.admNo}']='Absent';renderAttendance()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Absent'?'bg-rose-600 text-white':'text-slate-500'}">A</button><button type="button" onclick="attState.local['${s.admNo}']='Leave';renderAttendance()" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${st==='Leave'?'bg-amber-500 text-white':'text-slate-500'}">Leave</button></div></div>${st==='Leave'?`<input type="text" value="${rem}" onchange="attState.remarks['${s.admNo}']=this.value" placeholder="Leave reason..." class="w-full border rounded-xl px-3 py-1.5 text-xs">`:''}</div>`;
    }).join('') || '<div class="col-span-full card-soft p-8 rounded-2xl text-center text-xs text-slate-400">No students in this view.</div>'}</div>`;
  }

  $('sec-attendance').innerHTML = `
    <div class="card-soft p-3.5 rounded-2xl space-y-3">
      <div class="grid grid-cols-3 gap-2">
        <div><label class="text-[10px] font-bold text-slate-400">DATE</label><input type="date" value="${attState.date}" onchange="attState.date=this.value;syncLocalAttFromDB();renderAttendance()" class="w-full border rounded-xl px-2 py-1.5 text-xs font-bold"></div>
        <div><label class="text-[10px] font-bold text-slate-400">BATCH</label><select onchange="attState.batch=this.value;syncLocalAttFromDB();renderAttendance()" class="w-full border rounded-xl px-2 py-1.5 text-xs font-bold bg-white"><option value="ALL">All Batches</option>${DB.batches.map(b=>`<option value="${b.name}" ${attState.batch===b.name?'selected':''}>${b.name}</option>`).join('')}</select></div>
        <div><label class="text-[10px] font-bold text-slate-400">CLASS</label><select onchange="attState.cls=this.value;renderAttendance()" class="w-full border rounded-xl px-2 py-1.5 text-xs font-bold bg-white"><option value="ALL">All Classes</option>${classes.map(c=>`<option value="${c}" ${attState.cls===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="flex flex-wrap justify-between items-center gap-2">
        <div class="flex flex-wrap gap-1.5">
          <button type="button" onclick="attState.sub='mark';renderAttendance()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${attState.sub==='mark'?'navy-bg text-white':'bg-slate-100'}">Mark (${stus.length})</button>
          <button type="button" onclick="attState.sub='Present';renderAttendance()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${attState.sub==='Present'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}">Present (${p})</button>
          <button type="button" onclick="attState.sub='Absent';renderAttendance()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${attState.sub==='Absent'?'bg-rose-600 text-white':'bg-rose-50 text-rose-700'}">Absent (${a})</button>
          <button type="button" onclick="attState.sub='Leave';renderAttendance()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${attState.sub==='Leave'?'bg-amber-500 text-white':'bg-amber-50 text-amber-800'}">Leave (${l})</button>
          <button type="button" onclick="attState.sub='summary';renderAttendance()" class="px-3 py-1.5 rounded-xl text-xs font-bold ${attState.sub==='summary'?'navy-bg text-amber-300':'bg-slate-100'}">Monthly Summary</button>
        </div>
        ${attState.sub!=='summary'?`<button type="button" onclick="saveAttendanceNow()" class="gold-bg text-[#0F172A] px-4 py-2 rounded-xl text-xs font-extrabold shadow">Save Attendance</button>`:''}
      </div>
    </div>
    ${content}
  `;
}

async function saveAttendanceNow() {
  const bName = attState.batch === 'ALL' ? 'General' : attState.batch;
  const stus = DB.students.filter(s => s.status === 'Active' && (attState.batch === 'ALL' || s.batches.includes(attState.batch)) && (attState.cls === 'ALL' || s.studentClass === attState.cls));
  if (!stus.length) return toast('No students to mark.', true);
  const records = stus.map(s => ({ admNo: s.admNo, studentName: s.name, status: attState.local[s.admNo] || 'Present', remark: attState.remarks[s.admNo] || '' }));
  showLoader(true);
  try {
    const res = await api('saveAttendance', { payload: { date: attState.date, batchName: bName, records } });
    DB = res.data; renderAttendance(); toast('Attendance saved!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

// ===== 6. TESTS & RESULTS =====
function renderTests() {
  const subs = [...new Set(DB.tests.map(t => t.subject).filter(Boolean))];
  const filtered = DB.tests.filter(t => (testState.batch === 'ALL' || t.batch === testState.batch) && (testState.subject === 'ALL' || t.subject === testState.subject) && (!testState.date || t.testDate === testState.date));
  $('sec-tests').innerHTML = `
    <div class="card-soft p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between gap-2.5">
      <div class="grid grid-cols-3 gap-2 flex-1">
        <select onchange="testState.batch=this.value;renderTests()" class="border rounded-xl px-2 py-2 text-xs font-bold bg-white"><option value="ALL">All Batches</option>${DB.batches.map(b=>`<option value="${b.name}" ${testState.batch===b.name?'selected':''}>${b.name}</option>`).join('')}</select>
        <select onchange="testState.subject=this.value;renderTests()" class="border rounded-xl px-2 py-2 text-xs font-bold bg-white"><option value="ALL">All Subjects</option>${subs.map(s=>`<option value="${s}" ${testState.subject===s?'selected':''}>${s}</option>`).join('')}</select>
        <input type="date" value="${testState.date}" onchange="testState.date=this.value;renderTests()" class="border rounded-xl px-2 py-2 text-xs font-bold">
      </div>
      <button type="button" onclick="openTestModal()" class="navy-bg text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0">+ Create Test & Marks</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${filtered.length ? filtered.map(t => {
        const ms = DB.testMarks.filter(m => m.testId === t.testId);
        const passCnt = ms.filter(m => m.obtained >= t.passingMarks).length;
        const avg = ms.length ? Math.round(ms.reduce((a, b) => a + (b.obtained / t.maxMarks) * 100, 0) / ms.length) : 0;
        return `<div onclick="openTestDetail('${t.testId}')" class="card-soft p-4 rounded-2xl cursor-pointer hover:border-amber-400 space-y-2">
          <div class="flex justify-between items-start"><span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">${t.subject} • ${t.batch}</span><span class="text-[11px] font-bold text-slate-400">${t.testDate}</span></div>
          <h3 class="font-bold text-sm text-[#0F172A]">${t.testName}</h3>
          <div class="flex justify-between text-xs pt-2 border-t"><span>${ms.length} Appeared (${passCnt} Pass)</span><b class="text-amber-600">Avg: ${avg}% →</b></div>
        </div>`;
      }).join('') : '<div class="col-span-full card-soft p-10 rounded-2xl text-center text-xs text-slate-400">No tests found.</div>'}
    </div>
  `;
}

function openTestDetail(testId) {
  const t = DB.tests.find(x => x.testId === testId);
  if (!t) return;
  const ms = DB.testMarks.filter(m => m.testId === testId).sort((a, b) => b.obtained - a.obtained);
  $('td-title').innerText = `${t.testName} (${t.subject})`;
  $('td-meta').innerText = `${t.testDate} • ${t.batch} • Max: ${t.maxMarks} | Pass: ${t.passingMarks}`;
  $('td-body').innerHTML = ms.map((m, i) => {
    const pct = Math.round((m.obtained / t.maxMarks) * 100), pass = m.obtained >= t.passingMarks;
    return `<div onclick="closeModal('modal-test-detail');openStudentProfile('${m.admNo}','progress')" class="p-2.5 border rounded-xl flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50">
      <div><b class="mr-1.5 text-amber-600">#${i+1}</b><b>${m.studentName}</b> <span class="text-slate-400">(${m.admNo})</span></div>
      <div><b>${m.obtained}/${t.maxMarks} (${pct}%)</b> <span class="ml-1 px-1.5 py-0.5 rounded font-bold text-[10px] ${pass?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}">${pass?'PASS':'FAIL'}</span></div>
    </div>`;
  }).join('') || '<p class="text-center text-xs text-slate-400 py-4">No marks entered.</p>';
  $('td-del-btn').onclick = () => confirmDeleteTest(testId);
  openModal('modal-test-detail');
}

// ===== 7. REPORTS & ANALYTICS =====
function renderReports() {
  const fs = computeFeeSystem();
  const ymFilter = repState.month === 'ALL' ? repState.year : `${repState.year}-${repState.month}`;
  const years = [...new Set([String(new Date().getFullYear()), ...DB.students.map(s=>(s.joiningDate||'').slice(0,4)), ...DB.fees.map(f=>(f.paymentDate||'').slice(0,4))].filter(Boolean))].sort().reverse();

  let expBtnExcel = '', expBtnPdf = '', tabHtml = '';
  if (repState.tab === 'students') {
    const adms = DB.students.filter(s => s.joiningDate && s.joiningDate.startsWith(ymFilter));
    const lefts = DB.students.filter(s => s.leavingDate && s.leavingDate.startsWith(ymFilter));
    const rows = DB.students.map(s => [s.admNo, s.name, s.studentClass, s.batches.join(', '), s.joiningDate, s.status]);
    expBtnExcel = `exportTableExcel('Students_Report', ${JSON.stringify(DB.students.map(s=>({AdmNo:s.admNo,Name:s.name,Class:s.studentClass,Batches:s.batches.join(', '),Joining:s.joiningDate,Status:s.status})))}, 'AK_Students_Report.xlsx')`;
    expBtnPdf = `exportTablePDF('Students Report (${ymFilter})', ['AdmNo','Name','Class','Batches','Joined','Status'], ${JSON.stringify(rows)}, 'AK_Students_Report.pdf')`;
    tabHtml = `<div class="grid grid-cols-3 gap-2.5 text-center"><div class="card-soft p-3 rounded-2xl">Active<br><b class="text-lg">${DB.students.filter(s=>s.status==='Active').length}</b></div><div class="card-soft p-3 rounded-2xl">New Admissions (${ymFilter})<br><b class="text-lg text-emerald-600">${adms.length}</b></div><div class="card-soft p-3 rounded-2xl">Left (${ymFilter})<br><b class="text-lg text-rose-600">${lefts.length}</b></div></div>
    <div class="card-soft p-4 rounded-2xl space-y-2"><h4 class="font-bold text-xs uppercase text-slate-500">Batch-Wise Student Count</h4>${DB.batches.map(b=>`<div class="flex justify-between text-xs py-1 border-b"><span>${b.name} (${b.batchClass})</span><b>${DB.students.filter(s=>s.batches.includes(b.name)).length} Students</b></div>`).join('')||'<p class="text-xs text-slate-400">No batches.</p>'}</div>`;
  } else if (repState.tab === 'fees') {
    const recs = fs.records.filter(r => r.month.startsWith(ymFilter));
    const exp = recs.reduce((a, b) => a + b.expected, 0), rec = recs.reduce((a, b) => a + b.received, 0), pend = recs.reduce((a, b) => a + b.remaining, 0);
    const rows = recs.map(r => [r.admNo, r.studentName, r.month, r.expected, r.received, r.remaining, r.status]);
    expBtnExcel = `exportTableExcel('Fee_Report', ${JSON.stringify(recs.map(r=>({AdmNo:r.admNo,Name:r.studentName,Month:r.month,Expected:r.expected,Received:r.received,Remaining:r.remaining,Status:r.status})))}, 'AK_Fee_Report.xlsx')`;
    expBtnPdf = `exportTablePDF('Fee Report (${ymFilter})', ['AdmNo','Name','Month','Exp','Paid','Bal','Status'], ${JSON.stringify(rows)}, 'AK_Fee_Report.pdf')`;
    tabHtml = `<div class="grid grid-cols-3 gap-2.5 text-center"><div class="card-soft p-3 rounded-2xl">Expected<br><b class="text-base">${fmtINR(exp)}</b></div><div class="card-soft p-3 rounded-2xl">Received<br><b class="text-base text-emerald-600">${fmtINR(rec)}</b></div><div class="card-soft p-3 rounded-2xl">Pending<br><b class="text-base text-rose-600">${fmtINR(pend)}</b></div></div>
    <div class="card-soft p-4 rounded-2xl divide-y max-h-72 overflow-y-auto">${recs.map(r=>`<div class="py-2 flex justify-between text-xs"><span><b>${r.studentName}</b> (${r.month})</span><span>Paid ${fmtINR(r.received)} / ${fmtINR(r.expected)} <b class="ml-1 ${r.status==='Paid'?'text-emerald-600':'text-rose-600'}">${r.status}</b></span></div>`).join('')||'<p class="text-xs text-slate-400 text-center py-4">No fee records for period.</p>'}</div>`;
  } else if (repState.tab === 'attendance') {
    const attRows = DB.attendance.filter(a => a.date.startsWith(ymFilter));
    const p = attRows.filter(a=>a.status==='Present').length, tot = attRows.length, pct = tot ? Math.round((p/tot)*100) : 0;
    const stuAtt = DB.students.filter(s=>s.status==='Active').map(s => ({ ...s, st: getAttendanceStats(s.admNo, ymFilter) }));
    const lowAtt = stuAtt.filter(s => s.st.total > 0 && s.st.pct < 75);
    const rows = stuAtt.map(s => [s.admNo, s.name, s.st.present, s.st.absent, s.st.leave, s.st.pct + '%']);
    expBtnExcel = `exportTableExcel('Attendance_Report', ${JSON.stringify(stuAtt.map(s=>({AdmNo:s.admNo,Name:s.name,Present:s.st.present,Absent:s.st.absent,Leave:s.st.leave,Pct:s.st.pct+'%'})))}, 'AK_Attendance_Report.xlsx')`;
    expBtnPdf = `exportTablePDF('Attendance Report (${ymFilter})', ['AdmNo','Name','Pres','Abs','Leave','%'], ${JSON.stringify(rows)}, 'AK_Attendance_Report.pdf')`;
    tabHtml = `<div class="grid grid-cols-2 gap-2.5 text-center"><div class="card-soft p-3 rounded-2xl">Overall Attendance (${ymFilter})<br><b class="text-lg text-emerald-600">${pct}%</b></div><div class="card-soft p-3 rounded-2xl">Low Attendance (&lt;75%)<br><b class="text-lg text-rose-600">${lowAtt.length} Students</b></div></div>
    <div class="card-soft p-4 rounded-2xl divide-y">${lowAtt.map(s=>`<div class="py-2 flex justify-between text-xs text-rose-700 font-bold"><span>${s.name} (${s.studentClass})</span><span>${s.st.pct}% (${s.st.present}/${s.st.total})</span></div>`).join('')||'<p class="text-xs text-emerald-600 text-center py-3">No students below 75% attendance!</p>'}</div>`;
  } else {
    const tList = DB.tests.filter(t => t.testDate.startsWith(ymFilter));
    const rows = tList.map(t => { const ms = DB.testMarks.filter(m=>m.testId===t.testId); const avg = ms.length ? Math.round(ms.reduce((a,b)=>a+(b.obtained/t.maxMarks)*100,0)/ms.length) : 0; return [t.testDate, t.testName, t.subject, t.batch, ms.length, avg + '%']; });
    expBtnExcel = `exportTableExcel('Test_Report', ${JSON.stringify(rows.map(r=>({Date:r[0],Test:r[1],Subject:r[2],Batch:r[3],Students:r[4],Avg:r[5]})))}, 'AK_Test_Report.xlsx')`;
    expBtnPdf = `exportTablePDF('Test Report (${ymFilter})', ['Date','Test','Subject','Batch','Appeared','Avg%'], ${JSON.stringify(rows)}, 'AK_Test_Report.pdf')`;
    tabHtml = `<div class="card-soft p-4 rounded-2xl divide-y">${rows.map(r=>`<div class="py-2.5 flex justify-between text-xs"><div><b>${r[1]}</b> (${r[2]} • ${r[3]})<p class="text-[10px] text-slate-400">${r[0]}</p></div><div class="text-right"><b>Avg: ${r[5]}</b><p class="text-[10px] text-slate-400">${r[4]} Students</p></div></div>`).join('')||'<p class="text-xs text-slate-400 text-center py-4">No tests in selected period.</p>'}</div>`;
  }

  $('sec-reports').innerHTML = `
    <div class="card-soft p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between gap-2.5">
      <div class="flex flex-wrap gap-1.5">
        ${['students','fees','attendance','tests'].map(t=>`<button type="button" onclick="repState.tab='${t}';renderReports()" class="px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${repState.tab===t?'navy-bg text-amber-300':'bg-slate-100'}">${t}</button>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <select onchange="repState.month=this.value;renderReports()" class="border rounded-xl px-2 py-1.5 text-xs font-bold bg-white"><option value="ALL">Full Year</option>${MONTHS_SHORT.map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}" ${repState.month===String(i+1).padStart(2,'0')?'selected':''}>${m}</option>`).join('')}</select>
        <select onchange="repState.year=this.value;renderReports()" class="border rounded-xl px-2 py-1.5 text-xs font-bold bg-white">${years.map(y=>`<option value="${y}" ${repState.year===y?'selected':''}>${y}</option>`).join('')}</select>
        <button type="button" onclick='${expBtnExcel}' class="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-file-excel mr-1"></i>Excel</button>
        <button type="button" onclick='${expBtnPdf}' class="navy-bg text-white px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-file-pdf mr-1 text-amber-400"></i>PDF</button>
      </div>
    </div>
    ${tabHtml}
  `;
}
