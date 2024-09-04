import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

function DataList() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "movie"));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          Id: parseInt(doc.data().Id, 10) // Convert Id to a number
        }));

        // Sort data by numeric Id
        const sortedItems = items.sort((a, b) => a.Id - b.Id);

        setData(sortedItems);
        setFilteredData(sortedItems); // Initially display all sorted data
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data); // Show all data if search term is empty
    } else {
      try {
        const regex = new RegExp(searchTerm, "i"); // 'i' for case-insensitive search
        const filtered = data.filter(item =>
          regex.test(item.Title) || regex.test(item.Director) || regex.test(item.Genre)
        );

        // Ensure filtered data is still sorted by numeric Id
        const sortedFiltered = filtered.sort((a, b) => a.Id - b.Id);
        setFilteredData(sortedFiltered);
      } catch (error) {
        console.error("Invalid regular expression: ", error);
        setFilteredData([]); // If regex is invalid, show no results
      }
    }
  }, [searchTerm, data]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <h1>Firestore Data Sorted by ID</h1>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleChange}
        style={{ marginBottom: "20px", padding: "10px", width: "300px" }}
      />
      {filteredData.length > 0 ? (
        <ul>
          {filteredData.map(item => (
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
