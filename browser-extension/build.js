#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("Building Knowledge Vault Browser Extension...");

// Create icon files from SVG (you'll need to convert manually or use a tool)
console.log("📁 Creating build directory...");

// Create placeholder icon files (in production, convert from SVG)
const iconSizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create simple text files as placeholders for PNG icons
iconSizes.forEach((size) => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(
      iconPath,
      `PNG Icon ${size}x${size} placeholder - convert from icon.svg`
    );
    console.log(`📄 Created placeholder: icon-${size}.png`);
  }
});

// Validate manifest
const manifestPath = path.join(__dirname, "manifest.json");
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(
    `✅ Manifest valid - Extension: ${manifest.name} v${manifest.version}`
  );
} catch (error) {
  console.error("❌ Manifest validation failed:", error.message);
  process.exit(1);
}

// Check required files
const requiredFiles = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "popup.js",
  "background.js",
  "content.js",
  "content.css",
  "options.html",
  "options.css",
  "options.js",
];

let allFilesExist = true;
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error("\n❌ Build failed - missing required files");
  process.exit(1);
}

console.log("\n🎉 Build completed successfully!");
console.log("\nNext steps:");
console.log(
  "1. Convert icons/icon.svg to PNG files (16x16, 32x32, 48x48, 128x128)"
);
console.log("2. Load the extension in Chrome:");
console.log("   - Go to chrome://extensions/");
console.log("   - Enable Developer mode");
console.log('   - Click "Load unpacked" and select this folder');
console.log("3. Configure your Knowledge Vault server URL and auth token");
console.log("\nFor production:");
console.log('- Run "npm run pack" to create a zip file');
console.log("- Upload to Chrome Web Store");

// Check if we can create a zip
const { execSync } = require("child_process");
try {
  execSync("which zip", { stdio: "ignore" });
  console.log("\n📦 To create distribution zip: npm run pack");
} catch (error) {
  console.log("\n📦 Install zip utility to create distribution packages");
}
