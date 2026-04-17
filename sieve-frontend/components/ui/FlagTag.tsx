type FlagType = "Overqualified" | "Underexperienced" | "SkillMismatch" | "Low Confidence" | "CareerGap";

const flagStyles: Record<FlagType, string> = {
  Overqualified: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Underexperienced: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
  SkillMismatch: "bg-[#fef9c3] text-[#854d0e] border-[#fde68a]",
  "Low Confidence": "bg-[#fef9c3] text-[#92400e] border-[#fde68a]",
  CareerGap: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]",
};

export default function FlagTag({ flag }: { flag: FlagType }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${flagStyles[flag]}`}>
      {flag}
    </span>
  );
}