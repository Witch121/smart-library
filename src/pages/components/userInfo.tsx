import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { getDoc, doc } from "firebase/firestore"; //, onSnapshot
import { useNavigate } from "react-router-dom";

interface UserData {
  nickname?: string;
  email: string;
  uid: string;
  createdAt: string;
}

interface AdminData {
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  adminData: AdminData | null;
  loading: boolean;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  adminData: null,
  loading: true,
  handleSignOut: async () => {},
});

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser) {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userInfo = userDoc.exists() ? (userDoc.data() as UserData) : null;
            setUserData(userInfo);
            // if (userInfo) {
            //     console.log("User nickname:", userInfo.nickname);
            // }

          const adminDoc = await getDoc(doc(db, "properties", "roles"));
          // const fff = onSnapshot(doc(db, "properties", "roles"), (doc,c) => {  check it out-listener
          //   console.log("Current data: ", doc.data());        fff func as listener, instead of looking into db every time
          // } );
          
          if (adminDoc.exists()){
            const adminArray = adminDoc.data().admin || [];
            setAdminData({ isAdmin: adminArray.includes(currentUser.uid) });
            //console.log("isAdmin:", adminArray.includes(currentUser.uid));
        }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, adminData, loading, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};