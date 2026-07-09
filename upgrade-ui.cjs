const fs = require('fs');
const path = require('path');

const foldersToScan = ['src/pages', 'src/components'];

const replacements = [
  // Contrast fixes for text
  { from: /text-neutral-400([^a-zA-Z0-9_-])/g, to: 'text-neutral-500 dark:text-neutral-400$1' },
  
  // Borders
  { from: /border-brand-border\/30/g, to: 'border-brand-border/80 dark:border-neutral-700/80' },
  { from: /border-brand-border\/40/g, to: 'border-brand-border/80 dark:border-neutral-700/80' },
  { from: /border-brand-border\/60/g, to: 'border-brand-border dark:border-neutral-700' },
  
  // Rounding for consistency (xl to 2xl, etc)
  { from: /rounded-xl/g, to: 'rounded-2xl' },
  
  // Hover and shadows on cards
  { from: /hover:shadow-lg/g, to: 'hover:shadow-xl hover:-translate-y-1' },
  { from: /shadow-sm/g, to: 'shadow-md' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // We already manually handled Login.jsx and BatchManagement.jsx nicely, so we might skip them or let the script run.
      if (file === 'Login.jsx' || file === 'BatchManagement.jsx') continue;

      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      // Cleanup any duplicate dark modes introduced accidentally
      content = content.replace(/dark:text-neutral-400 dark:text-neutral-400/g, 'dark:text-neutral-400');
      content = content.replace(/rounded-2xl rounded-2xl/g, 'rounded-2xl');
      content = content.replace(/hover:-translate-y-1 hover:-translate-y-1/g, 'hover:-translate-y-1');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

foldersToScan.forEach(folder => {
  const fullFolderPath = path.join(__dirname, folder);
  if (fs.existsSync(fullFolderPath)) {
    processDirectory(fullFolderPath);
  }
});
console.log('UI Upgrade Script Complete');
