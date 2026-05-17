<div align="center">

# 📚 Exam Bank System — Hệ Thống Ngân Hàng Câu Hỏi

**Choose your language / Chọn ngôn ngữ:**

[![🇻🇳 Tiếng Việt](#-phiên-bản-tiếng-việt)](##-phiên-bản-tiếng-việt) &nbsp;|&nbsp; [![🇬🇧 English](#-english-version)](#-english-version)

</div>

---

## 🇻🇳 Phiên Bản Tiếng Việt

> Ứng dụng web Full-stack chuyên nghiệp giúp tự động hóa quy trình số hóa và soạn thảo đề thi, tích hợp AI nhận diện ảnh (OCR) và hỗ trợ đa dạng loại câu hỏi.

### Công Nghệ Sử Dụng

| Lớp | Công nghệ |
|---|---|
| **Framework** | Next.js 15+ (App Router) — Full-stack với API Routes |
| **UI / Styling** | TailwindCSS + shadcn/ui (Radix UI primitives) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI / OCR** | Google Gemini 2.5 Flash (Vision) |
| **Lưu trữ ảnh** | Cloudinary / Firebase Storage _(planned)_ |

### Cấu Trúc Thư Mục

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
│   │   ├── MultipleChoiceForm.jsx← Form trắc nghiệm (A/B/C/D + màu accent + upload ảnh)
│   │   ├── TrueFalseForm.jsx     ← Form đúng/sai (mệnh đề động + upload ảnh)
│   │   └── EssayForm.jsx         ← Form tự luận
│   │
│   ├── shared/                   ← Components dùng chung
│   │   ├── ThemeToggle.jsx       ← Nút chuyển Dark/Light mode
│   │   └── theme-provider.jsx    ← Context provider cho next-themes
│   │
│   └── ui/                       ← shadcn/ui components (tùy chỉnh)
│       ├── select.tsx            ← Custom Select: check icon trái, backdrop-blur
│       ├── input.tsx             ← Input chuẩn h-10 (đồng bộ với Select)
│       └── ...
│
├── lib/
│   └── firebase.js               ← Cấu hình Firebase Client SDK
│
├── .env.local                    ← API Keys (không commit)
└── README.md
```

### Tính Năng Đã Hoàn Thành

**Layout & Điều hướng**
- [x] Header sticky với logo, toggle sidebar và chuyển đổi theme
- [x] Sidebar responsive: thu gọn (icon-only) trên desktop, overlay trên mobile
- [x] Footer với thông tin thương hiệu và liên kết liên hệ
- [x] Dark / Light mode toàn ứng dụng

**Trang Soạn Thảo Đề Thi**
- [x] Cấu hình đề thi: Tiêu đề, Năm học, Cấp học, Môn học, Tỉnh thành, Thời gian
- [x] Quản lý danh sách câu hỏi: thêm, xóa, thu gọn/mở rộng
- [x] Nút chèn câu hỏi duy nhất ở cuối danh sách

**Form Câu Hỏi**
- [x] **Trắc nghiệm**: 4 đáp án A/B/C/D với màu accent riêng + upload ảnh từng đáp án
- [x] **Đúng / Sai**: Mệnh đề động + toggle ✓/✗ + màu nền theo trạng thái + upload ảnh
- [x] **Tự luận**: Ô nhập hướng dẫn chấm / lời giải gợi ý
- [x] OCR bằng AI: Dán ảnh → Gemini Vision → Auto-fill nội dung
- [x] Upload ảnh minh họa cho đề bài và đáp án

**UI/UX**
- [x] Custom Select/Dropdown: check icon bên trái, backdrop-blur, rounded-xl
- [x] Chiều cao field đồng nhất: `Input h-10 = SelectTrigger h-10`
- [x] Padding nội dung thoáng trong các ô đáp án/mệnh đề

### Cài Đặt & Chạy

```bash
# Clone repository
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Tạo file `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Mô Hình Dữ Liệu (Firestore)

<details>
<summary><b>Trắc nghiệm</b></summary>

```json
{
  "id": "q_001",
  "type": "multiple_choice",
  "content": "Cho hàm số có đồ thị như hình vẽ. Tìm số nghiệm của $f(x) = 0$.",
  "image": "data:image/png;base64,...",
  "options": ["1", "2", "3", "4"],
  "options_images": ["", "", "data:image/png;base64,...", ""],
  "correct_answer": "C",
  "answer_image": null
}
```
</details>

<details>
<summary><b>Đúng / Sai</b></summary>

```json
{
  "id": "q_002",
  "type": "true_false",
  "content": "Xác định tính đúng/sai của các mệnh đề:",
  "statements": [
    { "text": "Trung bình cộng là 7.5", "correct": true, "image": "" },
    { "text": "Phương sai là 4", "correct": false, "image": "" }
  ],
  "correct_answer": "Đúng, Sai"
}
```
</details>

<details>
<summary><b>Tự luận</b></summary>

```json
{
  "id": "q_003",
  "type": "essay",
  "content": "Chứng minh tổng các góc trong một tam giác bằng 180°.",
  "suggested_solution": "Vẽ đường thẳng d song song với BC đi qua A...",
  "correct_answer": ""
}
```
</details>

### Lộ Trình Phát Triển

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| **1 — Nền móng** | Next.js + TailwindCSS + shadcn/ui + Firebase + Dark/Light mode | ✅ Hoàn thành |
| **2 — Soạn thảo** | Form động 3 loại câu + OCR Gemini + Upload ảnh per-option | ✅ Hoàn thành |
| **3 — Backend** | Lưu Firestore + Cloud Storage + Firebase Auth | 🔄 Đang phát triển |
| **4 — Ngân hàng** | Dashboard + bộ lọc + QuestionPreview + KaTeX | 📋 Kế hoạch |
| **5 — Tối ưu** | Skeleton loading + Toast + MathLive + Kiểm thử E2E | 📋 Kế hoạch |

---

## 🇬🇧 English Version

> A professional Full-stack web application for automating exam digitization and question management, with AI-powered image recognition (OCR) supporting multiple question types.

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router) — Full-stack with API Routes |
| **UI / Styling** | TailwindCSS + shadcn/ui (Radix UI primitives) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI / OCR** | Google Gemini 2.5 Flash (Vision) |
| **Image Storage** | Cloudinary / Firebase Storage _(planned)_ |

### Project Structure

```text
exam-bank-system/
├── app/
│   ├── api/
│   │   └── ocr/
│   │       └── route.js          ← API Route: receives Base64 image, calls Gemini, returns JSON
│   ├── create-question/
│   │   └── page.js               ← Exam editor page (main feature)
│   ├── globals.css               ← CSS Variables for Dark/Light theme
│   ├── layout.tsx                ← Root layout
│   └── page.tsx                  ← Home page
│
├── components/
│   ├── layout/                   ← App shell components
│   │   ├── AppLayout.jsx         ← Wrapper: Header + Sidebar + main content
│   │   ├── Header.jsx            ← Sticky header (logo, menu toggle, theme switcher)
│   │   ├── Sidebar.jsx           ← Left navigation (collapsible, responsive)
│   │   └── Footer.jsx            ← Footer
│   │
│   ├── question/                 ← Question input forms
│   │   ├── QuestionForm.jsx      ← Master form (content + image + answers + result)
│   │   ├── MultipleChoiceForm.jsx← Multiple choice form (A/B/C/D + color accent + per-option image)
│   │   ├── TrueFalseForm.jsx     ← True/False form (dynamic statements + per-statement image)
│   │   └── EssayForm.jsx         ← Essay form
│   │
│   ├── shared/                   ← Shared components
│   │   ├── ThemeToggle.jsx       ← Dark/Light mode toggle button
│   │   └── theme-provider.jsx    ← next-themes context provider
│   │
│   └── ui/                       ← Customized shadcn/ui components
│       ├── select.tsx            ← Custom Select: left-aligned check icon, backdrop-blur
│       ├── input.tsx             ← Standard Input with h-10 (synced with Select height)
│       └── ...
│
├── lib/
│   └── firebase.js               ← Firebase Client SDK configuration
│
├── .env.local                    ← API Keys (not committed)
└── README.md
```

### Completed Features

**Layout & Navigation**
- [x] Sticky header with logo, sidebar toggle, and theme switcher
- [x] Responsive sidebar: icon-only on desktop, overlay on mobile
- [x] Footer with branding and contact links
- [x] App-wide Dark / Light mode

**Exam Editor Page**
- [x] Exam configuration: Title, Academic Year, Grade, Subject, Province, Duration
- [x] Question list management: add, delete, collapse/expand
- [x] Single insert button at the bottom of the list

**Question Forms**
- [x] **Multiple Choice**: A/B/C/D with unique color accents + per-option image upload
- [x] **True/False**: Dynamic statements + ✓/✗ toggle + colored rows + per-statement image
- [x] **Essay**: Marking guide / suggested solution field
- [x] AI OCR: Paste image → Gemini Vision → Auto-fill content
- [x] Image upload for question content and answer illustrations

**UI/UX**
- [x] Custom Select/Dropdown: left-aligned check icon, backdrop-blur, rounded-xl
- [x] Uniform field height: `Input h-10 = SelectTrigger h-10`
- [x] Comfortable padding inside answer option and statement rows

### Installation & Setup

```bash
# Clone repository
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System

# Install dependencies
npm install

# Start development server
npm run dev
```

Create `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Data Models (Firestore)

<details>
<summary><b>Multiple Choice</b></summary>

```json
{
  "id": "q_001",
  "type": "multiple_choice",
  "content": "Given the graph of a function, find the number of solutions of $f(x) = 0$.",
  "image": "data:image/png;base64,...",
  "options": ["1", "2", "3", "4"],
  "options_images": ["", "", "data:image/png;base64,...", ""],
  "correct_answer": "C",
  "answer_image": null
}
```
</details>

<details>
<summary><b>True / False</b></summary>

```json
{
  "id": "q_002",
  "type": "true_false",
  "content": "Determine whether each statement is True or False:",
  "statements": [
    { "text": "The arithmetic mean is 7.5", "correct": true, "image": "" },
    { "text": "The variance is 4", "correct": false, "image": "" }
  ],
  "correct_answer": "True, False"
}
```
</details>

<details>
<summary><b>Essay</b></summary>

```json
{
  "id": "q_003",
  "type": "essay",
  "content": "Prove that the sum of angles in a triangle equals 180°.",
  "suggested_solution": "Draw a line d through A parallel to BC...",
  "correct_answer": ""
}
```
</details>

### Roadmap

| Phase | Description | Status |
|---|---|---|
| **1 — Foundation** | Next.js + TailwindCSS + shadcn/ui + Firebase + Dark/Light mode | ✅ Done |
| **2 — Editor** | Dynamic forms for 3 question types + Gemini OCR + per-option image upload | ✅ Done |
| **3 — Backend** | Save to Firestore + Cloud Storage + Firebase Auth | 🔄 In Progress |
| **4 — Question Bank** | Dashboard + filters + QuestionPreview + KaTeX render | 📋 Planned |
| **5 — Polish** | Skeleton loading + Toast notifications + MathLive + E2E testing | 📋 Planned |

---

<div align="center">

**Made with ❤️ by [CMTran2005](https://github.com/CMTran2005)**

[📧 cmtran2005@gmail.com](mailto:cmtran2005@gmail.com) &nbsp;|&nbsp; [🐙 GitHub](https://github.com/CMTran2005/Exam-Bank-System)

</div>