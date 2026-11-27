const KEY_URL = 'AK_LH_GAS_URL';
const KEY_TOK = 'AK_LH_TOKEN';
let gasUrl = localStorage.getItem(KEY_URL) || '';
let authToken = localStorage.getItem(KEY_TOK) || '';
let DB = { students: [], batches: [], fees: [], attendance: [], tests: [], testMarks: [], todayStr: '' };
let currentSection = 'dashboard';
let charts = {};

// Filters state
let stuFilter = { q: '', cls: 'ALL', batch: 'ALL', status: 'ALL' };
let feeFilter = { month: 'ALL', year: 'ALL', status: 'ALL', q: '', sub: 'records' };
let attState = { date: '', batch: 'ALL', cls: 'ALL', sub: 'mark', local: {}, remarks: {} };
let testState = { batch: 'ALL', subject: 'ALL', date: '' };
let repState = { tab: 'students', month: 'ALL', year: String(new Date().getFullYear()) };

const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const $ = id => document.getElementById(id);
const fmtINR = n => '₹' + Number(n || 0).toLocaleString('en-IN');
function todayLocal() {
  if (DB.todayStr) return DB.todayStr;
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function currentYM() { return todayLocal().slice(0, 7); }

function showLoader(s) { $('loader').classList.toggle('hidden', !s); $('loader').classList.toggle('flex', s); }
function toast(msg, err = false) {
  $('toast-msg').innerText = msg;
  $('toast-icon').className = err ? 'fa-solid fa-circle-exclamation text-rose-400' : 'fa-solid fa-circle-check text-amber-400';
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 3400);
}
function openModal(id) { window.scrollTo(0, 0); $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

async function api(action, extra = {}) {
  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: authToken, ...extra })
  });
  const json = await res.json();
  if (json.authError) {
    authToken = '';
    localStorage.removeItem(KEY_TOK);
    $('app-shell').classList.add('hidden');
    $('auth-screen').classList.remove('hidden');
    throw new Error(json.error);
  }
  if (!json.ok) throw new Error(json.error || 'Operation failed');
  return json;
}

async function handleLogin(e) {
  e.preventDefault();
  const url = $('login-url').value.trim();
  const username = $('login-user').value.trim();
  const password = $('login-pass').value;
  if (!url.startsWith('https://script.google.com/')) {
    $('login-err').innerText = 'Please enter a valid Google Apps Script /exec URL.';
    $('login-err').classList.remove('hidden');
    return;
  }
  gasUrl = url;
  localStorage.setItem(KEY_URL, gasUrl);
  $('login-err').classList.add('hidden');
  showLoader(true);
  try {
    const res = await api('login', { username, password });
    authToken = res.token;
    localStorage.setItem(KEY_TOK, authToken);
    DB = res.data;
    attState.date = todayLocal();
    $('auth-screen').classList.add('hidden');
    $('app-shell').classList.remove('hidden');
    renderActiveView();
    toast('Welcome to AK Learning Hub!');
  } catch (err) {
    $('login-err').innerText = err.message;
    $('login-err').classList.remove('hidden');
  } finally { showLoader(false); }
}

function logout() {
  authToken = '';
  localStorage.removeItem(KEY_TOK);
  closeModal('modal-settings');
  $('app-shell').classList.add('hidden');
  $('auth-screen').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (gasUrl) $('login-url').value = gasUrl;
  if (gasUrl && authToken) {
    showLoader(true);
    try {
      const res = await api('getAllData');
      DB = res.data;
      attState.date = todayLocal();
      $('auth-screen').classList.add('hidden');
      $('app-shell').classList.remove('hidden');
      renderActiveView();
    } catch (e) {
      $('auth-screen').classList.remove('hidden');
    } finally { showLoader(false); }
  }
});

