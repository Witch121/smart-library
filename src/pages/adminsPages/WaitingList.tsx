import React, { useEffect, useState } from "react";
import { useAuth } from "../components/userInfo";
import { db } from "../../firebase/firebase";
import { collection, query, getDocs, orderBy, updateDoc, doc, writeBatch} from "firebase/firestore";

interface WaitingReservation {
  bookId: string;
  title: string;
  reservedAt: string;
  uid: string;
}

interface WaitingToReturn {
  bookId: string;
  creatorId: string;
  reason: string;
}


const WaitingList: React.FC = () => {
   const { adminData, user } = useAuth();
    const [reservedBooks, setReservedBooks] = useState<WaitingReservation[]>([]);
    const [afterUserBooks, setAfterUserBooks] = useState<WaitingToReturn[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [reservedBooksCount, setReservedBooksCount] = useState<number>(0);
    const [reternedBooksCount, setReternedBooksCount] = useState<number>(0);

      useEffect(() => {
        const fetchReservedBooks = async () => {
          if (!adminData) return;
          setLoading(true);
          if(user){
            console.log("user", user.uid);
          }
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

        const fetchAfterUsersBooks = async () => {
          if (!adminData) return;
          setLoading(true);
          try {
            const pendingRef = collection(db, "pending");
            const q = query(pendingRef);
            const querySnapshot = await getDocs(q);
            const pendingData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                bookId: data.bookId || "N/A",
                creatorId: data.creatorId || "N/A",
                reason: data.reason || "N/A", // Corrected typo from 'reson' to 'reason'
              } as WaitingToReturn;
            });
        
            setAfterUserBooks(pendingData); // Corrected line
            setReternedBooksCount(pendingData.length);
          } catch (error) {
            console.error("Error fetching users: ", error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchReservedBooks();
        fetchAfterUsersBooks();
      }, [adminData, user]);

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

      const handleTakeBackBookClick = async (book: WaitingToReturn) => {
        try {
          const batch = writeBatch(db);
      
          // Delete the document from 'pending' collection
          const pendingRef = doc(db, "pending", book.bookId);
          batch.delete(pendingRef);
      
          // Update the 'Availability' field in the 'books' collection
          const bookRef = doc(db, "books", book.bookId);
          batch.update(bookRef, {
            availability: true,
          });

          const userRef = doc(db, "users", book.creatorId);
          if (userRef) {
            const userData = (await getDocs(query(collection(db, "users"), orderBy("uid")))).docs.find(
              (doc) => doc.id === book.creatorId
            )?.data();
            const existingReadingHistory = userData?.ReadingHistory || [];
            const updatedReadingHistory = [...existingReadingHistory, book.bookId];
      
            batch.update(userRef, {
              ReadingHistory: updatedReadingHistory,
            });
          };
      
          // Commit the batch to Firestore
          await batch.commit();
      
          // Update the state to reflect the changes
          setAfterUserBooks((prevBooks) =>
            prevBooks.filter((afterUserBooks) => afterUserBooks.bookId !== book.bookId)
          );
      
          setReternedBooksCount((prevCount) => prevCount - 1);
      
          alert("Book returned successfully and marked as available!");
        } catch (error) {
          console.error("Error updating book status:", error);
          alert("Failed to update book status.");
        }
      };
      
      const handleNotOKClick = async (book: WaitingToReturn) => {
        const reportDamage = window.confirm("Do you want to report damage by the user?");
        let damageMessage = "";

        if (reportDamage) {
          // Prompt for a message about the user
          damageMessage = prompt("Enter a message about the user:") || "";
          if (!damageMessage) {
        alert("No message entered. Proceeding without user notes.");
          } else {
        try {
          const userRef = doc(db, "users", book.creatorId);

          // Update the user's document with the damage message
          await updateDoc(userRef, {
            notes: damageMessage,
          });

          alert("Damage report saved successfully!");
        } catch (error) {
          console.error("Error saving damage report:", error);
          alert("Failed to save damage report.");
        }
          }
        }

        // Proceed with the normal "take back" process
        const notes = prompt("Enter notes for the damaged book:") || "";
        if (!notes) {
          alert("No notes entered. Proceeding without book notes.");
        }

        try {
          const pendingRef = doc(db, "pending", book.bookId);
          await updateDoc(pendingRef, {
            creatorId: user?.uid || "Admin",
            reason: "damaged",
            notes: notes,
            createdAt: new Date().toISOString(),
          });

          alert("Book marked as damaged with notes.");
        } catch (error) {
          console.error("Error updating pending book status:", error);
          alert("Failed to mark book as damaged.");
        }
      };
      
  return (
    <div className="container">
      <h1>Waiting list</h1>
      <p>📚 Number of reserved books: {reservedBooksCount}</p>
      <p>📚 Number of books waiting to be returned: {reternedBooksCount}</p>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
        <h2>Reserved Books</h2>
          <table className="library_table resrve">
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

        <h2>Books waiting after returning</h2>
        <table className="library_table return">
          <thead>
            <tr>
              <th>UID</th>
              <th>Book ID</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {afterUserBooks.map((book) => (
              <tr key={book.bookId}>
              <td>{book.creatorId}</td>
              <td>{book.bookId}</td>
              <td>{book.reason}</td>
              <td>
                <button onClick={() => handleTakeBackBookClick(book)} className="btn">take back</button>
                <button onClick={() => handleNotOKClick(book)} className="btn">NOT OK</button>
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