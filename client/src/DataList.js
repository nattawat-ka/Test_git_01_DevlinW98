import React, { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from './firebase';


function DataList() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default number of items per page

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "movie"));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          Id: parseInt(doc.data().Id, 10)
        }));

        const sortedItems = items.sort((a, b) => a.Id - b.Id);

        setData(sortedItems);
        setFilteredData(sortedItems);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      try {
        const regex = new RegExp(searchTerm, "i");
        const filtered = data.filter(item =>
          regex.test(item.Title) || regex.test(item.Director) || regex.test(item.Genre)
        );

        const sortedFiltered = filtered.sort((a, b) => a.Id - b.Id);
        setFilteredData(sortedFiltered);
      } catch (error) {
        console.error("Invalid regular expression: ", error);
        setFilteredData([]);
      }
    }
  }, [searchTerm, data]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClick = (item) => {
    setSelectedItem(item);
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(start, end);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div>
      <div className="navbar">
        <h1 className="navbar-title">IMDD</h1>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleChange}
          className="navbar-search"
        />
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        onPageChange={handlePageChange}
      />
      {filteredData.length > 0 ? (
        <div className="card-container">
          {currentItems.map(item => (
            <div key={item.id} className="card" onClick={() => handleClick(item)}>
              <img src={item["URL Picture"]} alt={item.Title} className="card-image" />
              <div className="card-content">
                <h4><b>{item.Title}</b></h4>
                <p><strong>Score:</strong> {item.Score}⭐</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No data found</p>
      )}
      {selectedItem && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedItem.Title}</h2>
            <p><strong>Duration:</strong> {selectedItem.Duration}</p>
            <p><strong>Director:</strong> {selectedItem.Director}</p>
            <p><strong>Genre:</strong> {selectedItem.Genre}</p>
            <p><strong>Description:</strong> {selectedItem.Description}</p>
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const PaginationControls = ({ currentPage, totalPages, itemsPerPage, onItemsPerPageChange, onPageChange }) => {
  return (
    <div className="pagination-controls">
      <select value={itemsPerPage} onChange={onItemsPerPageChange}>
        {[5, 10, 25, 50].map((num) => (
          <option key={num} value={num}>
            {num} items per page
          </option>
        ))}
      </select>
      <div className="pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {[...Array(totalPages).keys()].map((i) => (
          <button
            key={i}
            className={i + 1 === currentPage ? 'active' : ''}
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataList;