function navTo(sec, opts = {}) {
  currentSection = sec;
  const titles = {
    dashboard: ['Dashboard', 'AK Learning Hub Real-Time Overview'],
    students: ['Students Management', 'Admissions, Profiles & Multi-Batch Assignment'],
    batches: ['Batch Management', 'Schedules, Capacity & Batch Performance'],
    fees: ['Fees Management', 'Month-Wise Ledger, Partial Payments & Dues'],
    attendance: ['Attendance Management', 'Daily Marking, History & Monthly Summary'],
    tests: ['Tests & Results', 'Marks, Percentages & Student Progress Trends'],
    reports: ['Reports & Analytics', 'Month-Wise & Year-Wise Exports (PDF / Excel)']
  };
  $('page-title').innerText = titles[sec][0];
  $('page-sub').innerText = titles[sec][1];

  ['dashboard','students','batches','fees','attendance','tests','reports'].forEach(t => {
    $('sec-' + t).classList.toggle('hidden', t !== sec);
    const sn = $('snav-' + t), mn = $('mnav-' + t);
    if (sn) sn.className = t === sec ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition snav-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 transition';
    if (mn) mn.className = t === sec ? 'flex flex-col items-center py-1 rounded-lg text-[9px] font-bold text-amber-400' : 'flex flex-col items-center py-1 rounded-lg text-[9px] font-bold text-slate-400';
  });

  if (opts.stuStatus) stuFilter.status = opts.stuStatus;
  if (opts.feeStatus) { feeFilter.status = opts.feeStatus; feeFilter.sub = opts.feeSub || 'students'; }
  if (opts.attSub) attState.sub = opts.attSub;
  renderActiveView();
  window.scrollTo(0, 0);
}

function renderActiveView() {
  if (currentSection === 'dashboard') renderDashboard();
  else if (currentSection === 'students') renderStudents();
  else if (currentSection === 'batches') renderBatches();
  else if (currentSection === 'fees') renderFees();
  else if (currentSection === 'attendance') renderAttendance();
  else if (currentSection === 'tests') renderTests();
  else if (currentSection === 'reports') renderReports();
}

// ===== FEE ENGINE (NEVER BEFORE JOINING, STOPS AFTER LEAVING, PARTIAL PAYMENTS, SEPARATE MONTHS) =====
function monthRange(startYM, endYM) {
  if (!startYM || !endYM || startYM > endYM) return [];
  const res = [];
  let [y, m] = startYM.split('-').map(Number);
  const [ey, em] = endYM.split('-').map(Number);
  let guard = 0;
  while ((y < ey || (y === ey && m <= em)) && guard < 120) {
    res.push(y + '-' + String(m).padStart(2, '0'));
    m++;
    if (m > 12) { m = 1; y++; }
    guard++;
  }
  return res;
}

function computeFeeSystem() {
  const curYM = currentYM();
  const records = [];
  const studentSummaries = [];
  let totalExpected = 0, totalReceived = 0, totalPending = 0;
  let paidCount = 0, unpaidCount = 0, partialCount = 0;

  DB.students.forEach(s => {
    const startYM = s.joiningDate ? s.joiningDate.slice(0, 7) : curYM;
    let endYM = curYM;
    if (s.status === 'Left' && s.leavingDate) {
      const lYM = s.leavingDate.slice(0, 7);
      if (lYM < endYM) endYM = lYM;
    }
    const months = monthRange(startYM, endYM);
    const stuFees = DB.fees.filter(f => f.admNo === s.admNo);

    let sExp = 0, sRec = 0, sPend = 0, prevDues = 0;
    months.forEach(ym => {
      const exp = s.monthlyFee;
      const pays = stuFees.filter(f => f.feeMonth === ym);
      const rec = pays.reduce((sum, x) => sum + x.amount, 0);
      const rem = Math.max(0, exp - rec);
      const st = rem === 0 ? (exp > 0 ? 'Paid' : 'Clear') : (rec > 0 ? 'Partial' : 'Unpaid');
      const lastDate = pays.length ? pays[0].paymentDate : '-';
      sExp += exp; sRec += rec; sPend += rem;
      if (ym < curYM) prevDues += rem;
      records.push({ admNo: s.admNo, studentName: s.name, studentClass: s.studentClass, month: ym, expected: exp, received: rec, remaining: rem, paymentDate: lastDate, status: st, payments: pays });
    });

    // Include any historical payments outside generated months so old payments are never erased
    const extraPays = stuFees.filter(f => !months.includes(f.feeMonth));
    extraPays.forEach(p => { sRec += p.amount; });

    totalExpected += sExp; totalReceived += sRec; totalPending += sPend;
    const stuPayStatus = sPend === 0 ? 'Paid' : (sRec > 0 ? 'Partial' : 'Unpaid');
    if (sExp > 0 || sPend > 0) {
      if (stuPayStatus === 'Paid') paidCount++;
      else if (stuPayStatus === 'Partial') partialCount++;
      else unpaidCount++;
    }
    studentSummaries.push({ ...s, totalExpected: sExp, totalReceived: sRec, totalPending: sPend, prevDues, feeStatus: stuPayStatus });
  });

  return { records, studentSummaries, totalExpected, totalReceived, totalPending, paidCount, unpaidCount, partialCount };
}

