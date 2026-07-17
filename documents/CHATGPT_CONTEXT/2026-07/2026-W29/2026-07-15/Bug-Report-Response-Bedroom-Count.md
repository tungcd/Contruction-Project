# Phản hồi Bug Report — Requirement Extraction (Bedroom Count)

**Trạng thái:** ĐÃ SỬA
**Ngày:** 2026-07-15
**Liên quan:** `Bug-Report-Requirement-Extraction-Bedroom-Count.md`

---

# 1. Xác nhận bug

Bug **có thật** và đã tái hiện được. Bằng chứng lấy từ chính dự án
`nhà quê đan phượng` trong database:

Khách mô tả:
- Tầng 1: 1 phòng ngủ cho mẹ
- Tầng 2: phòng ngủ master + 2 phòng cho các con

Hệ thống ghi nhận: `bedrooms = 1`. Đúng như báo cáo.

---

# 2. Nguyên nhân thật — KHÁC với dự đoán trong báo cáo

Báo cáo quy lỗi cho AI và đề xuất sửa prompt. **Sai địa chỉ.**

App khi đó chạy `AI_PROVIDER=mock`. Ở chế độ này **không có AI nào cả** —
requirement được dò bằng regex trong `MockProvider`:

```
/(\d+)\s*phòng ngủ/     -> chỉ lấy match ĐẦU TIÊN -> 1
```

Dự đoán *"lấy lần xuất hiện đầu tiên của field"* trong báo cáo là **chính xác**,
nhưng thủ phạm là regex của mock, không phải model.

Đã kiểm chứng: chạy đúng hội thoại đó qua OpenAI thật (`gpt-5-mini`) cho ra
`bedrooms = 4` **ngay từ đầu, không cần sửa prompt gì**.

> Bài học: mock không phải AI. Nó chỉ để chạy UI khi chưa có API key.
> Không được đánh giá chất lượng trích xuất dựa trên mock.

---

# 3. Đã sửa những gì

## 3.1 MockProvider

| Lỗi | Trước | Sau |
|---|---|---|
| Đếm phòng ngủ | lấy match đầu -> 1 | cộng tổng toàn bộ -> 4 |
| "phòng ngủ master" | bỏ qua | tính là 1 |
| "2 phòng tắm" | đếm thành phòng ngủ | loại bằng lookahead |
| "không cần gara" | `garage = true` (ngược) | `garage = false` |
| "tổng khoảng 90m2" | `landArea = null` | `90` |
| "đất 5x18m" | bỏ qua | `frontage=5, depth=18` |
| "2,5 đến 3 tỷ" | lấy `3 tỷ` (thổi phồng) | lấy trung bình `2,75 tỷ` |
| "kho nhỏ" | `storage = null` | `true` |

Hai bug do regex JS, đáng ghi nhớ:
- `\b` **chỉ hiểu ASCII**: `\bkho\b` khớp luôn chữ "**kho**ảng". Phải dùng
  lookaround Unicode `(?<!\p{L})kho(?!\p{L})/u`.
- `phòng\s*(?!tắm)`: `\s*` backtrack về 0 ký tự nên lookahead xét ở vị trí dấu
  cách và **luôn pass**. Khoảng trắng phải nằm TRONG lookahead.

## 3.2 OpenAI

- Model trả `0` và `""` thay cho `null` -> đã có `parsers/normalize` dọn.
- Model trả **tiếng Anh** (`roofType="flat"`, `architecturalStyle="modern"`)
  dù prompt yêu cầu tiếng Việt -> thêm bảng dịch trong `normalize`.
  Không tin prompt, chặn ở code.
- Model bịa `constructionArea` bằng `landArea` -> siết prompt.
  Score từ 76% (số bịa) về 64% (trung thực).
- `reasoning: { effort: "low" }` -> **58s xuống còn 7–14s**.

## 3.3 Lỗi nghiêm trọng phát hiện thêm khi chạy regression

PostgreSQL ném `22P05 "unsupported Unicode escape sequence"` khi AI trả chuỗi
lẫn ký tự NULL -> request **500 và mất trắng tin nhắn của khách**.

Đã thêm `sanitizeText()` cho **cả hai đầu**: chuỗi từ AI **và** tin nhắn người
dùng (khách paste từ Word/Zalo/PDF rất dễ dính).

## 3.4 UI

Thêm banner cảnh báo khi chạy mock, để không ai nhầm dữ liệu regex là dữ liệu
AI — chính cái bẫy đã sinh ra bug report này.

---

# 4. Regression test

Đúng như khuyến nghị mục 4 của báo cáo. Chạy:

```bash
npm run test:regression                      # provider trong .env
AI_PROVIDER=openai npm run test:regression   # ép dùng OpenAI
```

8 case, phủ: bedrooms cộng theo tầng, không đếm nhầm loại phòng khác, phủ định
gara, không suy constructionArea từ landArea, ngân sách dạng dải, kích thước
`5x18m`, phạm vi báo giá, và ký tự điều khiển.

**Kết quả: 8/8 pass trên cả `mock` và `openai`.**

Bắt buộc chạy lại mỗi khi sửa prompt hoặc đổi model.

---

# 5. Khuyến nghị

1. **Dùng `AI_PROVIDER=openai` khi demo với nhà thầu.** Mock chỉ để dựng UI.
2. Không đánh giá chất lượng sản phẩm bằng mock.
3. `gpt-5-mini` mất 7–14s/lần gọi. Nếu cần nhanh hơn nữa thì cân nhắc model
   không-reasoning, nhưng sẽ đánh đổi độ chính xác khi tổng hợp theo tầng.

# 6. Hạn chế còn lại

- `livingRoom`/`balcony`: model đôi khi trả `false` thay vì `null` cho thông tin
  khách không nhắc tới. **Không ảnh hưởng Requirement Score** (hai field này
  không nằm trong công thức tính điểm) nên chưa xử lý.
- Model thỉnh thoảng trả về toàn bộ `null` với hội thoại rất dài (đã gặp 1 lần
  trong ~6 lần chạy). Khi đó Score = 0% và khách phải gửi lại. Cần theo dõi
  thêm; nếu tái diễn thì bổ sung retry khi kết quả rỗng.
