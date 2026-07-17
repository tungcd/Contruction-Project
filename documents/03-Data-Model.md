# 03. Data Model

**Project:** AI Construction Copilot\
**Module:** AI Project Discovery (MVP)\
**Version:** v0.2\
**Status:** ĐÃ ĐÓNG BĂNG (Frozen) — 2026-07-16

> ⚠️ Data Model đã được Founder **đóng băng**. Không sửa nếu chưa có quyết định
> mở băng chính thức. Lịch sử review & quyết định nằm trong
> `documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-16/` (02_Data-Model-Review,
> 03_P0-Final-Proposal, 04_Final-Data-Model, và các Founder Decision). Thư mục
> `CHATGPT_CONTEXT` tổ chức theo `<năm-tháng>/<tuần ISO>/<ngày>/NN_file.md`, đánh
> số thứ tự tạo file trong ngày (01, 02, ...).
>
> Requirement Score và Readiness là **hai khái niệm độc lập** — xem mục 5.3.1.

------------------------------------------------------------------------

# 1. Mục tiêu

Tài liệu này định nghĩa cấu trúc dữ liệu cốt lõi của MVP.

Đây là **nguồn sự thật (Source of Truth)** để Claude Code sinh:

-   Database
-   Prisma Schema
-   DTO
-   API
-   TypeScript Types
-   Zod Schema

Không thiết kế theo Database trước, mà thiết kế theo **Business
Entity**.

------------------------------------------------------------------------

# 2. Design Principles

## Nguyên tắc 1

Business trước, Database sau.

    Business Entity
        ↓
    JSON Contract
        ↓
    Database
        ↓
    API

## Nguyên tắc 2

Không lưu dữ liệu có thể tính toán được.

Ví dụ:

-   Requirement Score
-   Missing Fields
-   Next Questions

Được sinh từ Requirement.

## Nguyên tắc 3

Requirement là Source of Truth.

Conversation chỉ là ngữ cảnh.

Project Brief chỉ là dữ liệu sinh ra từ Requirement.

------------------------------------------------------------------------

# 3. Business Entities

MVP chỉ có 5 entity.

    Project
    Conversation
    Requirement
    ProjectBrief
    History

------------------------------------------------------------------------

# 4. Entity Relationships

    Project
    ├── Conversation (1:N)
    ├── Requirement (1:1)
    ├── ProjectBrief (1:1)
    └── History (1:N)

------------------------------------------------------------------------

# 5. Entity Detail

## 5.1 Project

### Ý nghĩa

Đại diện cho một dự án của khách hàng.

### Fields

  Field           Type       Required
  --------------- ---------- ----------
  id              UUID       ✓
  name            string     ✓
  customerName    string     
  customerPhone   string     
  status          enum       ✓
  createdAt       datetime   ✓
  updatedAt       datetime   ✓

### Status

-   Discovery
-   ReadyForBrief
-   BriefGenerated

------------------------------------------------------------------------

## 5.2 Conversation

### Ý nghĩa

Lưu toàn bộ lịch sử chat giữa người dùng và AI.

### Fields

  Field       Type
  ----------- ---------------------------
  id          UUID
  projectId   UUID
  role        user / assistant / system
  message     text
  createdAt   datetime

Conversation KHÔNG phải nguồn dữ liệu chính.

------------------------------------------------------------------------

## 5.3 Requirement

### Ý nghĩa

Là dữ liệu chuẩn hóa của dự án.

Mọi module sau đều sử dụng Requirement.

### Structure

``` json
{
  "project": {},
  "site": {},
  "building": {},
  "household": {},
  "functional": {},
  "budget": {},
  "timeline": {},
  "notes": null
}
```

Mọi field đều nullable. `null` = chưa biết (Unknown).

### Project

  Field          Type              Ghi chú
  -------------- ----------------- --------------------------------------------
  projectType    enum \| null      new_build, renovation, interior, extension
  buildingType   enum \| null      townhouse, villa, apartment, level4, shophouse, other
  buildingTypeNote string \| null  dùng khi buildingType = other
  province       string \| null    tỉnh/thành — dùng cho Pricing
  district       string \| null    quận/huyện — dùng cho Pricing
  addressDetail  string \| null    phần địa chỉ còn lại — cho Proposal/Contract

