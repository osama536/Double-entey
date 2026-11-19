/* In-browser stand-in for Server.gs so the portal can be tried without Google.
   Data lives in memory (and localStorage, so a refresh keeps it). */
(function () {
  var KEY = 'prfPreviewDb_v1';
  var db;
  try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
  var cache = {};
  var clockOffset = 0; // preview can fast-forward time
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function h(s) { var x = 5381; for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0; return 'h' + x.toString(16); }

  window.STORE = {
    now: function () { return new Date(Date.now() + clockOffset); },
    readAll: function (n) { return (db[n] || []).map(function (r) { return Object.assign({}, r); }); },
    append: function (n, o) {
      var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k] == null ? '' : String(o[k]); });
      (db[n] = db[n] || []).push(r); persist();
    },
    update: function (n, k, v, patch) {
      var r = (db[n] || []).filter(function (x) { return String(x[k]) === String(v); })[0];
      if (!r) throw new Error(n + ' ' + v + ' not found');
      Object.keys(patch).forEach(function (f) { r[f] = patch[f] == null ? '' : String(patch[f]); }); persist();
    },
    replaceWhere: function (n, pred, rows) {
      db[n] = (db[n] || []).filter(function (x) { return !pred(x); });
      rows.forEach(function (r) { STORE.append(n, r); }); persist();
    },
    saveFile: function (path, name, file) {
      var url = 'data:' + (file.mime || 'application/pdf') + ';base64,' + file.base64;
      return { url: file.base64.length < 2000000 ? url : '#preview-file-' + encodeURIComponent(name), folderUrl: '#PRF Portal/' + path.slice(0, 2).join('/') };
    },
    hash: h,
    newToken: function () { return Math.random().toString(36).slice(2) + Date.now().toString(36); },
    cachePut: function (k, v) { cache[k] = v; try { sessionStorage.setItem(k, v); } catch (e) {} },
    cacheGet: function (k) { if (cache[k]) return cache[k]; try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    cacheRemove: function (k) { delete cache[k]; try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  function seed() {
    db = { Users: [], Budget: [], Vendors: [], Requests: [], Log: [], FollowUps: [], Schedules: [], Settings: [{ key: 'overdueDays', value: '15' }] };
    [['minhas', 'Mr. Minhas', 'AE'], ['ihtisham', 'Muhammad Ihtisham', 'REVIEWER'], ['shabir', 'Shabir', 'MANAGER'], ['osama', 'Osama', 'MANAGER']]
      .forEach(function (u) { db.Users.push({ username: u[0], name: u[1], role: u[2], salt: 's', passHash: h('s' + 'demo'), active: 'TRUE' }); });
    // SAMPLE budget only — replace by uploading the real 2026 budgets.
    var sample = [
      ['01-001', 'Cleaning services', 180000, 'Kawthar Al Khair', 'Cleaning & Maintenance', 'Monthly'],
      ['01-002', 'MEP / general maintenance', 144000, 'IMB Technical Services', 'Cleaning & Maintenance', 'Monthly'],
      ['02-001', 'Master community service charge', 96000, 'Master Community', '', ''],
      ['03-001', 'Civil Defence (DCD) annual fee', 8500, 'Dubai Civil Defence', '', ''],
      ['03-002', 'RERA fee', 12000, 'RERA', '', ''],
      ['04-001', 'Pest control', 7200, 'Green Pest Services', '', ''],
      ['04-002', 'Waste collection', 30000, 'Clean City Waste', '', ''],
      ['05-001', 'Water tank cleaning', 6000, 'AquaCare', '', ''],
      ['05-002', 'Facade cleaning', 24000, 'Skyline Facade', '', ''],
      ['06-001', 'CCTV maintenance', 16000, 'SecureVision', '', ''],
      ['07-001', 'District cooling', 420000, 'Empower', '', 'Monthly']
    ];
    PROJECTS.forEach(function (p, i) {
      sample.forEach(function (s) {
        var vendor = s[3];
        if (p === 'Equiti Residence' && s[4]) vendor = 'SPS Max';
        db.Budget.push({ year: '2026', project: p, code: s[0], description: s[1], group: s[4], vendor: vendor,
          amount: String(Math.round(s[2] * (0.8 + i * 0.07))), frequency: s[5] });
      });
    });
    persist();
  }
  if (!db) seed();

  function demoFlow() {
    // A few requests at different stages so every screen has something on it.
    var u = {}; db.Users.forEach(function (x) { u[x.username] = x; });
    var allChecks = {}; CHECKS.forEach(function (c) { allChecks[c.key] = true; });
    var pdf = { name: 'invoice.pdf', mime: 'application/pdf', base64: 'JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PC9UeXBlL0NhdGFsb2c+PgplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSPj4KJSVFT0YK' };
    function line(p, code) { return budgetLines('2026', p).filter(function (l) { return l.codes.indexOf(code) >= 0; })[0]; }
    function mk(p, code, vendor, inv, month, net, freq) {
      return saveRequest(u.minhas, { project: p, year: '2026', vendor: vendor, lineKey: line(p, code).key, invoiceNo: inv,
        frequency: freq, month: String(month), net: net, vat: Math.round(net * 5) / 100, checks: allChecks, file: pdf }, true);
    }
    clockOffset = -20 * 86400000;
    var a = mk('SIT Tower', '01-001', 'Kawthar Al Khair', 'KAK-2026-1041', 10, 26000, 'Monthly');
    var b = mk('BNH Tower 03', '03-001', 'Dubai Civil Defence', 'DCD-88412', 12, 8000, 'Annual');
    var c = mk('Equiti Residence', '01-001', 'SPS Max', 'SPS-7781', 10, 22500, 'Monthly');
    var e = mk('Equiti Arcade', '06-001', 'SecureVision', 'SV-Q3-221', 9, 4200, 'Quarterly');
    clockOffset = -16 * 86400000; approve(u.ihtisham, a, ''); approve(u.ihtisham, b, ''); approve(u.ihtisham, c, ''); approve(u.ihtisham, e, '');
    clockOffset = -14 * 86400000; approve(u.shabir, a, ''); approve(u.osama, b, ''); approve(u.osama, e, '');
    clockOffset = -13 * 86400000; bankInitiated(u.minhas, a, 'ENBD-55120'); bankInitiated(u.minhas, b, 'ENBD-55121'); bankInitiated(u.minhas, e, 'ENBD-55122');
    clockOffset = -11 * 86400000; approve(u.shabir, a, ''); approve(u.shabir, e, '');
    clockOffset = -9 * 86400000; markPaid(u.minhas, a, '2026-11-10', pdf);
    clockOffset = -8 * 86400000; nobrokerUpdated(u.minhas, a);
    clockOffset = -6 * 86400000;
    var f = mk('Al Falak Residence', '04-001', 'Green Pest Services', 'GPS-1120', 11, 600, 'Monthly');
    clockOffset = -4 * 86400000; reject(u.ihtisham, f, 'Service report is not stamped by the building. Please get it stamped and re-attach.');
    clockOffset = -2 * 86400000;
    mk('BNH Smart Tower', '04-002', 'Clean City Waste', 'CCW-3390', 11, 2600, 'Monthly');
    mk('Equiti Apartments', '01-001', 'Kawthar Al Khair', 'KAK-2026-1102', 11, 21000, 'Monthly');
    clockOffset = -25 * 86400000;
    schedulesFromBudget(u.osama, '2026', 'SIT Tower');
    schedulesFromBudget(u.osama, '2026', 'Equiti Arcade');
    generateDue({ username: 'system', name: 'System' });
    var tc = db.Requests.filter(function (r) { return r.status === ST.TO_COLLECT && r.project === 'SIT Tower' && /CCTV/.test(r.lineLabel); })[0];
    clockOffset = -12 * 86400000;
    if (tc) addFollowUp(u.minhas, tc.id, { type: 'Reminder sent', date: '2026-11-07', remark: 'Emailed SecureVision for Q4 CCTV invoice' });
    clockOffset = -5 * 86400000;
    if (tc) addFollowUp(u.minhas, tc.id, { type: 'Reminder sent', date: '2026-11-14', remark: 'Second reminder, asked to send by 20 Nov' });
    clockOffset = 0;
    db.demo = true; persist();
  }
  if (!db.demo) demoFlow();

  // google.script.run shim
  function runner(ok, bad) {
    return new Proxy({}, {
      get: function (t, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, bad); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f); };
        return function (token, action, payload) {
          setTimeout(function () {
            var r;
            try { r = handle(token, action, payload); r = r === undefined ? null : JSON.parse(JSON.stringify(r)); }
            catch (e) { return bad && bad(e); }
            ok && ok(r);
          }, 60);
        };
      }
    });
  }
  window.google = { script: { run: runner() } };
  window.PRF_PREVIEW = { reset: function () { localStorage.removeItem(KEY); sessionStorage.clear(); location.reload(); } };
})();
