#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Simple console colors without chalk
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

console.log(bold(blue('🔍 Gmail MCP CLI - Pre-publish Verification\n')));

const issues = [];
const warnings = [];
const successes = [];

// 1. Check package.json
console.log(cyan('1. Checking package.json...'));
try {
  const pkg = require('./package.json');
  if (pkg.name === 'gmail-mcp-cli') successes.push('✅ Package name correct');
  if (pkg.version) successes.push(`✅ Version: ${pkg.version}`);
  if (pkg.bin && pkg.bin['gmail-mcp']) successes.push('✅ CLI binary configured');
  if (!pkg.files.includes('templates/**/*')) issues.push('❌ templates not in files array');
} catch (e) {
  issues.push('❌ package.json error: ' + e.message);
}

// 2. Check CLI build
console.log(cyan('\n2. Checking CLI build...'));
if (fs.existsSync('dist/cli.js')) {
  successes.push('✅ CLI compiled (dist/cli.js exists)');
  const cliContent = fs.readFileSync('dist/cli.js', 'utf8');
  if (cliContent.includes('#!/usr/bin/env node')) {
    successes.push('✅ CLI has shebang');
  } else {
    issues.push('❌ CLI missing shebang');
  }
} else {
  issues.push('❌ dist/cli.js not found - run npm run build');
}

// 3. Check server template
console.log(cyan('\n3. Checking server template...'));
const templatePath = 'templates/server-template';

// Check critical files
const criticalFiles = [
  'package.json',
  'tsconfig.json',
  'src/index.ts',
  'src/setup-gmail.ts',
  '.npmignore'
];

criticalFiles.forEach(file => {
  const filePath = path.join(templatePath, file);
  if (fs.existsSync(filePath)) {
    successes.push(`✅ ${file} exists`);
  } else {
    issues.push(`❌ Missing: ${file}`);
  }
});

// 4. Check .npmignore issues
console.log(cyan('\n4. Checking .npmignore...'));
const npmignorePath = path.join(templatePath, '.npmignore');
if (fs.existsSync(npmignorePath)) {
  const npmignoreContent = fs.readFileSync(npmignorePath, 'utf8');
  const lines = npmignoreContent.split('\n').map(line => line.trim());
  
  // Check if src/ is explicitly excluded (not in a comment)
  const srcExcluded = lines.some(line => 
    line === 'src/' || 
    (line.startsWith('src/') && !line.startsWith('#'))
  );
  
  if (srcExcluded) {
    issues.push('❌ .npmignore excludes src/ directory - this will break builds!');
  } else {
    successes.push('✅ .npmignore allows src/ directory');
  }
  
  // Check if tsconfig.json is explicitly excluded
  const tsconfigExcluded = lines.some(line => 
    line === 'tsconfig.json' || 
    (line.includes('tsconfig.json') && !line.startsWith('#'))
  );
  
  if (tsconfigExcluded) {
    issues.push('❌ .npmignore excludes tsconfig.json - TypeScript builds will fail!');
  } else {
    successes.push('✅ .npmignore allows tsconfig.json');
  }
}

// 5. Check if src files exist
console.log(cyan('\n5. Checking src files...'));
const srcPath = path.join(templatePath, 'src');
if (fs.existsSync(srcPath)) {
  const srcFiles = fs.readdirSync(srcPath);
  if (srcFiles.length > 0) {
    successes.push(`✅ src/ has ${srcFiles.length} files`);
  } else {
    issues.push('❌ src/ directory is empty');
  }
} else {
  issues.push('❌ src/ directory missing');
}

// 6. Test file copy logic
console.log(cyan('\n6. Testing file copy logic...'));
const testDir = 'test-copy-' + Date.now();
try {
  fs.copySync(templatePath, testDir, {
    filter: (src) => !src.includes('node_modules')
  });
  
  if (fs.existsSync(path.join(testDir, 'src'))) {
    const copiedSrcFiles = fs.readdirSync(path.join(testDir, 'src'));
    if (copiedSrcFiles.length > 0) {
      successes.push('✅ File copy preserves src directory');
    } else {
      issues.push('❌ File copy creates empty src directory');
    }
  } else {
    issues.push('❌ File copy fails to copy src directory');
  }
  
  // Cleanup
  fs.removeSync(testDir);
} catch (e) {
  issues.push('❌ File copy test failed: ' + e.message);
}

// 7. Check TypeScript configuration
console.log(cyan('\n7. Checking TypeScript config...'));
const tsconfigPath = path.join(templatePath, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = require('./' + tsconfigPath);
    if (tsconfig.compilerOptions && tsconfig.compilerOptions.rootDir === './src') {
      successes.push('✅ tsconfig.json configured correctly');
    } else {
      warnings.push('⚠️  tsconfig.json may have incorrect rootDir');
    }
  } catch (e) {
    issues.push('❌ tsconfig.json parse error: ' + e.message);
  }
}

// 8. Check package scripts
console.log(cyan('\n8. Checking build scripts...'));
const templatePkg = require('./' + path.join(templatePath, 'package.json'));
if (templatePkg.scripts && templatePkg.scripts.build) {
  if (templatePkg.scripts.build.includes('tsc')) {
    successes.push('✅ Build script uses TypeScript');
  }
  if (templatePkg.scripts.build.includes('--project .')) {
    successes.push('✅ Build script has --project flag');
  }
} else {
  issues.push('❌ No build script in server template');
}

// Summary
console.log(bold(yellow('\n📊 Summary:\n')));

if (successes.length > 0) {
  console.log(bold(green('Successes:')));
  successes.forEach(s => console.log(green(s)));
}

if (warnings.length > 0) {
  console.log(bold(yellow('\nWarnings:')));
  warnings.forEach(w => console.log(yellow(w)));
}

if (issues.length > 0) {
  console.log(bold(red('\nCritical Issues:')));
  issues.forEach(i => console.log(red(i)));
  console.log(bold(red('\n❌ DO NOT PUBLISH - Fix these issues first!')));
  process.exit(1);
} else {
  console.log(bold(green('\n✅ All checks passed - Ready to publish!')));
  console.log('\nRun: npm publish --access public');
}
