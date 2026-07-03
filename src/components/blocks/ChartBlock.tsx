import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

const data = [
  { name: "Jan", value: 40 },
  { name: "Fev", value: 30 },
  { name: "Mar", value: 55 },
  { name: "Abr", value: 25 },
  { name: "Mai", value: 70 },
];
const colors = ["#5da8ff", "#b48cff", "#66d9c2", "#ffb861", "#ff7d9c"];

export function ChartBlock({ kind }: { kind: "chart-bar" | "chart-line" | "chart-pie" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {kind === "chart-bar" ? (
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip />
          <Bar dataKey="value" fill="#5da8ff" />
        </BarChart>
      ) : kind === "chart-line" ? (
        <LineChart data={data}>
          <XAxis dataKey="name" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#5da8ff" strokeWidth={2} />
        </LineChart>
      ) : (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} label>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      )}
    </ResponsiveContainer>
  );
}