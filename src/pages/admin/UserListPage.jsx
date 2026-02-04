import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase-config";
import "./userlistpage.css";

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all"); // all | student | counselor | moderator
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // If your users collection doesn't have createdAt, remove orderBy
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        setUsers(list);
      },
      (err) => {
        console.error("Failed to load users:", err);
      }
    );

    return () => unsub();
  }, []);

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();

    return users
      .filter((u) => {
        if (roleFilter === "all") return true;
        return (u.role || "").toLowerCase() === roleFilter;
      })
      .filter((u) => {
        if (!s) return true;
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        return name.includes(s) || email.includes(s) || username.includes(s);
      });
  }, [users, roleFilter, search]);

  const counts = useMemo(() => {
    const c = { all: users.length, student: 0, counselor: 0, moderator: 0 };
    users.forEach((u) => {
      const r = (u.role || "").toLowerCase();
      if (r === "student") c.student++;
      if (r === "counselor") c.counselor++;
      if (r === "moderator") c.moderator++;
    });
    return c;
  }, [users]);

  return (
    <div className="userlist-page">
        <div className="userlist-header">
        <div>
            <button className="btn btn-sm btn-outline-danger btn-back-dashboard" onClick={() => navigate("/admin/admin-dashboard")}>
            ← Back to Dashboard
            </button>
        </div>

        <h2>User List</h2>
        <p className="userlist-subtitle">
            Manage Student, Counselor, and Moderator accounts.
        </p>
        </div>


      <div className="userlist-controls">
        <input
          className="userlist-search"
          type="text"
          placeholder="Search by name / email / username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="userlist-filters">
          <button
            className={roleFilter === "all" ? "active" : ""}
            onClick={() => setRoleFilter("all")}
          >
            All ({counts.all})
          </button>
          <button
            className={roleFilter === "student" ? "active" : ""}
            onClick={() => setRoleFilter("student")}
          >
            Students ({counts.student})
          </button>
          <button
            className={roleFilter === "counselor" ? "active" : ""}
            onClick={() => setRoleFilter("counselor")}
          >
            Counselors ({counts.counselor})
          </button>
          <button
            className={roleFilter === "moderator" ? "active" : ""}
            onClick={() => setRoleFilter("moderator")}
          >
            Moderators ({counts.moderator})
          </button>
        </div>
      </div>

      <div className="userlist-table-wrap">
        <table className="userlist-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || u.username || "-"}</td>
                  <td>{u.email || "-"}</td>
                  <td>
                  <span className={`role ${u.role?.toLowerCase()}`}>
                      {u.role}
                  </span>
                  </td>
                  <td>
                  <span className={`status ${u.status}`}>
                     {u.status}
                  </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserListPage;
