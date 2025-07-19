import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");
  let user = localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
  }
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-300 shadow-lg px-4">
      <div className="flex-1">
        {/* This link now correctly points to the tickets page if logged in, or home if not */}
        <Link to={token ? "/tickets" : "/"} className="btn btn-ghost text-xl">
          Ticket AI
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 items-center gap-2">
          {!token ? (
            <>
              <li>
                <Link to="/signup" className="btn btn-sm">
                  Signup
                </Link>
              </li>
              <li>
                <Link to="/login" className="btn btn-sm btn-primary">
                  Login
                </Link>
              </li>
            </>
          ) : (
            <>
              {user?.role === "admin" && (
                <li>
                  <Link to="/admin" className="btn btn-sm btn-ghost">
                    Admin Panel
                  </Link>
                </li>
              )}
              <li>
                <span className="text-accent">Hi, {user?.email}</span>
              </li>
              <li>
                <button onClick={logout} className="btn btn-sm btn-outline btn-error">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