// ===== ATTENDANCE HELPERS =====
function getAttendanceStats(admNo, monthYM = '') {
  const rows = DB.attendance.filter(a => a.admNo === admNo && (!monthYM || a.date.startsWith(monthYM)));
  let p = 0, a = 0, l = 0;
  rows.forEach(r => { if (r.status === 'Present') p++; else if (r.status === 'Absent') a++; else if (r.status === 'Leave') l++; });
  const tot = p + a + l;
  return { present: p, absent: a, leave: l, total: tot, pct: tot ? Math.round((p / tot) * 100) : 0, rows };
}

// ===== TEST PROGRESS ENGINE =====
function getStudentProgress(admNo) {
  const marks = DB.testMarks.filter(m => m.admNo === admNo).slice().sort((a, b) => a.testDate.localeCompare(b.testDate));
  const timeline = marks.map((m, idx) => {
    const pct = m.maxMarks > 0 ? Math.round((m.obtained / m.maxMarks) * 100) : 0;
    const pass = m.obtained >= m.passingMarks;
    let diffMarks = null, diffPct = null;
    if (idx > 0) {
      const prev = marks[idx - 1];
      const prevPct = prev.maxMarks > 0 ? Math.round((prev.obtained / prev.maxMarks) * 100) : 0;
      diffMarks = m.obtained - prev.obtained;
      diffPct = pct - prevPct;
    }
    return { ...m, pct, pass, diffMarks, diffPct };
  });

  const subMap = {};
  timeline.forEach(t => {
    if (!subMap[t.subject]) subMap[t.subject] = { subject: t.subject, count: 0, pctSum: 0 };
    subMap[t.subject].count++;
    subMap[t.subject].pctSum += t.pct;
  });
  const subjects = Object.values(subMap).map(x => ({ ...x, avgPct: Math.round(x.pctSum / x.count) }));
  const overallTrend = timeline.length >= 2 ? timeline[timeline.length - 1].pct - timeline[0].pct : 0;
  return { timeline, subjects, overallTrend };
}

// ===== CHARTS =====
function makeChart(canvasId, config) {
  if (charts[canvasId]) { charts[canvasId].destroy(); }
  const el = $(canvasId);
  if (!el) return;
  charts[canvasId] = new Chart(el.getContext('2d'), config);
}

