import type { ConstraintSet } from "@acc/shared-types";
import { generateDesignIntentGraph } from "../designIntentGraph";
import { buildLayoutGraph, type LayoutGraph } from "../layoutGraph";

/**
 * Layout Template — Tech Lead Review mục 6: Layout Generator chỉ CHỌN
 * template, template KHÔNG tự giải hình học (không tính toạ độ). Template
 * chỉ chịu trách nhiệm: có áp dụng được không (`appliesWhen`), và dựng
 * LayoutGraph (tô-pô) cho trường hợp của nó.
 */
export interface LayoutTemplate {
  id: string;
  appliesWhen: (ctx: { frontage: number; depth: number; floors: number }) => boolean;
  buildLayoutGraph: (constraintSet: ConstraintSet, warnings: string[]) => LayoutGraph;
}

/**
 * Stage 1 — nhà 1 tầng, mặt tiền hẹp hơn chiều sâu (nhà ống/nhà cấp 4
 * đơn giản). Villa/nhiều tầng chưa implement (ngoài phạm vi Stage 1).
 */
export const TOWNHOUSE_TEMPLATE: LayoutTemplate = {
  id: "townhouse-single-floor-v1",
  appliesWhen: (ctx) => ctx.floors === 1 && ctx.frontage <= ctx.depth,
  buildLayoutGraph: (constraintSet, warnings) => {
    const dig = generateDesignIntentGraph(constraintSet, warnings);
    return buildLayoutGraph(dig);
  },
};

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [TOWNHOUSE_TEMPLATE];
