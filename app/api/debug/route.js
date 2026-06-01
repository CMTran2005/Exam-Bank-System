import { NextResponse } from "next/server";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
    try {
        const q = query(collection(db, "exam_attempts"), limit(50));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
            id: doc.id,
            startTime: doc.data().startTime,
            score: doc.data().score,
            classId: doc.data().classId
        }));
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
