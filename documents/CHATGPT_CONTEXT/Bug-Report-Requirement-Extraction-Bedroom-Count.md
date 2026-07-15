# Bug Report - Requirement Extraction V0.1

**Module:** AI Requirement Assistant\
**Priority:** High\
**Type:** Requirement Extraction Accuracy

---

# Bối cảnh

Sau khi test với một hội thoại thực tế, AI đã extract như sau:

    Đã ghi nhận:
    - Xây mới
    - Đan Phượng
    - 3 tầng
    - 1 phòng ngủ
    - Ngân sách 3 tỷ

Trong khi nội dung người dùng cung cấp là:

- Tầng 1:
  - 1 phòng ngủ
- Tầng 2:
  - 1 phòng master
  - 2 phòng ngủ cho con

=\> Tổng cộng **4 phòng ngủ**.

AI chỉ lấy giá trị đầu tiên và kết luận "1 phòng ngủ".

Đây là lỗi nghiêm trọng vì sẽ ảnh hưởng trực tiếp đến:

- Requirement Summary
- Requirement Score
- Project Brief
- Quantity Estimation (Module sau)

---

# Nguyên nhân dự đoán

Hiện tại AI có thể đang:

- Extract theo từng câu.
- Hoặc lấy lần xuất hiện đầu tiên của field.
- Chưa tổng hợp requirement trên toàn bộ hội thoại.

---

# Kỳ vọng

AI phải phân tích toàn bộ hội thoại trước khi kết luận.

Nếu người dùng mô tả công năng theo từng tầng thì phải tổng hợp thành
requirement cuối cùng.

Ví dụ:

    Tầng 1:
    - 1 phòng ngủ

    Tầng 2:
    - Master
    - 2 phòng ngủ

    ↓

    Bedrooms = 4

Không được trả:

    Bedrooms = 1

---

# Prompt cần bổ sung

Thêm rule:

> Nếu người dùng mô tả công năng theo từng tầng, AI phải tổng hợp số
> lượng của toàn bộ công trình. Không lấy giá trị xuất hiện đầu tiên
> hoặc cuối cùng.

---

# Test Case

Input:

    Tầng 1:
    - 1 phòng ngủ

    Tầng 2:
    - 1 phòng master
    - 2 phòng ngủ

    Tầng 3:
    - Phòng thờ
    - Kho

Expected:

```json
{
  "bedrooms": 4,
  "worshipRoom": true,
  "storage": true,
  "floors": 3
}
```

Không chấp nhận:

```json
{
  "bedrooms": 1
}
```

---

# Regression Test

Sau khi sửa prompt hoặc đổi model, luôn chạy lại test case này.

Expected:

- Bedrooms = 4
- Floors = 3
- Worship Room = true
- Storage = true

Nếu sai bất kỳ field nào thì coi như regression.

---

# Khuyến nghị

1.  Review lại prompt Requirement Extraction.
2.  Review JSON schema mapping.
3.  Nếu cần, yêu cầu AI trả thêm `reasoning_summary` (không lưu DB) để
    debug cách AI tổng hợp dữ liệu.
4.  Bổ sung bộ regression test cho các trường:
    - Bedrooms
    - Bathrooms
    - Floors
    - Functional rooms
    - Budget
    - Construction scope

Đây là bug P0 và cần được xử lý trước khi phát triển các module tiếp
theo.
