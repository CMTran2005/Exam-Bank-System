/**
 * Helper để random xáo trộn dựa trên Seed
 */
const getSeededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

/**
 * Hàm mũi tên (Arrow Function) getShuffleMap
 * Xử lý logic nghiệp vụ hoặc hiển thị.
 *
 * @param {any} attemptId - Tham số đầu vào
 * @returns {any}
 */
export const getShuffleMap = (attemptId, questions) => {
    if (!attemptId || !questions || !Array.isArray(questions)) return {};
    
    let hash = 0;
    for (let i = 0; i < attemptId.length; i++) {
        hash = Math.imul(31, hash) + attemptId.charCodeAt(i) | 0;
    }
    
    const shuffleMap = {};
    questions.forEach((q, idx) => {
        if (!q.type || q.type === 'multiple_choice') {
            const indices = Array.from({length: q.options?.length || 4}, (_, i) => i);
            let seed = hash + idx + (q.id ? String(q.id).charCodeAt(0) : 0);
            for (let i = indices.length - 1; i > 0; i--) {
                const rand = getSeededRandom(seed++);
                const j = Math.floor(rand * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            shuffleMap[q.id] = indices;
        }
    });
    return shuffleMap;
};
