/**
 * Usage: node scripts/generate-hash.js YOUR-SECRET-CODE
 *
 * Generates a SHA-256 hash for a new client access code.
 * Copy the output hash into data/clients.json for the new client entry.
 */
const { createHash } = require("crypto");

const code = process.argv[2];

if (!code) {
  console.error("Usage: node scripts/generate-hash.js YOUR-SECRET-CODE");
  process.exit(1);
}

const hash = createHash("sha256").update(code.trim()).digest("hex");

console.log("\n--- GES Client Code Hash Generator ---");
console.log(`Code:  ${code}`);
console.log(`Hash:  ${hash}`);
console.log("\nAdd this to data/clients.json:");
console.log(JSON.stringify({ hash }, null, 2));
