# Hệ Thống Số Hóa & Quản Lý Ngân Hàng Câu Hỏi

> **Exam Bank System** — Ứng dụng web Full-stack chuyên nghiệp giúp tự động hóa quy trình số hóa và soạn thảo đề thi, tích hợp AI nhận diện ảnh (OCR) và hỗ trợ đa dạng loại câu hỏi.

---

## Công Nghệ Sử Dụng

| Lớp | Công nghệ |
|---|---|
| **Framework** | Next.js 15+ (App Router) — Full-stack với API Routes |
| **UI / Styling** | TailwindCSS + shadcn/ui (Radix UI primitives) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI / OCR** | Google Gemini 2.5 Flash (Vision) |
| **Lưu trữ ảnh** | Cloudinary / Firebase Storage _(planned)_ |

---

## Cấu Trúc Thư Mục

```text
exam-bank-system/
├── app/
│   ├── api/
│   │   └── ocr/
│   │       └── route.js          ← API Route: nhận ảnh Base64, gọi Gemini AI, trả JSON
│   ├── create-question/
│   │   └── page.js               ← Trang soạn thảo đề thi (main feature)
│   ├── globals.css               ← CSS Variables cho Dark/Light theme
│   ├── layout.tsx                ← Root layout
│   └── page.tsx                  ← Trang chủ
│
├── components/
│   ├── layout/                   ← Các thành phần khung giao diện
│   │   ├── AppLayout.jsx         ← Wrapper: Header + Sidebar + main content
│   │   ├── Header.jsx            ← Thanh tiêu đề sticky (logo, menu toggle, theme)
│   │   ├── Sidebar.jsx           ← Thanh điều hướng trái (thu/mở, responsive)
│   │   └── Footer.jsx            ← Chân trang
│   │
│   ├── question/                 ← Các form nhập liệu câu hỏi
│   │   ├── QuestionForm.jsx      ← Form tổng hợp (nội dung + ảnh + đáp án + kết quả)
│   │   ├── MultipleChoiceForm.jsx← Form trắc nghiệm (A/B/C/D + màu accent + upload ảnh/đáp án)
│   │   ├── TrueFalseForm.jsx     ← Form đúng/sai (danh sách mệnh đề + upload ảnh/mệnh đề)
│   │   └── EssayForm.jsx         ← Form tự luận
│   │
│   ├── shared/                   ← Components dùng chung
│   │   ├── ThemeToggle.jsx       ← Nút chuyển Dark/Light mode
│   │   └── theme-provider.jsx    ← Context provider cho next-themes
│   │
│   └── ui/                       ← shadcn/ui components (tùy chỉnh)
│       ├── select.tsx            ← Custom Select: check icon trái, backdrop-blur, rounded-xl
│       ├── input.tsx             ← Input chuẩn h-10 (đồng bộ chiều cao với Select)
│       └── ...                   ← button, card, textarea, radio-group, ...
│
├── lib/
│   └── firebase.js               ← Cấu hình Firebase Client SDK
│
├── .env.local                    ← API Keys (không commit)
├── .gitignore
├── components.json               ← Cấu hình shadcn/ui
├── next.config.ts
├── package.json
└── README.md
```

---

## Tính Năng Đã Hoàn Thành

### Layout & Navigation
- [x] **Header** sticky với logo, nút toggle sidebar và ThemeToggle
- [x] **Sidebar** responsive: thu gọn (icon-only) trên desktop, overlay trên mobile
- [x] **Footer** với thông tin thương hiệu và liên kết liên hệ
- [x] **Dark / Light mode** toàn bộ ứng dụng qua `next-themes`

### Trang Soạn Thảo Đề Thi (`/create-question`)
- [x] **Cấu hình đề thi**: Tiêu đề, Năm học, Cấp học/Lớp, Môn học (phụ thuộc cấp), Tỉnh thành, Thời gian, Số câu hỏi
- [x] **Quản lý danh sách câu hỏi**: Thêm, xóa, thu gọn/mở rộng từng câu
- [x] **Nút chèn câu** duy nhất ở cuối — luôn thêm vào cuối danh sách, hiển thị số câu tiếp theo chính xác
- [x] **Nút lưu đề thi** ở dưới cùng (đóng gói payload JSON hoàn chỉnh)

### Form Câu Hỏi
- [x] **Trắc nghiệm** (MultipleChoiceForm):
  - 4 đáp án A/B/C/D với màu accent riêng biệt khi được chọn (Blue/Violet/Amber/Emerald)
  - Upload ảnh minh họa riêng cho **từng đáp án**
  - Preview ảnh inline + nút xóa/thay ảnh
- [x] **Đúng / Sai** (TrueFalseForm):
  - Danh sách mệnh đề động (thêm/xóa)
  - Nút toggle ✓/✗ với màu xanh/đỏ tương ứng
  - Upload ảnh minh họa riêng cho **từng mệnh đề**
  - Màu nền hàng thay đổi theo trạng thái Đúng/Sai
