const fs = require('fs');
const path = require('path');

function replaceFetch(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/fetch\(\s*'\/api\//g, "fetch('/assets/api/");
  content = content.replace(/fetch\(\s*"\/api\//g, 'fetch("/assets/api/');
  content = content.replace(/fetch\(\s*`\/api\//g, 'fetch(`/assets/api/');

  // Also replace window.location.href = '/' in login/page.tsx
  content = content.replace("window.location.href = '/';", "window.location.href = '/assets';");
  content = content.replace('window.location.href = "/";', 'window.location.href = "/assets";');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') walk(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      replaceFetch(full);
    }
  }
}

walk('src');
console.log('All API and location routes updated with /assets prefix.');
