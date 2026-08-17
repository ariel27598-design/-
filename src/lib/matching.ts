import type { Game, GameMatchResult, MatchReason, QuestionnaireAnswers } from '../types';

/** Score a single answer set against a single game. Returns 0-100 plus reason keys. */
export function scoreGame(
  game: Game,
  answers: QuestionnaireAnswers,
  playerCount: number,
): GameMatchResult {
  const reasons: MatchReason[] = [];
  const eligible = playerCount >= game.minPlayers && playerCount <= game.maxPlayers;

  if (!eligible) {
    reasons.push(
      playerCount < game.minPlayers
        ? { key: 'requiresAtLeast', params: { count: game.minPlayers } }
        : { key: 'supportsUpTo', params: { count: game.maxPlayers } },
    );
  }

  // Complexity fit: closer to requested weight = better (0-30 pts).
  const complexityDiff = Math.abs(game.weight - answers.complexity);
  const complexityScore = Math.max(0, 30 - complexityDiff * 7.5);
  if (complexityDiff <= 1) reasons.push({ key: 'reasonComplexityFit' });

  // Luck vs strategy fit (0-20 pts).
  const luckDiff = Math.abs(game.luckVsStrategy - answers.luckVsStrategy);
  const luckScore = Math.max(0, 20 - luckDiff * 5);
  if (luckDiff <= 1) {
    reasons.push({ key: answers.luckVsStrategy >= 4 ? 'reasonStrategyEmphasis' : 'reasonLuckLightness' });
  }

  // Playtime fit (0-20 pts).
  let timeScore: number;
  if (answers.timeAvailable >= game.minPlaytime && answers.timeAvailable <= game.maxPlaytime + 15) {
    timeScore = 20;
    reasons.push({ key: 'reasonTimeFit' });
  } else {
    const distance =
      answers.timeAvailable < game.minPlaytime
        ? game.minPlaytime - answers.timeAvailable
        : answers.timeAvailable - game.maxPlaytime;
    timeScore = Math.max(0, 20 - distance / 4);
  }

  // Social mode fit (0-15 pts).
  let socialScore = 15;
  if (answers.socialMode === 'cooperative' && !game.cooperative) socialScore = 3;
  else if (answers.socialMode === 'competitive' && game.cooperative) socialScore = 3;
  else if (answers.socialMode !== 'either') {
    reasons.push({ key: game.cooperative ? 'reasonCooperative' : 'reasonCompetitive' });
  }

  // Category overlap (0-15 pts).
  let categoryScore = 8;
  if (answers.preferredCategories.length > 0) {
    const overlap = game.categories.filter((c) => answers.preferredCategories.includes(c));
    categoryScore = overlap.length > 0 ? (overlap.length / answers.preferredCategories.length) * 15 : 0;
    if (overlap.length > 0) {
      reasons.push({ key: 'reasonCategoryMatch', params: { categories: overlap.join(',') } });
    }
  }

  // Rules-learning tolerance vs weight: heavy game + low tolerance = penalty folded into complexity already,
  // add a small extra nudge so it's felt distinctly.
  let learnPenalty = 0;
  if (game.weight >= 4 && answers.willingToLearnRules <= 2) {
    learnPenalty = 10;
    reasons.push({ key: 'reasonComplexRules' });
  }

  let total = complexityScore + luckScore + timeScore + socialScore + categoryScore - learnPenalty;
  total = Math.max(0, Math.min(100, total));

  if (!eligible) {
    total = Math.min(total, 20);
  }

  return { game, score: Math.round(total), reasons: reasons.slice(0, 3), eligible };
}

export function rankGames(
  games: Game[],
  answers: QuestionnaireAnswers,
  playerCount: number,
): GameMatchResult[] {
  return games
    .map((game) => scoreGame(game, answers, playerCount))
    .sort((a, b) => b.score - a.score);
}

function reasonSignature(reason: MatchReason): string {
  return `${reason.key}:${reason.params?.categories ?? ''}`;
}

/**
 * Aggregate multiple participants' answers into a single ranking that suits
 * the whole group. Uses the average score across participants, with a
 * penalty for high disagreement (variance) so we avoid games loved by some
 * and hated by others.
 */
export function rankGamesForGroup(
  games: Game[],
  answersList: QuestionnaireAnswers[],
  playerCount: number,
): GameMatchResult[] {
  return games
    .map((game) => {
      const perPerson = answersList.map((answers) => scoreGame(game, answers, playerCount));
      const eligible = perPerson.every((r) => r.eligible);
      const scores = perPerson.map((r) => r.score);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      // Penalize disagreement: a game everyone likes similarly beats one that's polarizing.
      const consensusScore = Math.max(0, mean - stdDev * 0.5);

      const reasonCounts = new Map<string, { reason: MatchReason; count: number }>();
      for (const r of perPerson) {
        for (const reason of r.reasons) {
          const sig = reasonSignature(reason);
          const existing = reasonCounts.get(sig);
          if (existing) existing.count += 1;
          else reasonCounts.set(sig, { reason, count: 1 });
        }
      }
      const reasons: MatchReason[] = [...reasonCounts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(({ reason, count }) =>
          count > 1
            ? { key: reason.key, params: { ...reason.params, __consensus: `${count}/${answersList.length}` } }
            : reason,
        );

      return {
        game,
        score: Math.round(eligible ? consensusScore : Math.min(consensusScore, 20)),
        reasons,
        eligible,
      };
    })
    .sort((a, b) => b.score - a.score);
}
