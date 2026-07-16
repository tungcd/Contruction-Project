/**
 * Regression test cho Requirement Extraction + Readiness (Data Model v0.2).
 * Nguồn: documents/CHATGPT_CONTEXT/Bug-Report-Requirement-Extraction-Bedroom-Count.md
 *        documents/CHATGPT_CONTEXT/Implementation-Task-DataModel-2026-07-16.md
 *
 * Chạy lại MỖI KHI sửa prompt, đổi model, hoặc đổi Data Model.
 *
 *   npm run test:regression            # test provider đang cấu hình trong .env
 *   AI_PROVIDER=openai npm run test:regression
 *
 * Yêu cầu app đang chạy ở http://localhost:3000 (npm run dev).
 *
 * Mỗi `expect` là path TƯƠNG ĐỐI với AnalyzeMessageResult, vd:
 *   "requirement.functional.bedrooms" | "readiness.brief.ready"
 * null = phải là null. undefined (không khai báo) = không kiểm tra.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const CASES = [
  {
    name: "Cộng phòng ngủ mô tả theo từng tầng (bug P0 trong report)",
    message: [
      "Tầng 1: 1 phòng ngủ.",
      "Tầng 2: 1 phòng master, 2 phòng ngủ.",
      "Tầng 3: phòng thờ, kho.",
      "Nhà 3 tầng.",
    ].join("\n"),
    expect: {
      "requirement.functional.bedrooms": 4,
      "requirement.building.floors": 3,
      "requirement.functional.worshipRoom": true,
      "requirement.functional.storage": true,
    },
  },
  {
    name: "Không đếm phòng khác thành phòng ngủ",
    message: "Nhà có 2 phòng ngủ, 2 phòng tắm, 1 phòng khách và 1 phòng thờ.",
    expect: {
      "requirement.functional.bedrooms": 2,
      "requirement.functional.bathrooms": 2,
    },
  },
  {
    name: "Phủ định: không cần gara",
    message: "Nhà không cần gara vì ô tô thường để ngoài sân.",
    expect: { "requirement.functional.garage": false },
  },
  {
    name: "Không suy diện tích xây dựng (footprint) từ diện tích đất",
    message: "Khách có đất 90m2, muốn xây nhà 2 tầng.",
    expect: {
      "requirement.site.landArea": 90,
      "requirement.site.buildingFootprint": null,
      "requirement.building.floors": 2,
    },
  },
  {
    // Founder Decision: Budget là Requirement, giữ nguyên dải, KHÔNG lấy trung bình.
    name: "Ngân sách dạng dải: giữ nguyên min/max, không lấy trung bình",
    message: "Ngân sách dự kiến khoảng 2 đến 3 tỷ.",
    expect: {
      "requirement.budget.budgetMin": 2_000_000_000,
      "requirement.budget.budgetMax": 3_000_000_000,
    },
  },
  {
    name: "Kích thước đất 5x18m",
    message: "Đất khoảng 5x18m, tổng khoảng 90m2.",
    expect: {
      "requirement.site.frontage": 5,
      "requirement.site.depth": 18,
      "requirement.site.landArea": 90,
    },
  },
  {
    name: "Phạm vi báo giá trọn gói (nhãn UI mới, enum không đổi)",
    message: "Nếu hợp lý thì em muốn làm trọn gói luôn.",
    expect: { "requirement.budget.constructionScope": "turnkey" },
  },
  {
    // Postgres ném 22P05 và mất trắng tin nhắn nếu text lẫn ký tự NULL.
    name: "Tin nhắn lẫn ký tự điều khiển không làm sập request",
    message: `Nhà 2 tầng${String.fromCharCode(0)}, 3 phòng ngủ${String.fromCharCode(7)}.`,
    expect: { "requirement.building.floors": 2, "requirement.functional.bedrooms": 3 },
  },
  {
    // Tách địa điểm theo Data Model v0.2 (location cũ đã bỏ).
    name: "Tách địa điểm: quận/huyện, tỉnh/thành",
    message: "Khách ở Đan Phượng, Hà Nội, muốn xây nhà 2 tầng.",
    expect: {
      "requirement.project.district": "Đan Phượng",
      "requirement.project.province": "Hà Nội",
    },
  },
  {
    // buildingFootprint (mỗi tầng) và totalFloorArea (tổng sàn) là 2 field độc lập.
    name: "buildingFootprint và totalFloorArea không lẫn nhau",
    message: "Khách muốn xây 70m2 mỗi tầng, 3 tầng, tổng diện tích sàn khoảng 200m2.",
    expect: {
      "requirement.site.buildingFootprint": 70,
      "requirement.site.totalFloorArea": 200,
    },
  },
  {
    // briefReady: đủ 6 hard blocker + coreFunctionalNeeds (bedrooms/livingRoom/kitchen).
    name: "briefReady = true khi đủ mọi hard blocker",
    message:
      "Khách muốn xây nhà phố ở Hà Nội, đất 100m2, xây 2 tầng, cần 2 phòng ngủ, có phòng khách và bếp.",
    expect: {
      "readiness.brief.ready": true,
      "readiness.brief.missing": [],
    },
  },
  {
    // Thiếu đúng 1 hard blocker (floors) -> phải chặn, bất kể các field khác đủ.
    name: "briefReady = false khi thiếu 1 hard blocker (số tầng)",
    message:
      "Khách muốn xây nhà phố ở Hà Nội, đất 100m2, cần 2 phòng ngủ, có phòng khách và bếp.",
    expect: {
      "readiness.brief.ready": false,
    },
  },
  {
    // Điều kiện 1 (Task Approval): false là giá trị ĐÃ XÁC NHẬN hợp lệ,
    // KHÔNG được chặn Brief. Test bằng kitchen=false tường minh.
    name: "kitchen=false vẫn hợp lệ, KHÔNG chặn briefReady",
    message:
      "Khách muốn xây nhà phố ở Hà Nội, đất 100m2, xây 2 tầng, cần 2 phòng ngủ, có phòng khách, không cần bếp riêng.",
    expect: {
      "requirement.functional.kitchen": false,
      "readiness.brief.ready": true,
    },
  },
];

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function eq(actual, expected) {
  if (Array.isArray(expected)) {
    return JSON.stringify(actual ?? []) === JSON.stringify(expected);
  }
  return actual === expected;
}

// gpt-5-mini thỉnh thoảng phản hồi rất chậm (đã đo được 1 lần ~1000s). Một
// request treo không được phép làm sập cả benchmark — timeout riêng để case
// đó tính là FAIL (ghi nhận trung thực) rồi CHẠY TIẾP các case còn lại.
const REQUEST_TIMEOUT_MS = 90_000;

async function api(path, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...init,
    });
    const body = await res.json().catch(() => null);
    if (!body?.success) {
      throw new Error(body?.message ?? `HTTP ${res.status}`);
    }
    return body.data;
  } finally {
    clearTimeout(timer);
  }
}

async function runCase(c) {
  let project;
  try {
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({ name: `REGRESSION ${Date.now()}` }),
    });
  } catch (err) {
    console.log(`  FAIL  ${c.name}  (không tạo được project: ${err.message})`);
    return false;
  }

  try {
    const started = Date.now();
    const result = await api(`/projects/${project.id}/analyze`, {
      method: "POST",
      body: JSON.stringify({ message: c.message }),
    });
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    const fails = [];
    for (const [path, expected] of Object.entries(c.expect)) {
      const actual = get(result, path);
      const norm = actual === undefined ? null : actual;
      if (!eq(norm, expected)) {
        fails.push(`      ${path}: nhận ${JSON.stringify(norm)}, mong đợi ${JSON.stringify(expected)}`);
      }
    }

    if (fails.length === 0) {
      console.log(`  PASS  ${c.name}  (${secs}s)`);
      return true;
    }
    console.log(`  FAIL  ${c.name}  (${secs}s)`);
    fails.forEach((f) => console.log(f));
    return false;
  } catch (err) {
    const timedOut = err.name === "AbortError";
    console.log(
      `  FAIL  ${c.name}  (${timedOut ? `timeout sau ${REQUEST_TIMEOUT_MS / 1000}s` : err.message})`,
    );
    return false;
  } finally {
    await api(`/projects/${project.id}`, { method: "DELETE" }).catch(() => {});
  }
}

const mode = await api("/ai-mode");
console.log(`\nRegression — Requirement Extraction + Readiness (Data Model v0.2)`);
console.log(`Provider: ${mode.provider}${mode.isMock ? "  (mock: độ chính xác thấp, chỉ để thử UI)" : ""}\n`);

let passed = 0;
for (const c of CASES) {
  if (await runCase(c)) passed++;
}

const failed = CASES.length - passed;
console.log(`\n${passed}/${CASES.length} pass${failed ? `, ${failed} FAIL` : ""}\n`);
process.exit(failed ? 1 : 0);
