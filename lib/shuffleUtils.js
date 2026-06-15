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
        let itemsToShuffle = 0;
        
        if (!q.type || q.type === 'multiple_choice' || q.type === 'group_multiple_choice') {
            itemsToShuffle = q.options?.length || 4;
        } else if (q.type === 'matching' || q.type === 'group_matching') {
            itemsToShuffle = q.pairs?.length || 0;
        } else if (q.type === 'ordering' || q.type === 'group_ordering') {
            itemsToShuffle = q.items?.length || 0;
        }

        if (itemsToShuffle > 0) {
            const indices = Array.from({length: itemsToShuffle}, (_, i) => i);
            let seed = hash + idx + (q.id ? String(q.id).charCodeAt(0) : 0);
            for (let i = indices.length - 1; i > 0; i--) {
                const rand = getSeededRandom(seed++);
                const j = Math.floor(rand * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            shuffleMap[q.id] = indices;
        }
        
        // Also handle subQuestions if it's a group
        if (q.subQuestions && Array.isArray(q.subQuestions)) {
            q.subQuestions.forEach((sub, subIdx) => {
                let subItemsToShuffle = 0;
                if (sub.type === 'multiple_choice') {
                    subItemsToShuffle = sub.options?.length || 4;
                } else if (sub.type === 'matching') {
                    subItemsToShuffle = sub.pairs?.length || 0;
                } else if (sub.type === 'ordering') {
                    subItemsToShuffle = sub.items?.length || 0;
                }

                if (subItemsToShuffle > 0) {
                    const subIndices = Array.from({length: subItemsToShuffle}, (_, i) => i);
                    let subSeed = hash + subIdx + (sub.id ? String(sub.id).charCodeAt(0) : 0);
                    for (let i = subIndices.length - 1; i > 0; i--) {
                        const rand = getSeededRandom(subSeed++);
                        const j = Math.floor(rand * (i + 1));
                        [subIndices[i], subIndices[j]] = [subIndices[j], subIndices[i]];
                    }
                    shuffleMap[sub.id] = subIndices;
                }
            });
        }
    });
    return shuffleMap;
};
