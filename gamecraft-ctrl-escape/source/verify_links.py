"""Checks the game's hyperlink graph: every link resolves, every slide is reachable
from the title screen, and the shield logic is consistent on every path."""
import json
import re
import sys
import zipfile
from collections import deque

pptx = sys.argv[1]
smap = {e["n"]: e["key"] for e in json.load(open(sys.argv[2]))}
z = zipfile.ZipFile(pptx)
n_slides = len([n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)])
assert n_slides == len(smap), (n_slides, len(smap))

edges, problems = {}, []
for i in range(1, n_slides + 1):
    xml = z.read(f"ppt/slides/slide{i}.xml").decode()
    rels = z.read(f"ppt/slides/_rels/slide{i}.xml.rels").decode()
    rmap = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    out = []
    for name, rid, action in re.findall(r'<p:cNvPr id="\d+" name="([^"]*)"[^>]*><a:hlinkClick r:id="([^"]*)"(?: action="([^"]*)")?', xml):
        if action == "ppaction://hlinksldjump":
            tgt = rmap.get(rid, "")
            m = re.fullmatch(r"slide(\d+)\.xml", tgt)
            if not m or not (1 <= int(m.group(1)) <= n_slides):
                problems.append(f"slide {i}: broken link {name} -> {tgt}")
                continue
            out.append((name, int(m.group(1))))
        elif action and "lastslideviewed" in action:
            out.append((name, "LAST"))
        elif action and "endshow" in action:
            out.append((name, "END"))
        elif not action:
            out.append((name, "EXTERNAL:" + rmap.get(rid, "?")))
        else:
            problems.append(f"slide {i}: unknown action {action}")
    if not out:
        problems.append(f"slide {i} ({smap[i]}): dead end, no links")
    if "<p:transition" not in xml or 'advClick="0"' not in xml:
        problems.append(f"slide {i}: click-to-advance not disabled")
    edges[i] = out

# reachability from the title (the help screen's Back returns to wherever you came from)
seen, dq = {1}, deque([1])
while dq:
    s = dq.popleft()
    for _, t in edges[s]:
        if isinstance(t, int) and t not in seen:
            seen.add(t)
            dq.append(t)
unreached = [f"{i}:{smap[i]}" for i in range(1, n_slides + 1) if i not in seen]
if unreached:
    problems.append("unreachable: " + ", ".join(unreached))

# shield logic: question q_X_L -> exactly one answer to ok_X_L, others to bad_X_{L-1} or gameover
key2n = {v: k for k, v in smap.items()}
qcount = 0
for n, key in smap.items():
    m = re.fullmatch(r"q_(\w+?)_(\d)", key)
    if not m:
        continue
    qcount += 1
    qid, L = m.group(1), int(m.group(2))
    targets = {}
    for name, t in edges[n]:
        if name.startswith("Link - Answer") or name.startswith("Link - Door"):
            letter = name.split()[3]
            targets.setdefault(letter, set()).add(smap.get(t, t) if isinstance(t, int) else t)
    oks = [l for l, ts in targets.items() if ts == {f"ok_{qid}_{L}"}]
    wrong_expect = f"bad_{qid}_{L-1}" if L > 1 else "gameover"
    bads = [l for l, ts in targets.items() if ts == {wrong_expect}]
    if len(oks) != 1 or len(oks) + len(bads) != len(targets):
        problems.append(f"{key}: answer wiring wrong {targets}")
    # wrong slide's retry keeps the reduced shield level
    if L > 1:
        bad = key2n[f"bad_{qid}_{L-1}"]
        retry = [smap[t] for nm, t in edges[bad] if isinstance(t, int) and "TRY AGAIN" in nm]
        if retry != [f"q_{qid}_{L-1}"]:
            problems.append(f"bad_{qid}_{L-1}: retry goes to {retry}")

# every correct slide continues at the same shield level
for n, key in smap.items():
    m = re.fullmatch(r"ok_(\w+?)_(\d)", key)
    if not m:
        continue
    L = m.group(2)
    nxt = [smap[t] for nm, t in edges[n] if isinstance(t, int) and "CONTINUE" in nm]
    if len(nxt) != 1 or not (nxt[0] == "ending" or nxt[0].endswith("_" + L)):
        problems.append(f"{key}: continue goes to {nxt}")

total_links = sum(len(v) for v in edges.values())
print(f"slides: {n_slides}, links: {total_links}, question slides checked: {qcount}, reachable: {len(seen)}/{n_slides}")
print("PROBLEMS:\n" + "\n".join(problems) if problems else "ALL LINK CHECKS PASSED")
