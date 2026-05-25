import { ArrowUpRight } from 'lucide-react';

const STATS = [
  { label: 'Conversations',   value: '340',      delta: '+12% vs last week' },
  { label: 'Automation rate', value: '87%',       delta: '+4 pts' },
  { label: 'M-Pesa volume',   value: 'KES 184k',  delta: '+KES 22k' },
  { label: 'Time saved',      value: '26 hrs',    delta: '≈ 3 work days' },
];

const CHART = [
  { day: 'Mon', height: 40 },
  { day: 'Tue', height: 65 },
  { day: 'Wed', height: 55 },
  { day: 'Thu', height: 78 },
  { day: 'Fri', height: 92 },
  { day: 'Sat', height: 88 },
  { day: 'Sun', height: 35 },
];

export default function DashboardPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, Asha 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Here&apos;s how your AI assistants performed this week.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        {STATS.map((s) => (
          <div key={s.label} className="p-5 rounded-lg bg-card border">
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">
              {s.label}
            </div>
            <div className="text-[28px] font-semibold tracking-tight text-foreground">
              {s.value}
            </div>
            <div className="text-[12px] mt-1.5 flex items-center gap-1 text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3.5">
        <div className="p-5 rounded-lg bg-card border">
          <div className="text-sm font-semibold mb-4 flex items-center justify-between">
            Conversations this week
            <span className="text-xs text-muted-foreground font-normal">
              Mon–Sun · all channels
            </span>
          </div>
          <div className="h-[200px] flex items-end gap-1.5 py-2">
            {CHART.map((b) => (
              <div
                key={b.day}
                className="flex-1 rounded-t relative min-h-[4px] hover:opacity-70 transition-opacity bg-primary/80"
                style={{ height: `${b.height}%` }}
              >
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                  {b.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-lg bg-card border">
          <div className="text-sm font-semibold mb-3">Recent activity</div>
          <ActivityItem dot="success" name="Wanjiku K." action="paid KES 500 deposit" meta="2 min ago · Salon booking" />
          <ActivityItem dot="primary" name="Mary N." action="requested human handoff" meta="17 min ago · Asked for owner" />
          <ActivityItem dot="info" name="Aisha S." action="new contact added" meta="1 hour ago · First WhatsApp" />
          <ActivityItem dot="success" name="Peter M." action="paid KES 1,200" meta="2 hours ago · Repeat customer" last />
        </div>
      </div>
    </>
  );
}

function ActivityItem({
  dot,
  name,
  action,
  meta,
  last,
}: {
  dot: 'success' | 'primary' | 'info';
  name: string;
  action: string;
  meta: string;
  last?: boolean;
}) {
  const dotColor = {
    success: 'bg-emerald-500',
    primary: 'bg-primary',
    info: 'bg-sky-500',
  }[dot];

  return (
    <div className={`flex items-start gap-3 py-3 text-sm ${last ? '' : 'border-b'}`}>
      <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
      <div className="flex-1 leading-relaxed">
        <span className="font-medium">{name}</span> {action}
        <div className="text-muted-foreground text-xs mt-0.5">{meta}</div>
      </div>
    </div>
  );
}
