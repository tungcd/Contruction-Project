# Completion Report — Migrate UI sang antd

**Ngày:** 2026-07-18
**Khung diễn đạt:** current recommendation, không phải kiến trúc cuối cùng (theo
Startup Flexibility Principle, Founder 2026-07-18) — có thể chỉnh lại theme,
đổi cách antd/Tailwind phối hợp, hoặc rút lại quyết định này bất kỳ lúc nào
nếu phát sinh xung đột/chi phí không xứng đáng.

## Done

- Cài `antd` + `@ant-design/nextjs-registry` (SSR registry, bắt buộc cho App
  Router) + `@ant-design/cssinjs` + `@ant-design/icons` + `dayjs`.
- Wire `AntdRegistry` ở root layout, `ConfigProvider` (theme + locale `vi_VN`)
  ở `providers.tsx` — theme token khớp màu/bo góc đang dùng (`#2563eb`, 8px)
  để không đổi giao diện đột ngột.
- **Current hypothesis về phối hợp antd/Tailwind:** antd phụ trách mọi
  component tương tác (Button/Card/Input/Select/Table/Form/DatePicker/Tag),
  Tailwind chỉ còn dùng cho layout/spacing (flex/grid/margin) quanh các
  component đó. Đây là lựa chọn thực dụng để không phải viết lại layout của
  toàn bộ trang — có thể xem lại nếu về sau thấy chồng chéo CSS gây khó chịu.
- `components/ui/{button,card,badge}.tsx` viết lại thành adapter mỏng quanh
  antd `Button`/`Card`/`Tag` — giữ nguyên API cũ (`variant`/`size`) nên hầu hết
  trang không cần sửa gì thêm, nhưng phần **render** đã là antd thật.
- Toàn bộ input/select/textarea/table thô (raw HTML) trong app đã thay bằng
  antd: `CreateProjectForm` (antd Form + validate), `WorkspaceHeader` (Input
  đổi tên dự án), `PromptBar` (Input.TextArea), trang PriceBooks (antd Form +
  DatePicker cho form tạo mới), trang PriceBook detail (antd Table với ô sửa
  trực tiếp bằng Input/Select), trang Estimate (antd Table cho bảng dòng BOQ,
  antd Select cho chọn PriceBook/lịch sử version).
- Đã grep xác nhận không còn `<input>`/`<select>`/`<textarea>`/`<table>` thô
  nào trong `apps/web/src`.

## Files

- Mới: không có file mới (chỉ sửa)
- Sửa: `app/layout.tsx`, `app/providers.tsx`, `components/ui/{button,card,badge}.tsx`,
  `features/project/components/CreateProjectForm.tsx`,
  `features/workspace/components/WorkspaceHeader.tsx`,
  `features/chat/components/PromptBar.tsx`,
  `app/pricebooks/page.tsx`, `app/pricebooks/[id]/page.tsx`,
  `app/projects/[id]/estimate/page.tsx`,
  `features/estimate/components/EstimateSectionTable.tsx`
- Không đổi (đã tự tương thích qua lớp adapter Card/Badge/Button):
  `ProjectCard`, `ConversationPanel`, `MissingPanel`, `RequirementSummaryPanel`,
  `ProjectBriefView`, `EstimateSummaryPanel`, `MockModeBanner`, Brief page.

## Verify

- typecheck: PASS. Build production: PASS (bundle tăng ~90-250kB/trang do
  antd — đánh đổi đã biết, chưa tối ưu vì ưu tiên demo trước theo đúng
  nguyên tắc Startup Flexibility).
- Server thật (`next start`): mọi route trả HTTP 200, SSR shell không có
  error digest, xác nhận `AntdRegistry` inject đúng CSS-in-JS (thấy class
  `ant-btn`/`ant-card` trong HTML SSR ở các phần không phụ thuộc data client).
- **Giới hạn đã biết:** không có browser/headless tool trong session này —
  chưa tự tay click/gõ để xác nhận Table sửa dòng, Select mở dropdown, Form
  validate hiển thị đúng trên trình duyệt thật. Đã bù bằng: đọc lại toàn bộ
  code từng file sau khi viết, xác nhận prop khớp đúng kiểu antd (typecheck
  bắt được sai kiểu), và test end-to-end API (không đổi) từ các ticket trước
  vẫn hoạt động phía sau UI mới. **Đề nghị Founder tự bấm thử ít nhất 2 luồng
  chính** (tạo project mới qua Form, sửa 1 dòng PriceBook/Estimate qua Table)
  trước khi coi migration này ổn định.

## Known Issues / Trade-off (đúng khung "current recommendation")

- Bundle size tăng đáng kể (First Load JS +90-250kB/trang) — chưa áp dụng
  tree-shaking/import động cho antd. Điều kiện nên xem lại: nếu Founder thấy
  tốc độ tải trang chậm rõ rệt khi demo.
- Button variant "outline" và "secondary" map cùng về antd `type="default"`
  (antd không có 5 variant riêng biệt như bộ cũ) — hội tụ hình ảnh chấp nhận
  được ở MVP, không phải giới hạn kỹ thuật cố định.
- Card/Badge vẫn giữ compound-component pattern cũ (`CardHeader`/`CardTitle`
  là div thường, không phải antd) vì antd Card không có cấu trúc con tương
  đương — điều kiện nên xem lại: nếu về sau cần API Card gần với antd gốc hơn
  (vd `extra`, `tabList`), có thể viết lại trực tiếp bằng antd Card props
  thay vì giữ adapter.
- Chưa đổi icon (`lucide-react`) sang `@ant-design/icons` — phạm vi yêu cầu
  tập trung vào "component"/"form", icon là chi tiết thị giác nhỏ, rủi ro
  thấp nếu giữ nguyên; có thể đổi sau nếu Founder muốn đồng bộ 100%.
