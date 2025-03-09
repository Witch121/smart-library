import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 🔹 Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Store user info in Firestore (using Auth UID as document ID)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        nickname: nickname,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      });
      navigate("/"); // Redirect to home after successful sign-up
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h2 className="form-title">Sign Up</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSignUp} className="form-container">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
                <input
          className="input-field"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <button type="submit" className="submit-btn">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
