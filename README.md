<div align="center">

<img src="./public/logo.png" alt="Exam Bank Logo" width="120" />

# Exam Bank — Hệ Thống Quản Lý Đề Thi Thông Minh

[![Vercel Deployment](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://exam-bank-system.vercel.app/)

![Version](https://img.shields.io/badge/version-1.9.1-gray)
![Language](https://img.shields.io/badge/JavaScript-96.5%25-fff2b2)
![TypeScript](https://img.shields.io/badge/TypeScript-3.1%25-bbf7d0)
![CSS](https://img.shields.io/badge/CSS-0.4%25-e9d5ff)

[Tiếng Việt](#tieng-viet) | [English](#english)

</div>

---

<a id="tieng-viet"></a>

## Tiếng Việt

### Giới Thiệu

Exam Bank System là giải pháp quản lý ngân hàng đề thi và tổ chức thi trực tuyến toàn diện, được thiết kế đặc thù cho các cơ sở giáo dục hiện đại. Nền tảng hướng tới việc tối ưu hóa hiệu suất làm việc của Giáo viên, nâng cao trải nghiệm học tập của Học sinh và cung cấp kênh giám sát trực quan cho Phụ huynh. 

Hệ thống kết hợp các công nghệ tiên tiến bao gồm trí tuệ nhân tạo (Gemini 2.5 Flash) để tự động hóa quy trình nhập liệu đề thi thông qua hình ảnh (AI OCR), MathLive và KaTeX phục vụ soạn thảo công thức toán học chuyên nghiệp, cùng với giải pháp chống gian lận đa lớp bảo vệ tính toàn vẹn của kết quả đánh giá. Được xây dựng trên nền tảng Progressive Web App (PWA), ứng dụng đảm bảo hiệu suất mượt mà ngay cả trong điều kiện mạng không ổn định.

### Tính Năng Nổi Bật

#### 1. Cổng Giáo Viên & Trình Soạn Thảo Đề Thi
* Soạn Thảo Thời Gian Thực: Hỗ trợ nhiều giáo viên cùng cộng tác biên soạn trực tiếp trên một đề thi, tự động đồng bộ hóa trạng thái hoạt động và các thay đổi tức thời.
* Quản Lý Loại Câu Hỏi Đa Dạng: Hỗ trợ đầy đủ các dạng câu hỏi bao gồm Trắc nghiệm khách quan, Đúng/Sai, Điền khuyết, Tự luận, Ghép đôi và Sắp xếp. Hỗ trợ tạo câu hỏi đơn lẻ hoặc các nhóm câu hỏi chia sẻ chung ngữ cảnh đọc hiểu.
* Trợ Lý Số Hóa AI OCR: Tận dụng mô hình Gemini 2.5 Flash để bóc tách thông tin từ ảnh chụp đề thi viết tay hoặc bản in, tự động phân tích cấu trúc câu hỏi, đáp án và điền vào biểu mẫu soạn thảo.
* Công Cụ Nhập Liệu Toán Học: Tích hợp MathLive cung cấp bàn phím ảo trực quan giúp nhập công thức toán học nhanh chóng như trên MS Word, hiển thị kết quả sắc nét nhờ KaTeX.
* Đấu Trường Live Quiz: Tổ chức thi trực tiếp theo thời gian thực với sảnh chờ sinh động, bảng xếp hạng realtime, âm thanh hiệu ứng và vinh danh kết quả thi.
* Quản Lý Thư Mục & Thùng Rác: Tổ chức đề thi khoa học theo thư mục phân cấp và môn học. Cơ chế xóa mềm giúp hạn chế rủi ro mất dữ liệu với khả năng khôi phục hoặc xóa vĩnh viễn.

#### 2. Cổng Học Sinh & Thi Trực Tuyến
* Giao Diện Làm Bài Chuyên Nghiệp: Thiết kế giao diện tách biệt tối ưu giữa bộ đếm thời gian, danh sách điều hướng câu hỏi và khung làm bài. Tích hợp công nghệ Text-to-Speech hỗ trợ đọc phát âm câu hỏi.
* Hệ Thống Chống Gian Lận Đa Tầng:
  * Phát hiện chuyển tab hoặc rời khỏi màn hình thi thông qua Page Visibility API.
  * Khóa các tổ hợp phím hệ thống như F12, Ctrl+C (Sao chép), Ctrl+V (Dán), Ctrl+P (In ấn), Ctrl+U (Xem mã nguồn).
  * Ứng dụng MutationObserver nhằm phát hiện và vô hiệu hóa các tiện ích mở rộng can thiệp vào mã nguồn trang web (như Sider, Grammarly).
* Sổ Tay Lỗi Sai & Ôn Luyện: Tự động tổng hợp các câu hỏi trả lời sai để học sinh luyện tập lại không giới hạn số lần, giúp khắc phục lỗ hổng kiến thức hiệu quả.
* Gamification & Đấu Giải: Thúc đẩy động lực học tập bằng cơ chế tích lũy điểm kinh nghiệm (XP), thăng hạng Leagues và hệ thống huy hiệu danh hiệu (Đồng, Bạc, Vàng, Kim Cương).

#### 3. Học Tập Flashcards (Spaced Repetition)
* Hệ thống tự động chuyển đổi các câu hỏi làm sai từ sổ tay lỗi sai thành các thẻ ghi nhớ (Flashcards).
* Tích hợp thuật toán lặp lại ngắt quãng SM-2 (SuperMemo-2) để tự động điều chỉnh khoảng thời gian ôn tập lại dựa trên đánh giá mức độ khó của học sinh, giúp củng cố trí nhớ dài hạn hiệu quả.

#### 4. Cổng Phụ Huynh
* Kết Nối Học Sinh: Phụ huynh dễ dàng liên kết tài khoản của con em mình thông qua Mã học sinh hoặc Email đăng ký.
* Báo Cáo Học Tập Trực Quan: Biểu đồ Radar so sánh năng lực giữa các bài thi chính thức với luyện tập, kết hợp cùng biểu đồ Vùng (Area Chart) phân tích tần suất ôn luyện hàng tuần giúp phụ huynh nắm bắt chính xác tiến trình học tập của con em.

#### 5. Cổng Quản Trị & Bảng Thống Kê
* Quản lý toàn diện tài khoản người dùng, phân quyền truy cập hệ thống.
* Biểu đồ trực quan hóa dữ liệu tăng trưởng đề thi, câu hỏi hàng tháng.
* Thống kê hiệu suất AI OCR bao gồm tỷ lệ chính xác (Confidence Rate) và thời gian phản hồi (Latency).

### Kiến Trúc Tổng Quan

Dự án được xây dựng theo mô hình Next.js App Router kết hợp với hệ sinh thái Firebase. Logic nghiệp vụ được tách biệt rõ ràng thông qua kiến trúc Modular ở Client-side và các dịch vụ bảo mật ở Server-side.

```mermaid
graph TD
    subgraph Giao dien Nguoi dung (Trinh duyet Client)
        TeacherPortal[Cong Giao vien: Soan de, Live Quiz, Thong ke]
        StudentPortal[Cong Hoc sinh: Lam bai, Chong gian lan, Flashcards]
        ParentPortal[Cong Phu huynh: Theo doi tien do, Bieu do]
        AdminPortal[Cong Admin: Quan tri tai khoan]
        ClientStore[Zustand Store & SWR Cache]
    end

    subgraph Tang Xu ly Trung gian (Next.js App Router)
        RouteHandlers[API Routes & Server Actions]
        GradingEngine[Bo cham diem: /api/exams/submit]
        AIEngine[Xu ly AI OCR: Gemini 2.5 Flash]
    end

    subgraph Dich vu Cloud & Persistence
        FirebaseAuth[Firebase Authentication]
        Firestore[(Firebase Firestore - Rules Enforced)]
        Cloudinary[Luu tru anh Cloudinary]
        GCloudVision[Google Cloud Vision API]
    end

    TeacherPortal --> ClientStore
    StudentPortal --> ClientStore
    ParentPortal --> ClientStore
    
    ClientStore --> RouteHandlers
    RouteHandlers --> GradingEngine
    RouteHandlers --> AIEngine
    
    GradingEngine --> FirebaseAdmin[Firebase Admin SDK]
    FirebaseAdmin --> Firestore
    FirebaseAdmin --> FirebaseAuth
    
    AIEngine --> GCloudVision
```

#### Trụ Cột An Toàn Thông Tin
* Server-Side Grading: Để ngăn ngừa các hành vi gian lận điểm số tại client, toàn bộ quá trình so khớp kết quả và tính toán điểm số được xử lý tại API `/api/exams/submit`. Phân hệ này sử dụng Firebase Admin SDK với đặc quyền cao nhất để ghi nhận điểm số trực tiếp vào cơ sở dữ liệu.
* Firestore Security Rules: Áp dụng các quy tắc bảo mật nghiêm ngặt (`firestore.rules`) nhằm giới hạn phạm vi truy xuất dữ liệu. Người dùng chỉ có quyền đọc ghi đối với dữ liệu do chính họ sở hữu hoặc được phân quyền rõ ràng, chặn đứng các thao tác ghi dữ liệu nhạy cảm từ phía client.

#### Kiến Trúc Ngoại Tuyến (Offline-First Capability)
* Sử dụng `@ducanh2912/next-pwa` để cấu hình Service Worker, tự động lưu trữ tài nguyên tĩnh và các hình ảnh từ Firebase Storage vào cache.
* Tích hợp thư viện LocalForage để quản lý dữ liệu trong IndexedDB tại trình duyệt, lưu trữ tạm thời tiến trình làm bài thi để tránh mất dữ liệu khi xảy ra sự cố gián đoạn đường truyền Internet.

### Cấu Hình Môi Trường

Hệ thống yêu cầu các biến môi trường sau để kết nối và vận hành đầy đủ các tính năng. Hãy tạo tệp `.env.local` ở thư mục gốc của dự án:

```env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Storage Settings (Dành cho upload hình ảnh câu hỏi)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

# Firebase Client SDK Configuration (Kết nối Auth và Firestore ở Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration (Chạy Server-side Actions bảo mật)
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

# Google Cloud Vision API Key (Cho quy trình OCR dự phòng nâng cao)
GOOGLE_CLOUD_API_KEY=your_gcp_api_key
```

### Cài Đặt

Thực hiện theo các bước sau để thiết lập môi trường phát triển cục bộ:

1. Clone mã nguồn dự án từ kho lưu trữ:
```bash
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System
```

2. Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```

3. Xác thực cấu hình môi trường: Đảm bảo bạn đã sao chép và nhập đầy đủ các biến môi trường vào tệp `.env.local` theo hướng dẫn cấu hình ở trên.

### Chạy Dự Án

Sử dụng các câu lệnh sau để vận hành hệ thống:

* Khởi chạy môi trường phát triển (Local Development Server):
```bash
npm run dev
```
Sau khi khởi chạy thành công, truy cập ứng dụng qua trình duyệt tại địa chỉ: `http://localhost:3000`

* Biên dịch dự án cho môi trường Production:
```bash
npm run build
```

* Vận hành máy chủ ở môi trường Production:
```bash
npm start
```

* Kiểm tra chất lượng mã nguồn (Linter):
```bash
npm run lint
```

### Cấu Trúc Thư Mục

Dưới đây là sơ đồ cấu trúc các phân hệ chính trong dự án:

```text
exam-bank-system/
├── app/                          # Dẫn hướng Next.js App Router và Server API
│   ├── api/                      # Các API Routes xử lý Server-side (Chấm thi, AI OCR)
│   ├── (teacher)/                # Giao diện Cổng Giáo viên (Soạn đề, quản lý lớp)
│   ├── student/                  # Giao diện Cổng Học sinh (Làm bài, Flashcards, Leagues)
│   ├── parent/                   # Giao diện Cổng Phụ huynh (Xem báo cáo năng lực con em)
│   ├── login/                    # Phân hệ Xác thực & Đăng nhập
│   └── layout.jsx                # Layout gốc của toàn bộ hệ thống
├── components/                   # Kho lưu trữ các React Components dùng chung
│   ├── layout/                   # Bố cục giao diện (Header, Sidebar theo từng vai trò)
│   ├── question/                 # Trình soạn thảo và hiển thị câu hỏi nâng cao
│   ├── teacher/                  # Các thành phần dành riêng cho phân hệ giáo viên
│   ├── student/                  # Các thành phần phục vụ quá trình làm bài của học sinh
│   ├── shared/                   # Các UI Components tùy chỉnh và Context Providers
│   └── ui/                       # Hệ thống UI nguyên bản từ shadcn/ui
├── hooks/                        # Các React Custom Hooks quản lý Business Logic tách biệt
│   ├── teacher/                  # Hook quản lý đề thi, lớp học và phân tích số liệu
│   ├── student/                  # Hook xử lý ca thi, lấy danh sách lớp, gamification
│   ├── parent/                   # Hook liên kết con em và tổng hợp báo cáo năng lực
│   └── shared/                   # Hook tiện ích chung (địa giới, cấu hình hệ thống)
├── services/                     # Lớp Giao tiếp Dữ liệu (Data Access Layer) chuẩn JSDoc
│   ├── classService.js           # Nghiệp vụ quản lý lớp học và thành viên lớp
│   ├── examService.js            # Nghiệp vụ quản lý và phân loại đề thi
│   ├── examAttemptService.js     # Ghi nhận kết quả thi và lịch sử chống gian lận
│   ├── flashcardService.js       # Thuật toán lặp lại ngắt quãng SM-2 cho Flashcards
│   └── badgeService.js           # Nghiệp vụ tính điểm gamification và phân phối huy hiệu
├── store/                        # Quản lý trạng thái toàn cục bằng Zustand Stores
├── lib/                          # Các hàm tiện ích, cấu hình và hằng số dùng chung
├── public/                       # Thư mục chứa tài nguyên tĩnh (Hình ảnh, manifest, v.v.)
└── config/                       # Các tệp cấu hình cho hệ thống
```

### Lộ Trình Phát Triển

Hệ thống được phát triển theo các giai đoạn chiến lược để hoàn thiện tính năng và kiến trúc bảo mật:

| Giai Đoạn | Mô Tả Công Việc | Trạng Thái |
|---|---|---|
| Giai Đoạn 1 | Thiết lập nền tảng Next.js, cấu hình TailwindCSS v4, shadcn/ui và Dark Mode. | Hoàn thành |
| Giai Đoạn 2 | Phát triển lõi soạn thảo câu hỏi đa dạng, tích hợp Gemini OCR và MathLive. | Hoàn thành |
| Giai Đoạn 3 | Tái cấu trúc mã nguồn theo mô hình Modular, tách biệt Hooks, Services và Thùng rác. | Hoàn thành |
| Giai Đoạn 4 | Hoàn thiện Module xác thực Firebase, đồng bộ Profile và Dashboard thống kê. | Hoàn thành |
| Giai Đoạn 5 | Cổng cộng tác thời gian thực, chế độ tập trung (Zen Mode) và tự động lưu. | Hoàn thành |
| Giai Đoạn 6 | Hệ thống Gamification, bảng xếp hạng Leagues và ôn tập Spaced Repetition. | Hoàn thành |
| Giai Đoạn 7 | Tích hợp Server-Side Grading, các giải pháp chống gian lận nâng cao và Cổng Phụ Huynh. | Hoàn thành |
| Giai Đoạn 8 | Chuẩn hóa tài liệu mã nguồn bằng JSDoc, tối ưu hóa hiệu suất và hoàn thiện giao diện. | Hoàn thành |
| Giai Đoạn 9 | Tối ưu hóa chế độ ngoại tuyến nâng cao và đồng bộ hóa ngầm khi trực tuyến trở lại. | Đang phát triển |

### Hướng Dẫn Đóng Góp

Chào đón mọi đóng góp nhằm cải thiện hiệu năng và tính năng của hệ thống. Vui lòng tuân thủ quy trình sau:

1. Phân Nhánh (Branching Strategy):
   * Các tính năng mới: `feature/ten-tinh-nang`
   * Sửa lỗi: `bugfix/ten-loi`
   * Cải thiện hiệu năng hoặc refactor: `refactor/ten-phong-ban`

2. Tiêu Chuẩn Viết Mã (Coding Standards):
   * Mọi hàm, hook và service mới cần được khai báo đầy đủ tài liệu hướng dẫn bằng chuẩn JSDoc.
   * Viết mã rõ ràng, tường minh và khai báo biến dễ hiểu.

3. Quy Trình Gửi Yêu Cầu Đóng Góp (Pull Request):
   * Đảm bảo mã nguồn đã vượt qua kiểm tra chất lượng bằng lệnh `npm run lint`.
   * Gửi Pull Request mô tả chi tiết các thay đổi, kèm theo lý do và ảnh chụp kết quả kiểm nghiệm nếu có.

### Giấy Phép

Dự án được phân phối và bảo hộ theo Giấy phép MIT. Xem chi tiết tại tệp `LICENSE` đi kèm trong mã nguồn.

---

<a id="english"></a>

## English

### Introduction

Exam Bank System is a comprehensive online question bank management and examination platform engineered for modern educational institutions. The platform is designed to optimize educators workflows, enhance students test-taking experience, and provide parents with intuitive insights into their children academic progress.

The system integrates advanced technologies including Large Language Models (Gemini 2.5 Flash) for automated question digitization from paper sheets (AI OCR), MathLive and KaTeX for professional-grade virtual mathematical input, and a multi-layered browser-level anti-cheat system to protect the integrity of educational assessments. Built as a Progressive Web App (PWA), the application delivers resilient performance and responsive operations even under constrained network conditions.

### Key Features

#### 1. Teacher Portal & Exam Editor
* Real-time Collaboration: Enables multiple educators to work synchronously on the same exam sheet, with live presence indicators and immediate state synchronization.
* Diverse Question Modalities: Fully supports Multiple Choice, True/False, Fill in the blanks, Essay, Matching, and Sorting question types. Accommodates both standalone items and Grouped Questions sharing a common passage context.
* AI OCR Digitization: Employs Gemini 2.5 Flash to parse handwriting or print scans, automatically classifying question components, keys, and values to populate editing forms.
* Mathematical Formula Editor: Integrates MathLive virtual mathematical keyboard for intuitive equations entry resembling MS Word, rendered with high performance via KaTeX.
* Live Quiz Arena: Facilitates real-time synchronous quizzes featuring interactive lobbies, live leaderboards, sound effects, and digital podiums for winners.
* Directory Management & Recycle Bin: Structured folder categorization for simple navigation. Features a soft delete layer allowing quick retrieval of accidentally deleted material.

#### 2. Student Portal & Exam Ingestion
* Professional Testing Interface: Optimizes interface estate by separating the timer header, question navigation sidebar, and main rendering viewport. Outfitted with Text-to-Speech support for question auditory reading.
* Multi-layered Anti-Cheat System:
  * Detects tab switching or window defocus utilizing the Page Visibility API.
  * Disables developer panel shortcuts (F12) alongside system actions: Copy (Ctrl+C), Paste (Ctrl+V), Print (Ctrl+P), and View Source (Ctrl+U).
  * Implements MutationObserver configurations to detect and suppress browser extensions (e.g., Sider, Grammarly) attempting to alter the DOM tree.
* Practice Hub & Error Notebook: Automatically gathers incorrect responses into an organized repository, allowing infinite practice sessions to shore up knowledge gaps.
* Gamification & Leagues: Enhances academic drive with experience points (XP) accrual, weekly competitive Leagues, and badge collection (Bronze, Silver, Gold, Diamond).

#### 3. Flashcards Learning System (Spaced Repetition)
* Automatically converts incorrect questions from the Error Notebook into interactive digital Flashcards.
* Integrates the SM-2 (SuperMemo-2) spaced repetition algorithm, dynamically scheduling review intervals based on user difficulty feedback to lock concepts into long-term memory.

#### 4. Parent Dashboard
* Student Accounts Linking: Allows parents to link their profiles to their student accounts using unique Student IDs or registered emails.
* Performance Analytics: Features visual Radar Charts comparing official tests scores to practice benchmarks, paired with Area Charts tracking weekly practice frequency for multi-dimensional progress overview.

#### 5. Admin Panel & Statistics
* System-wide user accounts management and role authorization controls.
* High-fidelity monthly growth charts monitoring exam and question counts.
* In-depth telemetry tracking AI OCR confidence ratios and API latencies.

### Overall Architecture

The platform is designed around a Next.js App Router structure coupled with Firebase services. Business logic is segregated between modular UI layers on the client and secure endpoints on the server.

```mermaid
graph TD
    subgraph User Interface (Client Browser)
        TeacherPortal[Teacher Portal: Exam Editor, Live Quiz Host, Analytics]
        StudentPortal[Student Portal: Exam Session, Anti-Cheat, Flashcards]
        ParentPortal[Parent Portal: Progress Tracker, Visual Charts]
        AdminPortal[Admin Portal: Account & Role Management]
        ClientStore[Zustand Store & SWR Cache]
    end

    subgraph Server Middleware (Next.js App Router)
        RouteHandlers[API Routes & Server Actions]
        GradingEngine[Grading Engine: /api/exams/submit]
        AIEngine[AI OCR Processor: Gemini 2.5 Flash]
    end

    subgraph Cloud Infrastructure & Persistence
        FirebaseAuth[Firebase Authentication]
        Firestore[(Firebase Firestore - Rules Enforced)]
        Cloudinary[Cloudinary Image Cloud]
        GCloudVision[Google Cloud Vision API]
    end

    TeacherPortal --> ClientStore
    StudentPortal --> ClientStore
    ParentPortal --> ClientStore
    
    ClientStore --> RouteHandlers
    RouteHandlers --> GradingEngine
    RouteHandlers --> AIEngine
    
    GradingEngine --> FirebaseAdmin[Firebase Admin SDK]
    FirebaseAdmin --> Firestore
    FirebaseAdmin --> FirebaseAuth
    
    AIEngine --> GCloudVision
```

#### Security Pillars
* Server-Side Grading: To prevent score injection attacks on the client side, grading and response evaluation logic is isolated to the `/api/exams/submit` endpoint. The engine uses the Firebase Admin SDK to commit final scores directly to Firestore under administrative authority.
* Firestore Security Rules: Strict rules (`firestore.rules`) protect the persistent data layer. Unauthorized client write actions are blocked, ensuring users can only read and write data they explicitly own.

#### Offline Resilience (PWA Architecture)
* Configured using `@ducanh2912/next-pwa` to register Service Workers, localizing static shell assets and media files retrieved from Firebase Storage.
* Uses LocalForage to manage IndexedDB datasets locally, preserving in-progress student answers during connection dropouts and preventing data loss.

### Env Configuration

Create a `.env.local` file in the root directory and define the following variables:

```env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Storage Settings (For uploading question images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

# Firebase Client SDK Configuration (For Auth and Firestore in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration (For secure server action authentication)
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

# Google Cloud Vision API Key (For hybrid fallback OCR tasks)
GOOGLE_CLOUD_API_KEY=your_gcp_api_key
```

### Installation

Follow these steps to spin up the local development environment:

1. Clone the project repository:
```bash
git clone https://github.com/CMTran2005/Exam-Bank-System.git
cd Exam-Bank-System
```

2. Install the necessary system dependencies:
```bash
npm install
```

3. Configure environmental variables: Ensure you have populated `.env.local` with valid API keys according to the environment template above.

### Running the Project

Manage the execution cycle using the following commands:

* Launch the development server:
```bash
npm run dev
```
Once active, visit the development interface in your browser at: `http://localhost:3000`

* Build the project for production deployment:
```bash
npm run build
```

* Run the production server instance:
```bash
npm start
```

* Inspect syntax and structure quality using ESLint:
```bash
npm run lint
```

### Folder Structure

The structural layout of the source repository is mapped below:

```text
exam-bank-system/
├── app/                          # Next.js App Router routing and Server API
│   ├── api/                      # Server-side API endpoints (Grading, OCR)
│   ├── (teacher)/                # Teacher Portal views (Creation, Class management)
│   ├── student/                  # Student Portal views (Exam session, Flashcards)
│   ├── parent/                   # Parent Portal views (Children reports)
│   ├── login/                    # Authentication routines
│   └── layout.jsx                # Root system layout
├── components/                   # Shared UI React components library
│   ├── layout/                   # Framework layouts (Header, role-based Sidebar)
│   ├── question/                 # Specialized rich-text question fields
│   ├── teacher/                  # Modules restricted to the teacher workflow
│   ├── student/                  # Modules supporting the student test sequence
│   ├── shared/                   # Custom shared components and Context Providers
│   └── ui/                       # UI primitives from shadcn/ui
├── hooks/                        # Dedicated React Custom Hooks for business logic
│   ├── teacher/                  # Handles exams editing and statistical analysis
│   ├── student/                  # Manages exam sessions, leagues, and profile values
│   ├── parent/                   # Links children and aggregates progress graphs
│   └── shared/                   # Global helpers (e.g. system configurations)
├── services/                     # Data Access Layer written with JSDoc annotations
│   ├── classService.js           # Student directories and group operations
│   ├── examService.js            # Exam catalogs and category mapping
│   ├── examAttemptService.js     # Result committing and cheating incident logs
│   ├── flashcardService.js       # SM-2 spaced repetition cards persistence
│   └── badgeService.js           # XP management and achievement awards
├── store/                        # Zustand global client-side state stores
├── lib/                          # Utility functions, values, and shared assets
├── public/                       # Static file store (Favicons, web manifests)
└── config/                       # System configuration files
```

### Development Roadmap

The platform follows a phased development strategy to deliver features and secure infrastructure:

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Establish Next.js structure, TailwindCSS v4 integration, shadcn/ui, and Dark Mode. | Completed |
| Phase 2 | Build advanced question input editors, Gemini OCR support, and MathLive parser. | Completed |
| Phase 3 | Code refactoring into a Modular structure separating Hooks, Services, and Recycle Bin. | Completed |
| Phase 4 | Firebase Authentication implementation, profile synchronization, and Dashboards. | Completed |
| Phase 5 | Real-time teacher co-authoring workspace, Zen Mode, and auto-save capabilities. | Completed |
| Phase 6 | Gamification integration, competitive Leagues, and Spaced Repetition Flashcards. | Completed |
| Phase 7 | Server-Side Grading logic, enhanced anti-cheat triggers, and Parent Dashboard. | Completed |
| Phase 8 | Codebase JSDoc standardization, performance optimizations, and UI polish. | Completed |
| Phase 9 | Resilient offline mode improvements and background synchronization. | In Progress |

### Contribution Guidelines

We welcome community contributions to improve overall performance and feature offerings. Please conform to the following workflow:

1. Branching Strategy:
   * New features: `feature/feature-name`
   * Bug fixes: `bugfix/bug-name`
   * Performance refactoring: `refactor/target-area`

2. Coding Standards:
   * Every exported function, service, and custom hook must be annotated using standard JSDoc.
   * Write clean, self-documenting code with clear variable and function names.

3. Pull Request Protocol:
   * Verify that the local build passes all quality gates by running `npm run lint`.
   * Submit detailed descriptions of your changes, clarifying the problem solved and providing test evidence where applicable.

### License

This software is distributed under the terms of the MIT License. See the accompanying `LICENSE` file for details.

---

<div align="center">

**Made with love by CMTran2005**

[GitHub](https://github.com/CMTran2005) | [Email](mailto:cmtran2005@gmail.com) | [Repository](https://github.com/CMTran2005/Exam-Bank-System)

</div>