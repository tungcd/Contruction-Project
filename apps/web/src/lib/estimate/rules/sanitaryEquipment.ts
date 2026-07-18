import type { Requirement } from "@acc/shared-types";
import type { BOQDraftLine, EstimateSettings, PriceBook } from "../types";
import { buildRuleEstimatedLine } from "../lineBuilders";

/**
 * Rule R1 — `bathrooms` → thiết bị vệ sinh (M3-002 mục 4).
 * Confidence: high — đã kiểm chứng bằng dữ liệu thật (M3-001 mục 5: File 1
 * "Xí"=3, "Sen cây"=3 khớp đúng số WC).
 * Known limitations: không phân biệt loại xí bệt/xổm, có bồn tắm hay
 * không — dùng 1 mẫu chuẩn mặc định.
 */
export function ruleBathroomFixtures(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const bathrooms = requirement.functional.bathrooms;
  if (bathrooms === null || bathrooms <= 0) return [];

  // M3-008: sanitary.shower_set -> sanitary.shower, sanitary.towel_rack ->
  // sanitary.accessories (khớp SAN_004/SAN_006 của Standard PriceBook V1).
  // sanitary.floor_drain giữ nguyên — Standard PriceBook V1 không có entry
  // tương ứng, dòng này biết trước sẽ không tự tra được giá (giới hạn đã biết).
  const fixtures: { code: string; itemName: string; unit: string }[] = [
    { code: "sanitary.toilet", itemName: "Bồn cầu", unit: "bộ" },
    { code: "sanitary.shower", itemName: "Sen cây / vòi sen", unit: "bộ" },
    { code: "sanitary.lavabo", itemName: "Lavabo", unit: "bộ" },
    { code: "sanitary.bidet_spray", itemName: "Vòi xịt", unit: "bộ" },
    { code: "sanitary.accessories", itemName: "Giá treo khăn", unit: "bộ" },
    { code: "sanitary.floor_drain", itemName: "Thoát sàn", unit: "bộ" },
  ];

  return fixtures.map((f) =>
    buildRuleEstimatedLine({
      code: f.code,
      category: "Thiết bị vệ sinh",
      itemName: f.itemName,
      unit: f.unit,
      quantity: bathrooms,
      confidence: "high",
      note: `Ước lượng = số WC (${bathrooms}). Không phân biệt loại thiết bị cụ thể.`,
      sourceRuleId: "R1",
      priceBook,
      settings,
    }),
  );
}

/**
 * Rule R2 — `kitchen` → thiết bị bếp (M3-002 mục 4).
 * Confidence: high.
 * Known limitations: không biết loại bếp (đảo/chữ L/thẳng) ảnh hưởng số
 * lượng tủ bếp — chỉ ra thiết bị rời (chậu, vòi), không ra tủ bếp.
 */
export function ruleKitchenFixtures(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  if (requirement.functional.kitchen !== true) return [];

  const fixtures: { code: string; itemName: string; unit: string }[] = [
    { code: "kitchen.sink", itemName: "Chậu rửa", unit: "bộ" },
    { code: "kitchen.faucet", itemName: "Vòi rửa", unit: "bộ" },
  ];

  return fixtures.map((f) =>
    buildRuleEstimatedLine({
      code: f.code,
      category: "Thiết bị bếp",
      itemName: f.itemName,
      unit: f.unit,
      quantity: 1,
      confidence: "high",
      note: "Không tính tủ bếp — chỉ thiết bị rời.",
      sourceRuleId: "R2",
      priceBook,
      settings,
    }),
  );
}
