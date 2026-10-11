"""Count returned letters from hash-verified, independently audited trace chunks."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re


def export(run: Path) -> dict:
    arms = {}
    for arm in ('original', 'sft'):
        root = run / arm
        audit_bytes = (root / 'independent_audit.json').read_bytes()
        audit = json.loads(audit_bytes)
        if not audit['passed'] or audit['queries'] != 345600:
            raise ValueError('Complete independent audit required')
        predicted = [[0]*27 for _ in range(256)]
        expected = [[0]*26 for _ in range(256)]
        correct = [0]*256
        seen = set()
        paths = sorted((root / 'chunks').glob('*.jsonl.gz'))
        if {p.name for p in paths} != set(audit['chunks_sha256']):
            raise ValueError('Audited chunk coverage changed')
        for path in paths:
            raw = path.read_bytes()
            if hashlib.sha256(raw).hexdigest() != audit['chunks_sha256'][path.name]:
                raise ValueError('Audited chunk hash differs')
            lines = gzip.decompress(raw).splitlines()
            header = json.loads(lines[0])
            if header['freeze_sha256'] != audit['freeze_sha256']:
                raise ValueError('Chunk freeze changed')
            for line in lines[1:]:
                row = json.loads(line)
                n, i = row['task_depth'], row['graph_index']
                if not 1 <= n <= 256 or not 0 <= i < 1350 or (i,n) in seen:
                    raise ValueError('Repeated or out-of-panel query')
                seen.add((i,n))
                response = row['response'].strip()
                valid = re.fullmatch(r'[A-Z](?:\s+[A-Z])*', response, flags=re.ASCII) is not None
                states = response.split() if valid else []
                if states != row['states'] or valid != row['valid_answer']:
                    raise ValueError('Parsed states differ from audited response')
                last = ord(states[-1])-65 if states else 26
                target = ord(row['target'])-65
                if not 0 <= target < 26 or (last == target) != row['correct']:
                    raise ValueError('Final-answer score differs')
                predicted[n-1][last] += 1
                expected[n-1][target] += 1
                correct[n-1] += last == target
        if len(seen) != 345600 or any(sum(r)!=1350 for r in predicted+expected):
            raise ValueError('Incomplete response distribution')
        arms[arm] = dict(predicted=predicted,expected=expected,correct=correct,
            independent_audit_sha256=hashlib.sha256(audit_bytes).hexdigest(),
            outcomes_sha256=audit['outcomes_sha256'],verified_chunks=len(paths))
    return dict(schema_version=1,graphs=1350,source_run='eval/pointer_traces/seed61-20261010',arms=arms)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(export(args.run),separators=(',',':'),allow_nan=False))
