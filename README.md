# Hệ Thống Số Hóa & Quản Lý Ngân Hàng Câu Hỏi (Exam Bank System)

Một ứng dụng web Full-stack chuyên nghiệp giúp tự động hóa quy trình số hóa và soạn thảo đề thi. Hệ thống hỗ trợ tính năng dán ảnh để nhận diện chữ và công thức toán học (OCR sang LaTeX), quản lý câu hỏi thông minh theo mô hình Đơn/Nhóm và hỗ trợ đa dạng loại câu hỏi (Trắc nghiệm, Đúng/Sai, Tự luận).

---

## Công Nghệ Sử Dụng (Tech Stack)

*   **Core Framework:** Next.js 15+ (App Router) – Xử lý Full-stack (Frontend tương tác động và API Routes Backend xử lý AI bảo mật).
*   **Giao diện (UI):** TailwindCSS + Shadcn/ui (hoặc Ant Design) nhằm tối ưu tốc độ dựng form và các bộ lọc quản trị phức tạp.
*   **Database & Auth:** Firebase (Firestore lưu trữ dữ liệu câu hỏi cấu trúc động, Firebase Auth quản lý tài khoản người dùng).
*   **Lưu trữ hình ảnh:** Cloudinary API (Dịch vụ đám mây giúp upload ảnh minh họa, tự động nén và tối ưu kích thước qua CDN URL).
*   **Trí tuệ nhân tạo (AI/OCR):** Gemini 1.5 Flash API (Sử dụng Vision Model để đọc hiểu ngữ cảnh, tách đề bài và chuyển công thức toán sang mã LaTeX).
*   **Xử lý Toán học & Ký tự đặc biệt:**
    *   `MathLive`: Trình soạn thảo công thức WYSIWYG trực quan (nhập liệu như Equation trong Word, tự xuất ra mã LaTeX ngầm).
    *   `KaTeX`: Thư viện render mã LaTeX thành phương trình toán học hiển thị trực quan trên giao diện.

---

## Kiến Trúc Thư Mục Dự Án

```text
my-exam-bank/
├── app/
│   ├── api/
│   │   └── ocr/
│   │       └── route.js       <-- Backend API tiếp nhận ảnh dán và gọi Gemini API
│   ├── dashboard/
│   │   └── page.js            <-- Ngân hàng câu hỏi (Giao diện bộ lọc & Danh sách đề thi)
│   ├── create-question/
│   │   └── page.js            <-- Màn hình biên soạn (Nơi dán ảnh, nhập liệu và chọn cấu trúc)
│   ├── layout.js
│   └── page.js                <-- Trang chủ / Cổng đăng nhập (Authentication)
├── components/
│   ├── QuestionForm.jsx       <-- Form cấu trúc động (Tự thay đổi theo dạng Đơn/Nhóm và Loại câu hỏi)
│   ├── MathEditor.jsx         <-- Bộ gõ công thức trực quan tích hợp MathLive
│   ├── QuestionPreview.jsx    <-- Bộ render nội dung câu hỏi và lời giải (Dùng KaTeX)
│   └── ImageUploader.jsx      <-- Kéo thả/Chọn hình ảnh minh họa bài tập lên Cloudinary
├── lib/
│   └── firebase.js            <-- Cấu hình kết nối Firebase Client SDK
└── .env.local                 <-- Biến môi trường ẩn (Chứa các API Keys bảo mật)
```

---

