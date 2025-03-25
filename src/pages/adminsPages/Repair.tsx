import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { useAuth } from "../components/userInfo";

interface Book {
  id: string;
  creatorId: string;
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
            console.log("user", user.uid);
          }
          try {
      const pendingCollection = collection(db, "pending");
      const q = query(pendingCollection, where("reason", "==", "damaged"));
      const querySnapshot = await getDocs(q);

      const damagedBooks: Book[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        creatorId: doc.data().creatorId,
        reason: doc.data().reason,
        createdAt: new Date(doc.data().createdAt).toLocaleString(),
      }));

      setBooks(damagedBooks);
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
              <th>UID</th>
              <th>Book ID</th>
              <th>Title</th>
              <th>Marked as damaged</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.creatorId}</td>
                <td>{book.id}</td>
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