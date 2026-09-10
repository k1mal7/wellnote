import { Pause } from "lucide-react";

export default function ClientHoldBadge() {
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><Pause size={12} aria-hidden="true" />On hold</span>;
}
