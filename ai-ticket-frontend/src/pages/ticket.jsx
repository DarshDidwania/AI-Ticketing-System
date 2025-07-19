import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

/**
 * Renders the detailed view for a single ticket.
 */
export default function TicketDetailsPage() {
  const { id } = useParams(); // Get ticket ID from the URL
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Server responded with ${res.status}`);
        }

        const data = await res.json();
        setTicket(data.ticket);
      } catch (err) {
        console.error("Failed to fetch ticket details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, token]);

  if (loading) {
    return <div className="text-center p-10"><span className="loading loading-lg loading-spinner"></span></div>;
  }

  if (error) {
    return <div role="alert" className="alert alert-error max-w-xl mx-auto mt-10">{error}</div>;
  }

  if (!ticket) {
    return <div className="text-center p-10">Ticket not found.</div>;
  }

  // Helper to format priority with color
  const priorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return <div className="badge badge-error gap-2">High</div>;
      case 'medium': return <div className="badge badge-warning gap-2">Medium</div>;
      case 'low': return <div className="badge badge-info gap-2">Low</div>;
      default: return <div className="badge badge-ghost gap-2">N/A</div>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/tickets" className="btn btn-ghost">
          &larr; Back to All Tickets
        </Link>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h1 className="card-title text-3xl">{ticket.title}</h1>
            <div className="flex flex-col items-end gap-2">
                <div className="badge badge-outline">{ticket.status || 'SUBMITTED'}</div>
                {priorityBadge(ticket.priority)}
            </div>
          </div>
          
          <p className="text-sm opacity-60 mb-6">
            Created on: {new Date(ticket.createdAt).toLocaleString()}
          </p>

          {/* Main Content */}
          <div className="divider">Description</div>
          <p className="bg-base-100 p-4 rounded-lg whitespace-pre-wrap">{ticket.description}</p>
          
          {/* AI Analysis Section */}
          {ticket.helpfulNotes && (
            <>
              <div className="divider">AI Analysis</div>
              <div className="bg-base-100 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold">Helpful Notes from AI:</h3>
                <div className="prose max-w-none">
                  <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
                </div>
              </div>
            </>
          )}

          {/* Details Section */}
          <div className="divider">Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-100 p-4 rounded-lg">
            <div>
              <h3 className="font-semibold mb-2">Assigned To:</h3>
              <p>{ticket.assignedTo?.email || 'Not yet assigned'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Related Skills:</h3>
              {ticket.relatedSkills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ticket.relatedSkills.map(skill => (
                    <div key={skill} className="badge badge-neutral">{skill}</div>
                  ))}
                </div>
              ) : <p>None identified</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
