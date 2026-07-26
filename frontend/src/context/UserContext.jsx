import { createContext, useContext, useState, useEffect } from "react";

// Create a context to share the "logged in" user across all components
const UserContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Provider wraps the entire app and manages which user is selected
export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all seeded users from the backend on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`);
        const data = await res.json();
        setUsers(data);
        // Default to the first user if none selected yet
        if (data.length > 0) {
          setCurrentUser(data[0]);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for easy access to the user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
