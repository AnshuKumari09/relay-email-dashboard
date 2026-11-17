export const CLASSES = {
  assistant: ["Assistant to reply", "--as"],
  client: ["Client to reply", "--cl"],
  none: ["No reply needed", "--no"],
  review: ["Needs review", "--rv"]
};
export const SOURCE = { groq: "Groq AI", rules: "Rule-based fallback", manual: "Set by you" };

export default function Chip({ e }) {
  const [label, color] = CLASSES[e.cls] || CLASSES.review;
  return (
    <span className="chip" style={{ color: `var(${color})` }}>
      <i /> {label}{e.manual ? " ✎" : ""}
    </span>
  );
}
