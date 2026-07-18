import type { Requirement } from "./requirement";
import {
  ConstraintSetSchema,
  type ConstraintSet,
  type ConstraintType,
  type UnresolvedEntry,
} from "./constraint-set";

/**
 * Constraint Set Compiler — Requirement → ConstraintSet. Pure Function,
 * Deterministic, No AI (xem docs/features/concept-design/constraint/).
 *
 * "Deterministic" áp dụng cho NỘI DUNG MIỀN (site/building/household/
 * spaces/structure/style/budget/unresolved) — `metadata.compiledAt` là
 * timestamp tại thời điểm gọi, đương nhiên thay đổi mỗi lần chạy; đây
 * không phải vi phạm invariant, chỉ là dữ liệu audit thông thường.
 */

const COMPILER_VERSION = "0.1.0";

export class RequirementNotConfirmedError extends Error {
  constructor(status: string) {
    super(
      `Constraint Set Compiler chỉ compile Requirement ở trạng thái "confirmed" (Explicit Precondition), nhận được "${status}".`,
    );
    this.name = "RequirementNotConfirmedError";
  }
}

export class ConstraintValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConstraintValidationError";
  }
}

function scalarField<T>(value: T | null, constraintType: ConstraintType) {
  return value === null ? null : { value, constraintType };
}

/** true → required, false → forbidden. null (Requirement không nhắc tới) → không tạo field (No Information Creation). */
function boolField(value: boolean | null) {
  if (value === null) return null;
  return { value, constraintType: (value ? "required" : "forbidden") as ConstraintType };
}

/** Mảng rỗng ([]) coi như "không nhắc tới" — không tạo field, giống null. */
function listField(value: string[], constraintType: ConstraintType) {
  return value.length === 0 ? null : { value, constraintType };
}

function rangeField(min: number | null, max: number | null, constraintType: ConstraintType) {
  if (min === null && max === null) return null;
  return { value: { min, max }, constraintType };
}

export function compileRequirementToConstraintSet(requirement: Requirement): ConstraintSet {
  // Explicit Precondition — fail-fast, không sinh partial Constraint Set.
  if (requirement.status !== "confirmed") {
    throw new RequirementNotConfirmedError(requirement.status);
  }

  // Cross-field validation (Constraint Schema Review — Round 2): mâu
  // thuẫn giữa otherRooms/excludedRooms không được tự resolve.
  const overlap = requirement.functional.otherRooms.filter((room) =>
    requirement.functional.excludedRooms.includes(room),
  );
  if (overlap.length > 0) {
    throw new ConstraintValidationError(
      `otherRooms và excludedRooms mâu thuẫn — cùng nhắc tới: ${overlap.join(", ")}`,
    );
  }

  // No Silent Drop — ghi chú tự do (chưa có cơ chế biên dịch) phải được
  // preserve tường minh, không được biến mất.
  const unresolved: UnresolvedEntry[] = [];
  const preserve = (sourceField: string, rawValue: string | null) => {
    if (rawValue !== null) {
      unresolved.push({
        sourceField,
        rawValue,
        reason: "ghi chú tự do, chưa có cơ chế biên dịch thành constraint có cấu trúc",
      });
    }
  };
  preserve("project.buildingTypeNote", requirement.project.buildingTypeNote);
  preserve("building.roofTypeNote", requirement.building.roofTypeNote);
  preserve("building.architecturalStyleNote", requirement.building.architecturalStyleNote);
  preserve("budget.constructionScopeNote", requirement.budget.constructionScopeNote);
  preserve("budget.budgetNote", requirement.budget.budgetNote);
  preserve("notes", requirement.notes);

  return ConstraintSetSchema.parse({
    metadata: {
      compilerVersion: COMPILER_VERSION,
      compiledAt: new Date().toISOString(),
      sourceRequirementConfirmedAt: requirement.confirmedAt,
    },
    site: {
      landArea: scalarField(requirement.site.landArea, "exact"),
      buildingFootprint: scalarField(requirement.site.buildingFootprint, "exact"),
      totalFloorArea: scalarField(requirement.site.totalFloorArea, "exact"),
      frontage: scalarField(requirement.site.frontage, "exact"),
      depth: scalarField(requirement.site.depth, "exact"),
      roadWidth: scalarField(requirement.site.roadWidth, "exact"),
    },
    building: {
      // buildingType nằm ở Requirement.project — Constraint Set tổ
      // chức lại theo domain, không mirror 1:1 Requirement (đã thống
      // nhất ở Constraint Schema Review).
      buildingType: scalarField(requirement.project.buildingType, "exact"),
      floors: scalarField(requirement.building.floors, "exact"),
      basementLevels: scalarField(requirement.building.basementLevels, "exact"),
      constructionScope: scalarField(requirement.budget.constructionScope, "exact"),
    },
    household: {
      hasElderly: boolField(requirement.household.hasElderly),
      children: scalarField(requirement.household.children, "exact"),
      accessibilityNeeds: boolField(requirement.household.accessibilityNeeds),
    },
    spaces: {
      bedrooms: scalarField(requirement.functional.bedrooms, "exact"),
      bathrooms: scalarField(requirement.functional.bathrooms, "exact"),
      livingRoom: boolField(requirement.functional.livingRoom),
      kitchen: boolField(requirement.functional.kitchen),
      worshipRoom: boolField(requirement.functional.worshipRoom),
      storage: boolField(requirement.functional.storage),
      garage: boolField(requirement.functional.garage),
      garden: boolField(requirement.functional.garden),
      balcony: boolField(requirement.functional.balcony),
      otherRooms: listField(requirement.functional.otherRooms, "required"),
      excludedRooms: listField(requirement.functional.excludedRooms, "forbidden"),
    },
    structure: {
      foundationType: scalarField(requirement.building.foundationType, "exact"),
      roofType: scalarField(requirement.building.roofType, "exact"),
    },
    style: {
      architecturalStyle: scalarField(requirement.building.architecturalStyle, "preferred"),
    },
    budget: {
      budget: rangeField(requirement.budget.budgetMin, requirement.budget.budgetMax, "required"),
    },
    unresolved,
  });
}
