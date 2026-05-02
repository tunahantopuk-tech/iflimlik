const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/@mrnitrox/react-native-unity-ads-monetization/ios/UnityAdsMonetization.swift'
);

if (!fs.existsSync(filePath)) {
  console.log('⚠️  Unity Ads Swift file not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// Already patched check
if (content.includes('DispatchQueue.main.async')) {
  console.log('✅ Unity Ads Swift already patched');
  process.exit(0);
}

// Wrap all sendEvent(withName:body:) calls with DispatchQueue.main.async
// This fixes the RCTEventEmitter + New Architecture (TurboModule) crash
content = content.replace(
  /^(\s+)(sendEvent\(withName:[\s\S]*?\]\))\s*$/gm,
  (match, indent, call) => {
    return `${indent}DispatchQueue.main.async {\n${indent}  self.${call.trim()}\n${indent}}`;
  }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Unity Ads Swift patched - sendEvent wrapped with DispatchQueue.main.async');
