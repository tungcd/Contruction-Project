import type { ConstraintSet } from "@acc/shared-types";
import { LAYOUT_TEMPLATES } from "./templates/townhouse";
import { solveGeometry, type Geometry } from "./geometry";
import type { LayoutGraph } from "./layoutGraph";
import type { DesignIntentGraph } from "./designIntentGraph";
import { validateLayoutGraphTopology } from "./layoutGraphValidator";
import { validateVerticalConnections, type StaircaseCore } from "./staircase";

/**
 * Layout Generator — chỉ CHỌN template phù hợp và điều phối, không chứa
 * logic layout cụ thể nào (Tech Lead Review mục 6).
 *
 * Stage 2A: điều phối MỘT LayoutGraph/Geometry MỖI TẦNG (Task 4), rồi
 * validate thêm ở mức TOÀ NHÀ (cầu thang thẳng hàng + mọi tầng trên đều
 * tới được) — 2 lớp validate tách biệt, không trộn lẫn (mỗi tầng tự
 * đúng tô-pô nội bộ của nó TRƯỚC, sau đó mới xét quan hệ GIỮA các tầng).
 */

export class LayoutGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutGeneratorError";
  }
}

export interface LayoutResult {
  templateId: string;
  dig: DesignIntentGraph;
  layoutGraphs: LayoutGraph[]; // 1 phần tử/tầng, đúng thứ tự level tăng dần
  geometry: Geometry; // gộp tất cả tầng
  staircaseCore: StaircaseCore | null;
  warnings: string[];
}

export function generateLayout(constraintSet: ConstraintSet): LayoutResult {
  const frontage = constraintSet.site.frontage?.value;
  const depth = constraintSet.site.depth?.value;
  const floors = constraintSet.building.floors?.value ?? 1;

  if (!frontage || !depth) {
    throw new LayoutGeneratorError(
      "Constraint Set thiếu site.frontage/site.depth — không thể chọn template (cần đất hình chữ nhật).",
    );
  }

  const template = LAYOUT_TEMPLATES.find((t) => t.appliesWhen({ frontage, depth, floors }));
  if (!template) {
    throw new LayoutGeneratorError(
      `Không có template phù hợp cho frontage=${frontage}, depth=${depth}, floors=${floors}.`,
    );
  }

  const warnings: string[] = [];
  const { dig, layoutGraphs } = template.buildLayoutGraph(constraintSet, warnings);

  // Stage 1.7, Task 3 — validate tô-pô NỘI BỘ TỪNG TẦNG TRƯỚC khi giải
  // hình học (Design Intent -> Layout Graph -> [VALIDATE] -> Geometry).
  // Nếu tô-pô vi phạm bất biến circulation, candidate này phải FAIL ở
  // đây — không được để Geometry sinh ra rồi mới phát hiện, càng không
  // được quay lại sửa Design Intent để né lỗi (Critical Architecture
  // Correction, xem designIntentGraph.ts).
  for (const layoutGraph of layoutGraphs) {
    const topologyValidation = validateLayoutGraphTopology(dig, layoutGraph);
    if (!topologyValidation.passed) {
      throw new LayoutGeneratorError(
        `Layout Graph "${template.id}" (tầng ${layoutGraph.nodes[0]?.floor ?? "?"}) vi phạm bất biến circulation, không thể giải hình học: ${topologyValidation.errors.join("; ")}`,
      );
    }
  }

  const geometry: Geometry = {
    floors: layoutGraphs.flatMap((lg) => {
      const level = lg.nodes[0]?.floor ?? 0;
      return solveGeometry(lg, level).floors;
    }),
  };

  // Stage 2A, Task 4 — validate Ở MỨC TOÀ NHÀ: cầu thang thẳng hàng giữa
  // các tầng nối nhau + mọi tầng trên đều reachable qua 1 chuỗi
  // VerticalConnection liên tục. Chạy SAU khi Geometry đã giải (cần toạ
  // độ thật để xác nhận thẳng hàng, không chỉ tin thuật toán).
  const verticalValidation = validateVerticalConnections(dig, geometry);
  if (!verticalValidation.passed) {
    throw new LayoutGeneratorError(
      `Cầu thang/kết nối giữa các tầng không hợp lệ: ${verticalValidation.errors.join("; ")}`,
    );
  }

  return {
    templateId: template.id,
    dig,
    layoutGraphs,
    geometry,
    staircaseCore: verticalValidation.staircaseCore,
    warnings,
  };
}
