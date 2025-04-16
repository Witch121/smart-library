import React, { FormEvent, useEffect, useState } from "react";
import { useAuth } from "./components/userInfo";
import { useNavigate } from "react-router-dom";
import librarianImg from "../img/librarian.jpg";
// import Clock from "./clock";

const Home: React.FC = () => {
  const { user, userData, adminData } = useAuth();
  const navigate = useNavigate();
  const [wish, setWish] = useState<string>("");

  useEffect(() => {
    if (adminData && adminData.isAdmin) {
      try{
        const wishForTheDay = Math.floor(Math.random() * 20);
        const wishes = [
          "📖 A curious visitor will ask about a book you genuinely love—and you’ll get to share your enthusiasm",
          "🌤️ Your work area will stay unusually calm and organized today—even during peak hours",
          "👶 A child will light up when you help them find their book—their joy will make your day",
          "💬 A regular patron will thank you sincerely—a small reminder that your work really matters",
          "🔍 You’ll solve a tricky request effortlessly—you’ll feel like a library detective on top form",
          "📚 You’ll discover a new title while shelving that sparks your interest—a hidden gem finds you",
          "☕ You’ll enjoy a moment of peace (and maybe a warm drink) just when you need it most",
          "🎧 Your break will be refreshingly quiet or filled with just the right podcast or playlist",
          "😊 A conversation with a colleague or visitor will brighten your mood—a smile shared is doubled",
          "🌟 You’ll finish your shift feeling useful and appreciated—because today, you truly made a difference",
          "📅 You’ll have a productive day with fewer interruptions—your to-do list will thank you",
          "📖 A book you’ve been meaning to read will catch your eye on the shelf—your next read is calling",
          "🌈 A colorful display or decoration will lift your spirits—because a little color goes a long way",
          "🌈Today, your library will feel especially cozy and welcoming—like a little piece of paradise to everyone who walks in",
          "🔮 You’ll recommend a book today that opens a whole new world for someone—it may even spark a lifelong love of reading",
          "🎉 You’ll receive a compliment from a patron or colleague that makes you feel appreciated",
          "🔖 Today, you’ll match someone with their next loyal companion—a book they’ll never forget",
          "📖 You’ll witness someone rediscover their love for reading—subtle, but beautiful",
          "☕ Someone will come in today not just looking for a book—but for comfort, belonging, and hope. And they’ll find it.",
          "📚 You’ll have a moment of serendipity when you find a book that perfectly matches your mood",
        ]
        const randomWish = wishes[wishForTheDay];
        setWish(randomWish);

      } catch (error) {
      console.error("Error fetching wishes: ", error);
    }}}, [adminData]) ;

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
      {/* <Clock /> */}
      {user && userData ? (
        <>
        <div className="container minimalisticWithBigImg">
          <div className="minimalistic_content">
            <img
              src={librarianImg}
              className="big-img"
              loading="lazy"
              alt="librarian Icon"
            />
          </div>
            <div className="textToBtnMinimalVibe">
              <div className="user-greeting">
                <h2>👋 Hello, <strong>{userData.nickname || "User"}</strong>! <br/> </h2>
                {adminData?.isAdmin && <h3>🛡️ Have a nice day, the guardian of the library!</h3>}
              </div>
              <div className="wish">
                {user ? (
                  adminData?.isAdmin ? (
                    <h3>{wish}</h3>
                  ) : (
                    <h3>✨ “Libraries will get you through times of no money better than money will get you through times of no libraries.” – Anne Herbert</h3>
                  )
                ) : null}
              </div>
              <div className="btn_row">
                <form onSubmit={adminData?.isAdmin ? handleSubmitAdmin : handleSubmitUser}>
                  <input type="submit" value={adminData?.isAdmin ? "Library" : "Find The Book"} className="btn" />
                </form>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>Please sign in or sign up to access your personalized recommendations.</p>
      )}
    </div>
  );
};

export default Home;