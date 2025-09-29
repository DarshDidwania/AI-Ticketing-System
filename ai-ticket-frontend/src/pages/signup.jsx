import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State to hold specific error messages
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // --- DEBUGGING STEP ---
      // We are temporarily hardcoding the URL to verify the connection.
      // If this works, the problem is with your frontend's .env file.
      // The original line was:
      // const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/signup`, {
      
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        // Set the specific error message from the backend
        setError(data.error || "An unknown error occurred.");
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleSignup} className="card-body">
          <h2 className="card-title justify-center text-2xl">Create Account</h2>

          {/* Display error message here */}
          {error && (
            <div role="alert" className="alert alert-error text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
            <input type="email" name="email" placeholder="Email" className="input input-bordered" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Password</span></label>
            <input type="password" name="password" placeholder="Password" className="input input-bordered" value={form.password} onChange={handleChange} required />
          </div>

          <div className="form-control mt-6">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : "Create Account"}
            </button>
          </div>

          <div className="text-center mt-4">
            <p>Already have an account?{" "}
              <Link to="/login" className="link link-primary">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
