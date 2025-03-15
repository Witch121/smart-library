import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy, updateDoc, doc, writeBatch} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface WaitingReservation {
  bookId: string;
  title: string;
  reservedAt: string;
  uid: string;
}

// interface WaitingToReturn {
//   bookId: string;
//   creatorId: string;
//   reason: string;
// }


const WaitingList: React.FC = () => {
   const { adminData, user } = useAuth();
    const navigate = useNavigate();
    const [reservedBooks, setReservedBooks] = useState<WaitingReservation[]>([]);
    // const [afterUserBooks, setAfterUserBooks] = useState<WaitingToReturn[]>([]);
    // const [searchTerm, setSearchTerm] = useState<string>("");
    // const [filter, setFilter] = useState<string>("");
    // const [sortBy, setSortBy] = useState<string>("title");
    const [loading, setLoading] = useState<boolean>(true);
    // const [updatedBook, setUpdatedBook] = useState<Partial<WaitingToReturn>>({});
    // const [editBookId, setEditBookId] = useState<string | null>(null);
    const [reservedBooksCount, setReservedBooksCount] = useState<number>(0);
    // const [reternedBooksCount, setReternedBooksCount] = useState<number>(0);

      useEffect(() => {
        const fetchReservedBooks = async () => {
          if (!adminData) return;
          setLoading(true);
          try {
            const reservedRef = collection(db, "reserve");
            const q = query(reservedRef);
            const querySnapshot = await getDocs(q);
            const reservedData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                bookId: data.bookId || "N/A",
                title: data.title || "N/A",
                uid: data.uid || "N/A",
                reservedAt: data.reservedAt || [],
              } as WaitingReservation;
            });
    
            setReservedBooks(reservedData);
    
            setReservedBooksCount(reservedData.length);
          } catch (error) {
            console.error("Error fetching users: ", error);
          } finally {
            setLoading(false);
          }
        };

        // const fetchAfterUsersBooks = async () => {
        //   if (!adminData) return;
        //   setLoading(true);
        //   try {
        //     const pendingRef = collection(db, "pending");
        //     const q = query(pendingRef, orderBy(sortBy));
        //     const querySnapshot = await getDocs(q);
        //     const pendingData = querySnapshot.docs.map((doc) => {
        //       const data = doc.data();
        //       return {
        //         bookId: data.bookId || "N/A",
        //         creatorId: data.title || "N/A",
        //         reason: data.reservedAt || [],
        //       } as WaitingToReturn;
        //     });
    
        //     setAfterUserBooks(afterUserBooks);
    
        //     setReternedBooksCount(pendingData.length);
        //   } catch (error) {
        //     console.error("Error fetching users: ", error);
        //   } finally {
        //     setLoading(false);
        //   }
        // };
    
        fetchReservedBooks();
        // fetchAfterUsersBooks();
      }, [adminData]);

      const handleLandBookClick = async (book: WaitingReservation) => {
        try {
          const batch = writeBatch(db);
      
          // Reference to the user document
          const userRef = doc(db, "users", book.uid);
          const userSnapshot = await getDocs(query(collection(db, "users"), orderBy("uid")));
      
          if (userSnapshot) {
            const userData = userSnapshot.docs.find((doc) => doc.id === book.uid)?.data();
            const existingCurrentBooks = userData?.currentBook || [];
            const existingReservedBooks = userData?.reservedBooks || [];
      
            // 🔹 Remove bookId from reservedBooks array
            const updatedReservedBooks = existingReservedBooks.filter((bookId: string) => bookId !== book.bookId);
      
            batch.update(userRef, {
              currentBook: [...existingCurrentBooks, book.bookId], // Add to currentBooks
              reservedBooks: updatedReservedBooks, // Remove from reservedBooks
            });
          }
      
          // Delete the document from 'reserve' collection
          const reserveRef = doc(db, "reserve", book.bookId);
          batch.delete(reserveRef);
      
          // Commit the batch to Firestore
          await batch.commit();
      
          // Update the state to reflect the changes
          setReservedBooks((prevBooks) =>
            prevBooks.filter((reservedBook) => reservedBook.bookId !== book.bookId)
          );
      
          setReservedBooksCount((prevCount) => prevCount - 1);
      
          alert("Book moved to current books successfully!");
        } catch (error) {
          console.error("Error updating book status:", error);
          alert("Failed to update book status.");
        }
      };

      const handleUnreserveClick = async (book: WaitingReservation) => {
        try {
          const batch = writeBatch(db);
      
          // Reference to the user document
          const userRef = doc(db, "users", book.uid);
          const userSnapshot = await getDocs(query(collection(db, "users"), orderBy("uid")));
      
          if (userSnapshot) {
            const userData = userSnapshot.docs.find((doc) => doc.id === book.uid)?.data();
            const existingReservedBooks = userData?.reservedBooks || [];
      
            // 🔹 Remove bookId from reservedBooks array
            const updatedReservedBooks = existingReservedBooks.filter((bookId: string) => bookId !== book.bookId);
      
            batch.update(userRef, {
              reservedBooks: updatedReservedBooks, // Remove from reservedBooks
            });
          }
      
          // Delete the document from 'reserve' collection
          const reserveRef = doc(db, "reserve", book.bookId);
          batch.delete(reserveRef);
      
          // Update the 'Availability' field in the 'books' collection
          const bookRef = doc(db, "books", book.bookId);
          batch.update(bookRef, {
            availability: true,
          });
      
          // Commit the batch to Firestore
          await batch.commit();
      
          // Update the state to reflect the changes
          setReservedBooks((prevBooks) =>
            prevBooks.filter((reservedBook) => reservedBook.bookId !== book.bookId)
          );
      
          setReservedBooksCount((prevCount) => prevCount - 1);
      
          alert("Book deleted from reserved books successfully!");
        } catch (error) {
          console.error("Error updating book status:", error);
          alert("Failed to update book status.");
        }
      };

  return (
<div className="container">
      <h1>Waiting list</h1>
      <p>📚 Number of reserved books: {reservedBooksCount}</p>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <table className="library_table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Book ID</th>
              <th>Title</th>
              <th>Reserved at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservedBooks.map((book) => (
              <tr key={book.bookId}>
              <td>{book.uid}</td>
              <td>{book.bookId}</td>
              <td>{book.title}</td>
              <td>{book.reservedAt}</td>
              <td>
                <button onClick={() => handleLandBookClick(book)} className="btn">Hand In</button>
                <button onClick={() => handleUnreserveClick(book)} className="btn">Unreserve</button>
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

export default WaitingList;