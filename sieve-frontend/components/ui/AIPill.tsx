import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

export default function AIPill({ className = "" }: { className?: string }) {
  return (
    <span className={`bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${className}`}>
      <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[8px]" /> AI
    </span>
  );
}