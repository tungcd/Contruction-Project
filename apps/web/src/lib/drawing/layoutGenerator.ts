import type { ConstraintSet } from "@acc/shared-types";
import { LAYOUT_TEMPLATES } from "./templates/townhouse";
import { solveGeometry, type Geometry } from "./geometry";
import type { LayoutGraph } from "./layoutGraph";

/**
 * Layout Generator — chỉ CHỌN template phù hợp và điều phối, không chứa
 * logic layout cụ thể nào (Tech Lead Review mục 6).
 */

export class LayoutGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutGeneratorError";
  }
}

export interface LayoutResult {
  templateId: string;
  layoutGraph: LayoutGraph;
  geometry: Geometry;
  warnings: string[];
}

export function generateLayout(constraintSet: ConstraintSet): LayoutResult {
  const frontage = constraintSet.site.frontage?.value;
  const depth = constraintSet.site.depth?.value;
  const floors = constraintSet.building.floors?.value ?? 1;

  if (!frontage || !depth) {
    throw new LayoutGeneratorError(
      "Constraint Set thiếu site.frontage/site.depth — không thể chọn template (Stage 1 yêu cầu đất hình chữ nhật).",
    );
  }

  const template = LAYOUT_TEMPLATES.find((t) => t.appliesWhen({ frontage, depth, floors }));
  if (!template) {
    throw new LayoutGeneratorError(
      `Không có template phù hợp cho frontage=${frontage}, depth=${depth}, floors=${floors} — ngoài phạm vi Stage 1.`,
    );
  }

  const warnings: string[] = [];
  const layoutGraph = template.buildLayoutGraph(constraintSet, warnings);
  const geometry = solveGeometry(layoutGraph);

  return { templateId: template.id, layoutGraph, geometry, warnings };
}
