import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Printer,
  Building2,
  Wrench,
  Boxes,
  FileSpreadsheet,
  Receipt,
  FileCheck2,
  Kanban,
  Users,
  ShieldAlert,
  LogOut,
  ClipboardCheck,
  Calculator,
  PackageCheck,
  Swords,
  Calendar,
  Truck,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Role } from '../../types/index.js';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  roles?: Role[];
}

const navItems: NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'MAGASINIER', 'COMPTABILITE'],
  },
  {
    to: '/ai-assistant',
    labelKey: 'nav.aiCopilot',
    icon: Sparkles,
  },
  {
    to: '/machines',
    labelKey: 'nav.machines',
    icon: Printer,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV', 'MAGASINIER'],
  },
  {
    to: '/clients',
    labelKey: 'nav.clients',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'COMPTABILITE'],
  },
  {
    to: '/audits',
    labelKey: 'nav.audits',
    icon: ClipboardCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL'],
  },
  {
    to: '/tco',
    labelKey: 'nav.tco',
    icon: Calculator,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL'],
  },
  {
    to: '/quotes',
    labelKey: 'nav.quotes',
    icon: FileSpreadsheet,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'COMPTABILITE'],
  },
  {
    to: '/orders',
    labelKey: 'nav.orders',
    icon: PackageCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'COMPTABILITE', 'MAGASINIER'],
  },
  {
    to: '/invoices',
    labelKey: 'nav.invoices',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE'],
  },
  {
    to: '/maintenance',
    labelKey: 'nav.maintenance',
    icon: Wrench,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV'],
  },
  {
    to: '/planning',
    labelKey: 'nav.planning',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV'],
  },
  {
    to: '/inventory',
    labelKey: 'nav.inventory',
    icon: Boxes,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'RESPONSABLE_SAV', 'TECHNICIEN_SAV', 'MAGASINIER'],
  },
  {
    to: '/purchasing',
    labelKey: 'nav.purchasing',
    icon: Truck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MAGASINIER', 'COMPTABILITE', 'DIRECTION'],
  },
  {
    to: '/contracts',
    labelKey: 'nav.contracts',
    icon: FileCheck2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMMERCIAL', 'RESPONSABLE_SAV', 'COMPTABILITE'],
  },
  {
    to: '/competitors',
    labelKey: 'nav.competitors',
    icon: Swords,
    roles: ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL', 'DIRECTION'],
  },
  {
    to: '/crm',
    labelKey: 'nav.crm',
    icon: Kanban,
    roles: ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL', 'DIRECTION'],
  },
  {
    to: '/users',
    labelKey: 'nav.users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    to: '/audit',
    labelKey: 'nav.audit',
    icon: ShieldAlert,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Sliders,
    roles: ['SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'COMPTABILITE'],
  },
];


export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasRole, logout } = useAuth();

  return (
    <aside className="w-64 bg-videojet-blue text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 bg-slate-950/20">
        <div className="w-8 h-8 rounded-lg bg-videojet-orange flex items-center justify-center font-bold text-white shadow-md">
          VJ
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">VIDEOJET</h1>
          <p className="text-[10px] text-cyan-300 font-medium tracking-wider uppercase">
            Maroc Industrial
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.roles && !hasRole(...item.roles)) {
            return null;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-white/10 bg-slate-950/30">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white uppercase">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-cyan-300 font-medium truncate">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};
