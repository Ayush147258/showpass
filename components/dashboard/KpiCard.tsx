import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number; // percentage vs last period
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  suffix?: string;
}

export function KpiCard({
  title, value, change, icon: Icon,
  iconColor = "text-accent", iconBg = "bg-accent/15",
  suffix,
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="stat-card bg-white/3 border-white/8 hover:border-white/15 transition-all duration-200">
      {/* Subtle glow on top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
            isPositive && "bg-teal-500/15 text-teal-400",
            isNegative && "bg-red-500/15 text-red-400",
            !isPositive && !isNegative && "bg-white/8 text-white/50",
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> :
             isNegative ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-2xl font-clash font-bold text-white mb-1">
        {value}{suffix && <span className="text-lg text-white/50 ml-0.5">{suffix}</span>}
      </p>
      <p className="text-xs text-white/45 font-medium">{title}</p>
    </div>
  );
}
