import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/config/firebase";

interface AuthContextType {
    user: User | null;
    mongoUser: any | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    mongoUser: null,
    loading: true,
    logout: async () => { },
    refreshUser: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [mongoUser, setMongoUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    const res = await fetch("http://localhost:5000/api/auth/me", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setMongoUser(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch mongo user", error);
                }
            } else {
                setMongoUser(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setMongoUser(null);
    };

    const refreshUser = async () => {
        if (user) {
            try {
                const token = await user.getIdToken();
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMongoUser(data);
                } else {
                    setMongoUser(null);
                }
            } catch (error) {
                console.error("Failed to refresh mongo user", error);
                setMongoUser(null);
            }
        }
    };

    const value = {
        user,
        mongoUser,
        loading,
        logout,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
