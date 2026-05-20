<div align="center">

# Exam Bank System — Hệ Thống Ngân Hàng Câu Hỏi

**Language / Ngôn Ngữ:** 
[Tiếng Việt](#vietnamese) | [English](#english)

</div>

---

<a id="vietnamese"></a>

## Tiếng Việt

> Ứng dụng web Full-stack chuyên nghiệp giúp quản lý ngân hàng câu hỏi, lớp học và tự động hóa quy trình số hóa đề thi. Tích hợp AI nhận diện ảnh (OCR) và trình soạn thảo Toán học chuyên sâu.

### Công Nghệ Sử Dụng

| Lớp | Công nghệ |
|---|---|
| **Framework** | Next.js 15+ (App Router) — Full-stack với API Routes |
| **UI / Styling** | TailwindCSS v4 + shadcn/ui (Radix UI) |
| **Database & Caching** | Firebase Firestore + Local Storage Sync |
| **Auth** | Firebase Authentication |
| **AI / OCR** | Google Gemini 2.5 Flash (Vision) |
| **Rich Text & Math** | MathLive + KaTeX |

### Cấu Trúc Thư Mục Mới (Feature-based Architecture)

Hệ thống đã được tái cấu trúc (refactoring) theo hướng module hóa bằng Custom Hooks để tách biệt Business Logic và UI.

```text
exam-bank-system/
├── app/
│   ├── api/ocr/            ← API Route: Gọi Gemini AI
│   ├── classes/            ← Quản lý Lớp học
│   ├── create-question/    ← Soạn thảo Đề thi (Rich Text + Math)
│   ├── login/ & register/  ← Xác thực người dùng (Auth)
│   ├── my-exams/           ← Quản lý đề thi cá nhân
│   ├── questions/          ← Ngân hàng câu hỏi (Lọc, tìm kiếm)
│   ├── recycle-bin/        ← Thùng rác (Khôi phục dữ liệu)
│   ├── settings/           ← Cài đặt hồ sơ & tùy chọn ứng dụng
│   └── statistics/         ← Dashboard thống kê phân tích dữ liệu
│
├── components/
│   ├── layout/             ← Header, Sidebar, Footer, Layout vỏ
│   ├── question/           ← Form Câu hỏi (Đơn/Nhóm, Trắc nghiệm, Đúng/Sai, Tự luận)
│   ├── shared/             ← ThemeToggle, Context providers
│   └── ui/                 ← Component shadcn/ui
│
├── context/
│   └── AuthContext.jsx     ← Quản lý State đăng nhập toàn cục
│
├── hooks/                  ← Tách biệt toàn bộ Business Logic
│   ├── useClasses.js
│   ├── useCreateExam.js
│   ├── useQuestionForm.js
│   ├── useStatistics.js
│   └── ...
│
├── services/               ← Data Access Layer (Tương tác Firebase)
│   ├── classService.js
│   ├── examService.js
│   └── teacherService.js
└── ...
```

### Tính Năng Nổi Bật

**1. Xác thực & Hồ sơ (Authentication & Profile)**
- Đăng nhập / Đăng ký qua Firebase Auth.
- Đồng bộ và lưu trữ thông tin hồ sơ chuyên sâu (Học vị, Môn giảng dạy chính).
- Kiến trúc bền vững với tính năng tự động đồng bộ Local Storage và Firestore.

**2. Quản Lý Đề Thi & Trình Soạn Thảo (Exam Editor)**
- Hỗ trợ câu hỏi Đơn và câu hỏi Nhóm (Group Questions).
- 3 loại hình câu hỏi cốt lõi: Trắc nghiệm (A/B/C/D), Đúng/Sai (Mệnh đề động), Tự luận.
- **AI OCR**: Dán ảnh đề bài → Gemini Vision phân tích → Tự động điền văn bản.
- **Toán Học**: Tích hợp MathLive để gõ công thức trực quan và KaTeX để hiển thị chuẩn xác.
- Đính kèm hình ảnh minh họa cho từng đáp án/mệnh đề.

**3. Bảng Điều Khiển & Thống Kê (Dashboard & Statistics)**
- Theo dõi tốc độ tăng trưởng câu hỏi/đề thi theo từng tháng.
- Thống kê tỷ lệ loại câu hỏi (Trắc nghiệm, Đúng/Sai, Tự luận) qua biểu đồ Donut.
- Phân tích độ khó: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
- Đo lường hiệu suất AI (OCR Confidence) và độ trễ (Latency).

**4. Quản Lý Lớp Học & Học Sinh (Class Management)**
- Giáo viên có thể tạo và quản lý nhiều lớp học.
- Theo dõi số lượng học sinh, cài đặt lớp học.

**5. Thùng Rác & Ngân Hàng Câu Hỏi (Recycle Bin & Question Bank)**
- Thùng rác (Soft Delete): Lưu trữ các đề thi/câu hỏi đã xóa, cho phép phục hồi (Restore) hoặc xóa vĩnh viễn (Hard Delete).
- Ngân hàng câu hỏi: Bộ lọc đa chiều giúp tìm kiếm câu hỏi dễ dàng theo khối lớp, môn học, độ khó.

**6. Giao Diện & Trải Nghiệm (UI/UX)**
- Giao diện Premium, responsive với Dark/Light mode toàn diện.
- Custom Component đẹp mắt (Select, Input) đồng bộ chiều cao và thiết kế.
- Tách biệt UI và Logic giúp ứng dụng mượt mà, dễ bảo trì.

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

### Lộ Trình Phát Triển Hiện Tại

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| **1 — Nền móng & UI** | Next.js 15, Tailwind v4, shadcn, Dark Mode | Hoàn thành |
| **2 — Soạn thảo Core** | Editor đa dạng + Gemini OCR + MathLive | Hoàn thành |
| **3 — Kiến Trúc Tách Rời** | Custom hooks, Services, Tính năng Lớp học, Thùng rác | Hoàn thành |
| **4 — Dashboard & Auth** | Firebase Auth, Sync Profile, Thống kê trực quan | Hoàn thành |
| **5 — Tối ưu & Collaboration** | Zen mode, Auto-save, Shared Workspace | Đang phát triển |

---

<a id="english"></a>

## English

> A professional Full-stack web application designed for educators to manage question banks, classes, and automate exam digitization. Features AI-powered OCR and advanced Math editing capabilities.

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router) — Full-stack with API Routes |
| **UI / Styling** | TailwindCSS v4 + shadcn/ui (Radix UI) |
| **Database & Caching**| Firebase Firestore + Local Storage Sync |
| **Auth** | Firebase Authentication |
| **AI / OCR** | Google Gemini 2.5 Flash (Vision) |
| **Rich Text & Math** | MathLive + KaTeX |

