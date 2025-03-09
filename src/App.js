import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./pages/components/userInfo";
import "./styles/App.css";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import Home from "./pages/Home";
import LibrarianPanel from "./pages/LibrarianPanel";
import RecommendationAI from "./pages/RecommendationAI";
import Header from "./pages/components/Header";
import NavBar from "./pages/components/NavBar";
import Footer from "./pages/components/Footer";


function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />

        <main className="MainSpace">
        <NavBar />
        
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signout" element={<SignOut />} />
            <Route path="/librarianPanel" element={<LibrarianPanel />} />
            <Route path="/recommendationAI" element={<RecommendationAI />} />
          </Routes>
        </main>

        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App;
