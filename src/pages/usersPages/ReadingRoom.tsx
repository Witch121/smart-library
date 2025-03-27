import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { getDoc, doc, writeBatch} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// reserved books as list + btn "delete"
// current books as list + btn "hand in"
interface ActiveReservation {
  bookId: string;
  title: string;
  uid: string;
}

interface CurrentBooks {
  bookId: string;
  title: string;
}
const ReadingRoom: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservedBooks, setReservedBooks] = useState<ActiveReservation[]>([]);
  const [currentBooks, setCurrentBooks] = useState<CurrentBooks[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reservedBooksCount, setReservedBooksCount] = useState<number>(0);
  const [currentBooksCount, setCurrentBooksCount] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
        
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
                };
              }
              return { bookId, title: "Unknown Title" }; // Fallback if book not found
            })
          );

          setReservedBooks(reservedBooksWithTitles);
          setReservedBooksCount(reservedBooksWithTitles.length || 0);

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
                };
              }
              return { bookId, title: "Unknown Title" }; // Fallback if book not found
            })
          );

          setCurrentBooks(currentBooksWithTitles);
          setCurrentBooksCount(currentBooksWithTitles.length || 0);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [user]);

  const handleUnreserveClick = async (book: ActiveReservation) => {
    if (!user) {
      alert("Please login to unreserve a book.");
      navigate("/login");
      return;
    }
    try {
      const batch = writeBatch(db);
  
      // Reference to the user's document
      const userRef = doc(db, "users", user.uid);
  
      // Remove the bookId from the reservedBooks array
      const updatedReservedBooks = reservedBooks
        .filter((b) => b.bookId !== book.bookId)
        .map((b) => b.bookId); // Keep only the bookId
  
      batch.update(userRef, {
        reservedBooks: updatedReservedBooks, // Update Firestore with only book IDs
      });
  
      // Delete the document from the reserve collection
      const reserveRef = doc(db, "reserve", book.bookId);
      batch.delete(reserveRef);
  
      // Mark the book as available in the books collection
      const bookRef = doc(db, "books", book.bookId);
      batch.update(bookRef, {
        availability: true,
      });
  
      // Commit the batch
      await batch.commit();
  
      // Update the state
      setReservedBooks((prevBooks) => prevBooks.filter((b) => b.bookId !== book.bookId));
      setReservedBooksCount((prevCount) => prevCount - 1);
  
      alert("Book unreserved successfully!");
    } catch (error) {
      console.error("Error unreserving book:", error);
      alert("Failed to unreserve book.");
    }
  };

  const handleReturnBookClick = async (book: CurrentBooks) => {
    if (!user) {
      alert("Please login to return a book.");
      navigate("/login");
      return;
    }
    try {
      const batch = writeBatch(db);
  
      const userRef = doc(db, "users", user.uid);

      // Remove the bookId from the currentBook array
      const updatedCurrentBooks = currentBooks
        .filter((b) => b.bookId !== book.bookId)
        .map((b) => b.bookId); // Keep only the bookId

      batch.update(userRef, {
        currentBook: updatedCurrentBooks, // Update Firestore with only book IDs
      });
  
      const pendingRef = doc(db, "pending", book.bookId);
      batch.set(pendingRef, {
        creatorId: user.uid,
        bookId: book.bookId,
        reason: "return",
        notes: prompt("Enter notes for the book:") || "",
        createdAt: new Date().toISOString(),
      });
  
      await batch.commit();
  
      setCurrentBooks((prevBooks) => prevBooks.filter((b) => b.bookId !== book.bookId));
      setCurrentBooksCount((prevCount) => prevCount - 1);
  
      alert("Book returned successfully!");
    } catch (error) {
      console.error("Error returning book:", error);
      alert("Failed to return book.");
    }
  };

  return (
    <div className="container">
      <h1>Reading room page</h1>
      <p>📚 Number of reserved books: {reservedBooksCount}</p>
      <p>📚 Number of current books: {currentBooksCount}</p>

      {loading ? (
      <p>Loading data...</p>
      ) : (
        <>
        <h2>Reserved Books</h2>
        <table className="library_table reserve">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservedBooks.map((book) => (
                <tr key={book.bookId}>
                  <td>{book.bookId}</td>
                  <td>{book.title}</td>
                  <td>
                    <button onClick={() => handleUnreserveClick(book)} className="btn">Unreserve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        <h2>Current Books</h2>
        <table className="library_table current">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBooks.map((book) => (
              <tr key={book.bookId}>
                <td>{book.bookId}</td>
                <td>{book.title}</td>
                <td>
                  <button onClick={() => handleReturnBookClick(book)} className="btn">Return</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default ReadingRoom;