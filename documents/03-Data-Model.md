# 03. Data Model

**Project:** AI Construction Copilot\
**Module:** AI Project Discovery (MVP)\
**Version:** v0.1\
**Status:** Draft

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
  "notes": {}
}
```

### Project

-   projectType
-   buildingType
-   location

### Site

-   landArea
-   constructionArea
-   frontage
-   depth
-   roadWidth

### Building

-   floors
-   roofType
-   architecturalStyle

### Household

-   adults
-   children
-   elderly
-   cars

### Functional

-   bedrooms
-   bathrooms
-   livingRoom
-   kitchen
-   worshipRoom
-   storage
-   garage
-   garden

### Budget

-   budget
-   constructionScope

### Timeline

-   expectedStart
-   expectedFinish

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

-   Requirement Score
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