## ── CẤU TRÚC DỮ LIỆU CÂU HỎI (FIRESTORE JSON MODEL) ──
Hệ thống quản lý dữ liệu linh hoạt dựa trên cờ `isGroup` để phân tách rõ ràng câu hỏi đơn lẻ và câu hỏi chùm (chung ngữ cảnh/đoạn văn).
### Kiểu 1: Câu hỏi đơn (Trắc nghiệm / Đúng sai / Tự luận ngắn-dài)
```json
{
  "id": "q_single_001",
  "isGroup": false,
  "type": "multiple_choice", // Hoặc "true_false", "essay"
  "metadata": {
    "subject": "Toán học",
    "grade": 12,
    "year": "2025-2026",
    "exam": "Giữa Kỳ 1"
  },
  "content": "Cho hàm số có đồ thị như hình vẽ. Tìm số nghiệm của phương trình $f(x) = 0$.",
  "imageUrl": "[https://res.cloudinary.com/demo/image/upload/w_500,c_scale/hinh_do_thi_001.webp](https://res.cloudinary.com/demo/image/upload/w_500,c_scale/hinh_do_thi_001.webp)",
  "options": ["A. 1", "B. 2", "C. 3", "D. 4"], // Trường này để trống "" hoặc null nếu là câu tự luận
  "correct_answer": "C", // Nếu là tự luận, đây sẽ là đáp số ngắn
  "suggested_solution": "Dựa vào đồ thị ta thấy đường thẳng y = 0 cắt đồ thị tại 3 điểm phân biệt..." // Dành cho Tự luận/Lời giải chi tiết
}
```

### Kiểu 2: Câu hỏi Nhóm (Chùm câu hỏi chung Đoạn văn / Ngữ cảnh / Hình vẽ)
```json
{
  "id": "q_group_002",
  "isGroup": true,
  "metadata": {
    "subject": "Tiếng Anh",
    "grade": 12,
    "year": "2025-2026",
    "exam": "THPT Quốc Gia"
  },
  "passage": "Read the following passage and mark the letter A, B, C, or D... [Đoạn văn đọc hiểu hoặc hình vẽ hình học dùng chung]",
  "imageUrl": null, // Có thể chứa hình vẽ lớn dùng chung cho các câu hỏi con
  "subQuestions": [
    {
      "subId": "sub_1",
      "type": "multiple_choice",
      "content": "What is the main topic of the passage?",
      "options": ["A. Tech", "B. Environment", "C. Health", "D. History"],
      "correct_answer": "B"
    },
    {
      "subId": "sub_2",
      "type": "true_false",
      "content": "Xác định các mệnh đề sau đây là Đúng hay Sai dựa trên đoạn văn:",
      "statements": [
        {"text": "Ngành công nghiệp xanh đang phát triển.", "correct": true},
        {"text": "Nhiệt độ trái đất đang giảm dần.", "correct": false}
      ]
    },
    {
      "subId": "sub_3",
      "type": "essay",
      "content": "Tóm tắt thông điệp chính của tác giả bằng một câu văn (không quá 20 từ).",
      "suggested_solution": "The author emphasizes the urgent need for global environmental cooperation to combat climate change."
    }
  ]
}
```
---

## ── DANH SÁCH VIỆC CẦN LÀM (TO-DO LIST) ──
### Giai đoạn 1: Thiết lập nền móng ban đầu:
- Khởi tạo dự án Next.js (`npx create-next-app@latest`).

- Cài đặt và cấu hình thư viện UI (TailwindCSS kết hợp Shadcn/ui hoặc Ant Design).

- Cấu hình Firebase Console: Kích hoạt Firestore Database và bộ xác thực Firebase Authentication.

- Tạo file kết nối `lib/firebase.js` trong mã nguồn.

- Đăng ký tài khoản Cloudinary, tạo cấu hình Upload Preset ở chế độ `Unsigned` để sẵn sàng nhận file từ Frontend.

- Thiết lập file `.env.local` lưu trữ an toàn các mã Token và API Keys.

### Giai đoạn 2: Xây dựng Giao diện Form Soạn thảo Động (Logic Frontend)
- Thiết kế trang `/create-question` với thanh thông tin phân loại cố định (Môn học, Khối lớp, Năm học, Kỳ thi).

- Phát triển component `QuestionForm.jsx` xử lý giao diện linh hoạt chia làm 2 nhánh lớn:

  - Nhánh Câu hỏi Đơn: Tùy biến form theo loại:

    - Trắc nghiệm: Hiện ô nhập đề bài, 4 ô đáp án (A, B, C, D) và bộ chọn radio cho đáp án đúng.

    - Đúng/Sai: Hiện đề bài, danh sách các mệnh đề động kèm checkbox Đúng hoặc Sai.

    - Tự luận: Hiện đề bài và một ô Textarea lớn "Lời giải gợi ý / Hướng dẫn chấm".

  - Nhánh Câu hỏi Nhóm: Hiện ô nhập nội dung gốc (Đoạn văn/Bối cảnh), bên dưới có nút "Thêm câu hỏi con". Khi bấm sẽ sinh thêm một Form đơn độc lập (cho phép chọn cấu trúc Trắc nghiệm, Đúng/Sai hoặc Tự luận con).

