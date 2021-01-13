import * as React from "react";

import scoreYaml from "./score.yml";
import { parseScore, rankScore } from "./score";
import MetricChart from "./MetricChart";

export default function App() {
  const score = parseScore(scoreYaml);

  return (
    <div className="App">
      <h1>Rasa Assistant Scorecard</h1>
      {score && <MetricChart max={4} data={rankScore(score, 4)} />}
    </div>
  );
}
