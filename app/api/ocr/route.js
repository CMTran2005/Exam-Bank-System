import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Component POST
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} request - Tham số đầu vào
 * @returns {JSX.Element}
 */
export async function POST(request) {
    try {
        // Bước 1: Xác thực bảo mật với Firebase Admin để đảm bảo quyền truy cập hợp lệ
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

        // Danh sách các mô hình AI tiên tiến nhất hiện có trên Google Generative AI API
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ];

        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                console.log(`Đang thử gọi model AI OCR: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent([prompt, imagePart]);
                const text = result.response.text().trim();
                if (text) {
                    responseText = text;
                    console.log(`Gọi thành công model AI OCR: ${modelName}!`);
                    break;
                }
            } catch (err) {
                console.warn(`Model AI ${modelName} thất bại:`, err.message);
                lastError = err;
                
                // Nếu lỗi là 429 (Too Many Requests / Quota Exceeded), thoát vòng lặp ngay lập tức 
                // để tránh treo hệ thống 20 giây do SDK tự động retry hoặc thử các model khác cũng bị limit
                const msg = err.message?.toLowerCase() || "";
                if (msg.includes("429") || msg.includes("too many requests") || msg.includes("quota") || msg.includes("exhausted")) {
                    return NextResponse.json({ error: "Hệ thống AI đang bị quá tải hoặc vượt quá giới hạn API. Vui lòng thử lại sau vài giây." }, { status: 429 });
                }
            }
        }

        if (!responseText) {
            console.error("Tất cả các mô hình AI đều thất bại:", lastError?.message);
            throw lastError;
        }

        // Tối ưu hóa quá trình bóc tách dữ liệu JSON từ chuỗi phản hồi bằng Biểu thức chính quy (Regex)
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