/**
 * PRF Portal — core workflow logic.
 *
 * This file is plain JavaScript with no Google-specific calls. Everything that
 * touches Sheets, Drive, the cache or hashing goes through the global `STORE`
 * object, which Server.gs provides in Apps Script and dev/mock-store.js
 * provides in the local preview. Keep it that way so the preview stays honest.
 */

var PROJECTS = [
  'SIT Tower',
  'Al Falak Residence',
  'BNH Smart Tower',
  'Equiti Residence',
  'Equiti Arcade',
  'Equiti Apartments',
  'BNH Tower 03'
];

var ROLES = { AE: 'Accounts Executive', REVIEWER: 'Reviewer', MANAGER: 'Manager' };

var ST = {
  TO_COLLECT: 'To Collect',
  PENDING_REVIEW: 'Pending Review',
  PENDING_MGR: 'Pending Manager Approval',
  PENDING_BANK_INIT: 'Pending Bank Initiation',
  PENDING_BANK_APPROVAL: 'Pending Bank Approval',
  WITH_BANK: 'Pending with Bank',
  PENDING_NOBROKER: 'Paid - Update NoBroker',
  CLOSED: 'Closed',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled'
};

/** Which role has to act on each status. */
var OWNER = {};
OWNER[ST.TO_COLLECT] = 'AE';
OWNER[ST.PENDING_REVIEW] = 'REVIEWER';
OWNER[ST.PENDING_MGR] = 'MANAGER';
OWNER[ST.PENDING_BANK_INIT] = 'AE';
OWNER[ST.PENDING_BANK_APPROVAL] = 'MANAGER';
OWNER[ST.WITH_BANK] = 'AE';
OWNER[ST.PENDING_NOBROKER] = 'AE';
OWNER[ST.RETURNED] = 'AE';

/** Statuses whose amount counts as budget used (committed). */
var NOT_COMMITTED = [ST.TO_COLLECT, ST.CANCELLED];
var PAID_STATUSES = [ST.PENDING_NOBROKER, ST.CLOSED];

var CHECKS = [
  { key: 'voucher', label: 'NoBroker voucher is attached' },
  { key: 'invoiceSigned', label: 'Invoice is signed & stamped by both parties' },
  { key: 'reportSigned', label: 'Service report is signed & stamped by both parties' },
  { key: 'licence', label: 'Trade licence is active on the portal' },
  { key: 'contract', label: 'Contract is on the portal' },
  { key: 'iban', label: 'IBAN on the invoice matches the bank IBAN letter' }
];

var FREQUENCIES = ['Monthly', 'Quarterly', 'Half-yearly', 'Annual'];
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var FOLLOWUP_TYPES = ['Reminder sent', 'Documents missing', 'Invoice received', 'Other'];

/* ------------------------------------------------------------------ helpers */

function fail(msg) { throw new Error(msg); }
function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function round2(n) { return Math.round(num(n) * 100) / 100; }
function str(v) { return v == null ? '' : String(v).trim(); }
function nowIso() { return STORE.now().toISOString(); }
function parseJson(s, dflt) { try { return s ? JSON.parse(s) : dflt; } catch (e) { return dflt; } }
function daysBetween(a, b) { return (new Date(b) - new Date(a)) / 86400000; }

