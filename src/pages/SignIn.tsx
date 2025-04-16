import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { reload, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const lastSession = new Date();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          lastSession: lastSession,
        });
      }
      // reload the page 
      await reload(auth.currentUser!);
      // navigate("/");
      // navigate("/librarianPanel");
      // navigate("/profile");
      // navigate("/library");
      // navigate("/takeBook");
      // navigate("/waitingList");
      navigate("/usersLibrary");
        } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("auth/invalid-credential")) {
          alert("Invalid credentials. Please check your email and password.");
        } else if (err.message.includes("auth/network-request-failed")) {
          alert("Network error. Please check your internet connection.");
        }
        setError(err.message);
        
      }}
    }

  return (
    <div className="container">
      <h2 className="form-title">Sign In</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSignIn} className="form-container">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255} 
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={255} 
          required
        />
        {email.length > 255 && <p className="error-message">Email cannot exceed 255 characters.</p>}
        <button type="submit" className="submit-btn" disabled={!email || !password}>Sign In</button>
      </form>
      <p className="Create-new-accout-link">Don't have an account? <a href="/signup">Sign Up</a></p>
    </div>
  );
};

export default SignIn;