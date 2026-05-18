const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Remove "use client";
  content = content.replace(/"use client";\r?\n?/g, '');
  content = content.replace(/'use client';\r?\n?/g, '');

  // Replace next/link
  content = content.replace(/import\s+(.*?)\s+from\s+['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");

  // Replace next/navigation imports (useRouter, usePathname, useSearchParams)
  let usesNavigation = false;
  if (content.includes('next/navigation')) {
    usesNavigation = true;
    content = content.replace(/import\s+\{.*\}\s+from\s+['"]next\/navigation['"];?/g, "import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';");
  }

  // Replace useRouter with useNavigate
  content = content.replace(/useRouter\(\)/g, "useNavigate()");
  content = content.replace(/const router =/g, "const navigate =");
  content = content.replace(/router\.push\(/g, "navigate(");
  content = content.replace(/router\.replace\(/g, "navigate(");
  content = content.replace(/router\.back\(/g, "navigate(-1");

  // Replace usePathname with useLocation
  content = content.replace(/usePathname\(\)/g, "useLocation()");
  content = content.replace(/const pathname =/g, "const location =");
  // We need to change pathname to location.pathname where appropriate, but this is a rough regex, so let's just do:
  content = content.replace(/pathname ===/g, "location.pathname ===");
  content = content.replace(/pathname\./g, "location.pathname.");

  if (content.includes("react-router-dom")) {
    content = content.replace(/<Link\s+([^>]*)href=/g, "<Link $1to=");
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Refactored Link props in ${filePath}`);
  }
}

const targetDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'context'),
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, refactorFile);
  }
});

console.log("Refactoring complete.");
