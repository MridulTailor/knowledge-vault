#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

// Function to validate manifest
function validateManifest(manifestPath, browser) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    console.log(
      `✅ ${browser} Manifest valid - Extension: ${manifest.name} v${manifest.version}`
    );
    return true;
  } catch (error) {
    console.error(`❌ ${browser} Manifest validation failed:`, error.message);
    return false;
  }
}

// Validate both manifests
const chromeManifestPath = path.join(__dirname, "manifest.json");
const firefoxManifestPath = path.join(__dirname, "manifest-firefox.json");

let manifestsValid = true;
manifestsValid &= validateManifest(chromeManifestPath, "Chrome");
manifestsValid &= validateManifest(firefoxManifestPath, "Firefox");

if (!manifestsValid) {
  console.error("❌ Build failed - invalid manifests");
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
console.log("\n📦 For Chrome:");
console.log("   - Go to chrome://extensions/");
console.log("   - Enable Developer mode");
console.log('   - Click "Load unpacked" and select this folder');
console.log("   - Uses manifest.json");

console.log("\n🦊 For Firefox:");
console.log("   - Go to about:debugging#/runtime/this-firefox");
console.log('   - Click "Load Temporary Add-on"');
console.log("   - Select manifest-firefox.json");
console.log("   - Or create Firefox build: npm run pack:firefox");

console.log("\n3. Configure your Knowledge Vault server URL and auth token");

// Function to create distribution packages
function createDistributionZip(browser) {
  try {
    execSync("which zip", { stdio: "ignore" });

    const manifestFile =
      browser === "firefox" ? "manifest-firefox.json" : "manifest.json";
    const zipName = `knowledge-vault-extension-${browser}.zip`;

    // Create temporary manifest.json for the build
    if (browser === "firefox") {
      fs.copyFileSync("manifest-firefox.json", "manifest.json.tmp");
      fs.copyFileSync("manifest-firefox.json", "manifest.json");
    }

    // Create zip excluding unnecessary files
    const excludeFiles = [
      "build.js",
      "manifest-firefox.json",
      "manifest.json.tmp",
      "*.zip",
      "README.md",
      ".git*",
    ];

    const excludeArgs = excludeFiles.map((file) => `-x "${file}"`).join(" ");
    execSync(`zip -r ${zipName} . ${excludeArgs}`, { stdio: "inherit" });

    // Restore original manifest if needed
    if (browser === "firefox") {
      fs.copyFileSync("manifest.json.tmp", "manifest.json");
      fs.unlinkSync("manifest.json.tmp");
    }

    console.log(`\n📦 Created ${zipName} for ${browser}`);
    return true;
  } catch (error) {
    console.log(`\n❌ Failed to create ${browser} zip:`, error.message);
    return false;
  }
}

// Check if we can create zips
try {
  execSync("which zip", { stdio: "ignore" });
  console.log("\n📦 Available commands:");
  console.log("   npm run pack        - Create Chrome build");
  console.log("   npm run pack:firefox - Create Firefox build");
  console.log("   npm run pack:all     - Create both builds");
} catch (error) {
  console.log("\n📦 Install zip utility to create distribution packages");
}
