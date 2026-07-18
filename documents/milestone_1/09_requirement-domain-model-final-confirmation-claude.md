# Requirement Domain Model — Xác nhận cuối (phản hồi Claude)

## 1–5. Xác nhận

Đồng ý toàn bộ. Không còn phản biện nào với Requirement Domain Model.
Sẵn sàng chuyển sang vai trò review khi ChatGPT đưa ra Freeze Draft
(Domain Model v1.0 + ADR REQ-D1...D8).

## 6. Module tiếp theo nên thiết kế và freeze: **Constraint Set Compiler**

**Lý do:** đây là module duy nhất sau Requirement có thể freeze ngay mà
KHÔNG vi phạm Burden of Proof Rule vừa thống nhất — vì nó **100% tất
định** (Golden Contract #3), không đặt cược vào hành vi AI chưa kiểm
chứng như Design Intent Graph/Geometry/Descriptor. Domain model của một
phép biến đổi tất định có thể đặc tả với độ tin cậy tương đương những gì
vừa làm cho Requirement — không cần chờ bằng chứng thực nghiệm trước.

Ba lý do bổ sung, xếp theo mức độ ưu tiên:

1. **Là điều kiện tiên quyết để chạy Manual POC Rủi ro #1** (Design
   Intent Graph realizability, ưu tiên cao nhất đã thống nhất ở vòng 3)
   — không thể kiểm tra "LLM có tạo được graph realizable không" nếu
   chưa có Constraint Set nào để đưa vào. Freeze module này không phải
   chỉ vì "tới lượt", mà vì nó mở khoá được Manual POC quan trọng nhất.
2. **Giải quyết trực tiếp Open Boundary đã ghi nhận** khi freeze
   Requirement (`otherRooms`/`excludedRooms` → deterministic constraint)
   — đúng nơi câu hỏi đó thuộc về, không phải chủ đề mới.
3. Design Intent Graph, Geometry, Descriptor đều **nên đợi bằng chứng từ
   Manual POC #1** trước khi freeze ở độ sâu domain model tương tự — freeze
   chúng ngay bây giờ mới là hành vi vi phạm Burden of Proof Rule.

Không chọn Design Intent Graph/Geometry/Descriptor ở bước này, vì đó
chính xác là 3 module rủi ro cao nhất chưa có bằng chứng — freeze sâu
cho chúng lúc này là lặp lại đúng sai lầm vừa được thống nhất tránh.
