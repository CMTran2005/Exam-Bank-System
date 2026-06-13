<div align="center">

<img src="./public/logo.png" alt="Exam Bank Logo" width="120" />

# Exam Bank — Hệ Thống Quản Lý Đề Thi Thông Minh

[![Vercel Deployment](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://exam-bank-system.vercel.app/)

![Version](https://img.shields.io/badge/version-1.3.3-gray)
![Language](https://img.shields.io/badge/JavaScript-96.2%25-fff2b2)
![TypeScript](https://img.shields.io/badge/TypeScript-3.4%25-bbf7d0)
![CSS](https://img.shields.io/badge/CSS-0.4%25-e9d5ff)

**[Tiếng Việt](#vietnamese) | [English](#english)**

</div>

---

<a id="vietnamese"></a>

## Tiếng Việt

### Giới Thiệu

**Exam Bank System** là nền tảng web hiện đại được thiết kế toàn diện cho hệ sinh thái giáo dục bao gồm Giáo viên, Học sinh và Phụ huynh. Hệ thống giúp quản lý bài kiểm tra và câu hỏi một cách thông minh, từ việc tạo đề thi đến chấm bài tự động.

Ứng dụng không chỉ là nơi lưu trữ câu hỏi, mà còn tích hợp các công nghệ tiên tiến nhất: AI (Gemini Vision) và OCR thông minh để tự động số hóa đề thi, hệ thống Flashcards với thuật toán Spaced Repetition, Gamification để tăng tính hứng thú học tập, và hệ thống Anti-Cheat bảo mật tuyệt đối.

### Tính Năng Nổi Bật

#### 1. Cổng Giáo Viên (Teacher Portal) & Trình Soạn Thảo Đề Thi
- **Soạn thảo Thời gian thực (Real-time Collaboration)**: Hỗ trợ nhiều giáo viên cùng lúc tham gia biên soạn chung một đề thi, hiển thị trạng thái trực tuyến của thành viên.
- **Quản lý Câu hỏi Đa Dạng**: Hỗ trợ Trắc nghiệm (Multiple Choice A/B/C/D), Đúng/Sai (True/False với mệnh đề động), Điền khuyết (Fill in the blanks), và Tự luận (Essay). Gồm các câu hỏi đơn lẻ và Grouped Questions.
- **AI Tự Động Hóa (AI Builder & OCR)**: 
  - *AI Prompt*: Khởi tạo câu hỏi tự động từ yêu cầu văn bản của giáo viên.
  - *AI OCR*: Dán hình ảnh trực tiếp -> Gemini 2.5 Flash phân tích cấu trúc -> Tự động bóc tách thành nhiều câu hỏi và điền vào form.
- **Toán Học Trực Quan**: Tích hợp MathLive để gõ công thức như Word và KaTeX để hiển thị chuẩn xác (Rendering).
- **Thư Viện & Thùng Rác**: Phân loại theo thư mục, lưu trữ an toàn với cơ chế Soft Delete (Xóa mềm có thể khôi phục) hoặc Hard Delete (Xóa vĩnh viễn).
- **Cộng Đồng Chia Sẻ (Community)**: Chia sẻ đề thi công khai lên thư viện chung. Giáo viên khác có thể tìm kiếm, lọc theo khối lớp/môn học và Nhân bản (Clone) vào tài khoản của mình chỉ với một lần nhấp.

#### 2. Cổng Học Sinh (Student Portal) & Thi Trực Tuyến
- **Hệ Thống Anti-Cheat Tiên Tiến (Chống Gian Lận)**: 
  - Phát hiện hành vi chuyển Tab (Visibility API) hoặc mất Focus cửa sổ.
  - Vô hiệu hóa phím tắt hệ thống: F12, Sao chép (Ctrl+C), Dán (Ctrl+V), In ấn (Ctrl+P), Xem mã nguồn (Ctrl+U).
  - Sử dụng MutationObserver để tự động phát hiện và ẩn/vô hiệu hóa các tiện ích mở rộng (Extensions) cố tình can thiệp vào DOM (như Sider, Grammarly, v.v.).
- **Luyện Tập Tự Do (Practice Mode)**: Cho phép học sinh làm lại các đề thi không giới hạn số lần để rèn luyện kỹ năng, có lưu lại số lần đã thử (Attempts).
- **Gamification (Trò chơi hóa)**: Học sinh kiếm điểm kinh nghiệm, nhận huy hiệu thành tích (Đồng, Bạc, Vàng, Kim Cương...) và đua top trên Bảng xếp hạng (Leaderboard). Bao gồm các hiệu ứng Confetti khi đạt được huy hiệu.

#### 3. Hệ Thống Học Tập Flashcards (Spaced Repetition)
- Tự động trích xuất các câu hỏi học sinh làm sai trong quá trình thi để chuyển thành Flashcards.
- Tích hợp **Thuật toán SM-2 (SuperMemo-2)**: Điều chỉnh thời gian ôn tập lại (Interval) dựa trên đánh giá độ khó của người học, giúp tối ưu hóa trí nhớ dài hạn.

#### 4. Cổng Phụ Huynh (Parent Portal)
- **Theo Dõi Con Em**: Phụ huynh có thể nhập Mã học sinh hoặc Email để liên kết tài khoản con em vào bảng điều khiển.
- **Báo Cáo Học Tập (Analytics)**: Biểu đồ Radar đa chiều đánh giá năng lực của học sinh theo từng môn học và mức độ nhận thức (Nhận biết, Thông hiểu, Áp dụng, Tư duy cấp cao).

#### 5. Bảng Điều Khiển (Dashboard) & Thống Kê
- Theo dõi sự tăng trưởng số lượng câu hỏi và đề thi theo từng tháng.
- Biểu đồ Donut Chart phân bố các loại câu hỏi (Trắc nghiệm, Đúng/Sai, Tự luận).
- Đo lường hiệu suất của hệ thống AI (Tỷ lệ chính xác OCR Confidence Rate, Độ trễ Latency).

#### 6. Kiến Trúc Bảo Mật & Hệ Thống
- **Server-Side Grading**: Toàn bộ logic chấm điểm, đối chiếu đáp án được chuyển từ trình duyệt của học sinh lên Server API (`/api/exams/submit`). Sử dụng **Firebase Admin SDK** để ghi kết quả chấm điểm an toàn.
- **Firestore Security Rules**: Áp dụng các quy tắc bảo mật nghiêm ngặt (`firestore.rules`), chỉ cho phép User đọc dữ liệu thuộc quyền sở hữu của mình, chặn ghi dữ liệu từ phía client.
- **Đồng Bộ Dữ Liệu**: Tự động đồng bộ hóa thông tin hồ sơ chuyên sâu (Học vị, Môn giảng dạy) giữa Local Storage và Firestore.

### Tech Stack

| Lớp | Công Nghệ | Phiên Bản | Ghi chú |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 | Full-stack framework |
| UI Library | shadcn/ui + Radix UI | Latest | ARIA-compliant Components |
| Styling | TailwindCSS | v4 | Utility-first CSS |
| Database | Firebase Firestore | Latest | NoSQL Database |
| Authentication | Firebase Auth | v12.13 | JWT Security |
| AI / OCR | Google Gemini 2.5 Flash | Latest | Vision Analysis |
| Backend API | Firebase Admin SDK | Latest | Server-side Operations |
| Math Rendering | KaTeX | v0.16.47 | High-performance Math |
| Math Editing | MathLive | Integrated | Virtual Math Keyboard |
| State Management | Zustand + SWR | v5.0 | Global State & Data Fetching |
| Icons | Lucide React | v1.16 | SVG Icons |
| Charts | Recharts | v3.8 | Data Visualization |
| Notifications | Sonner | v2.0 | Toast Notifications |
| Documentation | JSDoc | Standard | Code consistency |

### Cấu Trúc Dự Án

```text
exam-bank-system/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # Server API Routes (Grading, AI OCR)
│   ├── (teacher)/                # Teacher Portal: dashboard, create-exam, my-exams...
│   ├── student/                  # Student Portal: exam, practice, flashcards, classes...
│   ├── parent/                   # Parent Portal: children, report...
│   ├── login/                    # Authentication
│   └── layout.jsx                # Root layout
│
├── components/                   # React Components
│   ├── layout/                   # Header, Sidebar (Teacher/Student/Parent), Footer
│   ├── question/                 # Form câu hỏi, Math editor
│   ├── shared/                   # Custom UI, Providers
│   └── ui/                       # shadcn/ui components
│
├── hooks/                        # Custom Hooks (Chia theo Role)
│   ├── teacher/                  # useExams, useCreateExam, useStatistics...
│   ├── student/                  # useClasses, useExam...
│   ├── parent/                   # useChildren, useStudentReport...
│   └── shared/                   # useProvinces, useSubjects, useSettings...
│
├── services/                     # Data Access Layer (JSDoc Standard)
│   ├── classService.js           # Lớp học
│   ├── examService.js            # Đề thi
│   ├── examAttemptService.js     # Lịch sử thi & Chống gian lận
│   ├── flashcardService.js       # Thuật toán Spaced Repetition (SM-2)
│   └── badgeService.js           # Gamification / Huy hiệu
│
├── store/                        # Zustand state stores
├── lib/                          # Utility functions & Constants
├── public/                       # Static assets
└── config/                       # Configuration files
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

Tạo file `.env.local` tại thư mục gốc và điền các khóa API (API Keys):

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

# Firebase Admin SDK (For Server-Side Actions)
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

#### 4. Chạy Development Server

```bash
npm run dev
```

Truy cập: http://localhost:3000

### Lộ Trình Phát Triển

| Phase | Nội Dung | Trạng Thái |
|-------|---------|-----------|
| 1 - Foundation | Next.js 15, TailwindCSS v4, shadcn/ui, Dark Mode | Hoàn thành |
| 2 - Core Editor | Trình soạn thảo + Gemini OCR + MathLive | Hoàn thành |
| 3 - Architecture | Custom Hooks, Services, Classes, Recycle Bin | Hoàn thành |
| 4 - Analytics | Firebase Auth, Profile Sync, Dashboard | Hoàn thành |
| 5 - Collaboration | Zen Mode, Auto-save, Shared Workspace | Hoàn thành |
| 6 - Student Portal| Gamification, Leaderboard, Spaced Repetition (Flashcards) | Hoàn thành |
| 7 - Security | Server-Side Grading, Anti-Cheat, Parent Portal, Firestore Rules | Hoàn thành |
| 8 - Documentation| JSDoc Standardization, Code Cleanup, UI Polish | Hoàn thành |

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

### Best Practices (Tiêu Chuẩn Dự Án)

- **Tách biệt Logic (Separation of Concerns)**: Custom Hooks được chia nhỏ và đóng gói business logic riêng biệt cho từng loại người dùng (Teacher, Student, Parent).
- **Bảo mật (Security)**: Xử lý điểm số thông qua Server Actions / API Route kết hợp với Firebase Admin SDK và Firestore Security Rules.
- **Tài liệu hóa (Documentation)**: Áp dụng chuẩn ghi chú JSDoc (`/** */`) trên toàn bộ tầng `services/` và `hooks/` để tạo Intellisense cho IDE. Inline comments (`//`) đi kèm để giải thích các luồng logic phức tạp.
- **Hiệu suất (Performance)**: Tận dụng cơ chế Caching của `SWR`, xử lý hình ảnh tối ưu, loại bỏ re-render thừa trong React.
- **Khả năng tiếp cận (Accessibility)**: Tuân thủ tiêu chuẩn ARIA của Radix UI cho các modals, dropdowns, forms.

### Hỗ Trợ & Liên Hệ

| Kênh | Liên hệ |
|------|---------|
| Email | [cmtran2005@gmail.com](mailto:cmtran2005@gmail.com) |
| GitHub | [@CMTran2005](https://github.com/CMTran2005) |
| Issues | [Báo cáo lỗi hoặc đề xuất tính năng](https://github.com/CMTran2005/Exam-Bank-System/issues) |

---

<a id="english"></a>

## English

### Overview

**Exam Bank System** is a modern, comprehensive web platform designed for the educational ecosystem including Teachers, Students, and Parents. The system enables seamless management, creation, execution, and grading of exams with intelligent question management.

The application goes beyond simple question storage by integrating cutting-edge technologies: AI (Gemini Vision) and intelligent OCR for automated exam digitization, Spaced Repetition algorithms for enhanced learning, Gamification features to boost engagement, and advanced Anti-Cheat mechanisms for secure assessment.

### Key Features

#### 1. Teacher Portal & Advanced Exam Editor
- **Real-time Collaboration**: Allows multiple educators to co-edit an exam simultaneously with live online presence tracking.
- **Diverse Question Management**: Supports Multiple Choice (A/B/C/D), True/False (with dynamic statements), Fill in the blanks (Short answer), and Essay questions. Includes both standalone and Grouped Questions.
- **AI Automation (AI Builder & OCR)**: 
  - *AI Prompt*: Automatically generate questions from text prompts.
  - *AI OCR*: Paste images directly -> Gemini 2.5 Flash analyzes structure -> Automatically extracts and fills multiple questions into the form.
- **Visual Mathematics**: Integrates MathLive for Word-like formula typing and KaTeX for precise rendering.
- **Library & Recycle Bin**: Categorization via folders, secure storage with Soft Delete (restorable) or Hard Delete capabilities.
- **Exam Community**: Share exams publicly to a shared library. Other educators can search, filter by grade/subject, and Clone/Fork exams into their own accounts with a single click.

#### 2. Student Portal & Online Exams
- **Advanced Anti-Cheat System**: 
  - Detects Tab switching (Visibility API) and window focus loss.
  - Disables system shortcuts: F12, Copy (Ctrl+C), Paste (Ctrl+V), Print (Ctrl+P), View Source (Ctrl+U).
  - Employs MutationObserver to automatically detect and hide/disable DOM-manipulating extensions (e.g., Sider, Grammarly).
- **Practice Mode**: Allows students to retake exams infinitely to hone their skills, logging the number of attempts.
- **Gamification**: Students earn experience points, unlock achievement badges (Bronze, Silver, Gold, Diamond), and compete on real-time class Leaderboards. Includes Confetti effects upon unlocking badges.

#### 3. Flashcards Learning System (Spaced Repetition)
- Automatically extracts incorrectly answered questions from exams to generate Flashcards.
- Integrates the **SM-2 (SuperMemo-2) Algorithm**: Dynamically adjusts the review interval based on the learner's difficulty rating, optimizing long-term memory retention.

#### 4. Parent Portal
- **Child Monitoring**: Parents can input a Student ID or Email to link their child's account to the dashboard.
- **Learning Analytics**: Multi-dimensional Radar charts evaluate student competencies across different subjects and cognitive levels (Remembering, Understanding, Applying, High-Order Thinking).

#### 5. Dashboard & Statistics
- Track monthly growth of questions and exams.
- Donut Charts visualizing the distribution of question types.
- AI System performance metrics (OCR Confidence Rate, Latency).

#### 6. Security Architecture & System
- **Server-Side Grading**: All grading and answer verification logic is moved from the student's browser to a Server API (`/api/exams/submit`). Uses **Firebase Admin SDK** to securely write scores.
- **Firestore Security Rules**: Strict security rules (`firestore.rules`) implemented to restrict data reads to owners only and block sensitive writes from the client.
- **Data Synchronization**: Automatic syncing of in-depth profile information (Academic Degree, Teaching Subjects) between Local Storage and Firestore.

### Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.6 | Full-stack framework |
| UI Library | shadcn/ui + Radix UI | Latest | ARIA-compliant Components |
| Styling | TailwindCSS | v4 | Utility-first CSS |
| Database | Firebase Firestore | Latest | NoSQL Database |
| Authentication | Firebase Auth | v12.13 | JWT Security |
| AI / OCR | Google Gemini 2.5 Flash | Latest | Vision Analysis |
| Backend API | Firebase Admin SDK | Latest | Server-side Operations |
| Math Rendering | KaTeX | v0.16.47 | High-performance Math |
| Math Editing | MathLive | Integrated | Virtual Math Keyboard |
| State Management | Zustand + SWR | v5.0 | Global State & Data Fetching |
| Icons | Lucide React | v1.16 | SVG Icons |
| Charts | Recharts | v3.8 | Data Visualization |
| Notifications | Sonner | v2.0 | Toast Notifications |
| Documentation | JSDoc | Standard | Code consistency |

### Project Structure

```text
exam-bank-system/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # Server API Routes (Grading, AI OCR)
│   ├── (teacher)/                # Teacher Portal: dashboard, create-exam, my-exams...
│   ├── student/                  # Student Portal: exam, practice, flashcards, classes...
│   ├── parent/                   # Parent Portal: children, report...
│   ├── login/                    # Authentication
│   └── layout.jsx                # Root layout
│
├── components/                   # React Components
│   ├── layout/                   # Header, Sidebar (Teacher/Student/Parent), Footer
│   ├── question/                 # Form components, Math editor
│   ├── shared/                   # Custom UI, Providers
│   └── ui/                       # shadcn/ui components
│
├── hooks/                        # Custom Hooks (Segregated by Role)
│   ├── teacher/                  # useExams, useCreateExam, useStatistics...
│   ├── student/                  # useClasses, useExam...
│   ├── parent/                   # useChildren, useStudentReport...
│   └── shared/                   # useProvinces, useSubjects, useSettings...
│
├── services/                     # Data Access Layer (JSDoc Standard)
│   ├── classService.js           # Class management
│   ├── examService.js            # Exam management
│   ├── examAttemptService.js     # Exam history & Anti-cheat logging
│   ├── flashcardService.js       # Spaced Repetition Algorithm (SM-2)
│   └── badgeService.js           # Gamification / Badges
│
├── store/                        # Zustand state stores
├── lib/                          # Utility functions & Constants
├── public/                       # Static assets
└── config/                       # Configuration files
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

Create `.env.local` in the root directory and fill in the API Keys:

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

# Firebase Admin SDK (For Server-Side Actions)
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

#### 4. Run Development Server

```bash
npm run dev
```

Access: http://localhost:3000

### Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 - Foundation | Next.js 15, TailwindCSS v4, shadcn/ui, Dark Mode | Done |
| 2 - Core Editor | Advanced forms + Gemini OCR + MathLive | Done |
| 3 - Architecture | Custom Hooks, Services, Classes, Recycle Bin | Done |
| 4 - Analytics | Firebase Auth, Profile Sync, Dashboard | Done |
| 5 - Collaboration | Zen Mode, Auto-save, Shared Workspace | Done |
| 6 - Student Portal| Gamification, Leaderboard, Flashcards (SM-2) | Done |
| 7 - Security | Server-Side Grading, Anti-Cheat, Parent Portal, Firestore Rules | Done |
| 8 - Documentation| JSDoc Standardization, Code Cleanup, UI Polish | Done |

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

- **Separation of Concerns**: Custom Hooks are modularized to encapsulate business logic specifically for each user role (Teacher, Student, Parent).
- **Security**: Score processing is handled via Server Actions / API Routes paired with the Firebase Admin SDK and Firestore Security Rules.
- **Documentation**: JSDoc standard (`/** */`) is applied across the `services/` and `hooks/` layers to provide IDE Intellisense. Inline comments (`//`) describe complex logical flows.
- **Performance**: Leverages `SWR` caching, optimized image handling, and eliminates unnecessary React re-renders.
- **Accessibility**: Adheres to Radix UI's ARIA standards for modals, dropdowns, and forms.

### Support & Contact

| Channel | Contact |
|---------|---------|
| Email | [cmtran2005@gmail.com](mailto:cmtran2005@gmail.com) |
| GitHub | [@CMTran2005](https://github.com/CMTran2005) |
| Issues | [Report bugs or suggest features](https://github.com/CMTran2005/Exam-Bank-System/issues) |

---

<div align="center">

**Made with love by CMTran2005**

[GitHub](https://github.com/CMTran2005) | [Email](mailto:cmtran2005@gmail.com) | [Repository](https://github.com/CMTran2005/Exam-Bank-System)

</div>
