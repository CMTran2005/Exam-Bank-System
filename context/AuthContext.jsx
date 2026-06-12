"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * @file AuthContext.jsx
 * @description Context cung cấp trạng thái xác thực người dùng thời gian thực bằng Firebase Authentication.
 * Toàn bộ các thao tác truy vấn Firestore được giới hạn thời gian chờ tối đa 5000ms (Fast Timeout),
 * triệt tiêu hoàn toàn hiện tượng treo màn hình hoặc chờ lâu khi chưa tạo Database trên console.
 */
const AuthContext = createContext({
    currentUser: null,
    setCurrentUser: () => { },
    login: async (email, password) => { },
    loginWithGoogle: async () => { },
    register: async (name, email, password, role) => { },
    logout: () => { },
    loading: true,
});

// Hàm tiện ích giới hạn thời gian chờ của một tác vụ Promise (tránh bị treo do mạng/DB chưa cấu hình)
const runWithTimeout = (promise, ms = 5000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Hết thời gian chờ phản hồi Firebase")), ms)
        )
    ]);
};

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm chuyển đổi các mã lỗi Firebase Auth sang Tiếng Việt thân thiện
    const translateFirebaseError = (code) => {
        switch (code) {
            case "auth/email-already-in-use":
                return "Email này đã được sử dụng bởi một tài khoản khác!";
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                return "Tài khoản hoặc mật khẩu không chính xác!";
            case "auth/weak-password":
                return "Mật khẩu quá yếu (tối thiểu phải từ 6 ký tự trở lên)!";
            case "auth/invalid-email":
                return "Địa chỉ email không đúng định dạng!";
            case "auth/operation-not-allowed":
                return "Lỗi cấu hình: Phương thức đăng nhập này chưa được kích hoạt trong Firebase Console! Vui lòng truy cập Firebase Console > Authentication > Sign-in method và kích hoạt.";
            case "auth/network-request-failed":
                return "Lỗi kết nối mạng! Vui lòng kiểm tra lại đường truyền internet.";
            case "auth/popup-closed-by-user":
                return "Cửa sổ đăng nhập bằng Google đã bị đóng trước khi hoàn tất.";
            default:
                return `Đã xảy ra lỗi hệ thống trong quá trình xác thực (${code}). Vui lòng thử lại sau!`;
        }
    };

    useEffect(() => {
        const hasCleanedLegacy = localStorage.getItem("eb_cleaned_v3");
        if (!hasCleanedLegacy) {
            localStorage.removeItem("eb_user");
            localStorage.removeItem("eb_users");
            signOut(auth).catch(() => { });
            localStorage.setItem("eb_cleaned_v3", "true");
        }
    }, []);

    // Khôi phục thông tin người dùng từ localStorage ngay khi mount (SSR Safe)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("eb_user");
            if (saved) {
                try {
                    setCurrentUser(JSON.parse(saved));
                } catch (e) {
                    console.error("Lỗi phục hồi cache user:", e);
                }
            }
            setLoading(false); // Kết thúc tải ngay khi khôi phục xong dữ liệu cục bộ
        }
    }, []);

    useEffect(() => {
        // Đăng ký bộ lắng nghe thay đổi trạng thái đăng nhập từ Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                // Khôi phục thông tin đã lưu trữ ở LocalStorage làm nền tảng trước để tránh mất các thuộc tính custom
                let cachedData = {};
                if (typeof window !== "undefined") {
                    try {
                        const saved = localStorage.getItem("eb_user");
                        if (saved) {
                            cachedData = JSON.parse(saved);
                        }
                    } catch (e) {}
                }

                let userData = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || "Giáo viên",
                    email: firebaseUser.email,
                    role: "guest",
                    school: "Trường THPT Chuyên Quốc Học",
                    degree: "Thạc sĩ",
                    mainSubject: "Toán học",
                    avatarUrl: "",
                    birthDate: "",
                    graduationYear: "",
                    graduationGrade: "Chưa tốt nghiệp",
                    status: "active",
                    ...cachedData
                };

                try {
                    // Truy vấn dữ liệu bổ sung từ Firestore (Fast Timeout 5000ms)
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await runWithTimeout(getDoc(userDocRef), 5000);

                    if (userDoc.exists()) {
                        userData = { ...userData, ...userDoc.data() };
                    }
                } catch (e) {
                    console.warn(
                        "Cảnh báo cấu hình Firebase: Firestore chưa được tạo hoặc hết thời gian chờ." +
                        " Sử dụng dữ liệu mặc định trực tiếp từ tài khoản Auth.",
                        e.message
                    );
                }

                setCurrentUser(userData);
                localStorage.setItem("eb_user", JSON.stringify(userData));
            } else {
                setCurrentUser(null);
                // KHÔNG xóa eb_user ở đây để tránh làm mất cache cục bộ khi tải lại/xác thực trung gian
            }
            setLoading(false);
        });

        // Hủy đăng ký lắng nghe khi component unmount
        return () => unsubscribe();
    }, []);

    // Hàm xử lý Đăng nhập qua Firebase Auth (Email/Password)
    const login = async (email, password) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            let userData = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Giáo viên",
                email: firebaseUser.email,
                role: "teacher",
                school: "Trường THPT Chuyên Quốc Học"
            };

            try {
                // Truy vấn dữ liệu hồ sơ từ Firestore (Fast Timeout 5000ms)
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await runWithTimeout(getDoc(userDocRef), 5000);

                if (userDoc.exists()) {
                    userData = { ...userData, ...userDoc.data() };
                }
            } catch (firestoreError) {
                console.warn("Bỏ qua lỗi Firestore khi đăng nhập:", firestoreError.message);
            }

            setCurrentUser(userData);
            localStorage.setItem("eb_user", JSON.stringify(userData));
            setLoading(false);
            return userData;
        } catch (error) {
            setLoading(false);
            throw new Error(translateFirebaseError(error.code));
        }
    };

    // Hàm xử lý Đăng nhập / Đăng ký cực nhanh bằng Tài khoản Google
    const loginWithGoogle = async (role = "guest") => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });

            const userCredential = await signInWithPopup(auth, provider);
            const firebaseUser = userCredential.user;

            let userData = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Người dùng Google",
                email: firebaseUser.email,
                role: role,
                school: "Chưa cập nhật",
                status: role === "teacher" ? "pending" : "active"
            };

            try {
                // Kiểm tra và lưu hồ sơ của Giáo viên vào Firestore (Fast Timeout 5000ms)
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await runWithTimeout(getDoc(userDocRef), 5000);

                if (userDoc.exists()) {
                    userData = { ...userData, ...userDoc.data() };
                } else {
                    // Lưu hồ sơ mới nếu đăng nhập lần đầu tiên (Fast Timeout 5000ms)
                    await runWithTimeout(setDoc(userDocRef, userData), 5000);
                }
            } catch (firestoreError) {
                console.warn("Bỏ qua lỗi Firestore khi đăng nhập Google:", firestoreError.message);
            }

            setCurrentUser(userData);
            localStorage.setItem("eb_user", JSON.stringify(userData));
            setLoading(false);
            return userData;
        } catch (error) {
            setLoading(false);
            throw new Error(translateFirebaseError(error.code));
        }
    };

    // Hàm xử lý Đăng ký tài khoản giáo viên/học sinh mới qua Firebase Auth & Firestore
    const register = async (name, email, password, role = "teacher") => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Cập nhật thuộc tính displayName trên Firebase Auth
            await updateProfile(firebaseUser, { displayName: name });

            const userData = {
                uid: firebaseUser.uid,
                name,
                email,
                role: role,
                school: "Chưa cập nhật",
                status: role === "teacher" ? "pending" : "active"
            };

            try {
                // Lưu hồ sơ giáo viên vào Firestore (Fast Timeout 5000ms)
                const userDocRef = doc(db, "users", firebaseUser.uid);
                await runWithTimeout(setDoc(userDocRef, userData), 5000);
            } catch (firestoreError) {
                console.warn("Bỏ qua lỗi Firestore khi đăng ký Email:", firestoreError.message);
            }

            setCurrentUser(userData);
            localStorage.setItem("eb_user", JSON.stringify(userData));
            setLoading(false);
            return userData;
        } catch (error) {
            setLoading(false);
            throw new Error(translateFirebaseError(error.code));
        }
    };

    // Hàm xử lý Đăng xuất
    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setCurrentUser(null);
            localStorage.removeItem("eb_user");
        } catch (error) {
            console.error("Lỗi đăng xuất Firebase Auth:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, login, loginWithGoogle, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
