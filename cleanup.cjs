const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'e:/BR Publications/Old app requiremnets/br-publications-frontend/br-publications-frontend-monorepo/br-publications-monorepo';
process.chdir(rootDir);

console.log("Removing old monorepo files...");
const itemsToRemove = [
    "apps",
    "packages",
    "deploy-build",
    "node_modules",
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "check-css-imports.cjs",
    "fix-header.cjs",
    "sync-css.cjs",
    "wrap-suspense.cjs",
    "cleanup.ps1"
];

for (const item of itemsToRemove) {
    const fullPath = path.join(rootDir, item);
    if (fs.existsSync(fullPath)) {
        console.log("Deleting " + item);
        try {
            fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (e) {
            console.error("Failed to delete " + item + ": " + e.message);
        }
    }
}

console.log("Promoting Next.js app to root...");
const seoTempDir = path.join(rootDir, '../seo_temp');
if (fs.existsSync(seoTempDir)) {
    const items = fs.readdirSync(seoTempDir);
    for (const item of items) {
        fs.renameSync(path.join(seoTempDir, item), path.join(rootDir, item));
    }
    fs.rmdirSync(seoTempDir);
}

console.log("Running pnpm install...");
try {
    execSync('pnpm install', { stdio: 'inherit' });
} catch (e) {
    console.error("pnpm install failed");
}

console.log("Monorepo teardown complete!");
