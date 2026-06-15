"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

function SortableRightItem({ id, content, disabled, showResult, isCorrect }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    let borderClass = "border-border bg-card hover:bg-accent/50";
    if (showResult) {
        borderClass = isCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20";
    }
    if (isDragging) borderClass = "border-primary bg-accent shadow-md ring-2 ring-primary/20";

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-3 rounded-xl border ${borderClass} transition-all mb-2 min-h-[3.5rem]`}>
            <div {...attributes} {...listeners} className={`shrink-0 p-1 -ml-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-muted rounded'}`}>
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 font-medium text-sm text-foreground overflow-x-auto">
                <LatexRenderer text={content} />
            </div>
            {showResult && (
                <div className="shrink-0">
                    {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                </div>
            )}
        </div>
    );
}

export default function MatchingRenderer({ question, answer, onAnswerChange, disabled, practiceResult, shuffleMap }) {
    const [rightItems, setRightItems] = useState([]);

    useEffect(() => {
        if (answer && Array.isArray(answer) && answer.length === question.pairs?.length) {
            // Reconstruct right items from answer IDs
            const ordered = answer.map(id => question.pairs.find(p => p.id === id)).filter(Boolean);
            if (ordered.length === question.pairs.length) {
                setRightItems(ordered);
                return;
            }
        }
        
        // Initial shuffle
        if (question.pairs) {
            let initialItems = [...question.pairs];
            const qMap = shuffleMap ? shuffleMap[question.id] : null;
            if (qMap && Array.isArray(qMap) && qMap.length === question.pairs.length) {
                initialItems = qMap.map(idx => question.pairs[idx]);
            } else {
                initialItems.sort(() => Math.random() - 0.5);
            }
            setRightItems(initialItems);
            if (onAnswerChange) {
                onAnswerChange(initialItems.map(i => i.id));
            }
        }
    }, [question.pairs, answer, shuffleMap, question.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = rightItems.findIndex((i) => i.id === active.id);
            const newIndex = rightItems.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(rightItems, oldIndex, newIndex);
            setRightItems(newItems);
            if (onAnswerChange) {
                onAnswerChange(newItems.map(i => i.id));
            }
        }
    };

    return (
        <div className="w-full mt-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                {/* Left Column (Static) */}
                <div className="space-y-2">
                    {question.pairs?.map((pair) => (
                        <div key={`left-${pair.id}`} className="flex items-center p-3 rounded-xl border border-border bg-muted/30 min-h-[3.5rem]">
                            <div className="flex-1 font-medium text-sm text-foreground overflow-x-auto">
                                <LatexRenderer text={pair.left} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center Arrows */}
                <div className="space-y-2 pt-3 flex flex-col items-center">
                    {question.pairs?.map((pair) => (
                        <div key={`arrow-${pair.id}`} className="flex items-center justify-center min-h-[3.5rem] px-2 mb-2">
                            <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                    ))}
                </div>

                {/* Right Column (Sortable) */}
                <div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={rightItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {rightItems.map((item, index) => {
                                // Correct if the item id matches the left pair id at this index
                                const expectedId = question.pairs[index]?.id;
                                const isCorrect = practiceResult?.checked ? item.id === expectedId : false;
                                return (
                                    <SortableRightItem
                                        key={item.id}
                                        id={item.id}
                                        content={item.right}
                                        disabled={disabled}
                                        showResult={practiceResult?.checked}
                                        isCorrect={isCorrect}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
