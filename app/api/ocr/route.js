import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Hàm Heuristics check xem đoạn text có chứa ký tự toán học/khoa học hoặc số liệu không
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function checkHasMathOrStats(text) {
    if (!text) return false;
    
    // 1. Quét regex các ký hiệu toán học, vật lý, hóa học hoặc định dạng lũy thừa, chỉ số dưới
    const mathSymbolsRegex = /[\u2200-\u22FF]|[\u2A00-\u2AFF]|[\u2190-\u21FF]|^|_|\/|\\frac|\\sqrt|\\sum|\\int|\\pi|\\alpha|\\beta|\\gamma|\+|-|=|\*|\\rightarrow|\\delta|\\theta/gi;
    const hasMathSymbol = mathSymbolsRegex.test(text);

    // 2. Kiểm tra mật độ chữ số (Digit Density) > 15%
    const digits = text.replace(/[^0-9]/g, "").length;
    const totalChars = text.length || 1;
    const digitDensity = digits / totalChars;

    return hasMathSymbol || digitDensity > 0.15;
}

/**
 * API POST /api/ocr
 * Xử lý quét văn bản và công thức toán học từ ảnh tải lên.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
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

        const base64Data = (image.split(",")[1] || image).replace(/\s/g, "");

        // ========================================================
        // GIAI ĐOẠN 1: GOOGLE CLOUD VISION API (LẤY VĂN BẢN THÔ)
        // ========================================================
        const gcvApiKey = process.env.GOOGLE_CLOUD_API_KEY;
        let rawText = "";
        let gcvSuccess = false;

        if (gcvApiKey) {
            try {
                console.log("Đang gọi Google Cloud Vision API để trích xuất văn bản thô...");
                const gcvResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        requests: [
                            {
                                image: { content: base64Data },
                                features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
                            }
                        ]
                    })
                });

                if (gcvResponse.ok) {
                    const gcvData = await gcvResponse.json();
                    const firstResponse = gcvData.responses?.[0];
                    if (firstResponse?.error) {
                        console.error(`Lỗi phản hồi Google Cloud Vision (${firstResponse.error.code || "ERR"}):`, firstResponse.error.message);
                    } else {
                        rawText = firstResponse?.fullTextAnnotation?.text || "";
                        gcvSuccess = true;
                        console.log("Google Cloud Vision trích xuất thành công văn bản thô!");
                    }
                } else {
                    const errJson = await gcvResponse.json().catch(() => null);
                    const errMsg = errJson?.error?.message || await gcvResponse.text().catch(() => "Lỗi không xác định");
                    console.error(`Lỗi phản hồi Google Cloud Vision (Status ${gcvResponse.status}):`, errMsg);
                }
            } catch (gcvErr) {
                console.error("Lỗi khi kết nối Google Cloud Vision API:", gcvErr.message);
            }
        } else {
            console.warn("Chưa cấu hình GOOGLE_CLOUD_API_KEY. Bỏ qua Cloud Vision và chuyển thẳng sang AI OCR.");
        }

        // ========================================================
        // GIAI ĐOẠN 2: BỘ LỌC THÔNG MINH HEURISTICS (TIẾT KIỆM AI)
        // ========================================================
        if (gcvSuccess && rawText.trim().length > 0) {
            const hasMathOrStats = checkHasMathOrStats(rawText);
            
            // Nếu là văn bản thường thuần túy, không có ký hiệu toán học/số liệu -> Trả về luôn!
            if (!hasMathOrStats) {
                console.log("-> [Hybrid OCR] Phát hiện văn bản thuần túy. Trả ngay kết quả, bỏ qua AI.");
                return NextResponse.json({
                    content: rawText.trim(),
                    suggested_solution: ""
                });
            }
            console.log("-> [Hybrid OCR] Phát hiện công thức/số liệu. Chuyển sang AI để định dạng LaTeX.");
        }

        // ========================================================
        // GIAI ĐOẠN 3: AI OCR (GEMINI / OPENROUTER FALLBACK)
        // ========================================================
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        // Prompt được tinh chỉnh chuyên sâu để đối chiếu ảnh và text gợi ý của Cloud Vision
        const prompt = `
Bạn là chuyên gia số hóa đề thi và tài liệu học tập chuyên nghiệp. 
Nhiệm vụ của bạn là nhận diện chính xác đề bài từ ảnh và định dạng các công thức toán/lý/hóa thành mã LaTeX.

Dưới đây là văn bản gợi ý từ bộ quét OCR thô (có thể chứa lỗi chính tả hoặc lỗi ký hiệu):
---
OCR RAW TEXT SUGGESTION:
${rawText || "(Không có văn bản gợi ý)"}
---

Yêu cầu nghiêm ngặt:
1. Đối chiếu ảnh với văn bản gợi ý để sửa lại toàn bộ lỗi chính tả, lỗi xuống dòng và ký tự lỗi.
2. Định dạng TOÀN BỘ các ký hiệu, biểu thức toán học, vật lý, hóa học sang mã LaTeX chuẩn (ví dụ: $x^2 - 4 = 0$, $\\frac{a}{b}$, $H_2SO_4$, $\\vec{v}$).
   - Sử dụng duy nhất một cặp ký tự $ bao quanh biểu thức nằm cùng dòng (inline). Ví dụ: $a^2 + b^2 = c^2$.
   - Sử dụng cặp ký tự $$ cho các công thức lớn hoặc công thức đứng riêng một dòng.
3. Nếu ảnh chứa cả Đề bài và Lời giải mẫu chi tiết, hãy tách riêng chúng ra.
4. Đảm bảo mã JSON đầu ra hợp lệ, không chứa ký tự lạ làm hỏng JSON.

Hãy trả về kết quả dưới dạng một chuỗi JSON duy nhất, KHÔNG bao bọc trong ký tự markdown \`\`\`json hay bất cứ thứ gì khác ngoài cặp ngoặc {}, tuân thủ đúng cấu trúc sau:
{
  "content": "Nội dung đề bài sau khi quét và chuyển công thức thành định dạng LaTeX",
  "suggested_solution": "Nội dung lời giải chi tiết nếu có trong ảnh, nếu không có hãy để chuỗi rỗng \"\""
}
`;

        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro"
        ];

        let responseText = "";
        let isQuotaError = false;
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
                
                const msg = err.message?.toLowerCase() || "";
                if (msg.includes("429") || msg.includes("too many requests") || msg.includes("quota") || msg.includes("exhausted")) {
                    isQuotaError = true;
                    break;
                }
            }
        }

        let orErrorMessage = null;
        // --- PHAO CỨU SINH OPENROUTER ---
        if (!responseText && isQuotaError && process.env.OPENROUTER_API_KEY) {
            console.log("Kích hoạt phao cứu sinh OpenRouter do Google Gemini quá tải...");
            const orModels = [
                "google/gemini-2.5-flash",
                "qwen/qwen-3.7-max",
                "meta-llama/llama-3.3-70b-instruct"
            ];
            for (const orModel of orModels) {
                try {
                    console.log(`Đang thử gọi OpenRouter OCR model: ${orModel}...`);
                    const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://exam-bank-system.vercel.app", 
                            "X-Title": "Exam Bank System"
                        },
                        body: JSON.stringify({
                            model: orModel, 
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: prompt },
                                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                                    ]
                                }
                            ]
                        })
                    });

                    if (orResponse.ok) {
                        const orData = await orResponse.json();
                        const text = orData.choices?.[0]?.message?.content?.trim();
                        if (text) {
                            responseText = text;
                            console.log(`Gọi thành công AI qua OpenRouter bằng model ${orModel}!`);
                            break;
                        }
                    } else {
                        orErrorMessage = await orResponse.text();
                        console.error(`OpenRouter model ${orModel} thất bại:`, orErrorMessage);
                        if (!orErrorMessage.includes("429") && !orErrorMessage.includes("rate-limited")) {
                            break;
                        }
                    }
                } catch (orError) {
                    orErrorMessage = orError.message;
                    console.error(`Lỗi khi gọi OpenRouter model ${orModel}:`, orErrorMessage);
                }
            }
        }

        if (!responseText) {
            if (isQuotaError) {
                if (process.env.OPENROUTER_API_KEY) {
                    return NextResponse.json({ error: `Cả Google và phao cứu sinh OpenRouter đều thất bại. Lỗi OpenRouter: ${orErrorMessage}` }, { status: 429 });
                }
                return NextResponse.json({ error: "Hệ thống AI đang bị quá tải hoặc vượt quá giới hạn API. Gợi ý: Hãy thêm OPENROUTER_API_KEY vào biến môi trường để dùng tính năng dự phòng." }, { status: 429 });
            }
            console.error("Tất cả các mô hình AI đều thất bại:", lastError?.message);
            throw lastError;
        }

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