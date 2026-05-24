import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
    try {
        // 1. Xác thực bảo mật với Firebase Admin
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing token." }, { status: 401 });
        }
        
        const token = authHeader.split("Bearer ")[1];
        if (!adminAuth) {
             console.warn("Chưa cấu hình Firebase Admin, bỏ qua bước check Token (Vui lòng thiết lập biến môi trường FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
        } else {
             try {
                 await adminAuth.verifyIdToken(token);
             } catch (authError) {
                 return NextResponse.json({ error: "Unauthorized: Invalid or expired token." }, { status: 401 });
             }
        }

        const { image } = await request.json();
        if (!image) {
            return NextResponse.json({ error: "Không tìm thấy dữ liệu ảnh." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const base64Data = image.split(",")[1] || image;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/png",
            },
        };

        const prompt = `
      Bạn là chuyên gia số hóa đề thi chuyên nghiệp hàng đầu. Hãy phân tích hình ảnh câu hỏi và công thức được cung cấp.
      Nhiệm vụ của bạn là nhận diện chữ viết (tiếng Việt/tiếng Anh) và chuyển các công thức toán/lý/hóa thành mã LaTeX cực kỳ chính xác.
      
      Yêu cầu nghiêm ngặt:
      1. Quét và chuyển toàn bộ văn bản trong ảnh thành chữ thuần túy, giữ nguyên định dạng xuống dòng của đề bài nếu có.
      2. Chuyển CHÍNH XÁC các ký hiệu, biểu thức toán học sang định dạng mã LaTeX chuẩn (ví dụ: \\frac{a}{b}, \\sqrt{x}, x^2, \\int) và bao bọc chúng bằng duy nhất một cặp ký tự $ (Ví dụ: $x^2 - 4 = 0$, $\\frac{a}{b}$). KHÔNG bao bọc bằng ký tự $$ trừ khi đó là công thức lớn cần xuống dòng ở giữa câu.
      3. Nếu trong ảnh có sẵn cả Đề bài và Lời giải mẫu chi tiết, hãy bóc tách riêng chúng ra.
      4. Đảm bảo mã JSON đầu ra hợp lệ, không chứa ký tự lạ làm hỏng JSON.
      
      Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json hay bất cứ thứ gì khác ngoài cặp ngoặc {}, tuân thủ đúng cấu trúc sau:
      {
        "content": "Nội dung đề bài sau khi quét và chuyển công thức thành định dạng LaTeX",
        "suggested_solution": "Nội dung lời giải chi tiết nếu có trong ảnh, nếu không có hãy để chuỗi rỗng \"\""
      }
    `;

        let responseText = "";

        // 1. Cố gắng sử dụng mô hình mới nhất gemini-2.5-flash (nhẹ, nhanh, miễn phí)
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent([prompt, imagePart]);
            responseText = result.response.text().trim();
        } catch (err1) {
            console.warn("Thử gemini-2.5-flash thất bại, chuyển sang gemini-1.5-flash...", err1.message);
            try {
                // 2. Thử mô hình gemini-1.5-flash
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent([prompt, imagePart]);
                responseText = result.response.text().trim();
            } catch (err2) {
                console.warn("Thử gemini-1.5-flash thất bại, chuyển sang gemini-1.5-pro...", err2.message);
                try {
                    // 3. Thử mô hình cao cấp gemini-1.5-pro
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                    const result = await model.generateContent([prompt, imagePart]);
                    responseText = result.response.text().trim();
                } catch (err3) {
                    console.warn("Thử gemini-1.5-pro thất bại, chuyển sang gemini-2.5-pro làm phương án cuối...", err3.message);
                    // 4. Phương án cuối cùng
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
                    const result = await model.generateContent([prompt, imagePart]);
                    responseText = result.response.text().trim();
                }
            }
        }

        // Tối ưu bóc tách JSON bằng Regex
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Không tìm thấy định dạng JSON hợp lệ trong phản hồi của AI.");
        }

        const cleanJson = JSON.parse(jsonMatch[0]);

        return NextResponse.json(cleanJson);
    } catch (error) {
        console.error("Lỗi xử lý Gemini API:", error);
        return NextResponse.json({ error: "Xử lý ảnh thất bại: " + error.message }, { status: 500 });
    }
}