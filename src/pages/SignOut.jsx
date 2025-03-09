import React, { useEffect } from "react";
import { useAuth } from "./components/userInfo";
import { useNavigate } from "react-router-dom";

const SignOut = () => {
  const { handleSignOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      await handleSignOut();
      navigate("/signin");
    };
    logout();
  }, [handleSignOut, navigate]);

  return (
    <div>
      <h2>Signing Out...</h2>
      <p>Please wait while we log you out.</p>
    </div>
  );
};

export default SignOut;
