import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse } from "@acc/shared-types";

/**
 * Trả lỗi theo đúng format { success:false, data:null, message } cho mọi lỗi.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Đã có lỗi xảy ra. Vui lòng thử lại.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (res && typeof res === "object" && "message" in res) {
        const m = (res as { message: unknown }).message;
        message = Array.isArray(m) ? m.join(", ") : String(m);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(exception);
    }

    const body: ApiResponse<null> = { success: false, data: null, message };
    response.status(status).json(body);
  }
}