// ===== STUDENT CRUD =====
function openStudentModal(admNo) {
  const s = admNo ? DB.students.find(x => x.admNo === admNo) : null;
  $('stu-modal-title').innerText = s ? `Edit Student (${s.admNo})` : 'New Student Admission';
  $('f-stu-admno').value = s ? s.admNo : '';
  $('f-stu-name').value = s ? s.name : '';
  $('f-stu-class').value = s ? s.studentClass : '';
  $('f-stu-father').value = s ? s.fatherName : '';
  $('f-stu-mother').value = s ? s.motherName : '';
  $('f-stu-sphone').value = s ? s.studentPhone : '';
  $('f-stu-pphone').value = s ? s.parentPhone : '';
  $('f-stu-subjects').value = s ? s.subjects : '';
  $('f-stu-fee').value = s ? s.monthlyFee : '';
  $('f-stu-jdate').value = s ? s.joiningDate : todayLocal();
  $('f-stu-ldate').value = s ? s.leavingDate : '';
  $('f-stu-status').value = s ? s.status : 'Active';
  $('f-stu-address').value = s ? s.address : '';
  $('f-stu-photo').value = s ? s.photoUrl : '';
  $('f-stu-notes').value = s ? s.notes : '';

  const curBatches = s ? s.batches : [];
  const allB = DB.batches.map(b => b.name);
  $('f-stu-batches-wrap').innerHTML = allB.length
    ? allB.map(bn => `<label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border cursor-pointer"><input type="checkbox" class="f-stu-bat-cb" value="${bn}" ${curBatches.includes(bn)?'checked':''}><span>${bn}</span></label>`).join('')
    : '<span class="text-slate-400">No batches created yet. Create a batch first in Batches tab.</span>';
  openModal('modal-student');
}

