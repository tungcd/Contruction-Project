import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

/**
 * Validate body/query bằng Zod schema (04-Tech-Stack mục 6, 05-AI-Contract).
 * Cách dùng: @Body(new ZodValidationPipe(CreateProjectSchema)) dto: CreateProjectInput
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ");
        throw new BadRequestException(msg || "Dữ liệu không hợp lệ");
      }
      throw new BadRequestException("Dữ liệu không hợp lệ");
    }
  }
}
