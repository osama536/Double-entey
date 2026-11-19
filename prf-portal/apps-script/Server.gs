/**
 * PRF Portal — Apps Script side: web app entry, Sheets/Drive storage,
 * one-time setup and the daily schedule trigger.
 *
 * Deploy as a web app that runs as YOU (the owner), so the database sheet and
 * the "PRF Portal" Drive folder only need to be shared with you. People log in
 * with the username/password kept (hashed) in the Users sheet.
 */

var SHEETS = {
  Users: ['username', 'name', 'role', 'email', 'salt', 'passHash', 'active'],
  Budget: ['year', 'project', 'code', 'description', 'group', 'vendor', 'amount', 'frequency'],
  Vendors: ['name', 'addedBy', 'addedAt'],
  Requests: ['id', 'year', 'project', 'vendor', 'lineKey', 'lineLabel', 'codes', 'invoiceNo', 'frequency',
    'month', 'net', 'vat', 'total', 'checks', 'status', 'statusSince', 'returnTo', 'lastRemark',
    'overBudgetReason', 'invoiceFileUrl', 'proofFileUrl', 'folderUrl', 'bankRef', 'paidDate',
    'scheduleId', 'periodKey', 'createdBy', 'createdAt', 'submittedAt', 'updatedAt'],
  Log: ['ts', 'requestId', 'user', 'userName', 'action', 'fromStatus', 'toStatus', 'remark'],
  FollowUps: ['ts', 'requestId', 'user', 'userName', 'type', 'date', 'remark', 'fileUrl'],
  Schedules: ['id', 'year', 'project', 'vendor', 'lineKey', 'lineLabel', 'frequency', 'startMonth',
    'active', 'createdBy', 'createdAt'],
  Settings: ['key', 'value']
};

var PROPS = PropertiesService.getScriptProperties();

/* --------------------------------------------------------------- web app */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('PRF Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Called by the page: google.script.run.api(token, action, payload). */
function api(token, action, payload) {
  var writes = /^(save|add|approve|bulk|reject|bank|mark|nobroker|cancel|schedules|generate|upload|change)/;
  var lock = writes.test(action) ? LockService.getScriptLock() : null;
  if (lock) lock.waitLock(30000);
  try {
    _cache = {};
    return JSON.parse(JSON.stringify(handle(token, action, payload)));
  } finally {
    if (lock) lock.releaseLock();
  }
}

/* ---------------------------------------------------------------- storage */

var _cache = {};

function db_() {
  var id = PROPS.getProperty('DB_ID');
  if (!id) throw new Error('Run setup() first.');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  var sh = db_().getSheetByName(name);
  if (!sh) throw new Error('Missing sheet ' + name + '. Run setup() again.');
  return sh;
}

var STORE = {
  now: function () { return new Date(); },

  readAll: function (name) {
    if (_cache[name]) return _cache[name].map(function (r) { return Object.assign({}, r); });
    var sh = sheet_(name);
    var values = sh.getDataRange().getValues();
    var head = values.shift() || [];
    var rows = values.filter(function (v) { return v.join('') !== ''; }).map(function (v) {
      var o = {};
      head.forEach(function (h, i) {
        var x = v[i];
        o[h] = x instanceof Date ? x.toISOString() : (x === '' ? '' : String(x));
      });
      return o;
    });
    _cache[name] = rows;
    return rows.map(function (r) { return Object.assign({}, r); });
  },

  append: function (name, obj) {
    var sh = sheet_(name);
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    sh.appendRow(head.map(function (h) { return obj[h] == null ? '' : obj[h]; }));
    delete _cache[name];
  },

  update: function (name, keyField, keyVal, patch) {
    var sh = sheet_(name);
    var values = sh.getDataRange().getValues();
    var head = values[0];
    var k = head.indexOf(keyField);
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][k]) === String(keyVal)) {
        var row = values[i].slice();
        Object.keys(patch).forEach(function (f) {
          var c = head.indexOf(f);
          if (c >= 0) row[c] = patch[f] == null ? '' : patch[f];
        });
        sh.getRange(i + 1, 1, 1, head.length).setValues([row]);
        delete _cache[name];
        return;
      }
    }
    throw new Error(name + ' ' + keyVal + ' not found');
  },

  /** Delete rows matching `pred` and append `rows`. */
  replaceWhere: function (name, pred, rows) {
    var sh = sheet_(name);
    var values = sh.getDataRange().getValues();
    var head = values[0];
    var keep = values.slice(1).filter(function (v) {
      var o = {}; head.forEach(function (h, i) { o[h] = String(v[i]); });
      return v.join('') !== '' && !pred(o);
    });
    var add = rows.map(function (r) { return head.map(function (h) { return r[h] == null ? '' : r[h]; }); });
    var all = keep.concat(add);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, head.length).clearContent();
    if (all.length) sh.getRange(2, 1, all.length, head.length).setValues(all);
    delete _cache[name];
  },

  /** Save a base64 file under PRF Portal/<path...>. Returns {url, folderUrl}. */
  saveFile: function (path, fileName, file) {
    var folder = DriveApp.getFolderById(PROPS.getProperty('ROOT_FOLDER_ID'));
    path.forEach(function (p) {
      var it = folder.getFoldersByName(p);
      folder = it.hasNext() ? it.next() : folder.createFolder(p);
    });
    var blob = Utilities.newBlob(Utilities.base64Decode(file.base64), file.mime || 'application/pdf', fileName);
    var f = folder.createFile(blob);
    var top = DriveApp.getFolderById(PROPS.getProperty('ROOT_FOLDER_ID'));
    var reqFolder = top;
    path.slice(0, 2).forEach(function (p) { reqFolder = reqFolder.getFoldersByName(p).next(); });
    return { url: f.getUrl(), folderUrl: reqFolder.getUrl() };
  },

  hash: function (s) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
      .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  },

  newToken: function () { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); },

  cachePut: function (k, v) { CacheService.getScriptCache().put(k, v, 21600); }, // 6 hours
  cacheGet: function (k) { return CacheService.getScriptCache().get(k); },
  cacheRemove: function (k) { CacheService.getScriptCache().remove(k); }
};

