import yaml from "js-yaml";
import * as t from "io-ts";
import { isLeft } from "fp-ts/Either";

const Score = t.type({
  version: t.number,
  scorecard: t.type({
    manual: t.intersection([
      t.type({
        CI: t.type({
          filename: t.string
        }),
        CD: t.type({
          infrastructure_as_code: t.boolean,
          messaging_channels_integrated: t.array(t.string)
        }),
        success_kpis: t.type({
          automated_conversation_tags: t.union([t.array(t.string), t.null])
        })
      }),
      t.partial({
        training_data_health: t.type({})
      })
    ]),
    auto: t.intersection([
      t.type({
        CI: t.type({
          code_and_training_data_in_git: t.boolean,
          rasa_test_coverage: t.number,
          ci_runs_data_validation: t.boolean,
          ci_runs_rasa_test: t.boolean,
          ci_trains_model: t.boolean,
          ci_builds_action_server: t.boolean,
          ci_runs_vulnerability_scans: t.boolean
        }),
        training_data_health: t.type({
          num_real_conversations: t.number,
          num_annotated_messages: t.number,
          num_warnings_from_nlu_insights: t.number
        }),
        success_kpis: t.type({
          num_reviewed_conversations: t.number,
          num_tagged_conversations: t.number
        })
      }),
      t.partial({
        CD: t.type({})
      })
    ])
  })
});

type ScoreType = t.TypeOf<typeof Score>;

export function parseScore(scoreYaml: string) {
  try {
    const score = yaml.load(scoreYaml);
    const check = Score.decode(score);
    if (isLeft(check)) return null;
    return score;
  } catch (e) {
    return null;
  }
}

function scoreTrues(...predicates: boolean[]) {
  return (
    predicates
      .map((p) => (p ? 1 : 0))
      .reduce((value, v) => value + v, 0 as number) / predicates.length
  );
}

export function rankCI(
  manual: ScoreType["scorecard"]["manual"]["CI"],
  auto: ScoreType["scorecard"]["auto"]["CI"]
) {
  return scoreTrues(
    manual.filename !== "",
    auto.code_and_training_data_in_git,
    auto.rasa_test_coverage > 50,
    auto.ci_runs_data_validation,
    auto.ci_runs_rasa_test,
    auto.ci_trains_model,
    auto.ci_builds_action_server,
    auto.ci_runs_vulnerability_scans
  );
}

export function rankCD(
  manual: ScoreType["scorecard"]["manual"]["CD"],
  auto: ScoreType["scorecard"]["auto"]["CD"]
) {
  return scoreTrues(
    manual.infrastructure_as_code,
    manual.messaging_channels_integrated.length > 2
  );
}

export function rankTrainingDataHealth(
  manual: ScoreType["scorecard"]["manual"]["training_data_health"],
  auto: ScoreType["scorecard"]["auto"]["training_data_health"]
) {
  return scoreTrues(
    auto.num_annotated_messages > 5000,
    auto.num_real_conversations > 50000,
    auto.num_warnings_from_nlu_insights < 10
  );
}

export function rankSuccessKpis(
  manual: ScoreType["scorecard"]["manual"]["success_kpis"],
  auto: ScoreType["scorecard"]["auto"]["success_kpis"]
) {
  const tags = manual.automated_conversation_tags;
  return scoreTrues(
    tags !== null && tags.length > 10,
    auto.num_reviewed_conversations > 5,
    auto.num_tagged_conversations > 10
  );
}

export function rankScore(score: ScoreType, outOf: number) {
  const { manual, auto } = score.scorecard;
  return [
    { metric: "CI", score: rankCI(manual.CI, auto.CI) * outOf },
    { metric: "CD", score: rankCI(manual.CI, auto.CI) * outOf },
    {
      metric: "Training Data Health",
      score:
        rankTrainingDataHealth(
          manual.training_data_health,
          auto.training_data_health
        ) * outOf
    },
    {
      metric: "Success KPIs",
      score: rankSuccessKpis(manual.success_kpis, auto.success_kpis) * outOf
    }
  ];
}
