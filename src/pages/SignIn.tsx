import { useState } from "react";
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/library");
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
        <button type="submit" className="submit-btn">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;