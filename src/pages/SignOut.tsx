import React from "react";
// import { useAuth } from "./components/userInfo";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import signOutImg from "../img/signOut_img.jpg";


const SignOut: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (err) {
      console.error("Error signing out:", (err as Error).message);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="container signOut">
      <div className="signOut_content">
        <img
          src={signOutImg}
          className="big-img"
          loading="lazy"
          alt="How about no Icon"
        />
      </div>
      <div className="signOut_btn">
        <h2>Are you sure you want to sign out?</h2>
        <div className="btn_row">
          <button onClick={handleSignOut} className="btn">Yes</button>
          <button onClick={handleCancel} className="btn">No</button>
        </div>
      </div>
    </div>
  );
};

export default SignOut;