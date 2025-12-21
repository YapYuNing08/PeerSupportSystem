import React from "react";

function AdminStats() {
  const stats = [
    { label: "Total Students", count: 10, icon: "🎓", color: "#fce4ec" },
    { label: "Total Counselors", count: 10, icon: "📋", color: "#fce4ec" },
    { label: "Pending Approvals", count: 10, icon: "👥", color: "#fce4ec" },
  ];

  return (
    <div className="row mb-4">
      {stats.map((stat, index) => (
        <div className="col-md-4" key={index}>
          <div className="card text-center p-3 shadow-sm border-0" style={{ backgroundColor: stat.color }}>
            <div style={{ fontSize: "2rem" }}>{stat.icon}</div>
            <h3 className="my-2">{stat.count}</h3>
            <p className="text-muted mb-0">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminStats;