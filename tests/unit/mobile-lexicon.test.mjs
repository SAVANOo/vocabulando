import test from "node:test";
import assert from "node:assert/strict";
import { MOBILE_LEXICON } from "../../apps/mobile/src/data/mobileLexicon.ts";
import { buildQuizBlank } from "../../packages/domain/src/index.ts";

test("MOBILE_LEXICON tem 20 palavras válidas e todas geram lacuna _______ no quiz", () => {
  assert.equal(MOBILE_LEXICON.length, 20);
  const validDiffs = new Set(["intermediario", "avancado", "erudito"]);

  for (const item of MOBILE_LEXICON) {
    assert.ok(item.id.length > 0);
    assert.ok(item.word.length > 0);
    assert.ok(validDiffs.has(item.difficulty), `Dificuldade inválida em ${item.id}`);
    const blank = buildQuizBlank(item.example, item.word, item.definition);
    assert.ok(
      blank.prompt.includes("_______"),
      `Lacuna ausente em ${item.id}: ${blank.prompt}`,
    );
  }
});
