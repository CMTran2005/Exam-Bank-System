/**
 * @file uploadService.js
 * @description Service chuyên dụng để upload file đa phương tiện (Ảnh, Audio) lên Cloudinary, 
 * giải quyết vấn đề đầy bộ nhớ Firestore do lưu Base64.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfseun0dm";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "exam_bank_preset";

/**
 * Uploads a file (image or audio) to Cloudinary and returns its secure URL.
 * 
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadMediaToCloudinary = async (file) => {
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    // Sử dụng 'auto' để Cloudinary tự nhận diện Image hay Audio/Video
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

    try {
        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Upload failed");
        }

        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error("Lỗi khi tải file lên máy chủ: " + error.message);
    }
};
