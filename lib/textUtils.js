/**
 * Cleans and normalizes text for comparison (e.g. grading).
 * Removes HTML tags, standardizes quotes, converts to lowercase, etc.
 * 
 * @param {string} text - The text to normalize
 * @returns {string} The normalized text
 */
export const cleanAndNormalize = (text) => {
    if (text === undefined || text === null) return "";
    return text
        .toString()
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .toLowerCase()
        .replace(/,/g, ".");
};
