import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { formatScore } from '@/lib/format';

// Charts are drawn in SVG, so they carry a text description for screen readers.
export function SkillRadar({ data }) {
  const description = data.map((d) => `${d.label} ${formatScore(d.value)}`).join(', ');
  return (
    <div role="img" aria-label={`Average score for each criterion: ${description}`} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="short" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.16} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