- Tích hợp thư viện `MathLive` vào toàn bộ các ô nhập nội dung/đáp án/lời giải để người dùng có thể click gõ công thức toán học như Word.

- Hoàn thiện component `ImageUploader.jsx` hỗ trợ tải ảnh minh họa bài tập lên Cloudinary, nhận URL CDN và lưu vào State của câu hỏi.

### Giai đoạn 3: Tích hợp Tính năng Dán ảnh & Xử lý với Gemini AI (OCR & LaTeX)
- Xây dựng bộ lắng nghe sự kiện `onPaste` tại các ô nhập liệu chính. Nếu Clipboard chứa dữ liệu hình ảnh, tự động mã hóa sang định dạng Base64 và kích hoạt màn hình chờ (Loading).

- Xây dựng cấu trúc API Route Backend tại `/app/api/ocr/route.js`:

  - Tiếp nhận file ảnh được truyền từ trình duyệt.

  - Gọi SDK `@google/generative-ai` để chuyển tiếp dữ liệu sang mô hình Gemini 1.5 Flash.

  - Thiết lập cấu trúc System Prompt ép định dạng đầu ra:

      "Bạn là chuyên gia số hóa đề thi. Hãy phân tích hình ảnh câu hỏi được cung cấp (bất kể là trắc nghiệm, đúng sai hay tự luận, đơn hay nhóm). Chuyển toàn bộ ký tự thành chữ thuần túy. Trích xuất chính xác các công thức toán/lý/hóa sang mã LaTeX nằm trong cặp dấu $. Nếu ảnh chứa cả đề bài lẫn lời giải mẫu, hãy tách chúng ra theo cấu trúc JSON gồm các trường: 'content' (đề bài) và 'suggested_solution' (lời giải). Chỉ trả về nội dung text/JSON kết quả, không giải thích gì thêm."

- Xử lý phản hồi từ API ở Frontend, tự động phân tách dữ liệu và điền (Auto-fill) vào các ô tương ứng trên Form động để người dùng kiểm tra lại.

### Giai đoạn 4: Quản lý Ngân hàng và Hiển thị Đề thi
- Viết hàm đồng bộ dữ liệu để đóng gói Object câu hỏi (Đơn/Nhóm) kèm link ảnh minh họa gửi lên Firestore Database.

- Phát triển trang `/dashboard` hiển thị tổng quan ngân hàng câu hỏi.

- Thiết kế thanh Sidebar chứa bộ lọc thông minh (Lọc theo Môn học, Khối lớp, Kỳ thi, Năm học và Định dạng câu hỏi Đơn/Nhóm).

- Xây dựng component `QuestionPreview.jsx`: Sử dụng KaTeX để render mượt mà các đoạn mã toán học dạng `$ ... $` ra màn hình. Thiết kế thêm nút "Xem lời giải chi tiết" ẩn/hiện linh hoạt đối với các câu hỏi Tự luận hoặc câu hỏi có lời giải dài.

### Giai đoạn 5: Hoàn thiện & Tối ưu Hệ thống
- Kiểm thử kỹ lưỡng các kịch bản: Số hóa đề đọc hiểu Tiếng Anh (Câu hỏi nhóm), Số hóa đề hình học/đồ thị có hình vẽ minh họa (Cloudinary), Số hóa đề tự luận Toán dài.

- Viết hàm Regex xử lý chuỗi ở API Route để làm sạch các ký tự bao bọc mã markdown (như ` ```json ` hoặc ` ```text `) do AI trả về trước khi xử lý ở Frontend.

- Thêm hiệu ứng Skeleton loading khi tải danh sách ngân hàng đề và các hộp thoại Toast thông báo trạng thái trực quan để tối ưu trải nghiệm người dùng (UX).