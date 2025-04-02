import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "./components/userInfo";
import { formatDistanceToNow } from "date-fns";
import avatar1 from "../img/avatars/avatar1.jpg";
import avatar2 from "../img/avatars/avatar2.jpg";
import avatar3 from "../img/avatars/avatar3.jpg";
import avatar4 from "../img/avatars/avatar4.jpg";
import avatar5 from "../img/avatars/avatar5.jpg";
import avatar6 from "../img/avatars/avatar6.jpg";

interface ProfileData {
  nickname: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

interface ActiveReservation {
  bookId: string;
  title: string;
  author: string;
  uid: string;
}

interface Wishlist {
  bookId: string;
  title: string;
  author: string;
}

interface CurrentBooks {
  bookId: string;
  title: string;
  author: string;
}

interface HistoryOfReading {
  bookId: string;
  title: string;
  author: string;
}

const avatars = [
  { id: "avatar1", src: avatar1 },
  { id: "avatar2", src: avatar2 },
  { id: "avatar3", src: avatar3 },
  { id: "avatar4", src: avatar4 },
  { id: "avatar5", src: avatar5 },
  { id: "avatar6", src: avatar6 },
];

function Profile() {
  const { user } = useAuth();
  const [profileData, setProfiledata] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState<string>("avatar1");
  const [nickname, setNickname] = useState<string>("");
  const [reservedBooks, setReservedBooks] = useState<ActiveReservation[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [currentBooks, setCurrentBooks] = useState<CurrentBooks[]>([]);
  const [historyOfReading, setHistoryOfReading] = useState<HistoryOfReading[]>([]);

  useEffect(() => {
    const fetchUserProfileData = async () => {
      setLoading(true);
      if (!user) {
        console.error("User is not authorised");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          const profileData: ProfileData = {
            nickname: userData?.nickname || "Unknown User",
            email: userData?.email || "Unknown Email",
            avatar: userData?.avatar || "avatar1",
            createdAt: userData?.createdAt || "Unknown Date",
          };
          setProfiledata(profileData);
          setNickname(profileData.nickname);
          setAvatar(profileData.avatar || "avatar1");
          // Fetch reserved books with titles
          const reservedBookIds = userData?.reservedBooks || [];
              const reservedBooksWithTitles = await Promise.all(
                reservedBookIds.map(async (bookId: string) => {
                  const bookRef = doc(db, "books", bookId);
                  const bookSnapshot = await getDoc(bookRef);
                  if (bookSnapshot.exists()) {
                    const bookData = bookSnapshot.data();
                    return {
                      bookId,
                      title: bookData?.title || "Unknown Title",
                      author: bookData?.author || "Unknown Author",
                    };
                  }
                  return { bookId, title: "Unknown Title" }; // Fallback if book not found
                })
              );
    
              setReservedBooks(reservedBooksWithTitles);
    
              // Fetch wishlist with titles and authors
              const wishlistBookIds = userData?.wishlist || [];
              const wishlistBooksWithTitles = await Promise.all(
                wishlistBookIds.map(async (bookId: string) => {
                  const bookRef = doc(db, "books", bookId);
                  const bookSnapshot = await getDoc(bookRef);
                  if (bookSnapshot.exists()) {
                    const bookData = bookSnapshot.data();
                    return {
                      bookId,
                      title: bookData?.title || "Unknown Title",
                      author: bookData?.author || "Unknown Author",
                    };
                  }
                  return { bookId, title: "Unknown Title" }; // Fallback if book not found
                })
              );
    
            setWishlist(wishlistBooksWithTitles);

          // Fetch reading history
          const readBooksID = userData?.ReadingHistory || [];
          const readBooksWithTitles = await Promise.all(
            readBooksID.map(async (bookId: string) => {
              const bookRef = doc(db, "books", bookId);
              const bookSnapshot = await getDoc(bookRef);
              if (bookSnapshot.exists()) {
                const bookData = bookSnapshot.data();
                return {
                  bookId,
                  title: bookData?.title || "Unknown Title",
                  author: bookData?.author || "Unknown Author",
                };
              }
              return { bookId, title: "Unknown Title" }; // Fallback if book not found
            })
          );
      
          setHistoryOfReading(readBooksWithTitles);

          // Fetch current books with titles
          const currentBookIds = userData?.currentBook || [];
          const currentBooksWithTitles = await Promise.all(
            currentBookIds.map(async (bookId: string) => {
              const bookRef = doc(db, "books", bookId);
              const bookSnapshot = await getDoc(bookRef);
              if (bookSnapshot.exists()) {
                const bookData = bookSnapshot.data();
                return {
                  bookId,
                  title: bookData?.title || "Unknown Title",
                  author: bookData?.author || "Unknown Author",
                };
              }
              return { bookId, title: "Unknown Title" }; // Fallback if book not found
            })
          );

          setCurrentBooks(currentBooksWithTitles);
        }

      } catch (error) {
        console.error("Error fetching user profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileData();
  }, [user]);

  const handleAvatarChange = (avatarId: string) => {
    setAvatar(avatarId);
  };

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const updatedProfileData: ProfileData = {
      nickname: nickname,
      email: profileData?.email || "",
      avatar: avatar,
    };

    try {
      await setDoc(doc(db, "users", user.uid), updatedProfileData, { merge: true });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving user preferences:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const membershipDuration = profileData?.createdAt
  ? formatDistanceToNow(new Date(profileData.createdAt), { addSuffix: true })
  : "N/A";

  return (
    <div className="container">
      {loading ? (
          <p>Loading profile...</p>
        ) : (
          <>
          <h1 className="title">Bookworm's Profile</h1>
          <div className="profile-container">
            <div className="img-container">
              {!editing && avatar && (
                <img
                  src={avatars.find((a) => a.id === avatar)?.src || avatar1}
                  alt="Profile Avatar"
                  className="big-img"
                />
              )}
            </div>
            <div className="profile-info">
              <p className="profile-text">
                  {!editing ? (
                    <div>
                      <p><strong>Username:</strong> {nickname}</p>
                      <p><strong>Email:</strong> {profileData?.email}</p>
                      <p><strong>Registered:</strong> {membershipDuration}</p>
                      <button onClick={handleEditClick} className="btn">Edit Profile</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <label>
                        Username:
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Username"
                        />
                      </label>
                      <label>
                        Avatar:
                        <div className="avatar-selection">
                          {avatars.map(({ id, src }) => (
                              <div
                              key={id}
                              className={`avatar-option-container ${id === avatar ? "selected" : ""}`}
                              onClick={() => handleAvatarChange(id)}
                              style={{
                              border: id === avatar ? "0.3rem solid #3973ac" : "none",
                              padding: "0.5rem",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                              transform: id === avatar ? "scale(1.1)" : "scale(1)",
                              boxShadow: id === avatar ? "0 0 10px rgba(57, 115, 172, 0.8)" : "none",
                              }}
                              >
                              <img
                              src={src}
                              alt={`Avatar ${id}`}
                              className="avatar-img"
                              style={{
                              width: "100%",
                              height: "auto",
                              borderRadius: "0",
                              }}
                              />
                              </div>
                          ))}
                        </div>
                      </label>
                      <div className="btn_row">
                        <button type="submit" className="btn">Save</button>
                        <button type="button" onClick={handleCancelEdit} className="btn">Cancel</button>
                      </div>
                    </form>
                  )}
                </p>
            </div>
            <div className="library-container">
              <h2>Wishlist</h2>
              <ul>
                {wishlist?.map((book) => (
                  <li key={book.bookId}>
                    <strong>{book.title}</strong> by {book.author}
                  </li>
                ))}
              </ul>

              <h2>Current Books</h2>
              <ul>
                {currentBooks?.map((book) => (
                  <li key={book.bookId}>
                    <strong>{book.title}</strong> by {book.author}
                  </li>
                ))}
              </ul>

              <h2>Reserved Books</h2>
              <ul>
                {reservedBooks?.map((book) => (
                  <li key={book.bookId}>
                    <strong>{book.title}</strong> by {book.author}
                  </li>
                ))}
              </ul>

              <h2>Reading History</h2>
              <ul>
                {historyOfReading?.map((book) => (
                  <li key={book.bookId}>
                    <strong>{book.title}</strong> by {book.author}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </>
        )}
    </div>
  );
}

export default Profile;