import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis
} from "recharts";

interface MetricChartData {
  metric: string;
  score: number;
}

interface Props {
  max?: number;
  data: MetricChartData[];
}

export default function MetricChart({ data, max = 4 }: Props) {
  return (
    <RadarChart
      cx={300}
      cy={250}
      outerRadius={150}
      width={500}
      height={500}
      data={data}
    >
      <PolarAngleAxis dataKey="metric" />
      <PolarRadiusAxis domain={[0, max]} tick={false} />
      <PolarGrid />
      <Radar
        dataKey="score"
        stroke="#8884d8"
        fill="#8884d8"
        fillOpacity={0.6}
      />
    </RadarChart>
  );
}
