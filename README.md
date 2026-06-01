# Exam Bank System — Hệ Thống Ngân Hàng Câu Hỏi Thông Minh

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Language](https://img.shields.io/badge/JavaScript-94.4%25-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5%25-blue)

**[Tiếng Việt](#vietnamese) | [English](#english)**

</div>

---

<a id="vietnamese"></a>

## Tiếng Việt

### Giới Thiệu

**Exam Bank System** là nền tảng web hiện đại được thiết kế cho các giáo viên, nhà giáo dục để quản lý, sáng tạo và chia sẻ ngân hàng câu hỏi. 

Ứng dụng tích hợp công nghệ AI (Gemini Vision), OCR thông minh để tự động số hóa đề thi từ hình ảnh, hỗ trợ soạn thảo công thức toán học trực quan, cùng hệ thống quản lý câu hỏi thông minh với các tính năng như Dark Mode, Dashboard thống kê, Thùng Rác và nhiều hơn nữa.

### Tính Năng Nổi Bật

#### 1. Xác Thực & Quản Lý Hồ Sơ

- Đăng nhập / Đăng ký qua Firebase Authentication
- Lưu trữ thông tin hồ sơ chuyên sâu (Học vị, Môn giảng dạy)
- Đồng bộ tự động giữa Local Storage và Firestore

#### 2. Trình Soạn Thảo Đề Thi (Exam Editor)

- Hỗ trợ 3 loại câu hỏi chính:
  - Trắc nghiệm (Multiple Choice A/B/C/D)
  - Đúng/Sai (True/False với các mệnh đề động)
  - Tự luận (Essay questions)
- Câu hỏi đơn và câu hỏi nhóm (Group Questions)
- AI OCR: Dán ảnh → Gemini 2.5 Flash phân tích → Tự động điền văn bản
- Hỗ trợ Toán học: MathLive (gõ công thức) + KaTeX (hiển thị chuẩn)
- Đính kèm hình ảnh minh họa cho từng đáp án/mệnh đề

#### 3. Bảng Điều Khiển & Thống Kê (Dashboard)

- Theo dõi tăng trưởng câu hỏi/đề thi theo tháng
- Biểu đồ phân bố loại câu hỏi (Trắc nghiệm, Đúng/Sai, Tự luận)
- Phân tích độ khó: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
- Đo lường hiệu suất AI (OCR Confidence Rate, Latency)

#### 4. Quản Lý Lớp Học & Học Sinh

- Tạo và quản lý nhiều lớp học
- Theo dõi danh sách học sinh
- Cài đặt tùy chỉnh theo từng lớp

#### 5. Ngân Hàng Câu Hỏi & Tìm Kiếm

- Bộ lọc đa chiều: khối lớp, môn học, độ khó
- Tìm kiếm nhanh theo từ khóa
- Đánh dấu/lưu câu hỏi yêu thích

#### 6. Thùng Rác & Khôi Phục

- Soft Delete: Xóa mềm với khả năng phục hồi
- Khôi phục (Restore) hoặc xóa vĩnh viễn (Hard Delete)
- Lịch sử xóa chi tiết

#### 7. Giao Diện Hiện Đại

- Hỗ trợ Dark Mode / Light Mode toàn bộ
- Responsive design trên tất cả thiết bị
- UI Premium với component tùy chỉnh
- Hiệu suất tối ưu

### Tech Stack

| Lớp | Công Nghệ | Phiên Bản |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | shadcn/ui + Radix UI | Latest |
| Styling | TailwindCSS | v4 |
| Database | Firebase Firestore | Latest |
| Authentication | Firebase Auth | v12.13 |
| AI / OCR | Google Gemini 2.5 Flash | Latest |
| Math Rendering | KaTeX | v0.16.47 |
| Math Editing | MathLive | Integrated |
| State Management | Zustand | v5.0 |
| Icons | Lucide React | v1.16 |
| Charts | Recharts | v3.8 |
| Notifications | Sonner | v2.0 |
| Language | JavaScript/TypeScript | 94.4% / 5% |

### Cấu Trúc Dự Án

```text
exam-bank-system/
├── app/                          # Next.js 15 App Router
│   ├── api/ocr/                 # API Route: Gọi Gemini AI
│   ├── classes/                 # Quản lý lớp học
│   ├── create-question/         # Trình soạn thảo đề thi
│   ├── login/                   # Trang đăng nhập
│   ├── register/                # Trang đăng ký
│   ├── my-exams/                # Quản lý đề thi cá nhân
│   ├── questions/               # Ngân hàng câu hỏi
│   ├── recycle-bin/             # Thùng rác
│   ├── settings/                # Cài đặt hồ sơ
│   ├── statistics/              # Dashboard thống kê
│   └── layout.tsx               # Root layout
│
├── components/                  # React Components
│   ├── layout/                  # Header, Sidebar, Footer
│   ├── question/                # Form câu hỏi
│   ├── shared/                  # Provider, utilities
│   └── ui/                      # shadcn/ui components
│
├── context/
│   └── AuthContext.jsx          # Global auth state
│
├── hooks/                       # Custom Hooks (Business Logic)
│   ├── useClasses.js
│   ├── useCreateExam.js
│   ├── useQuestionForm.js
│   ├── useStatistics.js
│   └── ...
│
├── services/                    # Data Access Layer
│   ├── classService.js
│   ├── examService.js
│   └── teacherService.js
│
├── store/                       # Zustand state stores
├── lib/                         # Utility functions
├── public/                      # Static assets
└── config/                      # Configuration files
```

### Cài Đặt & Chạy

#### 1. Clone Repository

```bash
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System
```

#### 2. Cài Đặt Dependencies

```bash
npm install
```

#### 3. Tạo File Environment

Tạo file `.env.local` tại thư mục gốc:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 4. Chạy Development Server

```bash
npm run dev
```

Truy cập: http://localhost:3000

#### 5. Build Production

```bash
npm run build
npm start
```

### Lộ Trình Phát Triển

| Phase | Nội Dung | Trạng Thái |
|-------|---------|-----------|
| 1 - Foundation | Next.js 15, TailwindCSS v4, shadcn/ui, Dark Mode | Hoàn thành |
| 2 - Core Editor | Trình soạn thảo + Gemini OCR + MathLive | Hoàn thành |
| 3 - Architecture | Custom Hooks, Services, Classes, Recycle Bin | Hoàn thành |
| 4 - Analytics | Firebase Auth, Profile Sync, Dashboard | Hoàn thành |
| 5 - Collaboration | Zen Mode, Auto-save, Shared Workspace | Đang phát triển |

### Các Lệnh Có Sẵn

```bash
# Development
npm run dev              # Chạy server dev

# Production
npm run build            # Build dự án
npm start                # Chạy production server

# Linting
npm run lint             # Kiểm tra code quality
```

### Best Practices

- Tách biệt Logic: Custom Hooks riêng cho từng feature
- Bảo mật: Firebase Auth + Firestore security rules
- Hiệu suất: SSR, Image optimization, Code splitting
- Responsive: Mobile-first design
- Accessibility: Radix UI components (ARIA compliant)

### Hỗ Trợ & Liên Hệ

- Email: cmtran2005@gmail.com
- GitHub: https://github.com/CMTran2005
- Issues: https://github.com/CMTran2005/Exam-Bank-System/issues

---

<a id="english"></a>

## English

### Overview

**Exam Bank System** is a modern web platform designed for educators and teachers to manage, create, and share question banks. 

The application integrates AI technology (Gemini Vision) and intelligent OCR to automatically digitize exams from images, supports visual mathematical formula editing, along with an intelligent question management system featuring Dark Mode, analytics dashboard, recycle bin, and much more.

### Key Features

#### 1. Authentication & Profile Management

- Login / Registration via Firebase Authentication
- Store detailed profile information (Academic Degree, Teaching Subject)
- Auto-sync between Local Storage and Firestore

#### 2. Advanced Exam Editor

- Support for 3 main question types:
  - Multiple Choice (A/B/C/D options)
  - True/False (Dynamic statements)
  - Essay (Open-ended questions)
- Single and Group Questions support
- AI OCR: Paste image → Gemini 2.5 Flash analyzes → Auto-fill text
- Math Support: MathLive (visual editor) + KaTeX (precise rendering)
- Image attachments for each option/statement

#### 3. Dashboard & Analytics

- Monthly growth tracking (questions and exams)
- Question type distribution charts
- Difficulty level analysis (Remembering, Understanding, Applying, High-Order)
- AI Performance metrics (OCR Confidence, Latency)

#### 4. Class Management

- Create and manage multiple classes
- Track student enrollment
- Class-specific customization

#### 5. Question Bank & Search

- Multi-dimensional filters (grade, subject, difficulty)
- Fast keyword search
- Favorite marking system

#### 6. Recycle Bin & Recovery

- Soft Delete: Safe removal with restore capability
- Full restore or permanent deletion
- Detailed deletion history

#### 7. Modern UI

- Dark Mode / Light Mode support
- Fully responsive design
- Premium custom components
- Optimized performance

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | shadcn/ui + Radix UI | Latest |
| Styling | TailwindCSS | v4 |
| Database | Firebase Firestore | Latest |
| Authentication | Firebase Auth | v12.13 |
| AI / OCR | Google Gemini 2.5 Flash | Latest |
| Math Rendering | KaTeX | v0.16.47 |
| Math Editing | MathLive | Integrated |
| State Management | Zustand | v5.0 |
| Icons | Lucide React | v1.16 |
| Charts | Recharts | v3.8 |
| Notifications | Sonner | v2.0 |
| Language | JavaScript/TypeScript | 94.4% / 5% |

### Project Structure

```text
exam-bank-system/
├── app/                         # Next.js 15 App Router
│   ├── api/ocr/                # API Route: Gemini AI integration
│   ├── classes/                # Class management
│   ├── create-question/        # Exam editor
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── my-exams/               # Personal exam management
│   ├── questions/              # Question bank
│   ├── recycle-bin/            # Trash/recovery
│   ├── settings/               # Profile settings
│   ├── statistics/             # Analytics dashboard
│   └── layout.tsx              # Root layout
│
├── components/                 # React Components
│   ├── layout/                 # Header, Sidebar, Footer
│   ├── question/               # Question forms
│   ├── shared/                 # Providers, utilities
│   └── ui/                     # shadcn/ui components
│
├── context/
│   └── AuthContext.jsx         # Global auth state
│
├── hooks/                      # Custom Hooks (Business Logic)
│   ├── useClasses.js
│   ├── useCreateExam.js
│   ├── useQuestionForm.js
│   ├── useStatistics.js
│   └── ...
│
├── services/                   # Data Access Layer
│   ├── classService.js
│   ├── examService.js
│   └── teacherService.js
│
├── store/                      # Zustand state stores
├── lib/                        # Utility functions
├── public/                     # Static assets
└── config/                     # Configuration files
```

### Installation & Setup

#### 1. Clone Repository

```bash
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Create Environment File

Create `.env.local` in the root directory:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 4. Run Development Server

```bash
npm run dev
```

Access: http://localhost:3000

#### 5. Build for Production

```bash
npm run build
npm start
```

### Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 - Foundation | Next.js 15, TailwindCSS v4, shadcn/ui, Dark Mode | Done |
| 2 - Core Editor | Advanced forms + Gemini OCR + MathLive | Done |
| 3 - Architecture | Custom Hooks, Services, Classes, Recycle Bin | Done |
| 4 - Analytics | Firebase Auth, Profile Sync, Dashboard | Done |
| 5 - Collaboration | Zen Mode, Auto-save, Shared Workspace | In Progress |

### Available Commands

```bash
# Development
npm run dev              # Start development server

# Production
npm run build            # Build project
npm start                # Start production server

# Quality
npm run lint             # Check code quality
```

### Best Practices

- Separation of Concerns: Custom Hooks isolate business logic
- Security: Firebase Auth + Firestore security rules
- Performance: SSR, Image optimization, Code splitting
- Responsive: Mobile-first approach
- Accessibility: Radix UI components (ARIA-compliant)

### Support & Contact

- Email: cmtran2005@gmail.com
- GitHub: https://github.com/CMTran2005
- Issues: https://github.com/CMTran2005/Exam-Bank-System/issues

---

<div align="center">

**Made with love by CMTran2005**

https://github.com/CMTran2005 | cmtran2005@gmail.com | https://github.com/CMTran2005/Exam-Bank-System

</div>
