import { Navigate } from "react-router-dom";

function CheckAuth({ children, protected: isProtectedRoute }) {
  const token = localStorage.getItem("token");

  if (isProtectedRoute) {
    // If trying to access a protected route without a token, redirect to login
    if (!token) {
      return <Navigate to="/login" replace />;
    }
  } else {
    // If trying to access a public-only route (login/signup) with a token,
    // redirect to the main tickets page.
    if (token) {
      return <Navigate to="/tickets" replace />;
    }
  }

  return children;
}

export default CheckAuth;
