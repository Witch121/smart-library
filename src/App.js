import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./pages/components/userInfo";
import "./styles/App.css";
import Header from "./pages/components/Header";
import NavBar from "./pages/components/NavBar";
import Footer from "./pages/components/Footer";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import Profile from "./pages/Profile";
import Home from "./pages/Home";

import LibrarianPanel from "./pages/adminsPages/LibrarianPanel";
import Library from "./pages/adminsPages/Library";
import Repair from "./pages/adminsPages/Repair";
import WaitingList from "./pages/adminsPages/WaitingList";
import InfoAboutUsers from "./pages/adminsPages/InfoAboutUsers"

import RecommendationAI from "./pages/usersPages/RecommendationAI";
import ReadingRoom from "./pages/usersPages/ReadingRoom";
import TakeBook from "./pages/usersPages/TakeBook";
import UsersLibrary from "./pages/usersPages/UsersLibrary";




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
            <Route path="/profile" element={<Profile />} />

            <Route path="/librarianPanel" element={<LibrarianPanel />} />
            <Route path="/library" element={<Library />} />
            <Route path="/repair" element={<Repair />} />
            <Route path="/waitingList" element={<WaitingList />} />
            <Route path="/infoAboutUsers" element={<InfoAboutUsers />} />

            <Route path="/recommendationAI" element={<RecommendationAI />} />
            <Route path="/readingRoom" element={<ReadingRoom />} />
            <Route path="/takeBook" element={<TakeBook />} />
            <Route path="/usersLibrary" element={<UsersLibrary />} />      

          </Routes>
        </main>

        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App;

//npx tsc --noEmit - check for TypeScript errors without compiling.
