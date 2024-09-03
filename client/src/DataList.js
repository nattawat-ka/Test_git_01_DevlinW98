import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

function DataList() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Query Firestore to get data sorted by 'Id'
        const q = query(collection(db, "movie"));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          Id: Number(doc.data().Id) // Convert Id to a number
        }));
        // Sort the items by Id in ascending order
        items.sort((a, b) => a.Id - b.Id);
        setData(items);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Firestore Data Sorted by ID</h1>
      {data.length > 0 ? (
        <ul>
          {data.map(item => (
            <li key={item.id}>
              <img src={item["URL Picture"]} alt={item.Title} style={{ width: "100px", height: "150px" }} />
              <h2>{item.Title} ({item.Id})</h2>
              <p><strong>Director:</strong> {item.Director}</p>
              <p><strong>Genre:</strong> {item.Genre}</p>
              <p><strong>Duration:</strong> {item.Duration}</p>
              <p><strong>Score:</strong> {item.Score}</p>
              <p>{item.Description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No data found</p>
      )}
    </div>
  );
}

export default DataList;
