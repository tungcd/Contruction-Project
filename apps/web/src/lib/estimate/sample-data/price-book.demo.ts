import type { PriceBook } from "../types";

/**
 * DỮ LIỆU DEMO — CHỈ ĐỂ FOUNDER REVIEW ENGINE (Ticket M3-003).
 *
 * KHÔNG PHẢI giá thị trường thật. Không lấy từ scraping, không do AI sinh
 * (đúng M3-002 mục 6.3: "Không scraping, không AI sinh giá"). Đơn giá lấy
 * cảm tính tương đương độ lớn quan sát được ở File 1 (M3-001) để JSON đầu
 * ra không toàn số `null`, giúp Founder review hình dạng dữ liệu dễ hơn.
 *
 * PriceBook thật do chủ thầu tự nhập/import (M3-002 mục 6.3) — KHÔNG dùng
 * file này cho môi trường thật. `isDemo: true` để engine echo lại trong
 * `EstimateDraft.priceBookIsDemo` — bất kỳ ai đọc JSON output đều thấy
 * ngay, không cần lục vào PriceBook (Founder Decision, M3-003 mục 5).
 */
export const DEMO_PRICE_BOOK: PriceBook = {
  id: "demo-price-book",
  name: "[DEMO] Bảng giá thử nghiệm — không phải giá thật",
  pricingRegion: "Hà Nội",
  effectiveFrom: "2026-01-01",
  isDemo: true,
  entries: [
    // --- Thiết bị vệ sinh (R1) ---
    // M3-008: itemCode đổi theo Business Code taxonomy mới (xem
    // rules/sanitaryEquipment.ts) — shower_set -> shower, towel_rack -> accessories.
    { itemCode: "sanitary.toilet", itemName: "Bồn cầu", unit: "bộ", materialTier: "all", unitPrice: 2_000_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.shower", itemName: "Sen cây / vòi sen", unit: "bộ", materialTier: "all", unitPrice: 1_800_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.lavabo", itemName: "Lavabo", unit: "bộ", materialTier: "all", unitPrice: 1_200_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.bidet_spray", itemName: "Vòi xịt", unit: "bộ", materialTier: "all", unitPrice: 200_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.accessories", itemName: "Giá treo khăn", unit: "bộ", materialTier: "all", unitPrice: 350_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.floor_drain", itemName: "Thoát sàn", unit: "bộ", materialTier: "all", unitPrice: 100_000, updatedAt: "2026-01-01" },

    // --- Thiết bị bếp (R2) ---
    { itemCode: "kitchen.sink", itemName: "Chậu rửa", unit: "bộ", materialTier: "all", unitPrice: 2_500_000, updatedAt: "2026-01-01" },
    { itemCode: "kitchen.faucet", itemName: "Vòi rửa", unit: "bộ", materialTier: "all", unitPrice: 1_000_000, updatedAt: "2026-01-01" },

    // --- Cửa phòng ngủ (R3) — có phân biệt materialTier để demo tra cứu tier ---
    { itemCode: "door.bedroom", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "standard", unitPrice: 2_500_000, updatedAt: "2026-01-01" },
    { itemCode: "door.bedroom", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "mid", unitPrice: 3_300_000, updatedAt: "2026-01-01" },
    { itemCode: "door.bedroom", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "premium", unitPrice: 4_500_000, updatedAt: "2026-01-01" },

    // --- Lát nền (R4) ---
    { itemCode: "flooring.tile_600x600", itemName: "Gạch lát nền", unit: "m2", materialTier: "standard", unitPrice: 350_000, updatedAt: "2026-01-01" },
    { itemCode: "flooring.tile_600x600", itemName: "Gạch lát nền", unit: "m2", materialTier: "mid", unitPrice: 420_000, updatedAt: "2026-01-01" },
    { itemCode: "flooring.tile_600x600", itemName: "Gạch lát nền", unit: "m2", materialTier: "premium", unitPrice: 600_000, updatedAt: "2026-01-01" },

    // --- Tường / trát / sơn (R5) — M3-008: tách trong/ngoài theo Business Code mới ---
    { itemCode: "masonry.wall_110", itemName: "Xây tường 110", unit: "m2", materialTier: "all", unitPrice: 460_000, updatedAt: "2026-01-01" },
    { itemCode: "plaster.interior_wall", itemName: "Trát tường trong nhà", unit: "m2", materialTier: "all", unitPrice: 100_000, updatedAt: "2026-01-01" },
    { itemCode: "plaster.exterior_wall", itemName: "Trát tường ngoài nhà", unit: "m2", materialTier: "all", unitPrice: 115_000, updatedAt: "2026-01-01" },
    { itemCode: "paint.interior", itemName: "Sơn nước trong nhà", unit: "m2", materialTier: "standard", unitPrice: 65_000, updatedAt: "2026-01-01" },
    { itemCode: "paint.exterior", itemName: "Sơn nước ngoài nhà", unit: "m2", materialTier: "standard", unitPrice: 75_000, updatedAt: "2026-01-01" },

    // --- Cầu thang (R6) ---
    // Cố tình KHÔNG có giá — Standard PriceBook V1 cũng không có (chỉ có giá
    // theo m3 bê tông, khác nghiệp vụ với "bậc" — xem finishing.ts).
    // itemCode: "stair.step_count" — để trống có chủ đích.

    // --- Kết cấu / Móng (placeholder — có giá tham khảo, chưa có khối lượng) ---
    { itemCode: "foundation.precast_pile_200x200.driving", itemName: "Ép cọc bê tông cốt thép 200x200", unit: "m", materialTier: "all", unitPrice: 210_000, updatedAt: "2026-01-01" },
    { itemCode: "foundation.concrete.m250", itemName: "Bê tông móng M250", unit: "m3", materialTier: "all", unitPrice: 1_700_000, updatedAt: "2026-01-01" },
    { itemCode: "foundation.rebar", itemName: "Cốt thép móng", unit: "kg", materialTier: "all", unitPrice: 19_800, updatedAt: "2026-01-01" },
    // Cố tình KHÔNG thêm giá cho các dòng còn lại (đào móng, ván khuôn, xây
    // móng, giằng, bể nước, bể phốt, bê tông lót) — để JSON demo có cả
    // trường hợp unitPrice = null (chưa có trong Price Book), đúng hành vi
    // thiết kế mục 6.3: "không tìm thấy entry -> null, không dùng tạm giá khác".

    // --- MEP / phần thân (placeholder) — M3-008: đổi sang đo theo điểm ---
    { itemCode: "electrical.socket", itemName: "Điểm ổ cắm", unit: "điểm", materialTier: "all", unitPrice: 520_000, updatedAt: "2026-01-01" },
    { itemCode: "electrical.switch", itemName: "Điểm công tắc/đèn", unit: "điểm", materialTier: "all", unitPrice: 420_000, updatedAt: "2026-01-01" },
    { itemCode: "plumbing.cold_water", itemName: "Điểm cấp nước lạnh", unit: "điểm", materialTier: "all", unitPrice: 850_000, updatedAt: "2026-01-01" },
    { itemCode: "plumbing.hot_water", itemName: "Điểm cấp nước nóng", unit: "điểm", materialTier: "all", unitPrice: 950_000, updatedAt: "2026-01-01" },
    // plumbing.drain, structure.column_formwork/beam_formwork/slab_formwork,
    // structure.beam_rebar/slab_rebar, masonry.wall_area_measured:
    // cố tình để trống — demo trường hợp chưa có giá tham khảo.
  ],
};
