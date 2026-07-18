/**
 * Bootstrap để chạy script .ts trực tiếp bằng ts-node (transpile-only,
 * không type-check lại — đã có `npm run typecheck` riêng), resolve
 * đúng path alias `@/*` và workspace package `@acc/shared-types`.
 * Dùng file .cjs này thay vì biến môi trường trong npm script để tránh
 * khác biệt cú pháp giữa các shell (bash/PowerShell/cmd).
 */
process.env.TS_NODE_PROJECT = require("path").join(__dirname, "tsconfig.script.json");
process.env.TS_NODE_TRANSPILE_ONLY = "true";
require("ts-node/register");
require("tsconfig-paths/register");
