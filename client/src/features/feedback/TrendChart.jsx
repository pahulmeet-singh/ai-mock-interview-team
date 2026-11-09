import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatScore, formatShortDate } from '@/lib/format';

const tick = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 };

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{formatDate(point.createdAt)}</p>
      <p className="tabular font-display text-lg font-semibold">{formatScore(point.score)}</p>
    </div>
  );
}

export function TrendChart({ trend }) {
  const data = trend.map((point) => ({ ...point, label: formatShortDate(point.createdAt) }));
  const description = data.map((d) => `${d.label} ${formatScore(d.score)}`).join(', ');
  return (
    <div role="img" aria-label={`Overall score over time: ${description}`} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickLine={false} axisLine={false} tick={tick} />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="hsl(var(--primary))"
            fillOpacity={0.08}
            dot={{ r: 4, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
