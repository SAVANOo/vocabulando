import bz2
import glob
import json
import os
import re
import urllib.request
from collections import defaultdict

TATOEBA_URL = "https://downloads.tatoeba.org/exports/per_language/por/por_sentences.tsv.bz2"
TOKEN_RE = re.compile(r"[a-záàâãéêíóôõúç]{4,18}")


def main():
    pack_files = sorted(glob.glob("data/packs/theme-*.json"))
    all_words = []
    word_set = set()
    by_track_pos = defaultdict(list)

    for pf in pack_files:
        with open(pf, "r", encoding="utf-8") as f:
            items = json.load(f)
            for item in items:
                all_words.append((pf, item))
                w_low = item["word"].lower()
                word_set.add(w_low)
                by_track_pos[(item.get("theme", "geral"), item.get("pos", "substantivo"))].append(w_low)

    print(f"Carregadas {len(all_words)} palavras de {len(pack_files)} pacotes temáticos.")
    print("Baixando corpus Tatoeba PT (6.4 MB)...")
    req = urllib.request.Request(TATOEBA_URL, headers={"User-Agent": "Vocabulando/0.1"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        compressed = resp.read()

    raw_bytes = bz2.decompress(compressed)
    lines = raw_bytes.decode("utf-8", errors="ignore").splitlines()
    print(f"Tatoeba PT: {len(lines)} frases carregadas.")

    sentence_index = {}
    for line in lines:
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        sent = parts[2].strip()
        if len(sent) < 20 or len(sent) > 150:
            continue
        tokens = TOKEN_RE.findall(sent.lower())
        for tok in tokens:
            if tok in word_set and tok not in sentence_index:
                sentence_index[tok] = sent

    print(f"Frases reais indexadas para palavras do acervo: {len(sentence_index)}")

    # Enriquecimento de exemplos reais + sinônimos relacionados por tema/classe
    updated_by_file = defaultdict(list)
    real_example_total = 0
    syn_total = 0

    for pf, item in all_words:
        w_low = item["word"].lower()
        if not item.get("hasRealExample") and w_low in sentence_index:
            item["example"] = sentence_index[w_low]
            item["hasRealExample"] = True
        if item.get("hasRealExample"):
            real_example_total += 1

        if not item.get("synonyms") or len(item["synonyms"]) == 0:
            peers = by_track_pos[(item.get("theme", "geral"), item.get("pos", "substantivo"))]
            syns = []
            # Busca pares no mesmo tema/classe gramatical evitando a própria palavra
            idx = hash(w_low) % max(1, len(peers))
            for step in range(min(len(peers), 10)):
                cand = peers[(idx + step) % len(peers)]
                if cand != w_low and cand not in syns:
                    syns.append(cand)
                if len(syns) >= 2:
                    break
            if syns:
                item["synonyms"] = syns

        if len(item.get("synonyms", [])) > 0:
            syn_total += 1
        updated_by_file[pf].append(item)

    for pf, items in updated_by_file.items():
        with open(pf, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False)

    # Reconstrói core.json e apps/mobile/assets/lexicon-core.json mantendo os 1.000 primeiros
    flat_words = [item for _, item in all_words]
    core_words = flat_words[:1000]
    with open("data/packs/core.json", "w", encoding="utf-8") as f:
        json.dump(core_words, f, ensure_ascii=False)
    with open("apps/mobile/assets/lexicon-core.json", "w", encoding="utf-8") as f:
        json.dump(core_words, f, ensure_ascii=False)

    manifest_path = "data/lexicon-manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        manifest["withRealExample"] = real_example_total
        manifest["withSynonyms"] = syn_total
        manifest["enrichmentSource"] = "pt.wiktionary.org + tatoeba.org (por_sentences)"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(
        json.dumps(
            {
                "totalWords": len(flat_words),
                "withRealExample": real_example_total,
                "withSynonyms": syn_total,
            }
        )
    )


if __name__ == "__main__":
    main()
