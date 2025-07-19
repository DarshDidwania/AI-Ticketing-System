import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="hero min-h-[calc(100vh-100px)] bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Welcome to Ticket AI</h1>
          <p className="py-6">
            The intelligent solution for managing and resolving support tickets. 
            Our AI-powered assistant helps triage, prioritize, and suggest solutions, 
            making your support workflow more efficient than ever.
          </p>
          <Link to="/login" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </div>
  );
}
