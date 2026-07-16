/**
 * Fixture demo "Đan Phượng" — dựng từ hội thoại test thật đã có trong DB dev
 * (dự án "nhà quê đan phượng"), theo yêu cầu Founder trước khi reset DB:
 *   "Chuyển các test case có giá trị thành fixture/seed."
 *
 * QUAN TRỌNG (điều kiện 4 — Task Approval):
 * - Requirement dưới đây đã được CHUẨN HOÁ THỦ CÔNG theo Data Model v0.2.
 * - Seed KHÔNG được gọi OpenAI. Dữ liệu ở đây là kết quả cuối, viết tay,
 *   deterministic — không phải để AI phân tích lại lúc seed.
 * - Hội thoại gốc giữ lại làm input tham khảo / hiển thị demo, KHÔNG phải
 *   nguồn để tính Requirement lúc seed.
 */

export const projectInfo = {
  name: "Anh Hùng - Nhà phố Đan Phượng (Demo)",
  customerName: "Anh Hùng",
  customerPhone: null,
};

/** Hội thoại gốc — chỉ để hiển thị trong Conversation, không dùng để tính lại Requirement. */
export const conversation = [
  {
    role: "user",
    message: `Chào anh.
Em đang có mảnh đất ở Đan Phượng, Hà Nội.
Đất khoảng 5x18m, tổng khoảng 90m2.
Nhà em định xây nhà để ở lâu dài cho gia đình.
Hiện tại nhà có 5 người gồm hai vợ chồng, hai con nhỏ và mẹ già.
Em muốn xây khoảng 3 tầng, phong cách hiện đại, ưu tiên nhiều ánh sáng và thoáng.
Tầng 1 em muốn có phòng khách, bếp, 1 phòng ngủ cho mẹ vì bà lớn tuổi nên không muốn leo cầu thang, thêm 1 WC chung.
Tầng 2 dự kiến có phòng ngủ master của hai vợ chồng và thêm 2 phòng cho các con, chắc thêm 2 WC.
Tầng 3 thì muốn có phòng thờ, sân phơi, kho nhỏ và nếu đủ diện tích thì làm thêm phòng làm việc.
Nhà không cần gara vì ô tô thường để ngoài sân hoặc ngoài đường.
Em thích mái bằng.
Ban công mỗi tầng một chút để trồng cây.
Ngân sách dự kiến khoảng 2,5 đến 3 tỷ.
Nếu hợp lý thì muốn làm trọn gói luôn.
Dự kiến đầu năm sau sẽ khởi công.
À trước nhà là đường ô tô tránh nhau được nên chắc xe vật liệu vào thoải mái.
Nếu cần thêm thông tin thì anh hỏi giúp em nhé.`,
  },
  {
    role: "assistant",
    message:
      "Mình đã ghi nhận: xây mới, ở Đan Phượng, Hà Nội, đất 90m² (5x18m), 3 tầng, phong cách hiện đại, mái bằng, 4 phòng ngủ, ngân sách 2,5-3 tỷ, muốn trọn gói, dự kiến khởi công đầu năm sau.\n\nMình cần hỏi thêm 3 thông tin:\n1. Tổng diện tích sàn xây dựng dự kiến khoảng bao nhiêu m² ạ?\n2. Nhà mình có cần tầng hầm không ạ?\n3. Loại móng dự kiến (nếu đã khảo sát) là gì ạ?",
  },
];

/**
 * Requirement CUỐI CÙNG, đã chuẩn hoá thủ công theo Data Model v0.2.
 * Field nào hội thoại không nói rõ -> giữ null (không suy diễn/bịa thêm).
 */
export const requirement = {
  project: {
    projectType: "new_build",
    buildingType: "townhouse",
    buildingTypeNote: null,
    province: "Hà Nội",
    district: "Đan Phượng",
    addressDetail: null,
  },
  site: {
    landArea: 90,
    buildingFootprint: null,
    totalFloorArea: null,
    frontage: 5,
    depth: 18,
    roadWidth: null,
  },
  building: {
    floors: 3,
    basementLevels: null,
    roofType: "flat",
    roofTypeNote: null,
    architecturalStyle: "modern",
    architecturalStyleNote: null,
    foundationType: null,
  },
  household: {
    adults: 2,
    children: 2,
    hasElderly: true,
    cars: null,
  },
  functional: {
    bedrooms: 4, // tầng 1 (1) + master (1) + tầng 2 (2)
    bathrooms: 3, // tầng 1 (1) + tầng 2 (2)
    livingRoom: true,
    kitchen: true,
    worshipRoom: true,
    storage: true, // "kho nhỏ"
    garage: false, // khách nói rõ không cần gara
    garden: null,
    balcony: true,
    otherRooms: ["Sân phơi", "Phòng làm việc"],
  },
  budget: {
    budgetMin: 2_500_000_000,
    budgetMax: 3_000_000_000,
    budgetNote: "Ngân sách dự kiến khoảng 2,5 đến 3 tỷ",
    constructionScope: "turnkey",
    constructionScopeNote: "Nếu hợp lý thì muốn làm trọn gói luôn",
  },
  timeline: {
    expectedStart: "đầu năm sau",
    expectedFinish: null,
  },
  notes: "Đường trước nhà là đường ô tô tránh nhau được, xe vật liệu vào thoải mái.",
};
