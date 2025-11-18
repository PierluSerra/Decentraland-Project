# #!/usr/bin/env bash
# set -euo pipefail

# QUESTION='Chi è il professore di Programmazione?'
# OUTBASE='evaluation/results/q1_rag'

# mkdir -p "$(dirname "$OUTBASE")"
# : > "${OUTBASE}.txt"
# : > "${OUTBASE}_sources.txt"
# : > "${OUTBASE}_passages.txt"

# for i in {1..10}; do
#   # Costruisco il body JSON con jq per evitare problemi di quoting
#   BODY_JSON="$(jq -n --arg q "$QUESTION" --argjson opts '{"temperature":0,"top_p":1,"seed":12345}' \
#                   '{message:$q, options:$opts}')"

#   RESP="$(curl -s http://localhost:8787/chat \
#             -H 'Content-Type: application/json' \
#             --data-binary "$BODY_JSON")"

#   # 1) reply (una riga per run)
#   printf '%s\n' "$RESP" | jq -r '.reply' >> "${OUTBASE}.txt"

#   # 2) fonti (compattate su una sola riga per run)
#   #    Usiamo un here-doc per il programma jq così non servono escape complicati
#   printf '%s\n' "$RESP" | jq -r -f /dev/stdin >> "${OUTBASE}_sources.txt" <<'JQ'
# (.sources // [])
# | map(
#     "[" + (.n|tostring) + "] " + (.source // "") + " - " + (.id // "")
#     + ( if (has("score") and .score != null)
#         then " (score " + (.score|tostring) + ")"
#         else ""
#         end )
#   )
# | join("  ")
# JQ

#   # 3) passages (estratti, troncati e compattati su una riga per run)
#   printf '%s\n' "$RESP" | jq -r -f /dev/stdin >> "${OUTBASE}_passages.txt" <<'JQ'
# (.passages // [])
# | map(
#     "[" + (.n|tostring) + "] "
#     + ( (.text // "") | gsub("\n"; " ") | .[0:240] )
#     + ( if ( (.text // "") | length ) > 240 then " …" else "" end )
#   )
# | join("  ")
# JQ

# done


##SECONDA PROVA
#!/usr/bin/env bash
set -euo pipefail

QUESTION='Quanti corsi ha il docente di Database?'
OUTBASE='evaluation/results/q6_rag'

mkdir -p "$(dirname "$OUTBASE")"
: > "${OUTBASE}.txt"
: > "${OUTBASE}_sources.txt"
: > "${OUTBASE}_passages.txt"

for i in {1..10}; do
  BODY_JSON="$(jq -n \
      --arg q "$QUESTION" \
      --argjson opts '{"temperature":0.7,"top_p":1,"seed":12345}' \
      '{message:$q, options:$opts}')"

  RESP="$(curl -s http://localhost:8787/chat \
              -H 'Content-Type: application/json' \
              --data-binary "$BODY_JSON")"


echo $RESP

  # 1) reply (una riga per run) — normalizza oggetto/array
  printf '%s\n' "$RESP" | jq -r '
    def takeobj: if type=="array" then .[0] else . end;
    takeobj | .reply
  ' >> "${OUTBASE}.txt"

  # 2) fonti (una riga compatta per run; "(none)" se vuote) — normalizza
  printf '%s\n' "$RESP" | jq -r '
    def takeobj: if type=="array" then .[0] else . end;
    (takeobj) as $d
    | if ($d.sources | type) == "array" and ($d.sources|length) > 0 then
        ($d.sources
          | map("[" + (.n|tostring) + "] " + (.source // "") + " - " + (.id // "")
                + (if (.score!=null) then " (score " + (.score|tostring) + ")" else "" end))
          | join("  "))
      else
        "(none)"
      end
  ' >> "${OUTBASE}_sources.txt"

  # 3) passages (estratti troncati; "(none)" se vuoti) — normalizza
  printf '%s\n' "$RESP" | jq -r '
    def takeobj: if type=="array" then .[0] else . end;
    (takeobj) as $d
    | if ($d.passages | type) == "array" and ($d.passages|length) > 0 then
        ($d.passages
          | map("[" + (.n|tostring) + "] "
                + ( (.text // "") | gsub("\n"; " ") | .[0:240] )
                + (if ( (.text // "") | length ) > 240 then " …" else "" end))
          | join("  "))
      else
        "(none)"
      end
  ' >> "${OUTBASE}_passages.txt"
done