### Site

  Field              Type            Ghi chú
  ------------------ --------------- ------------------------------------------
  landArea           number \| null  m² — diện tích khu đất
  buildingFootprint  number \| null  m² — diện tích chiếm đất (tầng 1)
  totalFloorArea     number \| null  m² — TỔNG diện tích sàn (biến chính của BOQ)
  frontage           number \| null  m — mặt tiền
  depth              number \| null  m — chiều sâu
  roadWidth          number \| null  m — đường vào

### Building

  Field               Type            Ghi chú
  ------------------- --------------- -----------------------------------------
  floors              number \| null  số tầng nổi chính (KHÔNG tính tum/lửng/hầm)
  basementLevels      number \| null  số tầng hầm (0 = không có)
  roofType            enum \| null    flat, japanese, thai, tile, metal, sloped, other
  roofTypeNote        string \| null  dùng khi roofType = other
  architecturalStyle  enum \| null    modern, neoclassical, classical, minimalist, indochine, tropical, scandinavian, other
  architecturalStyleNote string\|null dùng khi architecturalStyle = other
  foundationType      enum \| null    single, strip, raft, pile, unknown

### Household

  Field       Type             Ghi chú
  ----------- ---------------- ---------------------------
  adults      number \| null
  children    number \| null
  hasElderly  boolean \| null  có người già ở cùng
  cars        number \| null

### Functional

  Field        Type              Ghi chú
  ------------ ----------------- --------------------------
  bedrooms     number \| null
  bathrooms    number \| null
  livingRoom   boolean \| null
  kitchen      boolean \| null
  worshipRoom  boolean \| null   phòng thờ
  storage      boolean \| null   kho
  garage       boolean \| null   gara / sân ô tô
  garden       boolean \| null   sân vườn
  balcony      boolean \| null   ban công
  otherRooms   string\[\]        phòng ngoài danh sách (sân phơi, phòng làm việc...)

### Budget

  Field                  Type            Ghi chú
  ---------------------- --------------- ---------------------------------------
  budgetMin              number \| null  VNĐ — cận dưới ngân sách
  budgetMax              number \| null  VNĐ — cận trên ngân sách
  budgetNote             string \| null  nguyên văn khách nói
  constructionScope      enum \| null    labor_only, rough_and_finishing_labor, turnkey, turnkey_with_interior
  constructionScopeNote  string \| null  nguyên văn khách nói

Budget là **Requirement**, không phải Estimate. Không quy về một con số.
Ví dụ: "2,5 đến 3 tỷ" → budgetMin = 2.5 tỷ, budgetMax = 3 tỷ. "hơn 2 tỷ" →
budgetMin = 2 tỷ, budgetMax = null. "dưới 3 tỷ" → budgetMin = null, budgetMax = 3 tỷ.

### Timeline

  Field           Type            Ghi chú
  --------------- --------------- ------------------------
  expectedStart   string \| null  tự do ("đầu năm sau")
  expectedFinish  string \| null  tự do

------------------------------------------------------------------------

## 5.3.1 Requirement Score vs Readiness (Founder Decision)

**Đây là hai khái niệm ĐỘC LẬP.**

### Requirement Score

-   CHỈ dùng để hiển thị **tiến độ** thu thập requirement.
-   KHÔNG quyết định readiness.
-   Là dữ liệu dẫn xuất, tính động, không lưu DB.
-   Công thức: `% = tổng trọng số field đã có / tổng trọng số field theo dõi`.
-   `foundationType` KHÔNG tính vào Score (khách không thể biết ở giai đoạn Discovery).

### Readiness (Business Rule riêng)

Kiến trúc chuẩn bị 3 cờ; MVP hiện tại **chỉ implement `briefReady`**:

    readiness = {
      brief:    { ready, missing },   // implement bây giờ
      quantity: ...                   // để sau (BOQ)
      pricing:  ...                   // để sau (Pricing)
    }

**Quy tắc `briefReady` (chốt):**

    briefReady =
      projectType   !== null &&
      buildingType  !== null &&
      province      !== null &&
      landArea      !== null &&
      floors        !== null &&
      bedrooms      !== null && bedrooms >= 1 &&
      livingRoom    !== null &&
      kitchen       !== null

Ghi chú ngữ nghĩa:

-   `coreFunctionalNeeds` = bedrooms + livingRoom + kitchen. bathroom KHÔNG chặn.
-   `livingRoom` / `kitchen` dùng **"đã xác định" (!== null)**, KHÔNG phải truthy.
    Giá trị `false` là một requirement đã xác nhận hợp lệ, KHÔNG được chặn Brief.
