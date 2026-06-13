import json
from pathlib import Path

two = json.loads(
    Path(__file__).resolve().parent.joinpath("_bolme_coklu_two_step.json").read_text(encoding="utf-8")
)
for k in sorted(two.keys()):
    parts = [f'("{op}", {a}, {b}, {res})' for op, a, b, res in two[k]]
    print(f'    "{k}": [{", ".join(parts)}],')
