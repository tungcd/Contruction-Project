/**
 * Manual POC — Constraint Set Compiler.
 * Chạy compiler qua từng fixture trong fixtures/constraint/<name>/
 * (requirement.json + expected-constraint-set.json), so sánh output.
 *
 *   npm run poc:constraint   (tự build trước khi chạy)
 *
 * metadata.compiledAt bị bỏ qua khi so sánh (timestamp tại thời điểm
 * chạy, không phải nội dung miền — xem constraint-set-compiler.ts).
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import {
  RequirementSchema,
  compileRequirementToConstraintSet,
} from "../dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures", "constraint");

function normalize(constraintSet) {
  const copy = structuredClone(constraintSet);
  copy.metadata.compiledAt = "IGNORED";
  return copy;
}

const cases = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`\nConstraint Set Compiler — Manual POC (${cases.length} fixtures)\n`);

let passed = 0;
for (const name of cases) {
  const dir = path.join(fixturesDir, name);
  const rawRequirement = JSON.parse(
    readFileSync(path.join(dir, "requirement.json"), "utf8"),
  );
  const expected = JSON.parse(
    readFileSync(path.join(dir, "expected-constraint-set.json"), "utf8"),
  );

  try {
    const requirement = RequirementSchema.parse(rawRequirement);
    const actual = compileRequirementToConstraintSet(requirement);
    assert.deepStrictEqual(normalize(actual), normalize(expected));
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

const failed = cases.length - passed;
console.log(`\n${passed}/${cases.length} pass${failed ? `, ${failed} FAIL` : ""}\n`);
process.exit(failed ? 1 : 0);
