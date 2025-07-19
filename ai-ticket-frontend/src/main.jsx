import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CheckAuth from "./components/check-auth.jsx";
import Tickets from "./pages/tickets.jsx";
import TicketDetailsPage from "./pages/ticket.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import Admin from "./pages/admin.jsx";
import HomePage from "./pages/home.jsx"; // Import the new Home Page

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* Public Route */}
          <Route index element={<HomePage />} />
          
          {/* Protected Routes */}
          <Route
            path="tickets" // The main tickets page is now at /tickets
            element={
              <CheckAuth protected={true}>
                <Tickets />
              </CheckAuth>
            }
          />
          <Route
            path="tickets/:id"
            element={
              <CheckAuth protected={true}>
                <TicketDetailsPage />
              </CheckAuth>
            }
          />
          <Route
            path="admin"
            element={
              <CheckAuth protected={true}>
                <Admin />
              </CheckAuth>
            }
          />

          {/* Public-Only Routes */}
          <Route
            path="login"
            element={
              <CheckAuth protected={false}>
                <Login />
              </CheckAuth>
            }
          />
          <Route
            path="signup"
            element={
              <CheckAuth protected={false}>
                <Signup />
              </CheckAuth>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
