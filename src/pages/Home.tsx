import React, { FormEvent } from "react";
import { useAuth } from "./components/userInfo";
import { useNavigate } from "react-router-dom";


const Home: React.FC = () => {
  const { user, userData, adminData } = useAuth();
  const navigate = useNavigate();

  const handleSubmitUser = (e: FormEvent) => {
    e.preventDefault();
    navigate("/recommendationAI");
  };

  const handleSubmitAdmin = (e: FormEvent) => {
    e.preventDefault();
    navigate("/library");
  };

  return (
    <div className="container home">
      <h1>Welcome to Smart Library</h1>
      {user && userData ? (
        <>
          <p>
            Hello, <strong>{userData.nickname || "User"}</strong>! You are logged
            in.
          </p>
          {adminData?.isAdmin && (
            <>
              <p>Have a nice day, the guardian of the library!</p>
              {/* {console.log("admin data: ", adminData)} */}
            </>
          )}
        </>
      ) : (
        <p>Please sign in or sign up to access your personalized recommendations.</p>
      )}
      <div>
        <form onSubmit={adminData?.isAdmin ? handleSubmitAdmin : handleSubmitUser}>
          <input type="submit" value={adminData?.isAdmin ? "Library" : "Find The Book"} className="btn" />
        </form>
      </div>
    </div>
  );
};

export default Home;