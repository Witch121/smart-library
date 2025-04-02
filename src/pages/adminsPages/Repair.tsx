import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, query, where, getDocs, doc, writeBatch, getDoc } from "firebase/firestore";
import { useAuth } from "../components/userInfo";

interface Book {
  id: string;
  creatorId: string; 
  nickname: string;
  title: string; 
  reason: string;
  createdAt: string;
}

const Repair: React.FC = () => {
  const { adminData, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [damagedBooksCount, setDamagedBooksCount] = useState<number>(0);

  useEffect(() => {
    const fetchDamagedBooks = async () => {
      if (!adminData) return;
          setLoading(true);
          if(user){
            // console.log("user", user.uid);
          }
          try {
      const pendingCollection = collection(db, "pending");
      const q = query(pendingCollection, where("reason", "==", "damaged"));
      const querySnapshot = await getDocs(q);

      const damagedBooks: Book[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        creatorId: doc.data().creatorId,
        title: "Unknown Title",
        nickname: "Unknown User ",
        reason: doc.data().reason,
        createdAt: new Date(doc.data().createdAt).toLocaleString(),
      }));

      const damagedBooksWithTitles = await Promise.all(
        damagedBooks.map(async (book) => {
          const bookRef = doc(db, "books", book.id);
          const bookSnapshot = await getDoc(bookRef);
          if (bookSnapshot.exists()) {
            const bookData = bookSnapshot.data();
            return {
              ...book,
              title: bookData?.title || "Unknown Title",
            };
          }
          return { ...book, title: "Unknown Title" }; // Fallback if book not found
        })
      );

      const damagedBooksWithTitlesAndUsers = await Promise.all(
        damagedBooksWithTitles.map(async (book) => {
          const usersRef = doc(db, "users", book.creatorId);
          const userSnapshot = await getDoc(usersRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            return {
              ...book,
              nickname: userData?.nickname || "Unknown User ",
            };
          }
          return { ...book, nickname: "Unknown User ID" }; // Fallback if book not found
        })
      );  
      setBooks(damagedBooksWithTitlesAndUsers);
      setDamagedBooksCount(damagedBooks.length);
    } catch (error) {
      console.error("Error fetching damaged books: ", error);
    } finally {
      setLoading(false);
    }
  };
    fetchDamagedBooks();
  }
  , [adminData, user]);

  const handleRepaired = async (bookId: string) => {
    const batch = writeBatch(db);

    // Delete from "pending" collection
    const pendingDocRef = doc(db, "pending", bookId);
    batch.delete(pendingDocRef);

    // Mark as available in "books" collection
    const booksDocRef = doc(db, "books", bookId);
    batch.update(booksDocRef, { status: "available" });

    await batch.commit();

    // Update UI
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookId));
  };

  const copyID = (id: string, type: "book" | "user") => {
    navigator.clipboard.writeText(id).then(() => {
      alert(`${type === "book" ? "Book" : "User"} ID copied to clipboard!`);
    }).catch((error) => {
      console.error(`Error copying ${type} ID: `, error);
      alert(`Failed to copy ${type} ID.`);
    });
  };

  return (
    <div className="container">
      <h1>Repair page</h1>
      <p>📚 Number of damaged books: {damagedBooksCount}</p>
      {loading ? (
        <p>Loading data...</p>
      ) : (
      <>
        <table className="library_table resrve">
          <thead>
            <tr>
              {/* <th>UID</th> */}
              <th>Username</th>
              {/* <th>Book ID</th> */}
              <th>Title</th>
              <th>Reason</th>
              <th>Marked as damaged</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                {/* <td>{book.creatorId}</td> */}
                <td><span onClick={() => copyID(book.creatorId, "user")}>{book.nickname}</span></td>
                {/* <td>{book.id}</td> */}
                <td><span onClick={() => copyID(book.id, "book")}>{book.title}</span></td>
                <td>{book.reason}</td>
                <td>{book.createdAt}</td>
                <td><button onClick={() => handleRepaired(book.id)} className="btn">Repaired</button></td>
              </tr>
            ))}
          </tbody>
        </table>
     </>
      )}
    </div>
  );
};

export default Repair;