function nextId(prefix, rows, field) {
  var max = 0;
  rows.forEach(function (r) {
    var m = String(r[field] || '').match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return prefix + String(max + 1).padStart(4, '0');
}

/* -------------------------------------------------------------------- auth */

function login(username, password) {
  username = str(username).toLowerCase();
  var u = STORE.readAll('Users').filter(function (x) {
    return str(x.username).toLowerCase() === username && str(x.active) !== 'FALSE';
  })[0];
  if (!u || STORE.hash(u.salt + password) !== u.passHash) fail('Wrong username or password.');
  var token = STORE.newToken();
  STORE.cachePut('sess_' + token, u.username);
  return { token: token, user: publicUser(u) };
}

function logout(token) { STORE.cacheRemove('sess_' + token); return true; }

function userFromToken(token) {
  var name = token && STORE.cacheGet('sess_' + token);
  if (!name) fail('SESSION_EXPIRED');
  var u = STORE.readAll('Users').filter(function (x) { return x.username === name; })[0];
  if (!u) fail('SESSION_EXPIRED');
  return u;
}

function publicUser(u) {
  return { username: u.username, name: u.name, role: u.role, roleLabel: ROLES[u.role] || u.role };
}

function changePassword(user, oldPw, newPw) {
  if (STORE.hash(user.salt + oldPw) !== user.passHash) fail('Current password is wrong.');
  if (str(newPw).length < 6) fail('New password must be at least 6 characters.');
  var salt = STORE.newToken().slice(0, 12);
  STORE.update('Users', 'username', user.username, { salt: salt, passHash: STORE.hash(salt + newPw) });
  return true;
}

function requireRole(user, roles) {
  if (roles.indexOf(user.role) < 0) fail('Your role (' + (ROLES[user.role] || user.role) + ') cannot do this.');
}

/* ------------------------------------------------------------------ budget */

/**
 * Budget rows are grouped into "lines". Rows that share a Group value inside
 * the same project + year (e.g. "Cleaning & Maintenance") become ONE line, so
 * a single invoice/payment is tracked against their combined amount.
 */
function budgetLines(year, project) {
  var lines = {};
  STORE.readAll('Budget').forEach(function (b) {
    if (year && String(b.year) !== String(year)) return;
    if (project && b.project !== project) return;
    var group = str(b.group);
    var key = b.year + '|' + b.project + '|' + (group ? 'G:' + group : 'C:' + str(b.code));
    var l = lines[key];
    if (!l) {
      l = lines[key] = {
        key: key, year: String(b.year), project: b.project, group: group,
        codes: [], descriptions: [], vendors: [], amount: 0, frequency: str(b.frequency)
      };
    }
    l.codes.push(str(b.code));
    l.descriptions.push(str(b.description));
    if (str(b.vendor) && l.vendors.indexOf(str(b.vendor)) < 0) l.vendors.push(str(b.vendor));
    l.amount += num(b.amount);
    if (!l.frequency && str(b.frequency)) l.frequency = str(b.frequency);
  });
  return Object.keys(lines).map(function (k) {
    var l = lines[k];
    l.amount = round2(l.amount);
    l.label = l.group
      ? l.group + ' (' + l.codes.join(', ') + ')'
      : l.codes[0] + ' - ' + l.descriptions[0];
    return l;
  }).sort(function (a, b) { return a.label < b.label ? -1 : 1; });
}

function lineUsage(lineKey, requests, excludeId) {
  var committed = 0, paid = 0, count = 0;
  requests.forEach(function (r) {
    if (r.lineKey !== lineKey || r.id === excludeId) return;
    if (NOT_COMMITTED.indexOf(r.status) >= 0) return;
    committed += num(r.total);
    count++;
    if (PAID_STATUSES.indexOf(r.status) >= 0) paid += num(r.total);
  });
  return { committed: round2(committed), paid: round2(paid), count: count };
}

function budgetSummary(year, project) {
  var reqs = STORE.readAll('Requests');
  return budgetLines(year, project).map(function (l) {
    var u = lineUsage(l.key, reqs);
    l.committed = u.committed; l.paid = u.paid; l.invoices = u.count;
    l.balance = round2(l.amount - u.committed);
    return l;
  });
}

/**
 * Replace the budget for one project + year with uploaded rows.
 * rows: [{code, description, amount, vendor?, group?, frequency?}]
 */
function uploadBudget(user, year, project, rows) {
  requireRole(user, ['MANAGER']);
  year = str(year); project = str(project);
  if (!/^\d{4}$/.test(year)) fail('Budget year must be 4 digits.');
  if (PROJECTS.indexOf(project) < 0) fail('Unknown project: ' + project);
  var clean = [];
  (rows || []).forEach(function (r, i) {
    var code = str(r.code), amount = num(String(r.amount).replace(/,/g, ''));
    if (!code && !amount) return; // blank line
    if (!code) fail('Row ' + (i + 2) + ': budget code is missing.');
    var f = str(r.frequency);
    if (f && FREQUENCIES.indexOf(f) < 0) fail('Row ' + (i + 2) + ': frequency must be one of ' + FREQUENCIES.join(', '));
    clean.push({
      year: year, project: project, code: code, description: str(r.description),
      group: str(r.group), vendor: str(r.vendor), amount: round2(amount), frequency: f
    });
  });
  if (!clean.length) fail('The file has no budget rows.');
  STORE.replaceWhere('Budget', function (b) {
    return String(b.year) === year && b.project === project;
  }, clean);
  logEvent(user, '', 'Budget uploaded', '', '', project + ' ' + year + ': ' + clean.length + ' rows');
  return { rows: clean.length, total: round2(clean.reduce(function (s, r) { return s + r.amount; }, 0)) };
}

/* ----------------------------------------------------------------- vendors */

function vendorList(project) {
  var set = {};
  STORE.readAll('Budget').forEach(function (b) {
    if ((!project || b.project === project) && str(b.vendor)) set[str(b.vendor)] = true;
  });
  STORE.readAll('Vendors').forEach(function (v) { if (str(v.name)) set[str(v.name)] = true; });
  return Object.keys(set).sort();
}

function addVendor(user, name) {
  name = str(name);
  if (!name) fail('Vendor name is required.');
  var exists = vendorList().some(function (v) { return v.toLowerCase() === name.toLowerCase(); });
  if (!exists) STORE.append('Vendors', { name: name, addedBy: user.username, addedAt: nowIso() });
  return vendorList();
}

/* ---------------------------------------------------------------- requests */

function logEvent(user, requestId, action, from, to, remark) {
  STORE.append('Log', {
    ts: nowIso(), requestId: requestId, user: user.username, userName: user.name,
    action: action, fromStatus: from, toStatus: to, remark: str(remark)
  });
}

function getRequest(id) {
  var r = STORE.readAll('Requests').filter(function (x) { return x.id === id; })[0];
  if (!r) fail('Request ' + id + ' not found.');
  return r;
}

function setStatus(user, r, to, action, remark, patch) {
  var from = r.status;
  patch = patch || {};
  patch.status = to;
  patch.statusSince = nowIso();
  patch.updatedAt = patch.statusSince;
  if (remark) patch.lastRemark = remark;
  STORE.update('Requests', 'id', r.id, patch);
  logEvent(user, r.id, action, from, to, remark);
}

function periodLabel(r) {
  var m = num(r.month);
  return (m ? MONTHS[m - 1] + ' ' : '') + r.year + (r.frequency ? ' · ' + r.frequency : '');
}

/** Rows for the main table, with budget figures and "days in stage". */
function listRequests(user) {
  var reqs = STORE.readAll('Requests');
  var lines = {};
  budgetLines().forEach(function (l) { lines[l.key] = l; });
  var fu = {};
  STORE.readAll('FollowUps').forEach(function (f) {
    var x = fu[f.requestId] || (fu[f.requestId] = { count: 0, reminders: 0, last: '' });
    x.count++;
    if (f.type === 'Reminder sent') x.reminders++;
    if (f.date > x.last) x.last = f.date;
  });
  var overdueDays = num(getSetting('overdueDays', 15));
  var now = STORE.now();
  return reqs.map(function (r) {
    var l = lines[r.lineKey];
    var u = lineUsage(r.lineKey, reqs);
    var since = r.statusSince || r.createdAt;
    var days = since ? Math.floor(daysBetween(since, now)) : 0;
    return {
      id: r.id, createdAt: r.createdAt, project: r.project, vendor: r.vendor, invoiceNo: r.invoiceNo,
      lineKey: r.lineKey, lineLabel: r.lineLabel, year: r.year, month: r.month, frequency: r.frequency,
      period: periodLabel(r), total: num(r.total), status: r.status, owner: OWNER[r.status] || '',
      budget: l ? l.amount : null, balance: l ? round2(l.amount - u.committed) : null,
      daysInStage: days, overdue: r.status === ST.TO_COLLECT && days >= overdueDays,
      followUps: fu[r.id] || { count: 0, reminders: 0, last: '' },
      lastRemark: r.lastRemark || '', returnTo: r.returnTo || '',
      mine: OWNER[r.status] === user.role
    };
  }).sort(function (a, b) { return a.id < b.id ? 1 : -1; });
}

function requestDetail(user, id) {
  var r = getRequest(id);
  var reqs = STORE.readAll('Requests');
  var line = budgetLines(r.year, r.project).filter(function (l) { return l.key === r.lineKey; })[0];
  var usage = lineUsage(r.lineKey, reqs, r.id);
  var log = STORE.readAll('Log').filter(function (x) { return x.requestId === id; });
  var followUps = STORE.readAll('FollowUps').filter(function (x) { return x.requestId === id; });
  return {
    request: Object.assign({}, r, { checks: parseJson(r.checks, {}) }),
    line: line || null,
    usage: usage,
    balanceBefore: line ? round2(line.amount - usage.committed) : null,
    log: log, timeline: timeline(log, r), followUps: followUps,
    actions: availableActions(user, r)
  };
}

function availableActions(user, r) {
  var a = [];
  var s = r.status, role = user.role;
  if (role === 'AE' && (s === ST.TO_COLLECT || s === ST.RETURNED)) a.push('edit', 'submit');
  if (role === 'REVIEWER' && s === ST.PENDING_REVIEW) a.push('approve', 'reject');
  if (role === 'MANAGER' && (s === ST.PENDING_MGR || s === ST.PENDING_BANK_APPROVAL)) a.push('approve', 'reject');
  if (role === 'AE' && s === ST.PENDING_BANK_INIT) a.push('bankInitiated');
  if (role === 'AE' && s === ST.WITH_BANK) a.push('markPaid');
  if (role === 'AE' && s === ST.PENDING_NOBROKER) a.push('nobroker');
  if (role === 'MANAGER' && [ST.CLOSED, ST.CANCELLED].indexOf(s) < 0) a.push('cancel');
  if ([ST.CLOSED, ST.CANCELLED].indexOf(s) < 0) a.push('followUp');
  return a;
}

/** Time spent in each stage, from the log. */
function timeline(log, r) {
  var events = log.filter(function (e) { return e.toStatus; })
    .sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
  var out = [];
  for (var i = 0; i < events.length; i++) {
    var e = events[i], next = events[i + 1];
    out.push({
      status: e.toStatus, start: e.ts, end: next ? next.ts : '',
      days: Math.round(daysBetween(e.ts, next ? next.ts : STORE.now()) * 10) / 10,
      enteredBy: e.userName || e.user, exitedBy: next ? (next.userName || next.user) : '',
      exitAction: next ? next.action : '', open: !next
    });
  }
  return out;
}

/**
 * Create a new request or save/submit an existing To Collect / Returned one.
 * data: {id?, project, vendor, lineKey, invoiceNo, frequency, month, year, net, vat,
 *        checks:{}, overBudgetReason, file:{name, mime, base64}?}
 * submit: true to send it for review, false to just save.
 */
function saveRequest(user, data, submit) {
  requireRole(user, ['AE', 'MANAGER']);
  var existing = data.id ? getRequest(data.id) : null;
  if (existing && [ST.TO_COLLECT, ST.RETURNED].indexOf(existing.status) < 0)
    fail('This request is ' + existing.status + ' and can no longer be edited.');

  var project = str(data.project), vendor = str(data.vendor), year = str(data.year);
  if (PROJECTS.indexOf(project) < 0) fail('Choose a project.');
  if (!vendor) fail('Choose a vendor.');
  var line = budgetLines(year, project).filter(function (l) { return l.key === data.lineKey; })[0];
  if (!line) fail('Choose a budget code for ' + project + ' ' + year + '.');

  var net = round2(data.net), vat = round2(data.vat), total = round2(net + vat);
  var checks = {};
  CHECKS.forEach(function (c) { checks[c.key] = !!(data.checks && data.checks[c.key]); });

  var reqs = STORE.readAll('Requests');
  var id = existing ? existing.id : nextId('PRF-' + year + '-', reqs, 'id');
  var invoiceNo = str(data.invoiceNo);

  var patch = {
    year: year, project: project, vendor: vendor, lineKey: line.key, lineLabel: line.label,
    codes: line.codes.join(', '), invoiceNo: invoiceNo, frequency: str(data.frequency),
    month: str(data.month), net: net, vat: vat, total: total, checks: JSON.stringify(checks),
    overBudgetReason: str(data.overBudgetReason), updatedAt: nowIso()
  };

  if (submit) {
    if (!invoiceNo) fail('Invoice number is required.');
    if (!(total > 0)) fail('Invoice amount must be more than zero.');
    if (FREQUENCIES.indexOf(patch.frequency) < 0) fail('Choose monthly, quarterly, half-yearly or annual.');
    if (!(num(patch.month) >= 1 && num(patch.month) <= 12)) fail('Choose the invoice month.');
    var missing = CHECKS.filter(function (c) { return !checks[c.key]; });
    if (missing.length) fail('Tick all checks before submitting. Missing: ' + missing.map(function (c) { return c.label; }).join('; '));
    var dup = reqs.filter(function (r) {
      return r.id !== id && r.status !== ST.CANCELLED &&
        str(r.vendor).toLowerCase() === vendor.toLowerCase() &&
        str(r.invoiceNo).toLowerCase() === invoiceNo.toLowerCase();
    })[0];
    if (dup) fail('Invoice ' + invoiceNo + ' from ' + vendor + ' is already on ' + dup.id + '.');
    var balance = line.amount - lineUsage(line.key, reqs, id).committed;
    if (total > balance + 0.005 && !patch.overBudgetReason)
      fail('OVER_BUDGET:' + round2(balance));
    if (!data.file && !(existing && existing.invoiceFileUrl)) fail('Attach the invoice pack PDF.');
  }

  if (!existing) {
    patch.id = id; patch.status = ST.TO_COLLECT; patch.createdBy = user.username;
    patch.createdAt = nowIso(); patch.statusSince = patch.createdAt;
  }

  var folder = folderPath(Object.assign({}, existing || {}, patch));
  if (data.file) {
    var f = STORE.saveFile(folder, '01 Invoice pack - ' + safeName(invoiceNo || id) + extOf(data.file.name), data.file);
    patch.invoiceFileUrl = f.url;
    patch.folderUrl = f.folderUrl;
  }

  if (existing) STORE.update('Requests', 'id', id, patch);
  else {
    STORE.append('Requests', patch);
    logEvent(user, id, 'Created', '', ST.TO_COLLECT, 'Created manually');
  }

  if (submit) {
    var cur = getRequest(id);
    var to = cur.status === ST.RETURNED && cur.returnTo ? cur.returnTo : ST.PENDING_REVIEW;
    setStatus(user, cur, to, cur.status === ST.RETURNED ? 'Resubmitted' : 'Submitted',
      patch.overBudgetReason && total > line.amount - lineUsage(line.key, reqs, id).committed
        ? 'Over budget: ' + patch.overBudgetReason : '',
      { submittedAt: cur.submittedAt || nowIso(), returnTo: '' });
  }
  return id;
}

function folderPath(r) {
  return [r.project, r.id + ' - ' + safeName(r.vendor) + (r.invoiceNo ? ' - ' + safeName(r.invoiceNo) : '')];
}
function safeName(s) { return str(s).replace(/[\\/:*?"<>|#]/g, '-').slice(0, 60); }
function extOf(name) { var m = str(name).match(/\.[A-Za-z0-9]{1,5}$/); return m ? m[0] : ''; }

function approve(user, id, remark) {
  var r = getRequest(id);
  if (r.status === ST.PENDING_REVIEW) {
    requireRole(user, ['REVIEWER']);
    setStatus(user, r, ST.PENDING_MGR, 'Reviewed & approved', remark);
  } else if (r.status === ST.PENDING_MGR) {
    requireRole(user, ['MANAGER']);
    setStatus(user, r, ST.PENDING_BANK_INIT, 'Manager approved', remark);
  } else if (r.status === ST.PENDING_BANK_APPROVAL) {
    requireRole(user, ['MANAGER']);
    setStatus(user, r, ST.WITH_BANK, 'Approved on bank portal', remark);
  } else fail(id + ' is ' + r.status + '; nothing to approve.');
  return true;
}

function bulkApprove(user, ids, remark) {
  var done = [], errors = [];
  (ids || []).forEach(function (id) {
    try { approve(user, id, remark); done.push(id); } catch (e) { errors.push(id + ': ' + e.message); }
  });
  return { done: done, errors: errors };
}

function reject(user, id, remark) {
  remark = str(remark);
  if (!remark) fail('Write a remark so the accounts executive knows what to fix.');
  var r = getRequest(id);
  var allowed = { };
  allowed[ST.PENDING_REVIEW] = 'REVIEWER';
  allowed[ST.PENDING_MGR] = 'MANAGER';
  allowed[ST.PENDING_BANK_APPROVAL] = 'MANAGER';
  if (!allowed[r.status]) fail(id + ' is ' + r.status + '; it cannot be rejected now.');
  requireRole(user, [allowed[r.status]]);
  // Rejected on the bank portal: the AE re-initiates in the bank, so it goes
  // back to "Pending Bank Initiation" rather than to the start.
  var back = r.status === ST.PENDING_BANK_APPROVAL ? ST.PENDING_BANK_INIT : ST.RETURNED;
  setStatus(user, r, back, 'Rejected', remark, { returnTo: back === ST.RETURNED ? r.status : '' });
  return true;
}

function bankInitiated(user, id, bankRef) {
  requireRole(user, ['AE']);
  var r = getRequest(id);
  if (r.status !== ST.PENDING_BANK_INIT) fail(id + ' is ' + r.status + '.');
  setStatus(user, r, ST.PENDING_BANK_APPROVAL, 'Initiated in bank', bankRef ? 'Bank ref: ' + bankRef : '',
    { bankRef: str(bankRef) });
  return true;
}

function markPaid(user, id, paidDate, file) {
  requireRole(user, ['AE']);
  var r = getRequest(id);
  if (r.status !== ST.WITH_BANK) fail(id + ' is ' + r.status + '.');
  if (!str(paidDate)) fail('Enter the payment date.');
  if (!file) fail('Attach the bank payment proof.');
  var f = STORE.saveFile(folderPath(r), '02 Payment proof' + extOf(file.name), file);
  setStatus(user, r, ST.PENDING_NOBROKER, 'Paid by bank', 'Paid on ' + paidDate,
    { paidDate: str(paidDate), proofFileUrl: f.url, folderUrl: r.folderUrl || f.folderUrl });
  return true;
}

function nobrokerUpdated(user, id) {
  requireRole(user, ['AE']);
  var r = getRequest(id);
  if (r.status !== ST.PENDING_NOBROKER) fail(id + ' is ' + r.status + '.');
  setStatus(user, r, ST.CLOSED, 'Updated in NoBroker', '');
  return true;
}

function cancelRequest(user, id, remark) {
  requireRole(user, ['MANAGER']);
  if (!str(remark)) fail('Give a reason for cancelling.');
  var r = getRequest(id);
  if ([ST.CLOSED, ST.CANCELLED].indexOf(r.status) >= 0) fail(id + ' is already ' + r.status + '.');
  setStatus(user, r, ST.CANCELLED, 'Cancelled', remark);
  return true;
}

function addFollowUp(user, id, data) {
  var r = getRequest(id);
  var type = FOLLOWUP_TYPES.indexOf(data.type) >= 0 ? data.type : 'Other';
  if (!str(data.date)) fail('Enter the date.');
  var url = '';
  if (data.file) {
    var n = STORE.readAll('FollowUps').filter(function (f) { return f.requestId === id; }).length + 1;
    var path = folderPath(r).concat(['Correspondence']);
    url = STORE.saveFile(path, String(n).padStart(2, '0') + ' ' + data.date + ' ' + type + extOf(data.file.name), data.file).url;
  }
  STORE.append('FollowUps', {
    ts: nowIso(), requestId: id, user: user.username, userName: user.name,
    type: type, date: str(data.date), remark: str(data.remark), fileUrl: url
  });
  STORE.update('Requests', 'id', id, { updatedAt: nowIso() });
  return true;
}

/* --------------------------------------------------------------- schedules */

/** Default collection frequency from the budget description. */
function defaultFrequency(text) {
  var t = str(text).toLowerCase();
  if (/master\s*community/.test(t)) return 'Quarterly';
  if (/civil\s*defen|\bdcd\b|\btcd\b/.test(t)) return 'Annual';
  if (/\brera\b/.test(t)) return 'Annual';
  if (/pest/.test(t) || /waste|garbage/.test(t)) return 'Monthly';
  if (/water\s*tank/.test(t) || /fa[cç]ade/.test(t)) return 'Half-yearly';
  return 'Quarterly';
}

function listSchedules() {
  return STORE.readAll('Schedules').sort(function (a, b) {
    return (a.project + a.lineLabel) < (b.project + b.lineLabel) ? -1 : 1;
  });
}

function saveSchedule(user, s) {
  requireRole(user, ['MANAGER', 'AE']);
  var line = budgetLines(s.year, s.project).filter(function (l) { return l.key === s.lineKey; })[0];
  if (!line) fail('Choose a budget code.');
  if (FREQUENCIES.indexOf(s.frequency) < 0) fail('Choose a frequency.');
  var row = {
    year: str(s.year), project: s.project, vendor: str(s.vendor) || line.vendors[0] || '',
    lineKey: line.key, lineLabel: line.label, frequency: s.frequency,
    startMonth: str(s.startMonth || 1), active: s.active === false ? 'FALSE' : 'TRUE'
  };
  if (s.id) STORE.update('Schedules', 'id', s.id, row);
  else {
    row.id = nextId('SCH-', STORE.readAll('Schedules'), 'id');
    row.createdBy = user.username; row.createdAt = nowIso();
    STORE.append('Schedules', row);
  }
  return true;
}

function schedulesFromBudget(user, year, project) {
  requireRole(user, ['MANAGER']);
  var existing = {};
  STORE.readAll('Schedules').forEach(function (s) { existing[s.lineKey] = true; });
  var made = 0;
  var projects = project ? [project] : PROJECTS;
  projects.forEach(function (p) {
    budgetLines(year, p).forEach(function (l) {
      if (existing[l.key]) return;
      saveSchedule(user, {
        year: year, project: p, lineKey: l.key, vendor: l.vendors[0] || '',
        frequency: l.frequency || defaultFrequency(l.descriptions.join(' ') + ' ' + l.group),
        startMonth: 1
      });
      made++;
    });
  });
  return made;
}

/** Period that `date` falls in, for a frequency. month = month the invoice is for. */
function periodFor(freq, date) {
  var y = date.getFullYear(), m = date.getMonth() + 1;
  if (freq === 'Monthly') return { key: y + '-M' + m, start: m, month: m };
  if (freq === 'Quarterly') { var q = Math.ceil(m / 3); return { key: y + '-Q' + q, start: q * 3 - 2, month: q * 3 }; }
  if (freq === 'Half-yearly') { var h = m <= 6 ? 1 : 2; return { key: y + '-H' + h, start: h * 6 - 5, month: h * 6 }; }
  return { key: y + '-Y', start: 1, month: 12 };
}

/**
 * Create "To Collect" lines for every active schedule whose current period
 * has started and has no line yet. Runs daily from a trigger; safe to re-run.
 */
function generateDue(sysUser) {
  var today = STORE.now();
  var reqs = STORE.readAll('Requests');
  var have = {};
  reqs.forEach(function (r) { if (r.scheduleId) have[r.scheduleId + '|' + r.periodKey] = true; });
  var made = [];
  STORE.readAll('Schedules').forEach(function (s) {
    if (str(s.active) === 'FALSE') return;
    if (String(today.getFullYear()) !== String(s.year)) return;
    var p = periodFor(s.frequency, today);
    if (p.month < num(s.startMonth || 1)) return;
    if (have[s.id + '|' + p.key]) return;
    var id = nextId('PRF-' + s.year + '-', reqs, 'id');
    var row = {
      id: id, year: String(s.year), project: s.project, vendor: s.vendor, lineKey: s.lineKey,
      lineLabel: s.lineLabel, frequency: s.frequency, month: String(p.month), invoiceNo: '',
      net: 0, vat: 0, total: 0, checks: '{}', status: ST.TO_COLLECT, scheduleId: s.id, periodKey: p.key,
      createdBy: 'system', createdAt: nowIso(), statusSince: nowIso(), updatedAt: nowIso()
    };
    STORE.append('Requests', row);
    reqs.push(row);
    have[s.id + '|' + p.key] = true;
    logEvent(sysUser, id, 'Scheduled', '', ST.TO_COLLECT, 'From schedule ' + s.id + ' (' + p.key + ')');
    made.push(id);
  });
  return made;
}

/* ----------------------------------------------------------------- reports */

/** How long each person took on the steps they completed. */
function performanceReport() {
  var log = STORE.readAll('Log').filter(function (e) { return e.requestId && e.toStatus; })
    .sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
  var byReq = {};
  log.forEach(function (e) { (byReq[e.requestId] = byReq[e.requestId] || []).push(e); });
  var people = {}, stages = {};
  var now = STORE.now();
  Object.keys(byReq).forEach(function (id) {
    var ev = byReq[id];
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i], next = ev[i + 1];
      var d = daysBetween(e.ts, next ? next.ts : now);
      var st = stages[e.toStatus] || (stages[e.toStatus] = { status: e.toStatus, done: 0, totalDays: 0, open: 0, openDays: 0 });
      if (next) {
        st.done++; st.totalDays += d;
        var who = next.userName || next.user;
        var p = people[who] || (people[who] = { person: who, steps: 0, totalDays: 0, maxDays: 0, rejections: 0 });
        p.steps++; p.totalDays += d; p.maxDays = Math.max(p.maxDays, d);
        if (next.action === 'Rejected') p.rejections++;
      } else if ([ST.CLOSED, ST.CANCELLED].indexOf(e.toStatus) < 0) {
        st.open++; st.openDays = Math.max(st.openDays, d);
      }
    }
  });
  function fin(o) {
    o.avgDays = o.steps || o.done ? Math.round(o.totalDays / (o.steps || o.done) * 10) / 10 : 0;
    if (o.maxDays != null) o.maxDays = Math.round(o.maxDays * 10) / 10;
    if (o.openDays != null) o.openDays = Math.round(o.openDays * 10) / 10;
    delete o.totalDays;
    return o;
  }
  return {
    people: Object.keys(people).map(function (k) { return fin(people[k]); }),
    stages: Object.keys(stages).map(function (k) { return fin(stages[k]); })
  };
}

/* ---------------------------------------------------------------- settings */

function getSetting(key, dflt) {
  var s = STORE.readAll('Settings').filter(function (x) { return x.key === key; })[0];
  return s && str(s.value) !== '' ? s.value : dflt;
}

/* -------------------------------------------------------------- dispatcher */

/** Single entry point the web page calls. */
function handle(token, action, p) {
  p = p || {};
  if (action === 'login') return login(p.username, p.password);
  var user = userFromToken(token);
  switch (action) {
    case 'bootstrap':
      return {
        user: publicUser(user), projects: PROJECTS, checks: CHECKS, frequencies: FREQUENCIES,
        months: MONTHS, statuses: ST, owners: OWNER, followUpTypes: FOLLOWUP_TYPES,
        vendors: vendorList(), today: nowIso(), currentYear: String(STORE.now().getFullYear())
      };
    case 'logout': return logout(token);
    case 'changePassword': return changePassword(user, p.oldPw, p.newPw);
    case 'listRequests': return listRequests(user);
    case 'requestDetail': return requestDetail(user, p.id);
    case 'budgetLines': return budgetSummary(p.year, p.project);
    case 'vendors': return vendorList(p.project);
    case 'addVendor': return addVendor(user, p.name);
    case 'saveRequest': return saveRequest(user, p.data, !!p.submit);
    case 'approve': return approve(user, p.id, p.remark);
    case 'bulkApprove': return bulkApprove(user, p.ids, p.remark);
    case 'reject': return reject(user, p.id, p.remark);
    case 'bankInitiated': return bankInitiated(user, p.id, p.bankRef);
    case 'markPaid': return markPaid(user, p.id, p.paidDate, p.file);
    case 'nobroker': return nobrokerUpdated(user, p.id);
    case 'cancel': return cancelRequest(user, p.id, p.remark);
    case 'addFollowUp': return addFollowUp(user, p.id, p.data || {});
    case 'listSchedules': return listSchedules();
    case 'saveSchedule': return saveSchedule(user, p.schedule || {});
    case 'schedulesFromBudget': return schedulesFromBudget(user, p.year, p.project);
    case 'generateDue': requireRole(user, ['MANAGER', 'AE']); return generateDue(user);
    case 'uploadBudget': return uploadBudget(user, p.year, p.project, p.rows);
    case 'report': return performanceReport();
  }
  fail('Unknown action: ' + action);
}
