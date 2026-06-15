"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2, XCircle } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";

function SortableItem({ id, item, disabled, showResult, isCorrect }) {
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
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 rounded-xl border ${borderClass} transition-all mb-2`}>
            <div {...attributes} {...listeners} className={`shrink-0 p-1 -ml-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-muted rounded'}`}>
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 font-medium text-sm text-foreground overflow-x-auto">
                <LatexRenderer text={item.text} />
            </div>
            {showResult && (
                <div className="shrink-0 ml-2">
                    {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
            )}
        </div>
    );
}

export default function OrderingRenderer({ question, answer, onAnswerChange, disabled, practiceResult, shuffleMap }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (answer && Array.isArray(answer) && answer.length === question.items?.length) {
            const ordered = answer.map(id => question.items.find(i => i.id === id)).filter(Boolean);
            if (ordered.length === question.items.length) {
                setItems(ordered);
                return;
            }
        }
        
        // If no answer, use shuffleMap
        if (question.items) {
            let initialItems = [...question.items];
            const qMap = shuffleMap ? shuffleMap[question.id] : null;
            if (qMap && Array.isArray(qMap) && qMap.length === question.items.length) {
                initialItems = qMap.map(idx => question.items[idx]);
            } else {
                // Fallback shuffle
                initialItems.sort(() => Math.random() - 0.5);
            }
            setItems(initialItems);
            // Save initial state so we have a definite answer array even if they don't move anything
            if (onAnswerChange) {
                onAnswerChange(initialItems.map(i => i.id));
            }
        }
    }, [question.items, answer, shuffleMap, question.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            if (onAnswerChange) {
                onAnswerChange(newItems.map(i => i.id));
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mt-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item, index) => {
                        // Determine if it's in the correct absolute position for practice result
                        // Actually, the absolute position is question.items[index].id
                        const isCorrect = practiceResult?.checked ? item.id === question.items[index]?.id : false;
                        return (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                item={item}
                                disabled={disabled}
                                showResult={practiceResult?.checked}
                                isCorrect={isCorrect}
                            />
                        );
                    })}
                </SortableContext>
            </DndContext>
        </div>
    );
}
