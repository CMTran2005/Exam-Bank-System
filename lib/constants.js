/**
 * @file constants.js
 * @description Khai báo các hằng số hệ thống (Môn học theo từng cấp lớp, danh sách Tỉnh thành Việt Nam, v.v.).
 * Giúp chuẩn hóa dữ liệu đầu vào và đồng bộ hóa các bộ lọc trên toàn bộ hệ thống.
 */

// Hệ thống Hằng số toàn diện cho Hệ thống Ngân hàng Đề thi

// 1. Danh sách đầy đủ 63 Tỉnh/Thành phố Việt Nam sắp xếp theo bảng chữ cái
export const STATIC_PROVINCES = [
    "Toàn quốc",
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bạc Liêu",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cần Thơ",
    "Cao Bằng",
    "Đà Nẵng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Nội",
    "Hà Tĩnh",
    "Hải Dương",
    "Hải Phòng",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "TP. Hồ Chí Minh",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái"
];

// 2. Hàm sinh tự động danh sách Năm học dựa trên năm hiện tại (không vượt quá năm hiện tại, và lùi tối đa 10 năm trước)
export const getDynamicAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Sinh năm học từ năm hiện tại lùi về 10 năm trước (tổng cộng 11 năm học)
    for (let i = 0; i <= 10; i++) {
        const start = currentYear - i;
        const end = start + 1;
        years.push(`${start}-${end}`);
    }
    return years;
};

// 3. Bản đồ Môn học theo các khối lớp từ Tiểu học, THCS, THPT cho đến Đại học
export const GRADE_SUBJECTS_MAP = {
    // Tiểu học
    "1": ["Toán học", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Đạo đức", "Âm nhạc", "Mỹ thuật", "Hoạt động trải nghiệm"],
    "2": ["Toán học", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Đạo đức", "Âm nhạc", "Mỹ thuật", "Hoạt động trải nghiệm"],
    "3": ["Toán học", "Tiếng Việt", "Tiếng Anh", "Tin học", "Công nghệ", "Tự nhiên và Xã hội", "Đạo đức", "Âm nhạc", "Mỹ thuật"],
    "4": ["Toán học", "Tiếng Việt", "Tiếng Anh", "Tin học", "Công nghệ", "Khoa học", "Lịch sử và Địa lý", "Đạo đức", "Âm nhạc", "Mỹ thuật"],
    "5": ["Toán học", "Tiếng Việt", "Tiếng Anh", "Tin học", "Công nghệ", "Khoa học", "Lịch sử và Địa lý", "Đạo đức", "Âm nhạc", "Mỹ thuật"],
    
    // THCS
    "6": ["Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lý", "Giáo dục công dân", "Tin học", "Công nghệ", "Mỹ thuật", "Âm nhạc"],
    "7": ["Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lý", "Giáo dục công dân", "Tin học", "Công nghệ", "Mỹ thuật", "Âm nhạc"],
    "8": ["Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lý", "Giáo dục công dân", "Tin học", "Công nghệ", "Mỹ thuật", "Âm nhạc"],
    "9": ["Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lý", "Giáo dục công dân", "Tin học", "Công nghệ", "Mỹ thuật", "Âm nhạc"],
    
    // THPT (Chương trình phổ thông mới GDPT 2018)
    "10": [
        "Toán học", 
        "Ngữ văn", 
        "Tiếng Anh", 
        "Vật lý", 
        "Hóa học", 
        "Sinh học", 
        "Lịch sử", 
        "Địa lý", 
        "Giáo dục Kinh tế và Pháp luật", 
        "Tin học", 
        "Công nghệ",
        "Giáo dục quốc phòng và an ninh"
    ],
    "11": [
        "Toán học", 
        "Ngữ văn", 
        "Tiếng Anh", 
        "Vật lý", 
        "Hóa học", 
        "Sinh học", 
        "Lịch sử", 
        "Địa lý", 
        "Giáo dục Kinh tế và Pháp luật", 
        "Tin học", 
        "Công nghệ",
        "Giáo dục quốc phòng và an ninh"
    ],
    "12": [
        "Toán học", 
        "Ngữ văn", 
        "Tiếng Anh", 
        "Vật lý", 
        "Hóa học", 
        "Sinh học", 
        "Lịch sử", 
        "Địa lý", 
        "Giáo dục Kinh tế và Pháp luật", 
        "Tin học", 
        "Công nghệ",
        "Giáo dục quốc phòng và an ninh"
    ],
    
    // Đại học (Các môn học đại cương và chuyên ngành Công nghệ thông tin)
    "Đại học": [
        "Toán cao cấp",
        "Vật lý đại cương",
        "Triết học Mác-Lênin",
        "Lập trình C/C++",
        "Cấu trúc dữ liệu và Giải thuật",
        "Lập trình Web (Node.js/ReactJS)",
        "Cơ sở dữ liệu (SQL/NoSQL)",
        "Mạng máy tính",
        "Hệ điều hành (Unix/FreeBSD/Windows)",
        "Đồ họa máy tính (Computer Graphics)",
        "Học máy (Machine Learning)",
        "Trí tuệ nhân tạo (AI)",
        "An toàn thông tin",
        "Kiến trúc máy tính"
    ]
};
