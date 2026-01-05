import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getOpenIssues, resolveIssue } from "../../models/TechnicalIssue";

function TechnicalIssuesPage() {
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getOpenIssues();
    setIssues(data);
  };

  const handleResolve = async (id) => {
    const notes = prompt("Enter resolution details:");
    if (notes) {
      await resolveIssue(id, notes);
      toast.success("Issue resolved!");
      fetchData(); 
    }
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.headerContainer}>
        <button 
          onClick={() => navigate("/admin/admin-dashboard")}
          className="btn btn-sm btn-outline-danger" 
          style={{ marginBottom: "10px", backgroundColor: "white" }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontWeight: "bold", color: "black", margin: "10px 0" }}>
          Technical Support Issues
        </h1>
      </div>

      <div className="card shadow-sm" style={styles.card}>
        <div className="card-body">
          {issues.length === 0 ? (
            <p className="text-muted text-center">No open technical issues reported.</p>
          ) : (
            <table className="table table-hover" style={{ width: "100%", tableLayout: "fixed" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "25%" }}>Student ID</th>
                  <th style={{ width: "15%" }}>Category</th>
                  <th style={{ width: "45%" }}>Description</th>
                  <th style={{ width: "15%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td style={{ wordBreak: "break-all" }}>{issue.studentID}</td>
                    <td><span className="badge bg-warning text-dark">{issue.category}</span></td>
                    <td>{issue.description}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-success" 
                        onClick={() => handleResolve(issue.id)}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#e0f7fa", 
    minHeight: "100vh",
    padding: "40px 20px", 
  },
  headerContainer: {
    textAlign: "center",
    marginBottom: "30px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "15px",
    padding: "20px",
    width: "90%",
    maxWidth: "1200px",  
    margin: "0 auto", 
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
  }
};

export default TechnicalIssuesPage;