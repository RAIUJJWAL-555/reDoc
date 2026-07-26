import { useUser } from "../context/UserContext";

// Simple dropdown to switch between mock users
// This simulates "logging in" as different users for the demo
export default function UserSelector() {
  const { users, currentUser, setCurrentUser, loading } = useUser();

  if (loading) return <span className="user-selector-loading">Loading users...</span>;

  return (
    <div className="user-selector">
      <label htmlFor="user-select">Logged in as:</label>
      <select
        id="user-select"
        value={currentUser?._id || ""}
        onChange={(e) => {
          const selected = users.find((u) => u._id === e.target.value);
          setCurrentUser(selected);
        }}
      >
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
}
