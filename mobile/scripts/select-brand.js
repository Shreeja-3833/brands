const fs = require("fs");
const path = require("path");

const brand = process.env.BRAND;
const src = path.join(__dirname, "..", "brands", brand ?? "");
if (!brand || !fs.existsSync(src)) {
  console.error(`Unknown BRAND "${brand}". Use BRAND=default`);
  process.exit(1);
}
const out = path.join(__dirname, "..", "src", "generated");
fs.mkdirSync(out, { recursive: true });
for (const f of ["brand.json", "default-config.json"]) {
  fs.copyFileSync(path.join(src, f), path.join(out, f));
}
console.log(`Selected brand ${brand}`);