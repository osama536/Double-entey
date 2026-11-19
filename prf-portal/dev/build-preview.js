// Builds dev/preview.html: the real Index.html + Core.gs + an in-memory store.
// Usage: node prf-portal/dev/build-preview.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'apps-script/Index.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'apps-script/Core.gs'), 'utf8');
const mock = fs.readFileSync(path.join(__dirname, 'mock-store.js'), 'utf8');
const banner = '<div style="background:#fff3dc;color:#7a4a00;padding:6px 16px;font:12px system-ui;border-bottom:1px solid #f0d9a8">' +
  'PREVIEW with sample data — logins: minhas / ihtisham / shabir / osama, password <b>demo</b>. ' +
  '<a href="#" onclick="PRF_PREVIEW.reset();return false">Reset sample data</a></div>';
const inject = '<script>\n' + core + '\n</script>\n<script>\n' + mock + '\n</script>\n';
let out = index.replace('<body>', '<body>\n' + banner).replace('<script>\n/* ====', inject + '<script>\n/* ====');
if (out === index) throw new Error('injection points not found');
fs.writeFileSync(path.join(__dirname, 'preview.html'), out);
console.log('wrote', path.join(__dirname, 'preview.html'));

// Optional: `--artifact <file>` writes a copy without the document skeleton,
// for hosting as a claude.ai artifact (the host adds <html>/<head>/<body>).
const i = process.argv.indexOf('--artifact');
if (i > 0) {
  const art = out
    .replace(/<!DOCTYPE html>\s*<html[^>]*>\s*<head>/i, '')
    .replace(/<base target="_top">\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<\/head>\s*<body>/i, '')
    .replace(/<\/body>\s*<\/html>\s*$/i, '');
  fs.writeFileSync(process.argv[i + 1], art);
  console.log('wrote', process.argv[i + 1]);
}
