import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * Component POST
 * Xử lý logic và chức năng liên quan.
 *
 * @param {any} request - Tham số đầu vào
 * @returns {JSX.Element}
 */
export async function POST(request) {
    try {
        const { action, ...params } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Không tìm thấy API Key của Gemini. Vui lòng cấu hình trong biến môi trường." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let prompt = "";
        let imagePart = null;

        if (action === "generate_solution") {
            const { type, content, choices } = params;
            if (!content || !content.trim()) {
                return NextResponse.json({ error: "Nội dung câu hỏi trống." }, { status: 400 });
            }

            prompt = `
Bạn là chuyên gia học thuật và giảng viên xuất sắc hàng đầu Việt Nam, am hiểu sâu sắc từ giáo dục phổ thông đến các chuyên ngành, học phần đại học, cao đẳng.
Nhiệm vụ của bạn là đọc nội dung câu hỏi sau và viết lời giải chi tiết cùng đáp số đúng cuối cùng.

Loại câu hỏi: ${type || "multiple_choice"}
Nội dung câu hỏi: ${content}
Các phương án/mệnh đề/chỗ trống (nếu có): ${JSON.stringify(choices || [])}

Yêu cầu nghiêm ngặt:
1. Lời giải chi tiết (suggested_solution) phải phân tích rõ ràng, giải thích từng bước lập luận logic khoa học bằng tiếng Việt.
2. Các công thức toán/lý/hóa phải được viết bằng định dạng LaTeX chuẩn và bao bọc bằng duy nhất một cặp ký tự $ (Ví dụ: $V = B \\cdot h$, $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$). KHÔNG bao bọc bằng ký tự $$ trừ khi đó là công thức lớn cần xuống dòng ở giữa câu.
3. ĐẶC BIỆT LƯU Ý KHI VIẾT LATEX TRONG JSON: Bạn BẮT BUỘC phải escape ký tự dấu gạch chéo ngược (backslash). Ví dụ: thay vì viết \frac, hãy viết \\\\frac. Thay vì viết \Delta, hãy viết \\\\Delta.
4. Đáp số (final_answer):
   - Trắc nghiệm (multiple_choice): Đáp số ngắn gọn (Ví dụ: "A", "B", "C", "D").
   - Đúng/Sai (true_false): Trả về mảng boolean tương ứng với tính Đúng/Sai của từng mệnh đề (Ví dụ: [true, false, true, true]).
   - Điền khuyết (fill_blank): Trả về mảng chuỗi chứa đáp án cho từng ô trống theo thứ tự (Ví dụ: ["12", "x^2", "vận tốc"]).
   - Tự luận (essay): Đáp số ngắn gọn cuối cùng (Ví dụ: "x = 2").
5. Chỉ số đáp án (correct_choice_index): Dành riêng cho trắc nghiệm (multiple_choice). Trả về số nguyên 0, 1, 2, hoặc 3 tương ứng với phương án đúng (0 là A, 1 là B...). Các loại khác trả về null.

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json hay bất cứ thứ gì khác ngoài cặp ngoặc {}, tuân thủ đúng cấu trúc sau:
{
  "suggested_solution": "Nội dung lời giải chi tiết đầy đủ có chứa LaTeX",
  "final_answer": "Đáp số ngắn gọn cuối cùng hoặc mảng đáp án (nếu là đúng/sai hoặc điền khuyết)",
  "correct_choice_index": 0 | 1 | 2 | 3 | null
}
`;
        } else if (action === "generate_question") {
            const { promptText, type } = params;
            if (!promptText || !promptText.trim()) {
                return NextResponse.json({ error: "Chủ đề / Yêu cầu tạo câu hỏi trống." }, { status: 400 });
            }

            prompt = `
Bạn là chuyên gia biên soạn tài liệu học thuật xuất sắc, có khả năng xây dựng các câu hỏi từ bậc phổ thông cho tới các học phần chuyên ngành ở bậc đại học, cao đẳng.
Nhiệm vụ của bạn là tạo một câu hỏi kiểm tra hoàn chỉnh cực kỳ chất lượng dựa trên yêu cầu/chủ đề sau:
Yêu cầu/Chủ đề: "${promptText}"
Loại câu hỏi: ${type || "multiple_choice"}

Yêu cầu chất lượng câu hỏi:
1. Nội dung câu hỏi sinh động, bám sát yêu cầu chuyên môn, phân loại người học (học sinh/sinh viên) cực kỳ tốt.
2. Tất cả các ký hiệu và biểu thức học thuật/toán/lý/hóa học phải sử dụng định dạng mã LaTeX chuẩn và bao bọc bằng duy nhất một cặp ký tự $ (Ví dụ: $y = f(x)$, $x^2 - 4 = 0$).
3. Nếu loại câu hỏi là trắc nghiệm ("multiple_choice"):
   - Cung cấp đúng 4 phương án lựa chọn (A, B, C, D) dưới dạng mảng "choices".
   - Mỗi phương án có trường "text" (nội dung câu trả lời) và "isCorrect" (boolean).
   - Có đúng duy nhất một phương án có "isCorrect": true.
4. Nếu loại câu hỏi là Đúng/Sai ("true_false"):
   - Cung cấp đúng 4 mệnh đề nhỏ dưới dạng mảng "subQuestions".
   - Mỗi mệnh đề có trường "content" (nội dung mệnh đề), "isCorrect" (boolean) và "points" (để mặc định "0.25").
5. Nếu loại câu hỏi là tự luận ("essay"):
   - Không cần cung cấp "choices" hay "subQuestions".
6. Cung cấp lời giải mẫu cực kỳ chi tiết từng bước lập luận logic (suggested_solution) kèm LaTeX và đáp số đúng ngắn gọn cuối cùng (final_answer).
7. Gợi ý mức độ khó phù hợp trong các giá trị: "nhan_biet" (Nhận biết), "thong_hieu" (Thông hiểu), "van_dung" (Vận dụng), "van_dung_cao" (Vận dụng cao).

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json hay bất cứ thứ gì khác ngoài cặp ngoặc {}, tuân thủ đúng cấu trúc sau:
{
  "content": "Nội dung đề bài câu hỏi được soạn thảo tinh tế kèm LaTeX",
  "difficulty": "nhan_biet" | "thong_hieu" | "van_dung" | "van_dung_cao",
  "points": "1.0",
  "suggested_solution": "Lời giải mẫu chi tiết từng bước kèm LaTeX",
  "final_answer": "Kết quả / đáp số ngắn gọn cuối cùng",
  "choices": [
    { "text": "Phương án A", "isCorrect": false },
    { "text": "Phương án B", "isCorrect": false },
    { "text": "Phương án C", "isCorrect": true },
    { "text": "Phương án D", "isCorrect": false }
  ],
  "subQuestions": [
    { "content": "Mệnh đề A", "isCorrect": true, "points": "0.25" },
    { "content": "Mệnh đề B", "isCorrect": false, "points": "0.25" },
    { "content": "Mệnh đề C", "isCorrect": false, "points": "0.25" },
    { "content": "Mệnh đề D", "isCorrect": true, "points": "0.25" }
  ]
}
`;
        } else if (action === "generate_tags") {
            const { content, type } = params;
            if (!content || !content.trim()) {
                return NextResponse.json({ error: "Nội dung câu hỏi trống." }, { status: 400 });
            }

            prompt = `
Bạn là chuyên gia đánh giá và thẩm định học liệu xuất sắc từ bậc phổ thông đến các chuyên ngành đại học, cao đẳng.
Nhiệm vụ của bạn là đọc nội dung câu hỏi sau và thực hiện phân tích kiến thức:

Loại câu hỏi: ${type || "multiple_choice"}
Nội dung câu hỏi: ${content}

Yêu cầu nghiêm ngặt:
1. Phân tích và đưa ra danh sách các thẻ gắn (tags) chất lượng cao (tối đa 4 thẻ). Các thẻ phải ngắn gọn, súc tích (1-3 từ mỗi thẻ), bao gồm:
   - Tên môn/học phần (Ví dụ: "Toán 12", "Đại số tuyến tính", "Kinh tế vi mô").
   - Chuyên đề lớn (Ví dụ: "Khối đa diện", "Không gian vector", "Cung và cầu").
   - Dạng bài/Khái niệm (Ví dụ: "Cực trị hàm số", "Chéo hóa ma trận", "Độ co giãn").
2. Đề xuất mức độ khó (difficulty) phù hợp nhất trong 4 mức độ:
   - "nhan_biet" (Nhận biết - Câu lý thuyết hoặc công thức áp dụng ngay)
   - "thong_hieu" (Thông hiểu - Áp dụng trực tiếp 1-2 bước tính toán cơ bản)
   - "van_dung" (Vận dụng - Phối hợp nhiều công thức, biến đổi nhẹ)
   - "van_dung_cao" (Vận dụng cao - Câu lấy điểm 9, 10, yêu cầu suy luận thông minh)

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json hay bất cứ thứ gì khác ngoài cặp ngoặc {}, tuân thủ đúng cấu trúc sau:
{
  "tags": ["Thẻ môn học", "Thẻ chuyên đề", "Thẻ dạng bài"],
  "difficulty": "nhan_biet" | "thong_hieu" | "van_dung" | "van_dung_cao"
}
`;
        } else if (action === "clean_word_html") {
            const { content } = params;
            if (!content || !content.trim()) {
                return NextResponse.json({ error: "Nội dung trống." }, { status: 400 });
            }

            prompt = `
Bạn là một chuyên gia xử lý dữ liệu và chuyển đổi định dạng tài liệu bậc thầy.
Nhiệm vụ của bạn là lấy đoạn mã HTML lộn xộn được copy/paste từ Microsoft Word (chứa các thẻ mso, MathType, OMML, MathML, span rườm rà) và làm sạch nó.

Yêu cầu nghiêm ngặt:
1. Loại bỏ toàn bộ các inline style, class rác (như MsoNormal), và các thẻ span/div không cần thiết.
2. Giữ lại các định dạng cơ bản: <b>, <i>, <u>, <br>, <p>.
3. QUAN TRỌNG NHẤT: Chuyển đổi TẤT CẢ các công thức toán học (được biểu diễn bằng MathML <mml:math>, MathType, hoặc các hình ảnh công thức) thành mã LaTeX thuần túy, và bao bọc chúng bằng duy nhất một cặp ký tự $ (Ví dụ: $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$).
4. Không thay đổi ngữ nghĩa của văn bản gốc.

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json, tuân thủ đúng cấu trúc sau:
{
  "clean_content": "Đoạn mã HTML siêu sạch có chứa công thức LaTeX đã chuyển đổi"
}
`;
        } else if (action === "parse_image_to_questions") {
            const { image } = params;
            if (!image) {
                return NextResponse.json({ error: "Không tìm thấy dữ liệu ảnh." }, { status: 400 });
            }

            const base64Data = image.split(",")[1] || image;
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png",
                },
            };

            prompt = `
Bạn là chuyên gia số hóa đề thi chuyên nghiệp hàng đầu. Hãy phân tích hình ảnh đề thi (chứa nhiều câu hỏi) được cung cấp.
Nhiệm vụ của bạn là bóc tách tất cả các câu hỏi trắc nghiệm có trong ảnh thành danh sách JSON chuẩn mực.

Yêu cầu nghiêm ngặt:
1. Mỗi câu hỏi bóc ra phải có "content" (đề bài chính) và mảng 4 phương án "choices" (A, B, C, D). Mỗi choice có "text" và "isCorrect" (để mặc định false nếu không rõ đáp án).
2. TẤT CẢ công thức toán học/hóa học/vật lý phải được định dạng chuẩn bằng mã LaTeX và bọc trong 1 cặp dấu $ (Ví dụ: $x^2 + y^2 = 1$). KHÔNG dùng $$.
3. Cố gắng suy luận đáp án đúng (isCorrect = true) nếu có thể giải, hoặc nếu trong ảnh có đánh dấu sẵn đáp án.
4. Tự động sinh ra "suggested_solution" (Lời giải chi tiết ngắn gọn) cho mỗi câu hỏi nếu bạn có thể giải được.

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json, tuân thủ đúng cấu trúc sau:
{
  "questions": [
    {
      "content": "Nội dung đề bài câu 1...",
      "type": "multiple_choice",
      "difficulty": "thong_hieu",
      "points": "1.0",
      "suggested_solution": "Lời giải chi tiết (nếu có)",
      "final_answer": "A",
      "choices": [
        { "text": "Nội dung A", "isCorrect": true },
        { "text": "Nội dung B", "isCorrect": false },
        { "text": "Nội dung C", "isCorrect": false },
        { "text": "Nội dung D", "isCorrect": false }
      ]
    }
  ]
}
`;
        } else {
            return NextResponse.json({ error: "Hành động AI không hợp lệ." }, { status: 400 });
        }

        let responseText = "";
        const generationConfig = {
            responseMimeType: "application/json",
        };

        // Danh sách các mô hình ngôn ngữ lớn (LLM) khả dụng của Google Gemini API
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ];

        let isQuotaError = false;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Đang thử gọi model AI: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const requestContents = [{ role: "user", parts: [{ text: prompt }] }];
                if (imagePart) {
                    requestContents[0].parts.push(imagePart);
                }

                const result = await model.generateContent({
                    contents: requestContents,
                    generationConfig
                });
                const text = result.response.text().trim();
                if (text) {
                    responseText = text;
                    console.log(`Gọi thành công model AI: ${modelName}!`);
                    break;
                }
            } catch (err) {
                console.warn(`Model AI ${modelName} thất bại:`, err.message);
                lastError = err;
                
                // Kiểm tra 429 để bật phao cứu sinh
                const msg = err.message?.toLowerCase() || "";
                if (msg.includes("429") || msg.includes("too many requests") || msg.includes("quota") || msg.includes("exhausted")) {
                    isQuotaError = true;
                    break;
                }
            }
        }

        // --- PHAO CỨU SINH OPENROUTER ---
        if (!responseText && isQuotaError && process.env.OPENROUTER_API_KEY) {
            console.log("Kích hoạt phao cứu sinh OpenRouter do Google Gemini quá tải...");
            try {
                const messages = [{ role: "user", content: prompt }];
                if (imagePart) {
                    // OpenRouter vision format (chỉ dùng nếu action sinh câu hỏi từ ảnh được gộp vào đây, 
                    // nhưng AI route chủ yếu là text, tuy nhiên cứ để cho an toàn nếu có imagePart)
                    messages[0].content = [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:image/png;base64,${imagePart.inlineData.data}` } }
                    ];
                }

                const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://exam-bank-system.vercel.app", 
                        "X-Title": "Exam Bank System"
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.5-flash", 
                        messages: messages
                    })
                });

                if (orResponse.ok) {
                    const orData = await orResponse.json();
                    const text = orData.choices?.[0]?.message?.content?.trim();
                    if (text) {
                        responseText = text;
                        console.log("Gọi thành công AI qua OpenRouter!");
                    }
                } else {
                    console.error("OpenRouter cũng thất bại:", await orResponse.text());
                }
            } catch (orError) {
                console.error("Lỗi khi gọi OpenRouter:", orError.message);
            }
        }

        if (!responseText) {
            if (isQuotaError) {
                return NextResponse.json({ error: "Hệ thống AI đang bị quá tải hoặc vượt quá giới hạn API. Gợi ý: Hãy thêm OPENROUTER_API_KEY vào biến môi trường để dùng tính năng dự phòng." }, { status: 429 });
            }
            throw new Error(`Tất cả các model AI trong chuỗi fallback đều thất bại. Lỗi cuối cùng: ${lastError?.message}`);
        }

        // Sử dụng Biểu thức chính quy (Regex) để trích xuất dữ liệu JSON an toàn từ chuỗi văn bản
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Không tìm thấy định dạng JSON hợp lệ trong phản hồi của AI. Phản hồi gốc: " + responseText);
        }

        let cleanJson;
        try {
            cleanJson = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.warn("JSON.parse chuẩn thất bại, tiến hành giải cứu và làm sạch chuỗi...", parseError.message);
            
            let sanitized = jsonMatch[0];
            
            // Bước 1: Khắc phục lỗi AI quên escape dấu gạch chéo ngược (\) trong công thức LaTeX (như \frac, \cdot, \Delta...)
            // Bỏ qua các escape hợp lệ của JSON như \n, \r, \t, \", \\, \/ và \u
            sanitized = sanitized.replace(/\\([^"\\/nrtu])/g, "\\\\$1");
            
            // Bước 2: Xử lý các ký tự xuống dòng (newline) nằm bên trong các chuỗi giá trị để đảm bảo chuẩn JSON
            sanitized = sanitized.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            
            // Bước 3: Khôi phục cấu trúc phân cấp gốc của JSON để tiến hành phân tích cú pháp (parsing)
            sanitized = sanitized
                .replace(/\\n\s*"/g, '\n"')
                .replace(/\\n\s*\}/g, '\n}')
                .replace(/\{\s*\\n/g, '{\n');

            try {
                cleanJson = JSON.parse(sanitized);
            } catch (secondError) {
                console.error("Giải cứu JSON thất bại:", secondError.message);
                throw new Error("Không thể phân tích kết quả JSON: " + secondError.message + "\nChuỗi gốc: " + responseText);
            }
        }

        return NextResponse.json(cleanJson);
    } catch (error) {
        console.error("Lỗi xử lý AI API:", error);
        return NextResponse.json({ error: "Xử lý AI thất bại: " + error.message }, { status: 500 });
    }
}
