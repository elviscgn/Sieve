import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faVideo,
  faMessage,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

export default function HelpPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#0f172a] flex items-center gap-3">
          <FontAwesomeIcon icon={faBookOpen} className="text-primary" />
          Help & Documentation
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Everything you need to get the most out of Sieve
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <FontAwesomeIcon
            icon={faBookOpen}
            className="text-2xl text-primary mb-3"
          />
          <h3 className="font-bold text-[#0f172a] mb-2">Getting Started</h3>
          <p className="text-sm text-[#64748b] mb-4">
            Learn the basics of creating jobs and screening candidates.
          </p>
          <a
            href="#"
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
          >
            Read guide{" "}
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </a>
        </div>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <FontAwesomeIcon
            icon={faVideo}
            className="text-2xl text-primary mb-3"
          />
          <h3 className="font-bold text-[#0f172a] mb-2">Video Tutorials</h3>
          <p className="text-sm text-[#64748b] mb-4">
            Watch step-by-step walkthroughs of key features.
          </p>
          <a
            href="#"
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
          >
            Watch now{" "}
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </a>
        </div>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <FontAwesomeIcon
            icon={faMessage}
            className="text-2xl text-primary mb-3"
          />
          <h3 className="font-bold text-[#0f172a] mb-2">Contact Support</h3>
          <p className="text-sm text-[#64748b] mb-4">
            Need help? Our team is ready to assist you.
          </p>
          <a
            href="#"
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
          >
            Contact us{" "}
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-[#0f172a] mb-1">
              How does AI scoring work?
            </h4>
            <p className="text-sm text-[#64748b]">
              Sieve uses Gemini to evaluate candidates against your custom
              rubric. Each dimension is scored 0-100, and the composite score is
              a weighted average based on your confirmed weights.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0f172a] mb-1">
              Can I edit the rubric after screening starts?
            </h4>
            <p className="text-sm text-[#64748b]">
              No—the rubric is locked once screening begins to ensure fair
              comparison. You can clone a session with a modified rubric if
              needed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0f172a] mb-1">
              What file formats are supported for resumes?
            </h4>
            <p className="text-sm text-[#64748b]">
              PDF files up to 10MB are supported. Our AI extracts structured
              data automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
