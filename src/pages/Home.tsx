import React, { FormEvent } from "react";
import { useAuth } from "./components/userInfo";
import { useNavigate } from "react-router-dom";


const Home: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate("/recommendationAI");
  };

  return (
    <div className="container home">
      <h1>Welcome to Smart Library</h1>
      {user && userData ? (
        <p>
          Hello, <strong>{userData.nickname || "User"}</strong>! You are logged
          in.
        </p>
      ) : (
        <p>Please sign in or sign up to access your personalized recommendations.</p>
      )}
      <div>
        <form onSubmit={handleSubmit}>
          <input type="submit" value="Find The Book" className="btn" />
        </form>
      </div>
    </div>
  );
};

export default Home;