async function saveStudentForm(e) {
  e.preventDefault();
  const batches = [...document.querySelectorAll('.f-stu-bat-cb:checked')].map(c => c.value);
  const admNo = $('f-stu-admno').value;
  const payload = {
    admNo, name: $('f-stu-name').value, studentClass: $('f-stu-class').value,
    fatherName: $('f-stu-father').value, motherName: $('f-stu-mother').value,
    studentPhone: $('f-stu-sphone').value, parentPhone: $('f-stu-pphone').value,
    subjects: $('f-stu-subjects').value, batches,
    joiningDate: $('f-stu-jdate').value, leavingDate: $('f-stu-ldate').value,
    monthlyFee: $('f-stu-fee').value, status: $('f-stu-status').value,
    address: $('f-stu-address').value, photoUrl: $('f-stu-photo').value, notes: $('f-stu-notes').value
  };
  closeModal('modal-student');
  showLoader(true);
  try {
    const res = await api(admNo ? 'editStudent' : 'addStudent', { payload });
    DB = res.data;
    renderActiveView();
    toast(admNo ? 'Student updated!' : 'Admission saved!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

async function confirmDeleteStudent(admNo) {
  const s = DB.students.find(x => x.admNo === admNo);
  if (!confirm(`Delete student "${s ? s.name : admNo}"? Tip: Set status to "Left" instead if you want to keep historical records.`)) return;
  closeModal('modal-student-profile');
  showLoader(true);
  try {
    const res = await api('deleteStudent', { admNo });
    DB = res.data; renderActiveView(); toast('Student deleted.');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

// ===== BATCH CRUD & OVERLAP CHECK =====
function timeToMin(t) { if (!t || !t.includes(':')) return -1; const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function checkBatchOverlap() {
  const id = $('f-bat-id').value;
  const st = timeToMin($('f-bat-start').value), en = timeToMin($('f-bat-end').value);
  const days = [...document.querySelectorAll('.f-bat-day-cb:checked')].map(c => c.value);
  const warn = $('bat-overlap-warn');
  if (st < 0 || en < 0 || !days.length) { warn.classList.add('hidden'); return; }
  const conflicts = DB.batches.filter(b => {
    if (b.id === id || b.status !== 'Active' || !b.timing.includes('-')) return false;
    const [bs, be] = b.timing.split('-').map(x => timeToMin(x.trim()));
    const dayHit = b.days.some(d => days.includes(d));
    return dayHit && bs >= 0 && be >= 0 && st < be && bs < en;
  });
  if (conflicts.length) {
    warn.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Timing overlaps with: ${conflicts.map(c => `${c.name} (${c.timing})`).join(', ')}`;
    warn.classList.remove('hidden');
  } else warn.classList.add('hidden');
}

function openBatchModal(batchId) {
  const b = batchId ? DB.batches.find(x => x.id === batchId) : null;
  $('bat-modal-title').innerText = b ? 'Edit Batch' : 'Create Batch';
  $('f-bat-id').value = b ? b.id : '';
  $('f-bat-oldname').value = b ? b.name : '';
  $('f-bat-name').value = b ? b.name : '';
  $('f-bat-class').value = b ? b.batchClass : '';
  $('f-bat-subjects').value = b ? b.subjects : '';
  const [st, en] = b && b.timing.includes('-') ? b.timing.split('-').map(x => x.trim()) : ['16:00', '17:00'];
  $('f-bat-start').value = st || '16:00';
  $('f-bat-end').value = en || '17:00';
  $('f-bat-cap').value = b && b.capacity ? b.capacity : '';
  $('f-bat-status').value = b ? b.status : 'Active';
  const curDays = b ? b.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  $('f-bat-days-wrap').innerHTML = DAYS_LIST.map(d => `<label class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border cursor-pointer"><input type="checkbox" class="f-bat-day-cb" value="${d}" onchange="checkBatchOverlap()" ${curDays.includes(d)?'checked':''}><span>${d}</span></label>`).join('');
  checkBatchOverlap();
  openModal('modal-batch');
}

async function saveBatchForm(e) {
  e.preventDefault();
  const id = $('f-bat-id').value;
  const days = [...document.querySelectorAll('.f-bat-day-cb:checked')].map(c => c.value);
  const payload = {
    id, oldName: $('f-bat-oldname').value, name: $('f-bat-name').value,
    batchClass: $('f-bat-class').value, subjects: $('f-bat-subjects').value,
    timing: `${$('f-bat-start').value}-${$('f-bat-end').value}`,
    days, capacity: $('f-bat-cap').value, status: $('f-bat-status').value
  };
  closeModal('modal-batch');
  showLoader(true);
  try {
    const res = await api(id ? 'editBatch' : 'addBatch', { payload });
    DB = res.data; renderActiveView(); toast(id ? 'Batch updated!' : 'Batch created!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

async function confirmDeleteBatch(id, name) {
  if (!confirm(`Delete batch "${name}"? Students will be unassigned from this batch (records remain safe).`)) return;
  showLoader(true);
  try {
    const res = await api('deleteBatch', { batchId: id, batchName: name });
    DB = res.data; renderActiveView(); toast('Batch deleted.');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

async function toggleStudentBatch(admNo, batchName, add) {
  const s = DB.students.find(x => x.admNo === admNo);
  if (!s) return;
  let batches = [...s.batches];
  if (add && !batches.includes(batchName)) batches.push(batchName);
  if (!add) batches = batches.filter(b => b !== batchName);
  showLoader(true);
  try {
    const res = await api('editStudent', { payload: { ...s, batches } });
    DB = res.data;
    openBatchStudentsModal(batchName);
    renderActiveView();
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

// ===== FEE ACTIONS =====
function openFeeModal(preAdmNo = '', preMonth = '') {
  if (!DB.students.length) return toast('Please add a student first.', true);
  $('f-fee-admno').innerHTML = DB.students.map(s => `<option value="${s.admNo}">${s.name} (${s.admNo} • ${s.studentClass})</option>`).join('');
  if (preAdmNo) $('f-fee-admno').value = preAdmNo;
  $('f-fee-month').value = preMonth || currentYM();
  $('f-fee-date').value = todayLocal();
  $('f-fee-notes').value = '';
  updateFeeHint();
  openModal('modal-fee');
}

function updateFeeHint() {
  const admNo = $('f-fee-admno').value;
  const ym = $('f-fee-month').value;
  const fs = computeFeeSystem();
  const rec = fs.records.find(r => r.admNo === admNo && r.month === ym);
  const stu = DB.students.find(s => s.admNo === admNo);
  if (rec) {
    $('f-fee-hint').innerText = `Month ${ym}: Expected ${fmtINR(rec.expected)} | Paid ${fmtINR(rec.received)} | Remaining ${fmtINR(rec.remaining)}`;
    $('f-fee-amount').value = rec.remaining > 0 ? rec.remaining : (stu ? stu.monthlyFee : '');
  } else if (stu) {
    $('f-fee-hint').innerText = `Monthly Fee: ${fmtINR(stu.monthlyFee)} (Note: Joining Date is ${stu.joiningDate})`;
    $('f-fee-amount').value = stu.monthlyFee;
  }
}

async function saveFeeForm(e) {
  e.preventDefault();
  const admNo = $('f-fee-admno').value;
  const s = DB.students.find(x => x.admNo === admNo);
  const payload = {
    admNo, studentName: s ? s.name : '',
    feeMonth: $('f-fee-month').value, amount: $('f-fee-amount').value,
    paymentDate: $('f-fee-date').value, mode: $('f-fee-mode').value, notes: $('f-fee-notes').value
  };
  closeModal('modal-fee'); showLoader(true);
  try {
    const res = await api('recordFee', { payload });
    DB = res.data; renderActiveView(); toast('Payment recorded!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

async function confirmDeleteFee(receiptNo) {
  if (!confirm(`Delete receipt ${receiptNo}?`)) return;
  showLoader(true);
  try {
    const res = await api('deleteFee', { receiptNo });
    DB = res.data; renderActiveView(); toast('Receipt deleted.');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

// ===== TEST ACTIONS =====
function openTestModal() {
  if (!DB.students.length) return toast('Add students first.', true);
  $('f-test-batch').innerHTML = '<option value="ALL">All Active Students</option>' + DB.batches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
  $('f-test-date').value = todayLocal();
  renderTestMarksEntry();
  openModal('modal-test');
}

function renderTestMarksEntry() {
  const b = $('f-test-batch').value;
  const list = DB.students.filter(s => s.status === 'Active' && (b === 'ALL' || s.batches.includes(b)));
  $('f-test-marks-wrap').innerHTML = list.length
    ? list.map(s => `<div class="flex justify-between items-center p-2"><span class="font-semibold">${s.name} <span class="text-slate-400">(${s.admNo})</span></span><input type="number" data-adm="${s.admNo}" data-name="${s.name}" min="0" placeholder="Marks" class="f-tmark-inp w-24 border rounded-lg px-2 py-1 text-center font-bold"></div>`).join('')
    : '<p class="p-4 text-center text-slate-400">No active students in this batch.</p>';
}

async function saveTestForm(e) {
  e.preventDefault();
  const marksList = [];
  document.querySelectorAll('.f-tmark-inp').forEach(i => { if (i.value !== '') marksList.push({ admNo: i.dataset.adm, studentName: i.dataset.name, obtained: Number(i.value) }); });
  if (!marksList.length) return toast('Enter marks for at least 1 student.', true);
  const payload = {
    testName: $('f-test-name').value, testClass: $('f-test-class').value, batch: $('f-test-batch').value,
    subject: $('f-test-subject').value, testDate: $('f-test-date').value,
    maxMarks: $('f-test-max').value, passingMarks: $('f-test-pass').value, marksList
  };
  closeModal('modal-test'); showLoader(true);
  try {
    const res = await api('saveTestWithMarks', { payload });
    DB = res.data; e.target.reset(); renderActiveView(); toast('Test & marks saved!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

async function confirmDeleteTest(testId) {
  if (!confirm('Delete this test and all its marks?')) return;
  closeModal('modal-test-detail'); showLoader(true);
  try {
    const res = await api('deleteTest', { testId });
    DB = res.data; renderActiveView(); toast('Test deleted.');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}

// ===== PDF & EXCEL EXPORTS =====
function downloadStudentProgressPDF(admNo) {
  const s = DB.students.find(x => x.admNo === admNo);
  if (!s) return;
  const prog = getStudentProgress(admNo);
  const att = getAttendanceStats(admNo);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18); doc.text('AK Learning Hub', 14, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11); doc.text('Official Student Progress Report', 14, 24);

  doc.setTextColor(15, 23, 42); doc.setFontSize(11);
  doc.text(`Student: ${s.name} (${s.admNo})`, 14, 42);
  doc.text(`Class: ${s.studentClass} | Batches: ${s.batches.join(', ') || '-'}`, 14, 49);
  doc.text(`Attendance: ${att.present} Present / ${att.total} Days (${att.pct}%)`, 14, 56);
  doc.text(`Overall Progress Trend: ${prog.overallTrend >= 0 ? '+' : ''}${prog.overallTrend}%`, 14, 63);

  const rows = prog.timeline.map(t => [t.testDate, t.testName, t.subject, `${t.obtained}/${t.maxMarks}`, `${t.pct}%`, t.pass ? 'PASS' : 'FAIL', t.diffPct === null ? '-' : `${t.diffPct >= 0 ? '+' : ''}${t.diffPct}%`]);
  doc.autoTable({ startY: 70, head: [['Date', 'Test', 'Subject', 'Marks', '%', 'Result', 'Change']], body: rows, headStyles: { fillColor: [15, 23, 42] } });
  doc.save(`${s.name.replace(/\s+/g, '_')}_Progress_Report.pdf`);
}

function shareProgressWhatsApp(admNo) {
  const s = DB.students.find(x => x.admNo === admNo);
  const raw = (s && (s.parentPhone || s.studentPhone)) || '';
  let ph = raw.replace(/\D/g, '');
  if (ph.length === 10) ph = '91' + ph;
  if (!ph) return toast('No parent/student phone saved!', true);
  const prog = getStudentProgress(admNo);
  const lines = prog.timeline.slice(-5).map(t => `• ${t.testName} (${t.subject}): ${t.obtained}/${t.maxMarks} (${t.pct}%)`).join('\n');
  const msg = `*AK Learning Hub - Progress Report*\nStudent: *${s.name}* (${s.studentClass})\n\n${lines || 'No tests yet'}\n\nOverall Trend: ${prog.overallTrend >= 0 ? '+' : ''}${prog.overallTrend}%`;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, '_blank');
}

function exportTableExcel(sheetName, rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function exportTablePDF(title, head, body, filename) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(212, 175, 55); doc.setFontSize(14); doc.text('AK Learning Hub — ' + title, 14, 15);
  doc.autoTable({ startY: 30, head: [head], body, headStyles: { fillColor: [15, 23, 42] } });
  doc.save(filename);
}

function exportFullBackupExcel() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.students), 'Students');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.batches), 'Batches');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.fees), 'Fees');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.attendance), 'Attendance');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.tests), 'Tests');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.testMarks), 'Test_Marks');
  XLSX.writeFile(wb, `AK_Learning_Hub_Backup_${todayLocal()}.xlsx`);
}

// ===== SETTINGS =====
function openSettingsModal() { $('set-gas-url').value = gasUrl; openModal('modal-settings'); }
function updateGasUrlSetting() {
  const u = $('set-gas-url').value.trim();
  if (!u.startsWith('https://script.google.com/')) return toast('Invalid URL', true);
  gasUrl = u; localStorage.setItem(KEY_URL, u); toast('URL updated! Refreshing...');
  closeModal('modal-settings');
  api('getAllData').then(r => { DB = r.data; renderActiveView(); }).catch(e => toast(e.message, true));
}
async function saveCredentialsForm(e) {
  e.preventDefault();
  showLoader(true);
  try {
    const res = await api('changeCredentials', { payload: { currentPassword: $('set-cur-pass').value, newUsername: $('set-new-user').value, newPassword: $('set-new-pass').value } });
    DB = res.data; e.target.reset(); closeModal('modal-settings'); toast('Login credentials updated!');
  } catch (err) { toast(err.message, true); } finally { showLoader(false); }
}
