import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { getDoc, doc } from "firebase/firestore"; //, onSnapshot
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser) {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userInfo = userDoc.exists() ? userDoc.data() : null;
            
            setUserData(userInfo);
            if (userInfo) {
                console.log("User nickname:", userInfo.nickname);
            }

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