### Modular Project Structure

The project has been refactored into a feature-based architecture utilizing Custom Hooks to decouple Business Logic from the UI.

```text
exam-bank-system/
├── app/
│   ├── api/ocr/            ← API Route: Gemini AI invocation
│   ├── classes/            ← Class Management
│   ├── create-question/    ← Exam Editor (Rich Text + Math)
│   ├── login/ & register/  ← Authentication flows
│   ├── my-exams/           ← Personal Exam Management
│   ├── questions/          ← Question Bank (Filtering & Search)
│   ├── recycle-bin/        ← Soft Delete & Data Restoration
│   ├── settings/           ← User Profile & App Preferences
│   └── statistics/         ← Analytical Dashboard
│
├── components/
│   ├── layout/             ← App shell (Header, Sidebar, Footer)
│   ├── question/           ← Question Forms (Single/Group, Multiple Choice, T/F, Essay)
│   ├── shared/             ← Theme providers, utility components
│   └── ui/                 ← shadcn/ui generic components
│
├── context/
│   └── AuthContext.jsx     ← Global Authentication State
│
├── hooks/                  ← Business Logic isolation
│   ├── useClasses.js
│   ├── useCreateExam.js
│   ├── useQuestionForm.js
│   ├── useStatistics.js
│   └── ...
│
├── services/               ← Data Access Layer (Firebase interaction)
│   ├── classService.js
│   ├── examService.js
│   └── teacherService.js
└── ...
```

### Key Features

**1. Authentication & User Profiles**
- Secure Login / Registration powered by Firebase Auth.
- Persistent synchronization of professional profile data (e.g., Academic Degree, Teaching Subject).
- Robust state hydration between Local Storage and Firestore.

**2. Advanced Exam Editor**
- Support for both Single and Group Questions.
- Three core types: Multiple Choice (A/B/C/D), True/False (Dynamic statements), and Essay.
- **AI OCR**: Paste an image → Gemini Vision processes it → Content is auto-filled.
- **Mathematics**: Integrated MathLive for visual equation editing and KaTeX for precise rendering.
- Per-option and per-statement image upload support.

**3. Analytics Dashboard**
- Monitor monthly growth of exams and questions.
- Donut charts visualizing question type distribution (MC, T/F, Essay).
- Cognitive level analysis: Recognizing, Understanding, Applying, High Applying.
- AI performance metrics (OCR Confidence rate & Latency).

**4. Class Management**
- Empower teachers to create and orchestrate multiple classes.
- Track student enrollment and configure class-specific settings.

**5. Recycle Bin & Question Bank**
- Soft Deletion: Safely remove exams/questions with full restore capabilities or permanent deletion.
- Question Bank: Multi-dimensional filters to easily search by grade, subject, and difficulty.

**6. Premium UI/UX**
- Responsive, polished design featuring full Dark/Light mode support.
- Highly consistent custom components ensuring a seamless user experience.
- Clean separation of UI and logic for optimal maintainability and performance.

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

### Current Roadmap

| Phase | Description | Status |
|---|---|---|
| **1 — Foundation & UI** | Next.js 15, Tailwind v4, shadcn, Dark Mode | Done |
| **2 — Core Editor** | Versatile forms + Gemini OCR + MathLive | Done |
| **3 — Modular Refactor** | Custom hooks, Services, Classes, Recycle Bin | Done |
| **4 — Dashboard & Auth** | Firebase Auth, Profile Sync, Analytics | Done |
| **5 — Collaboration** | Zen mode, Auto-save, Shared Workspace | In Progress |

---

<div align="center">

**Made by [CMTran2005](https://github.com/CMTran2005)**

[cmtran2005@gmail.com](mailto:cmtran2005@gmail.com) &nbsp;|&nbsp; [GitHub](https://github.com/CMTran2005/Exam-Bank-System)

</div>
