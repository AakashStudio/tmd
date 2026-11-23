import { spawnSync } from "child_process";

const testFiles = [
  "scripts/test-phase1.ts",
  "scripts/test-phase2.ts",
  "scripts/test-phase3.ts",
  "scripts/test-phase4.ts",
  "scripts/test-phase5.ts",
  "scripts/test-phase6.ts",
  "scripts/test-phase7.ts",
  "scripts/test-phase8-e2e.ts",
  "scripts/test-concurrency-defects.ts",
  "scripts/test-regression-fixes.ts",
  "scripts/test-regression-audit.ts",
  "scripts/test-phase8-reliability.ts",
  "scripts/test-release-gate.ts",
  "scripts/verify-release-gate-2.ts",
  "scripts/test-admin-events-integration.ts",
  "scripts/verify-clean-migration.ts",
  "scripts/verify-razorpay-staging.ts",
];

console.log("Starting Full Test Suite Execution for Code Coverage...\n");
for (const file of testFiles) {
  console.log(`Running ${file}...`);
  const result = spawnSync("npx", ["tsx", file], {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`Failed: ${file}`);
    process.exit(result.status || 1);
  }
}
console.log("\nAll tests completed successfully.");
