import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatMinutes } from '../../utils/formatters';

const MiniStudyChart = ({
  data = [],
  height = 80,
  color = '#16423C',
  showAxes = false,
}) => {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -25 }}
      >
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {showAxes && (
          <>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6A9C89' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6A9C89' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
            />
          </>
        )}

        <Tooltip
          formatter={(v) => [formatMinutes(v), 'Study time']}
          labelFormatter={(l) => l}
          contentStyle={{
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            fontSize: '12px',
            padding: '8px 12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        />

        <Area
          type="monotone"
          dataKey="minutes"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#miniGrad)"
          dot={false}
          activeDot={{
            r: 5,
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MiniStudyChart;