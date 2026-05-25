'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Inbox,
  Network,
  FileText,
  TrendingUp,
  Plug,
  Users,
  CreditCard,
  Settings,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const WORKSPACE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/templates', label: 'Templates', icon: Sparkles, badge: '6' },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: '12' },
  { href: '/builder', label: 'Workflows', icon: Network },
  { href: '/knowledge', label: 'Knowledge base', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/integrations', label: 'Integrations', icon: Plug },
];

const SETTINGS_NAV: NavItem[] = [
  { href: '/team', label: 'Team', icon: Users },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/');

  const Icon = item.icon;
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={item.href as any}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px]',
        'transition-colors',
        isActive
          ? 'bg-bg-elev2 text-text'
          : 'text-text-dim hover:bg-bg-elev1 hover:text-text',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-accent' : 'text-text-mute',
        )}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-accent/10 text-accent">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[248px] shrink-0 border-r border-border bg-bg flex flex-col overflow-y-auto">
      <div className="p-4 pb-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-2.5 mb-3">
          <div
            className="h-[30px] w-[30px] rounded-[8px] flex items-center justify-center text-[15px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #fcb13a 0%, #f97316 100%)',
              color: '#1a0f00',
              boxShadow:
                '0 0 0 1px rgba(252,177,58,0.2), 0 2px 8px rgba(252,177,58,0.15)',
            }}
          >
            P
          </div>
          <div className="text-[15px] font-semibold tracking-tight">
            Prune<span className="text-accent">.</span>ai
          </div>
        </div>

        {/* Workspace selector */}
        <button className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-border bg-bg-elev1 hover:border-border-strong transition-colors group">
          <div className="flex items-center gap-2">
            <div className="h-[22px] w-[22px] rounded-md bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-[11px] font-semibold">
              AS
            </div>
            <div className="text-left">
              <div className="text-[13px] font-medium leading-tight">
                Asha Salon
              </div>
              <div className="text-[11px] text-text-mute leading-tight">
                Starter · Westlands
              </div>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-text-mute" />
        </button>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        <div className="text-[11px] uppercase tracking-wider text-text-faint font-medium px-2.5 pt-2 pb-1.5">
          Workspace
        </div>
        {WORKSPACE_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <div className="text-[11px] uppercase tracking-wider text-text-faint font-medium px-2.5 pt-4 pb-1.5">
          Settings
        </div>
        {SETTINGS_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Usage card */}
      <div className="border-t border-border p-3 mt-3">
        <div className="flex justify-between text-[11px] text-text-mute mb-1.5">
          <span>Messages this month</span>
          <span className="text-text font-medium">340 / 1k</span>
        </div>
        <div className="h-1 bg-bg-elev2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: '34%',
              background:
                'linear-gradient(90deg, #fcb13a 0%, #f97316 100%)',
            }}
          />
        </div>
      </div>
    </aside>
  );
}
