import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileContract, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-4xl mx-auto mb-6">
          <FontAwesomeIcon icon={faFileContract} />
        </div>
        <h1 className="text-5xl font-extrabold text-[#0f172a] mb-2">404</h1>
        <p className="text-lg text-[#475569] mb-6">Page not found</p>
        <p className="text-sm text-[#94a3b8] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-md hover:bg-primary-dark transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