-   Địa điểm: chỉ `province` là bắt buộc cho Brief. `district`, `addressDetail` không.

**Thông tin cần xác nhận trong Brief:** các field KHÔNG chặn Brief nhưng nên hỏi nốt
nếu thiếu — `budgetMin/Max`, `constructionScope`, `totalFloorArea`, `foundationType`.
Hiển thị thành một mục trong Project Brief.

------------------------------------------------------------------------

## 5.3.2 Enum & Nhãn hiển thị

Enum là giá trị nội bộ / lưu DB. UI **không** hiển thị enum thô — dịch ở tầng hiển thị.
Enum "mở" (buildingType, roofType, architecturalStyle) có `other` + field `*Note` đi kèm.

  Enum                Giá trị                                                          Đóng/Mở
  ------------------- ---------------------------------------------------------------- --------
  projectType         new_build, renovation, interior, extension                       đóng
  buildingType        townhouse, villa, apartment, level4, shophouse, other            mở
  roofType            flat, japanese, thai, tile, metal, sloped, other                 mở
  architecturalStyle  modern, neoclassical, classical, minimalist, indochine, tropical, scandinavian, other  mở
  constructionScope   labor_only, rough_and_finishing_labor, turnkey, turnkey_with_interior  đóng
  foundationType      single, strip, raft, pile, unknown                               đóng

**Nhãn UI constructionScope:** labor_only → "Nhân công" · rough_and_finishing_labor →
"Xây phần thô" · turnkey → "Xây trọn gói" · turnkey_with_interior → "Xây trọn gói + Nội thất".

**Nhãn UI foundationType:** single → "Móng đơn" · strip → "Móng băng" · raft → "Móng bè" ·
pile → "Móng cọc" · unknown → "Chưa khảo sát".

------------------------------------------------------------------------

## 5.4 ProjectBrief

### Ý nghĩa

Tài liệu tóm tắt dự án.

Sinh hoàn toàn từ Requirement.

### Fields

  Field         Type
  ------------- ----------
  id            UUID
  projectId     UUID
  markdown      text
  generatedAt   datetime

------------------------------------------------------------------------

## 5.5 History

### Ý nghĩa

Lưu các sự kiện chính.

Ví dụ:

-   Requirement Updated
-   Brief Generated

### Fields

  Field       Type
  ----------- ----------
  id          UUID
  projectId   UUID
  event       string
  createdAt   datetime

------------------------------------------------------------------------

# 6. Aggregate Root

    Project
        │
        ├── Requirement
        ├── Conversation
        ├── ProjectBrief
        └── History

Mọi truy cập đều bắt đầu từ Project.

------------------------------------------------------------------------

# 7. Derived Data

Không lưu xuống database.

-   Requirement Score (chỉ hiển thị tiến độ — xem 5.3.1)
-   Readiness (briefReady — business rule riêng, xem 5.3.1)
-   Missing Fields
-   AI Questions
-   AI Assumptions

Các giá trị này được tính động.

------------------------------------------------------------------------

# 8. JSON Contract

``` json
{
  "project": {
    "id": "",
    "name": "",
    "status": "Discovery"
  },
  "requirement": {},
  "conversation": [],
  "brief": {},
  "history": []
}
```

Đây là contract thống nhất giữa Frontend, Backend và AI.

------------------------------------------------------------------------

# 9. MVP Decisions

## Quyết định 1

Requirement chỉ có **một phiên bản**.

Mỗi lần AI cập nhật sẽ ghi đè dữ liệu hiện tại.

## Quyết định 2

ProjectBrief được regenerate khi Requirement thay đổi.

## Quyết định 3

Conversation không được dùng làm nguồn dữ liệu nghiệp vụ.

------------------------------------------------------------------------

# 10. Future

Sau khi MVP thành công có thể bổ sung:

-   Requirement Versioning
-   Attachment
-   Image
-   Voice
-   Survey
-   Drawing
-   BOQ
-   Pricing

------------------------------------------------------------------------

# Definition of Done

Claude Code có thể từ tài liệu này sinh được:

-   Prisma Schema
-   Database Migration
-   REST API
-   TypeScript Models
-   Zod Schema
-   Mock Data

mà không cần hỏi thêm về cấu trúc dữ liệu.
