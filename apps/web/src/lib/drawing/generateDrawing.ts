import type { ConstraintSet } from "@acc/shared-types";
import { generateLayout } from "./layoutGenerator";
import { deriveWalls } from "./wall";
import { placeDoors } from "./door";
import { validateGeometry, type GeometryValidationResult } from "./geometryValidator";
import { buildDrawingPackage, type DrawingPackage } from "./drawingDocument";

/**
 * Entry point duy nhất cho Stage 1/1.5: Constraint Set -> Drawing Package.
 * Điều phối đúng pipeline đã chốt:
 * Design Intent Graph -> Layout Graph -> Geometry -> Wall (derived) ->
 * Door (derived) -> Geometry Validation -> Drawing Document.
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
  const { doors, warnings: doorWarnings } = placeDoors(layoutGraph, walls);
  const validation = validateGeometry(geometry, layoutGraph, walls, doors, constraintSet);
  const drawingPackage = buildDrawingPackage(
    geometry,
    walls,
    doors,
    projectName,
    [...warnings, ...doorWarnings, ...validation.errors],
    layoutGraph.envelope,
  );

  return { drawingPackage, validation, templateId };
}
