/**
 * Hệ số kinh nghiệm cho Rule Catalog (M3-002 mục 4, Rule R4/R5/R6).
 *
 * QUAN TRỌNG: các số này KHÔNG kiểm chứng được bằng 2 file mẫu ở M3-001 —
 * cả 2 file đều đo trực tiếp từ bản vẽ, không dùng hệ số kinh nghiệm nào.
 * Đây vẫn là CÂU HỎI MỞ số 2 trong M3-002 mục 9, chưa được Founder trả lời.
 *
 * Đặt thành hằng số có tên rõ ràng (không phải số rải rác trong logic) để
 * Founder/ChatGPT chỉnh lại dễ dàng mà không cần đọc/sửa code tính toán.
 */

/** R4: diện tích lát nền ≈ tổng diện tích sàn × hệ số này (trừ hao tường/cầu thang). */
export const FLOOR_TILE_COVERAGE_RATIO = 0.9;

/** R5: diện tích tường xây ≈ tổng diện tích sàn × hệ số này. */
export const WALL_AREA_PER_FLOOR_AREA = 1.0;

/** R5: diện tích trát = diện tích tường xây × hệ số này (trong + ngoài). */
export const PLASTER_SIDES_MULTIPLIER = 2;

/** R5: diện tích sơn ≈ diện tích trát × hệ số này (trừ hao cửa/cửa sổ). */
export const PAINT_COVERAGE_RATIO = 0.85;

/** R6: số bậc cầu thang mỗi tầng, ước lượng theo chiều cao tầng ~3.2m. */
export const STAIR_STEPS_PER_FLOOR = 18;
