import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Renders the main page for creating new tickets and viewing a list of existing tickets.
 */
export default function TicketsPage() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const token = localStorage.getItem("token");

  // Fetches the list of tickets from the backend
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("Could not fetch existing tickets. Is the server running correctly?");
    }
  };

  // Fetch tickets when the component first loads
  useEffect(() => {
    setError(null);
    fetchTickets();
  }, []);

  // Handles changes to the form inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handles the submission of the new ticket form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Ticket created successfully! The AI is analyzing it now.");
        setForm({ title: "", description: "" });
        setTimeout(() => {
            setSuccess(null);
            fetchTickets();
        }, 2000); // Clear success message and refresh list
      } else {
        setError(data.message || "Ticket creation failed on the server.");
      }
    } catch (err) {
      setError("Error creating ticket. Is the server running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Ticket</h1>
      
      <div className="card bg-base-200 shadow-xl mb-10">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Ticket Title</span></label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Login button not working"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Describe your issue in detail</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Please provide steps to reproduce the issue, what you expected to happen, and what actually happened."
                className="textarea textarea-bordered w-full h-32"
                required
              ></textarea>
            </div>
            
            {success && <div role="alert" className="alert alert-success text-sm">{success}</div>}
            {error && <div role="alert" className="alert alert-error text-sm">{error}</div>}

            <div className="card-actions justify-end">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="divider"></div>

      <h2 className="text-2xl font-bold mb-6 text-center">Your Submitted Tickets</h2>
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Link
              key={ticket._id}
              className="card bg-base-100 shadow-md hover:bg-base-300 transition-all duration-300 transform hover:-translate-y-1"
              to={`/tickets/${ticket._id}`}
            >
              <div className="card-body">
                <h3 className="card-title">{ticket.title}</h3>
                <p className="text-sm opacity-70 line-clamp-2">{ticket.description}</p>
                <div className="card-actions justify-end items-center mt-2">
                    <span className="text-xs opacity-60">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                    <div className="badge badge-outline">{ticket.status || 'SUBMITTED'}</div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center opacity-60 p-10">
            <p>You haven't submitted any tickets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