- [x] **Tự luận** (EssayForm): Ô nhập hướng dẫn chấm/lời giải gợi ý
- [x] **Ảnh minh họa đề bài**: Upload ảnh cho nội dung câu hỏi (dán từ clipboard hoặc chọn file)
- [x] **OCR bằng AI**: Dán ảnh vào ô nội dung → tự động gửi Gemini Vision → auto-fill đề bài & đáp án
- [x] **Kết quả / Đáp số đúng**: Ô nhập cuối form + ảnh sơ đồ minh họa đáp án

### UI/UX
- [x] **Custom Select/Dropdown**: Check icon bên trái, backdrop-blur, `rounded-xl`, `shadow-xl`
- [x] **Chiều cao field đồng nhất**: Input `h-10` = SelectTrigger `h-10` — căn thẳng hàng pixel-perfect
- [x] **Padding nội dung**: Text trong ô đáp án/mệnh đề có khoảng thụt vào `px-2` thoải mái
- [x] **Responsive**: Mobile-first, Sidebar overlay trên màn hình nhỏ

---

## Cài Đặt & Chạy Dự Án

### Yêu cầu
- Node.js 18+
- npm hoặc yarn

### Cài đặt

```bash
# Clone repo
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System

# Cài dependencies
npm install
```

### Cấu hình biến môi trường

Tạo file `.env.local` tại gốc dự án:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Chạy môi trường phát triển

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

---

## Mô Hình Dữ Liệu (Firestore JSON)

### Câu hỏi Trắc nghiệm

```json
{
  "id": "q_001",
  "type": "multiple_choice",
  "content": "Cho hàm số có đồ thị như hình vẽ. Tìm số nghiệm của $f(x) = 0$.",
  "image": "data:image/png;base64,...",
  "options": ["1", "2", "3", "4"],
  "options_images": ["", "", "data:image/png;base64,...", ""],
  "correct_answer": "C",
  "answer_image": null,
  "metadata": {
    "subject": "Toán học",
    "grade": "12",
    "year": "2025-2026",
    "province": "Hà Nội"
  }
}
```

### Câu hỏi Đúng / Sai

```json
{
  "id": "q_002",
  "type": "true_false",
  "content": "Cho bảng số liệu sau. Xác định tính đúng/sai của các mệnh đề:",
  "image": null,
  "statements": [
    { "text": "Trung bình cộng của dãy số là 7.5", "correct": true, "image": "" },
    { "text": "Phương sai của dãy số là 4", "correct": false, "image": "" }
  ],
  "correct_answer": "Đúng, Sai",
  "answer_image": null
}
```

### Câu hỏi Tự luận

```json
{
  "id": "q_003",
  "type": "essay",
  "content": "Chứng minh rằng tổng các góc trong một tam giác bằng 180°.",
  "image": null,
  "suggested_solution": "Vẽ đường thẳng d song song với BC đi qua A...",
  "correct_answer": "",
  "answer_image": null
}
```

---

## Lộ Trình Phát Triển (Roadmap)

### ✅ Giai đoạn 1 — Nền móng (Hoàn thành)
- Khởi tạo dự án Next.js với TailwindCSS + shadcn/ui
- Cấu hình Firebase, thiết lập `.env.local`
- Xây dựng layout cơ bản (Header, Sidebar, Footer)
- Tích hợp Dark/Light mode

### ✅ Giai đoạn 2 — Giao diện Soạn thảo (Hoàn thành)
- Trang `/create-question` với cấu hình đề thi
- Form động cho 3 loại câu hỏi (Trắc nghiệm, Đúng/Sai, Tự luận)
- Tích hợp OCR: Dán ảnh → Gemini Vision → Auto-fill
- Upload ảnh minh họa per-option và per-statement

### 🔄 Giai đoạn 3 — Tích hợp Backend (Đang phát triển)
- [ ] Lưu đề thi hoàn chỉnh lên Firestore
- [ ] Upload ảnh Base64 lên Cloud Storage (Firebase / Cloudinary)
- [ ] Firebase Authentication (đăng nhập/đăng ký)

### 📋 Giai đoạn 4 — Ngân hàng câu hỏi
- [ ] Trang `/dashboard` hiển thị danh sách đề thi đã lưu
- [ ] Bộ lọc: Môn học, Khối lớp, Năm học, Tỉnh thành, Loại câu hỏi
- [ ] Component `QuestionPreview.jsx` render LaTeX bằng KaTeX

### 📋 Giai đoạn 5 — Tối ưu & Kiểm thử
- [ ] Skeleton loading cho danh sách ngân hàng
- [ ] Toast notification thông báo trạng thái
- [ ] Tích hợp MathLive cho nhập công thức trực quan
- [ ] Kiểm thử E2E đầy đủ các luồng

---

## Đóng Góp

Pull requests và issues luôn được chào đón. Vui lòng mở Issue để thảo luận trước khi thực hiện thay đổi lớn.

---

## Liên Hệ

**Tác giả:** CMTran2005  
**Email:** cmtran2005@gmail.com  
**GitHub:** [CMTran2005/Exam-Bank-System](https://github.com/CMTran2005/Exam-Bank-System)