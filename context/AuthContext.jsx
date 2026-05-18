"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
    currentUser: null,
    login: async (email, password) => {},
    register: async (name, email, password) => {},
    logout: () => {},
    loading: true,
});

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage on mount
        const storedUser = localStorage.getItem("eb_user");
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Lỗi đọc thông tin đăng nhập:", e);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Read registered users
        const users = JSON.parse(localStorage.getItem("eb_users") || "[]");
        const user = users.find((u) => u.email === email && u.password === password);

        if (user) {
            const { password: _, ...safeUser } = user;
            setCurrentUser(safeUser);
            localStorage.setItem("eb_user", JSON.stringify(safeUser));
            setLoading(false);
            return safeUser;
        } else {
            // Default mock admin account
            if (email === "admin@test.com" && password === "admin123") {
                const safeUser = { name: "Nguyễn Văn Admin", email, role: "admin", avatar: "/next.svg" };
                setCurrentUser(safeUser);
                localStorage.setItem("eb_user", JSON.stringify(safeUser));
                setLoading(false);
                return safeUser;
            }
            setLoading(false);
            throw new Error("Tài khoản hoặc mật khẩu không chính xác!");
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        const users = JSON.parse(localStorage.getItem("eb_users") || "[]");
        if (users.some((u) => u.email === email) || email === "admin@test.com") {
            setLoading(false);
            throw new Error("Email này đã được sử dụng!");
        }

        const newUser = { name, email, password, role: "teacher" };
        users.push(newUser);
        localStorage.setItem("eb_users", JSON.stringify(users));

        const { password: _, ...safeUser } = newUser;
        setCurrentUser(safeUser);
        localStorage.setItem("eb_user", JSON.stringify(safeUser));
        setLoading(false);
        return safeUser;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("eb_user");
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
