import type { ConstraintSet } from "@acc/shared-types";
import { generateLayout } from "./layoutGenerator";
import { deriveWalls } from "./wall";
import { validateGeometry, type GeometryValidationResult } from "./geometryValidator";
import { buildDrawingPackage, type DrawingPackage } from "./drawingDocument";

/**
 * Entry point duy nhất cho Stage 1: Constraint Set -> Drawing Package.
 * Điều phối đúng pipeline đã chốt (21_...md):
 * Design Intent Graph -> Layout Graph -> Geometry -> Wall (derived) ->
 * Geometry Validation -> Drawing Document.
 */

export interface ConceptDrawingResult {
  drawingPackage: DrawingPackage;
  validation: GeometryValidationResult;
  templateId: string;
}

export function generateConceptDrawing(
  constraintSet: ConstraintSet,
  projectName: string,
): ConceptDrawingResult {
  const { templateId, layoutGraph, geometry, warnings } = generateLayout(constraintSet);
  const walls = deriveWalls(geometry);
  const validation = validateGeometry(geometry, layoutGraph, walls, constraintSet);
  const drawingPackage = buildDrawingPackage(
    geometry,
    walls,
    projectName,
    [...warnings, ...validation.errors],
    layoutGraph.envelope,
  );

  return { drawingPackage, validation, templateId };
}
