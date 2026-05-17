import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Không tìm thấy dữ liệu hình ảnh" }, { status: 400 });
        }

        const base64Data = image.split(",")[1] || image;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/png",
            },
        };

        const prompt = `
      Bạn là chuyên gia số hóa đề thi chuyên nghiệp. Hãy phân tích hình ảnh câu hỏi được cung cấp.
      Nhiệm vụ của bạn:
      1. Quét và chuyển toàn bộ văn bản trong ảnh thành chữ thuần túy (Tiếng Việt hoặc Tiếng Anh).
      2. Chuyển CHÍNH XÁC các công thức toán/lý/hóa hoặc ký tự đặc biệt sang định dạng mã LaTeX và bao bọc chúng bằng duy nhất một cặp ký tự $ (Ví dụ: $x^2 - 4 = 0$, $\\frac{a}{b}$).
      3. Nếu trong ảnh có sẵn cả Đề bài và Lời giải mẫu chi tiết, hãy bóc tách riêng chúng ra.
      
      Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json, tuân thủ đúng cấu trúc sau:
      {
        "content": "Nội dung đề bài sau khi quét và chuyển công thức thành định dạng LaTeX",
        "suggested_solution": "Nội dung lời giải chi tiết nếu có trong ảnh, nếu không có hãy để chuỗi rỗng \"\""
      }
    `;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();

        const cleanJson = JSON.parse(responseText);

        return NextResponse.json(cleanJson);
    } catch (error) {
        console.error("Lỗi xử lý Gemini API:", error);
        return NextResponse.json({ error: "Xử lý ảnh thất bại: " + error.message }, { status: 500 });
    }
}