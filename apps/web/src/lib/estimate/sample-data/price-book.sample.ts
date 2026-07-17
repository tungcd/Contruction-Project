import type { PriceBook } from "../types";

/**
 * DỮ LIỆU MẪU — CHỈ ĐỂ FOUNDER REVIEW ENGINE (Ticket M3-003).
 *
 * KHÔNG PHẢI giá thị trường thật. Không lấy từ scraping, không do AI sinh
 * (đúng M3-002 mục 6.3: "Không scraping, không AI sinh giá"). Đơn giá lấy
 * cảm tính tương đương độ lớn quan sát được ở File 1 (M3-001) để JSON đầu
 * ra không toàn số `null`, giúp Founder review hình dạng dữ liệu dễ hơn.
 *
 * PriceBook thật do chủ thầu tự nhập/import (M3-002 mục 6.3) — KHÔNG dùng
 * file này cho môi trường thật.
 */
export const SAMPLE_PRICE_BOOK: PriceBook = {
  id: "sample-price-book",
  name: "[MẪU] Bảng giá thử nghiệm — không phải giá thật",
  pricingRegion: "Hà Nội",
  effectiveFrom: "2026-01-01",
  entries: [
    // --- Thiết bị vệ sinh (R1) ---
    { itemCode: "sanitary.toilet", itemName: "Bồn cầu", unit: "bộ", materialTier: "all", unitPrice: 2_000_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.shower_set", itemName: "Sen cây / vòi sen", unit: "bộ", materialTier: "all", unitPrice: 1_800_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.lavabo", itemName: "Lavabo", unit: "bộ", materialTier: "all", unitPrice: 1_200_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.bidet_spray", itemName: "Vòi xịt", unit: "bộ", materialTier: "all", unitPrice: 200_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.towel_rack", itemName: "Giá treo khăn", unit: "bộ", materialTier: "all", unitPrice: 350_000, updatedAt: "2026-01-01" },
    { itemCode: "sanitary.floor_drain", itemName: "Thoát sàn", unit: "bộ", materialTier: "all", unitPrice: 100_000, updatedAt: "2026-01-01" },

    // --- Thiết bị bếp (R2) ---
    { itemCode: "kitchen.sink", itemName: "Chậu rửa", unit: "bộ", materialTier: "all", unitPrice: 2_500_000, updatedAt: "2026-01-01" },
    { itemCode: "kitchen.faucet", itemName: "Vòi rửa", unit: "bộ", materialTier: "all", unitPrice: 1_000_000, updatedAt: "2026-01-01" },

    // --- Cửa phòng ngủ (R3) — có phân biệt materialTier để demo tra cứu tier ---
    { itemCode: "finishing.bedroom_door", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "standard", unitPrice: 2_500_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.bedroom_door", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "mid", unitPrice: 3_300_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.bedroom_door", itemName: "Cửa đi phòng ngủ", unit: "bộ", materialTier: "premium", unitPrice: 4_500_000, updatedAt: "2026-01-01" },

    // --- Lát nền (R4) ---
    { itemCode: "finishing.floor_tile", itemName: "Gạch lát nền", unit: "m2", materialTier: "standard", unitPrice: 350_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.floor_tile", itemName: "Gạch lát nền", unit: "m2", materialTier: "mid", unitPrice: 420_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.floor_tile", itemName: "Gạch lát nền", unit: "m2", materialTier: "premium", unitPrice: 600_000, updatedAt: "2026-01-01" },

    // --- Tường / trát / sơn (R5) ---
    { itemCode: "construction.wall_masonry", itemName: "Xây tường", unit: "m2", materialTier: "all", unitPrice: 460_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.plaster", itemName: "Trát tường", unit: "m2", materialTier: "all", unitPrice: 100_000, updatedAt: "2026-01-01" },
    { itemCode: "finishing.paint", itemName: "Sơn nước", unit: "m2", materialTier: "standard", unitPrice: 65_000, updatedAt: "2026-01-01" },

    // --- Cầu thang (R6) ---
    { itemCode: "finishing.stair_steps", itemName: "Bậc cầu thang", unit: "bậc", materialTier: "all", unitPrice: 700_000, updatedAt: "2026-01-01" },

    // --- Kết cấu (placeholder — có giá tham khảo, chưa có khối lượng) ---
    { itemCode: "structure.pile_driving", itemName: "Ép cọc bê tông cốt thép", unit: "m", materialTier: "all", unitPrice: 210_000, updatedAt: "2026-01-01" },
    { itemCode: "structure.footing_concrete", itemName: "Bê tông móng", unit: "m3", materialTier: "all", unitPrice: 1_700_000, updatedAt: "2026-01-01" },
    { itemCode: "structure.footing_rebar", itemName: "Cốt thép móng", unit: "tấn", materialTier: "all", unitPrice: 19_800_000, updatedAt: "2026-01-01" },
    // Cố tình KHÔNG thêm giá cho các dòng Kết cấu còn lại (đào móng, ván
    // khuôn, xây móng, giằng, bể nước, bê tông lót) — để JSON demo có cả
    // trường hợp unitPrice = null (chưa có trong Price Book), đúng hành vi
    // thiết kế mục 6.3: "không tìm thấy entry -> null, không dùng tạm giá khác".

    // --- MEP / phần thân (placeholder) ---
    { itemCode: "electrical.wiring", itemName: "Dây điện", unit: "m", materialTier: "all", unitPrice: 12_000, updatedAt: "2026-01-01" },
    { itemCode: "plumbing.pipe", itemName: "Ống nước", unit: "m", materialTier: "all", unitPrice: 45_000, updatedAt: "2026-01-01" },
    // construction.formwork_body, construction.rebar_body, construction.wall_area_exact:
    // cố tình để trống — demo trường hợp chưa có giá tham khảo.
  ],
};
