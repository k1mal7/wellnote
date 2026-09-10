import { Pause } from "lucide-react";

export default function ClientHoldBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"><Pause size={12} aria-hidden="true" />On hold</span>;
}
