/**
 * Regression test cho Requirement Extraction.
 * Nguồn: documents/CHATGPT_CONTEXT/Bug-Report-Requirement-Extraction-Bedroom-Count.md
 *
 * Chạy lại MỖI KHI sửa prompt hoặc đổi model.
 *
 *   npm run test:regression            # test provider đang cấu hình trong .env
 *   AI_PROVIDER=openai npm run test:regression
 *
 * Yêu cầu app đang chạy ở http://localhost:3000 (npm run dev).
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** null = phải là null. undefined = không kiểm tra. */
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
      "functional.bedrooms": 4,
      "building.floors": 3,
      "functional.worshipRoom": true,
      "functional.storage": true,
    },
  },
  {
    name: "Không đếm phòng khác thành phòng ngủ",
    message: "Nhà có 2 phòng ngủ, 2 phòng tắm, 1 phòng khách và 1 phòng thờ.",
    expect: {
      "functional.bedrooms": 2,
      "functional.bathrooms": 2,
    },
  },
  {
    name: "Phủ định: không cần gara",
    message: "Nhà không cần gara vì ô tô thường để ngoài sân.",
    expect: { "functional.garage": false },
  },
  {
    name: "Không suy diện tích xây dựng từ diện tích đất",
    message: "Khách có đất 90m2, muốn xây nhà 2 tầng.",
    expect: {
      "site.landArea": 90,
      "site.constructionArea": null,
      "building.floors": 2,
    },
  },
  {
    name: "Ngân sách dạng dải lấy trung bình, không vơ số lớn",
    message: "Ngân sách dự kiến khoảng 2 đến 3 tỷ.",
    expect: { "budget.budget": 2_500_000_000 },
  },
  {
    name: "Kích thước đất 5x18m",
    message: "Đất khoảng 5x18m, tổng khoảng 90m2.",
    expect: {
      "site.frontage": 5,
      "site.depth": 18,
      "site.landArea": 90,
    },
  },
  {
    name: "Phạm vi báo giá trọn gói",
    message: "Nếu hợp lý thì em muốn làm trọn gói luôn.",
    expect: { "budget.constructionScope": "turnkey" },
  },
  {
    // Postgres ném 22P05 và mất trắng tin nhắn nếu text lẫn ký tự NULL.
    // Khách paste từ Word/PDF rất dễ dính. Chỉ cần KHÔNG nổ là đạt.
    name: "Tin nhắn lẫn ký tự điều khiển không làm sập request",
    message: `Nhà 2 tầng${String.fromCharCode(0)}, 3 phòng ngủ${String.fromCharCode(7)}.`,
    expect: { "building.floors": 2, "functional.bedrooms": 3 },
  },
];

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

async function api(path, init) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => null);
  if (!body?.success) {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }
  return body.data;
}

async function runCase(c) {
  const project = await api("/projects", {
    method: "POST",
    body: JSON.stringify({ name: `REGRESSION ${Date.now()}` }),
  });

  try {
    const started = Date.now();
    const result = await api(`/projects/${project.id}/analyze`, {
      method: "POST",
      body: JSON.stringify({ message: c.message }),
    });
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    const fails = [];
    for (const [path, expected] of Object.entries(c.expect)) {
      const actual = get(result.requirement, path);
      const norm = actual === undefined ? null : actual;
      if (norm !== expected) {
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
  } finally {
    await api(`/projects/${project.id}`, { method: "DELETE" }).catch(() => {});
  }
}

const mode = await api("/ai-mode");
console.log(`\nRegression — Requirement Extraction`);
console.log(`Provider: ${mode.provider}${mode.isMock ? "  (mock: độ chính xác thấp, chỉ để thử UI)" : ""}\n`);

let passed = 0;
for (const c of CASES) {
  if (await runCase(c)) passed++;
}

const failed = CASES.length - passed;
console.log(`\n${passed}/${CASES.length} pass${failed ? `, ${failed} FAIL` : ""}\n`);
process.exit(failed ? 1 : 0);
