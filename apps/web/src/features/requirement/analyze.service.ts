import type { Prisma } from "@prisma/client";
import {
  computeMissingFields,
  computeReadiness,
  computeScore,
  computeToConfirm,
  type AnalyzeMessageResult,
} from "@acc/shared-types";
import { prisma } from "@/lib/db/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { mergeRequirement } from "@/lib/ai/parsers/merge";
import { sanitizeText } from "@/lib/ai/parsers/normalize";
import { buildQuestionsFromMissing } from "@/lib/ai/question-templates";
import {
  ensureProjectExists,
  getProjectDetail,
  parseRequirement,
} from "@/features/project/project.repository";

/**
 * Luồng phân tích một tin nhắn (05-Prompt-and-AI-Contract mục 3).
 *
 *   Lưu tin nhắn -> AI extract (1 lần duy nhất) -> validate -> merge
 *   -> lưu Requirement -> code tính Score/Missing -> trả UI
 *
 * Business rule (score, missing, brief-ready, merge) nằm hết ở đây, KHÔNG
 * để AI quyết định. AI chỉ làm phần ngôn ngữ.
 */
export async function analyzeMessage(
  projectId: string,
  rawMessage: string,
): Promise<AnalyzeMessageResult> {
  await ensureProjectExists(projectId);

  // Khách hay paste từ Zalo/Word/PDF, dễ lẫn ký tự điều khiển. Postgres không
  // lưu được ký tự NULL -> phải dọn trước khi ghi, nếu không cả request 500.
  const message = sanitizeText(rawMessage);

  // 1. Lưu tin nhắn người dùng trước — không mất dữ liệu kể cả khi AI lỗi.
  await prisma.conversation.create({
    data: { projectId, role: "user", message },
  });

  // 2. Nạp ngữ cảnh hiện tại.
  const requirementRow = await prisma.requirement.findUnique({
    where: { projectId },
  });
  const current = parseRequirement(requirementRow);
  const askedQuestions = await loadAskedQuestions(projectId);

  // 3. Gọi AI đúng 1 lần cho mỗi message.
  const provider = getAIProvider();
  const result = await provider.analyzeRequirement({
    current,
    message,
    askedQuestions,
  });

  // 4. Merge — chỉ ghi đè field AI đọc được, không xoá dữ liệu cũ.
  const merged = mergeRequirement(current, result.requirement);

  // 5. Ghi đè Requirement (chỉ có 1 phiên bản — 03-Data-Model mục 9).
  await prisma.requirement.upsert({
    where: { projectId },
    create: {
      projectId,
      data: merged as unknown as Prisma.InputJsonValue,
    },
    update: { data: merged as unknown as Prisma.InputJsonValue },
  });

  // 6. Dữ liệu dẫn xuất — tính bằng code, không hỏi AI.
  //    Score chỉ hiển thị tiến độ; readiness là business rule ĐỘC LẬP.
  const score = computeScore(merged);
  const missingFields = computeMissingFields(merged);
  const readiness = computeReadiness(merged);
  const toConfirm = computeToConfirm(merged);

  // 7. Lọc lại câu hỏi của AI: đủ thông tin thì không hỏi nữa; AI không
  //    nghĩ ra câu nào thì rơi về template theo field còn thiếu.
  let questions: string[] = [];
  if (missingFields.length > 0) {
    questions = result.questions
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !askedQuestions.includes(q))
      .slice(0, 3);
    if (questions.length === 0) {
      questions = buildQuestionsFromMissing(merged, askedQuestions);
    }
  }

  // 8. Lưu phản hồi của AI vào hội thoại.
  const assistantMessage = sanitizeText(
    buildAssistantMessage(result.summary, questions),
  );
  if (assistantMessage) {
    await prisma.conversation.create({
      data: { projectId, role: "assistant", message: assistantMessage },
    });
  }

  // 9. Cập nhật trạng thái + lịch sử. Không hạ cấp nếu Brief đã sinh.
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { status: true },
  });
  if (project.status !== "BriefGenerated") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: readiness.brief.ready ? "ReadyForBrief" : "Discovery" },
    });
  }
  await prisma.history.create({
    data: { projectId, event: "Requirement Updated" },
  });

  return {
    requirement: merged,
    missingFields,
    questions,
    assumptions: result.assumptions,
    summary: result.summary,
    score,
    readiness,
    toConfirm,
  };
}

/** Đọc lại các câu AI đã hỏi để không hỏi lặp (05 mục 8). */
async function loadAskedQuestions(projectId: string): Promise<string[]> {
  const rows = await prisma.conversation.findMany({
    where: { projectId, role: "assistant" },
    orderBy: { createdAt: "asc" },
    select: { message: true },
  });

  const questions: string[] = [];
  for (const row of rows) {
    for (const line of row.message.split("\n")) {
      const m = line.match(/^\s*\d+\.\s+(.*\S)\s*$/);
      if (m?.[1]) questions.push(m[1]);
    }
  }
  return questions;
}

function buildAssistantMessage(summary: string, questions: string[]): string {
  const parts: string[] = [];
  if (summary.trim()) parts.push(summary.trim());
  if (questions.length > 0) {
    parts.push(
      `Mình cần hỏi thêm ${questions.length} thông tin:\n` +
        questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}

/** Dùng lại ở UI sau khi phân tích xong. */
export { getProjectDetail };
