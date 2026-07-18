/**
 * Import Standard PriceBook V1 (Ticket M3-008) — đọc
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/standard_pricebook_v1_80_items.json
 * (source of truth), map itemCode cũ (PREFIX_NNN) sang Business Code mới
 * (Founder Decision M3-008 — cùng hệ mã với Rule Engine), validate, rồi
 * tạo/update 1 PriceBook qua API (`/api/pricebooks`) — idempotent theo tên.
 *
 * Yêu cầu app đang chạy ở http://localhost:3000 (npm run dev / start).
 *
 *   node scripts/import-standard-pricebook.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(
  __dirname,
  "../../../documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/standard_pricebook_v1_80_items.json",
);
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/**
 * Business Code taxonomy (Founder Decision, ticket M3-008). Cột trái = mã
 * external cũ trong file nguồn (chỉ để đối chiếu, KHÔNG lưu vào DB — ticket
 * cho phép bỏ hoàn toàn "Claude tự đánh giá"). Cột phải = Business Code mới,
 * PHẢI khớp itemCode mà Rule Engine dùng cho các mã đã có rule tương ứng
 * (xem apps/web/src/lib/estimate/{structurePlaceholders,mepPlaceholders,
 * rules/finishing,rules/sanitaryEquipment}.ts).
 */
