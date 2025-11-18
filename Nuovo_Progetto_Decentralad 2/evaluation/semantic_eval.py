#!/usr/bin/env python3
# semantic_eval.py
# Compute semantic similarity metrics between candidate answers and references.
# Metrics: BERTScore (P/R/F1), MoverScore, Sentence-Mover Similarity (approx EMD over sentence embeddings).
#
# Usage examples:
#   python semantic_eval.py --candidates results/q1_rag.txt --references gold/q1_ref.txt --lang it --out scores/q1_semantic.csv
#   python semantic_eval.py --pair "risposta A" "gold A" --lang it
#
# Requirements (install once):
#   pip install -U torch==2.3.1 transformers==4.43.4 sentence-transformers==2.7.0 bert-score==0.3.13 moverscore==1.0.3
#   pip install -U nltk==3.8.1 numpy pandas scipy pot
#   python -c "import nltk; nltk.download('punkt')"
#
# Notes:
# - SMS here is a pragmatic approximation of Sentence Mover Similarity using sentence embeddings + EMD (POT).
# - For Italian, bert-score will auto-select a multilingual model; you can override via --bert-model.

import argparse
import sys
from pathlib import Path
import numpy as np
import pandas as pd
#import nltk
#from nltk.tokenize import sent_tokenize

from bert_score import score as bert_score
#from moverscore_v2 import get_idf_dict, word_mover_score
# DOPO:
try:
    from moverscore_v2 import get_idf_dict, word_mover_score
    _HAS_MS = True
except Exception:
    _HAS_MS = False
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import ot  # POT: Python Optimal Transport

import re
def sent_tokenize(text: str):
    # Split semplice su . ? ! seguiti da spazio; basta per SMS
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p for p in parts if p]


def read_lines(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f]

def compute_bertscore(cands, refs, lang="it", bert_model=None):
    P, R, F1 = bert_score(cands, refs, lang=lang, model_type=bert_model, verbose=False)
    return np.array(P.tolist()), np.array(R.tolist()), np.array(F1.tolist())

# def compute_moverscore(cands, refs):
#     # Moverscore expects lists
#     idf_cand = get_idf_dict(cands)
#     idf_ref  = get_idf_dict(refs)
#     scores = word_mover_score(refs, cands, idf_ref, idf_cand, stop_words=[], n_gram=1, remove_subwords=True)
#     return np.array(scores)
def compute_moverscore(cands, refs):
    if not _HAS_MS:
        raise RuntimeError("moverscore not available")
    idf_cand = get_idf_dict(cands)
    idf_ref  = get_idf_dict(refs)
    scores = word_mover_score(
        refs, cands, idf_ref, idf_cand,
        stop_words=[], n_gram=1, remove_subwords=True
    )
    return np.array(scores)


def sentence_mover_similarity(cand, ref, st_model: SentenceTransformer):
    # Tokenize into sentences
    s_c = [s.strip() for s in sent_tokenize(cand) if s.strip()]
    s_r = [s.strip() for s in sent_tokenize(ref) if s.strip()]
    if len(s_c) == 0: s_c = [cand.strip()]
    if len(s_r) == 0: s_r = [ref.strip()]
    # Embed sentences
    E_c = st_model.encode(s_c, normalize_embeddings=True)
    E_r = st_model.encode(s_r, normalize_embeddings=True)
    # Cost = 1 - cosine
    from sklearn.metrics.pairwise import cosine_similarity
    C = 1.0 - cosine_similarity(E_c, E_r)
    # Uniform masses
    a = np.full((len(s_c),), 1.0/len(s_c), dtype=np.float64)
    b = np.full((len(s_r),), 1.0/len(s_r), dtype=np.float64)
    # Earth Mover's Distance (minimum transport cost)
    import ot
    emd_cost = ot.emd2(a, b, C)  # scalar
    # Convert to similarity in [0,1]: sim = 1 - normalized cost
    sim = max(0.0, 1.0 - float(emd_cost) / 2.0)  # cosine cost in [0,2]
    return sim

def main():
    ap = argparse.ArgumentParser(description="Semantic similarity metrics (BERTScore, MoverScore, SMS)")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--candidates", type=Path, help="File with candidate answers, one per line")
    g.add_argument("--pair", nargs=2, metavar=("CANDIDATE", "REFERENCE"), help="Single pair mode")
    ap.add_argument("--references", type=Path, help="File with reference answers (gold), one per line")
    ap.add_argument("--lang", type=str, default="it", help="Language code for BERTScore (default: it)")
    ap.add_argument("--bert-model", type=str, default=None, help="Override BERTScore model type (e.g., 'xlm-roberta-large')")
    ap.add_argument("--st-model", type=str, default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", help="SentenceTransformer model for SMS")
    ap.add_argument("--out", type=Path, help="Output CSV path (will create folders)")
    ap.add_argument("--summary", action="store_true", help="Print summary stats at the end")
    args = ap.parse_args()

    if args.pair:
        cand, ref = args.pair
        cands, refs = [cand], [ref]
    else:
        if args.references is None:
            print("ERROR: --references is required when using --candidates", file=sys.stderr)
            sys.exit(1)
        cands = read_lines(args.candidates)
        refs  = read_lines(args.references)
        if len(cands) != len(refs):
            print(f"ERROR: candidates ({len(cands)}) and references ({len(refs)}) must have the same number of lines", file=sys.stderr)
            sys.exit(1)

    # BERTScore
    P, R, F1 = compute_bertscore(cands, refs, lang=args.lang, bert_model=args.bert_model)

    # MoverScore
    try:
        MS = compute_moverscore(cands, refs)
    except Exception as e:
        print(f"[warn] MoverScore failed ({e}). Filling with NaN.", file=sys.stderr)
        MS = np.full((len(cands),), np.nan)

    # SMS via sentence embeddings + EMD
    st_model = SentenceTransformer(args.st_model)
    SMS = np.array([sentence_mover_similarity(c, r, st_model) for c, r in zip(cands, refs)])

    # Output
    df = pd.DataFrame({
        "candidate": cands,
        "reference": refs,
        "bertscore_P": P,
        "bertscore_R": R,
        "bertscore_F1": F1,
        "moverscore": MS,
        "sms": SMS
    })

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(args.out, index=False, encoding="utf-8")
        print(f"[ok] Wrote {args.out}")
    else:
        print(df[["bertscore_F1","moverscore","sms"]].to_string(index=False))

    if args.summary:
        print("\n=== Summary ===")
        print(df[["bertscore_F1","moverscore","sms"]].describe().to_string())

if __name__ == "__main__":
    main()
