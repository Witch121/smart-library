import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./userInfo";
import { db } from "../../firebase/firebase";
import { getDoc, doc } from "firebase/firestore";

const NavBar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          const rolesDocRef = doc(db, "properties", "roles");
          const rolesDoc = await getDoc(rolesDocRef);
          if (rolesDoc.exists()) {
            const data = rolesDoc.data();
            const adminArray = data.admin || [];
            if (adminArray.includes(user.uid)) setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
        }
      }
    };
    checkAdminRole();
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <aside className={`side-menu ${isMenuOpen ? "open" : ""}`} ref={menuRef}>
      <button className="menu-toggle-btn" onClick={toggleMenu}>
        ☰
      </button>

      <nav className="navBar">
        <ul>
          {user ? (
            <>
              <li><Link to="/" className="linkNav">🏠 Home</Link></li>
              {isAdmin && <li><Link to="/librarianPanel" className="linkNav">📚 Librarian Panel</Link></li>}
              <li><Link to="/recommendationAI" className="linkNav">🤖 AI Recommend</Link></li>
              <li><Link to="/SignOut" className="linkNav">🚪 Sign Out</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/" className="linkNav">🏠 Home</Link></li>
              <li><Link to="/SignIn" className="linkNav">🔑 Sign In</Link></li>
              <li><Link to="/SignUp" className="linkNav">📝 Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>
    </aside>
    
  );
};

export default NavBar;
