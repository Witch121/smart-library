import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./userInfo";
import { db } from "../../firebase/firebase";
import { getDoc, doc } from "firebase/firestore";

const NavBar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
          <li><Link to="/" className="linkNav">🏠 Home</Link></li>
          {user ? (
            <>
              <li><Link to="/profile" className="linkNav">👤 Profile</Link></li>
              <li><Link to="/signout" className="linkNav">🚪 Sign Out</Link></li>
              {!isAdmin && (
                <>
                  <li><Link to="/recommendationAI" className="linkNav">🤖 AI Recommend</Link></li>
                  <li><Link to="/readingRoom" className="linkNav">📖 Reading Room</Link></li>
                  <li><Link to="/takeBook" className="linkNav">📚 Take Book</Link></li>
                  <li><Link to="/usersLibrary" className="linkNav">🏛️ Not Yet Mine Books</Link></li>
                </>
              )}
              {isAdmin && (
                <>
                  <li><Link to="/librarianPanel" className="linkNav">📚 Add Books</Link></li>
                  <li><Link to="/library" className="linkNav">🏢 Library</Link></li>
                  <li><Link to="/repair" className="linkNav">🔧 Repair</Link></li>
                  <li><Link to="/waitingList" className="linkNav">⏳ Waiting List</Link></li>
                  <li><Link to="/infoAboutUsers" className="linkNav">👥 Users Info</Link></li>
                </>
              )}
            </>
          ) : (
            <>
              <li><Link to="/signin" className="linkNav">🔑 Sign In</Link></li>
              <li><Link to="/signup" className="linkNav">📝 Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default NavBar;