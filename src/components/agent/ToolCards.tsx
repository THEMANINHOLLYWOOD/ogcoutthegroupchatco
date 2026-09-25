import { Plane, Ticket, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const fmt = (d?: string) => (d ? format(new Date(d), "EEE MMM d, h:mm a") : "");
const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c || "USD", maximumFractionDigits: 0 }).format(n);

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4 space-y-3">{children}</div>;
}

export function ToolCard({ part, onApprove }: { part: any; onApprove: (bookingId: string) => void }) {
  const name = String(part.type).replace("tool-", "");
  if (part.state !== "output-available") {
    if (part.state === "output-error") return <p className="text-sm text-destructive">{part.errorText}</p>;
    const label: Record<string, string> = {
      search_flights: "Searching real flights…",
      search_events: "Finding live events…",
      list_my_trips: "Looking at your trips…",
      get_trip: "Opening trip…",
      prepare_booking: "Checking the fare…",
    };
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {label[name] || "Working…"}
      </div>
    );
  }
  const out = part.output || {};
  if (out.error) return <p className="text-sm text-muted-foreground">{out.error}</p>;

  if (name === "search_flights") {
    return (
      <div className="space-y-2">
        {(out.offers || []).map((o: any) => (
          <Shell key={o.offer_id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plane className="w-4 h-4 text-primary" /> {o.airline}
              </div>
              <div className="text-right">
                <div className="font-semibold">{money(o.per_person, o.currency)}</div>
                <div className="text-xs text-muted-foreground">per person</div>
              </div>
            </div>
            {o.slices.map((s: any, i: number) => (
              <div key={i} className="text-sm text-muted-foreground">
                {s.from} → {s.to} · {fmt(s.depart)} · {s.stops === 0 ? "Nonstop" : `${s.stops} stop`}
              </div>
            ))}
          </Shell>
        ))}
        {!out.offers?.length && <p className="text-sm text-muted-foreground">No flights found.</p>}
      </div>
    );
  }
  if (name === "search_events") {
    return (
      <div className="grid gap-2">
        {(out.events || []).map((e: any, i: number) => (
          <a key={i} href={e.url} target="_blank" rel="noreferrer" className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary transition-colors">
            {e.image ? <img src={e.image} alt="" className="w-16 h-16 rounded-xl object-cover" /> : <Ticket className="w-6 h-6 text-primary m-5" />}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.date} {e.time?.slice(0, 5)}</div>
              <div className="text-xs text-muted-foreground truncate">{e.venue}{e.price_min ? ` · from ${money(e.price_min, e.currency)}` : ""}</div>
            </div>
          </a>
        ))}
        {!out.events?.length && <p className="text-sm text-muted-foreground">No events found for those dates.</p>}
      </div>
    );
  }
  if (name === "list_my_trips") {
    return (
      <div className="grid gap-2">
        {(out.trips || []).map((t: any) => (
          <Link key={t.id} to={`/trip/${t.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="text-sm"><span className="font-medium">{t.destination_city}</span> <span className="text-muted-foreground">· {t.departure_date}</span></div>
          </Link>
        ))}
      </div>
    );
  }
  if (name === "prepare_booking") {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="w-4 h-4 text-primary" /> Approve purchase</div>
        <div className="text-sm text-muted-foreground">
          {out.summary?.airline} · {out.summary?.slices?.map((s: any) => `${s.from}→${s.to}`).join(", ")}
          <br />{out.summary?.names?.join(", ")}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{money(out.amount, out.currency)}</span>
          <Button size="sm" className="rounded-full" onClick={() => onApprove(out.booking_id)}>Approve & pay</Button>
        </div>
        <p className="text-xs text-muted-foreground">Nothing is bought until you pay.</p>
      </Shell>
    );
  }
  return null;
}