/* ------------------------------------------------------------------ setup */

/**
 * Run once from the Apps Script editor (select "setup" → Run).
 * Creates the database spreadsheet, the "PRF Portal" Drive folder, the four
 * users with temporary passwords, and the daily trigger. Safe to run again:
 * it only adds what is missing. Temporary passwords are written to the log.
 */
function setup() {
  var dbId = PROPS.getProperty('DB_ID');
  var ss = dbId ? SpreadsheetApp.openById(dbId) : SpreadsheetApp.create('PRF Portal - Database');
  PROPS.setProperty('DB_ID', ss.getId());

  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = SHEETS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), head.length).setNumberFormat('@'); // keep text as text
  });
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  if (!PROPS.getProperty('ROOT_FOLDER_ID')) {
    var it = DriveApp.getFoldersByName('PRF Portal');
    var root = it.hasNext() ? it.next() : DriveApp.createFolder('PRF Portal');
    PROPS.setProperty('ROOT_FOLDER_ID', root.getId());
  }
  var rootFolder = DriveApp.getFolderById(PROPS.getProperty('ROOT_FOLDER_ID'));
  DriveApp.getFileById(ss.getId()).moveTo(rootFolder);

  _cache = {};
  var users = STORE.readAll('Users');
  var wanted = [
    ['minhas', 'Mr. Minhas', 'AE'],
    ['ihtisham', 'Muhammad Ihtisham', 'REVIEWER'],
    ['shabir', 'Shabir', 'MANAGER'],
    ['osama', 'Osama', 'MANAGER']
  ];
  wanted.forEach(function (w) {
    if (users.some(function (u) { return u.username === w[0]; })) return;
    var pw = Utilities.getUuid().slice(0, 8);
    var salt = Utilities.getUuid().slice(0, 12);
    STORE.append('Users', { username: w[0], name: w[1], role: w[2], email: '', salt: salt,
      passHash: STORE.hash(salt + pw), active: 'TRUE' });
    Logger.log('User %s  temporary password: %s', w[0], pw);
  });

  if (!STORE.readAll('Settings').some(function (s) { return s.key === 'overdueDays'; }))
    STORE.append('Settings', { key: 'overdueDays', value: '15' });

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyJob') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(6).create();

  Logger.log('Database: %s', ss.getUrl());
  Logger.log('Drive folder: %s', rootFolder.getUrl());
}

/** Daily: create "To Collect" lines for schedules whose period has started. */
function dailyJob() {
  _cache = {};
  var made = generateDue({ username: 'system', name: 'System' });
  Logger.log('Created %s To Collect lines', made.length);
}

/** Reset one user's password from the editor: resetPassword('minhas'). */
function resetPassword(username) {
  _cache = {};
  var pw = Utilities.getUuid().slice(0, 8);
  var salt = Utilities.getUuid().slice(0, 12);
  STORE.update('Users', 'username', username, { salt: salt, passHash: STORE.hash(salt + pw) });
  Logger.log('New temporary password for %s: %s', username, pw);
}
