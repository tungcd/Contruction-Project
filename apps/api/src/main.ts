import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { TransformInterceptor } from "./common/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend (Next.js) gọi API
  app.enableCors({ origin: true, credentials: true });

  // Chuẩn hoá response { success, data, message } + xử lý lỗi
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API đang chạy tại http://localhost:${port}`, "Bootstrap");
}

bootstrap();