const CODE_MAP = {
  PREP_001: "prep.demolition_light",
  PREP_002: "prep.debris_removal",
  PREP_004: "prep.site_setup",

  FND_001: "foundation.precast_pile_200x200.supply",
  FND_002: "foundation.precast_pile_200x200.driving",
  FND_003: "foundation.precast_pile_200x200.joint",
  FND_004: "foundation.precast_pile_200x200.head_cutting",
  FND_005: "foundation.excavation",
  FND_006: "foundation.excavation_disposal",
  FND_007: "foundation.concrete.lean_m100",
  FND_008: "foundation.concrete.m250",
  FND_009: "foundation.rebar",
  FND_010: "foundation.formwork",

  STR_001: "structure.column_concrete_m250",
  STR_002: "structure.beam_concrete_m250",
  STR_003: "structure.slab_concrete_m250",
  STR_004: "structure.stair_concrete_m250",
  STR_005: "structure.column_rebar",
  STR_006: "structure.beam_rebar",
  STR_007: "structure.slab_rebar",
  STR_009: "structure.column_formwork",
  STR_010: "structure.beam_formwork",
  STR_011: "structure.slab_formwork",

  MAS_001: "masonry.wall_110",
  MAS_002: "masonry.wall_220",
  MAS_003: "masonry.fence_wall_110",
  MAS_004: "plaster.interior_wall",
  MAS_005: "plaster.exterior_wall",
  MAS_006: "plaster.ceiling",
  MAS_007: "flooring.screed",

  WPF_001: "waterproofing.wc_floor",
  WPF_002: "waterproofing.balcony",
  WPF_003: "waterproofing.roof",
  WPF_004: "waterproofing.water_tank",
  WPF_005: "waterproofing.pipe_test_point",

  FIN_001: "finishing.putty_interior",
  FIN_002: "paint.interior",
  FIN_003: "paint.exterior",
  FIN_004: "flooring.tile_600x600",
  FIN_005: "flooring.tile_800x800",
  FIN_006: "finishing.wall_tile_wc",
  FIN_007: "flooring.tile_wc_antislip",
  FIN_008: "finishing.stair_stone_cladding",

  DOR_001: "door.main_wood",
  // KHÔNG dùng "door.bedroom" — Rule Engine's door.bedroom đo theo SỐ LƯỢNG
  // (bộ), còn DOR_002 định giá theo DIỆN TÍCH (m2). Trùng mã sẽ khiến
  // resolveUnitPrice() "tìm thấy" và nhân quantity(bộ) x unitPrice(m2) ra
  // con số SAI mà không có cảnh báo nào (đúng rủi ro ticket M3-008 cảnh báo ở
  // mục "Unit"). Đặt tên khác để không bao giờ trùng.
  DOR_002: "door.composite_panel",
  DOR_003: "door.wc_composite",
  DOR_004: "door.aluminum_swing",
  DOR_005: "door.aluminum_sliding",
  DOR_006: "window.aluminum",
  DOR_007: "partition.glass_aluminum",
  DOR_008: "door.rolling_shutter",

  CEI_001: "ceiling.gypsum_flat",
  CEI_002: "ceiling.gypsum_stepped",
  CEI_003: "ceiling.gypsum_wc",
  CEI_004: "ceiling.paint",

  ELE_001: "electrical.socket",
  ELE_002: "electrical.switch",
  ELE_003: "electrical.socket_device",
  ELE_004: "electrical.switch_device",
  ELE_005: "electrical.led_downlight",
  ELE_006: "electrical.distribution_board",
  ELE_007: "electrical.lan_point",

  PLB_001: "plumbing.cold_water",
  PLB_002: "plumbing.hot_water",
  PLB_003: "plumbing.drain",
  PLB_004: "plumbing.riser_supply",
  PLB_005: "plumbing.riser_drain",
  PLB_006: "plumbing.septic_tank",
  PLB_007: "plumbing.water_tank_underground",

  SAN_001: "sanitary.toilet",
  SAN_002: "sanitary.lavabo",
  SAN_003: "sanitary.lavabo_faucet",
  SAN_004: "sanitary.shower",
  SAN_005: "sanitary.bidet_spray",
  SAN_006: "sanitary.accessories",

  ROF_001: "roof.metal_sheet",
  ROF_002: "roof.tile",
  ROF_003: "exterior.paving_antislip",
  ROF_004: "exterior.gate_steel",
  ROF_006: "roof.gutter_downpipe",
};

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const raw = JSON.parse(readFileSync(SOURCE_PATH, "utf8"));
  console.log(`Đọc ${raw.entries.length} dòng từ ${SOURCE_PATH}`);

  // --- Map + validate ---
  const seenNewCodes = new Set();
  const entries = [];
  for (const e of raw.entries) {
    const newCode = CODE_MAP[e.itemCode];
    if (!newCode) fail(`Không có mapping cho itemCode "${e.itemCode}" — dừng import.`);
    if (!e.itemName?.trim()) fail(`itemName rỗng ở itemCode "${e.itemCode}".`);
    if (!e.unit?.trim()) fail(`unit rỗng ở itemCode "${e.itemCode}".`);
    if (typeof e.unitPrice !== "number" || e.unitPrice <= 0 || Number.isNaN(e.unitPrice)) {
      fail(`unitPrice không hợp lệ ở itemCode "${e.itemCode}": ${e.unitPrice}`);
    }
    if (seenNewCodes.has(newCode)) fail(`Business Code trùng lặp: "${newCode}" (từ "${e.itemCode}").`);
    seenNewCodes.add(newCode);

    const materialTier = e.tier === "standard" || e.tier === "mid" || e.tier === "premium" ? e.tier : "all";

    entries.push({
      itemCode: newCode,
      itemName: e.itemName,
      unit: e.unit,
      materialTier,
      unitPrice: e.unitPrice,
    });
  }

  // Đảm bảo mọi key trong CODE_MAP đều thực sự được dùng (không sót/thừa mapping).
  const rawCodes = new Set(raw.entries.map((e) => e.itemCode));
  for (const oldCode of Object.keys(CODE_MAP)) {
    if (!rawCodes.has(oldCode)) fail(`CODE_MAP có "${oldCode}" nhưng không tồn tại trong file nguồn — mapping thừa.`);
  }

  if (entries.length !== 80) {
    console.warn(`⚠️  Cảnh báo: kỳ vọng 80 dòng, thực tế map được ${entries.length}.`);
  }
  console.log(`✅ Validate xong: ${entries.length} entries, ${seenNewCodes.size} Business Code duy nhất.`);

  const payload = {
    name: raw.name,
    pricingRegion: raw.region,
    effectiveFrom: new Date(raw.effectiveDate).toISOString(),
    entries,
  };

  // --- Idempotent: tìm PriceBook cùng tên, update thay vì tạo trùng ---
  const listRes = await fetch(`${BASE}/api/pricebooks`);
  const listBody = await listRes.json();
  if (!listBody.success) fail(`Không gọi được GET /api/pricebooks: ${listBody.message}`);
  const existing = listBody.data.find((pb) => pb.name === payload.name);

  let result;
  if (existing) {
    console.log(`PriceBook "${payload.name}" đã tồn tại (id=${existing.id}) — update thay vì tạo mới.`);
    const res = await fetch(`${BASE}/api/pricebooks/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    result = await res.json();
  } else {
    console.log(`Tạo PriceBook mới "${payload.name}".`);
    const res = await fetch(`${BASE}/api/pricebooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    result = await res.json();
  }

  if (!result.success) fail(`Import thất bại: ${result.message}`);
  console.log(`✅ Import thành công: id=${result.data.id}, ${result.data.entries.length} entries.`);
}

main().catch((err) => fail(err.stack ?? String(err)));
