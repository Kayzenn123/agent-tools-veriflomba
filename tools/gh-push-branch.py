#!/usr/bin/env python3
"""Push a local dir as one commit to Kayzenn123/<repo> via Git Data API.

Usage: gh-push.py <repo> <dir> "<commit message>" [description]
- Creates the public repo if missing.
- Commits ALL files in <dir> (recursive) to main.
- Author/committer: Ahmad Zen <zenbae0280@gmail.com> (counts for Kayzenn123).
"""
import sys, os, json, base64, urllib.request, urllib.error

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

API = "https://api.github.com"
OWNER = "Kayzenn123"
AUTHOR = {"name": "Ahmad Zen", "email": "zenbae0280@gmail.com"}


def call(method, path, data=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "muse-gh-push")
    add_surrogate_to_request(req, "custom.github-pat", allowed_hosts=["api.github.com"])
    body = json.dumps(data).encode() if data is not None else None
    if body:
        req.add_header("Content-Type", "application/json")
        req.data = body
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return read_json_response(resp) if resp.status != 204 else {"ok": True}
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except Exception:
            err = {"message": str(e)}
        return {"_error": e.code, "_detail": err}


def die(msg, r=None):
    print("GAGAL:", msg)
    if r:
        print(json.dumps(r)[:600])
    sys.exit(1)


def main():
    repo, d, message = sys.argv[1], sys.argv[2], sys.argv[3]
    desc = sys.argv[4] if len(sys.argv) > 4 else ""
    branch = sys.argv[5] if len(sys.argv) > 5 else "main"

    r = call("GET", f"/repos/{OWNER}/{repo}")
    if r.get("_error") == 404:
        print("membuat repo", repo)
        r = call("POST", "/user/repos",
                 {"name": repo, "private": False, "description": desc})
        if r.get("_error"):
            die("buat repo", r)
    elif r.get("_error"):
        die("cek repo", r)

    ref = call("GET", f"/repos/{OWNER}/{repo}/git/ref/heads/{branch}")
    base, base_tree = None, None
    if ref.get("_error") in (404, 409) and branch == "main":
        print("repo kosong — seed via Contents API")
        seed = call("PUT", f"/repos/{OWNER}/{repo}/contents/.gitkeep",
                    {"message": "init", "content": "",
                     "committer": AUTHOR, "author": AUTHOR})
        if seed.get("_error"):
            die("seed", seed)
        ref = call("GET", f"/repos/{OWNER}/{repo}/git/ref/heads/{branch}")
        base = ref["object"]["sha"]
        c0 = call("GET", f"/repos/{OWNER}/{repo}/git/commits/{base}")
        base_tree = c0["tree"]["sha"]
    elif ref.get("_error") in (404, 409):
        print(f"branch {branch} belum ada — buat dari main")
        mref = call("GET", f"/repos/{OWNER}/{repo}/git/ref/heads/main")
        if mref.get("_error"):
            die("cek main", mref)
        cr = call("POST", f"/repos/{OWNER}/{repo}/git/refs",
                  {"ref": f"refs/heads/{branch}", "sha": mref["object"]["sha"]})
        if cr.get("_error"):
            die("buat branch", cr)
        ref = call("GET", f"/repos/{OWNER}/{repo}/git/ref/heads/{branch}")
        base = ref["object"]["sha"]
        c0 = call("GET", f"/repos/{OWNER}/{repo}/git/commits/{base}")
        base_tree = c0["tree"]["sha"]
    elif ref.get("_error"):
        die("cek ref", ref)
    else:
        base = ref["object"]["sha"]
        c = call("GET", f"/repos/{OWNER}/{repo}/git/commits/{base}")
        if c.get("_error"):
            die("cek commit", c)
        base_tree = c["tree"]["sha"]

    tree = []
    for root, _, fns in os.walk(d):
        for fn in fns:
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, d)
            b = call("POST", f"/repos/{OWNER}/{repo}/git/blobs",
                     {"content": base64.b64encode(open(full, "rb").read()).decode(),
                      "encoding": "base64"})
            if b.get("_error"):
                die(f"blob {rel}", b)
            tree.append({"path": rel, "mode": "100644", "type": "blob", "sha": b["sha"]})
    print(f"{len(tree)} blob")

    tdata = {"tree": tree, "base_tree": base_tree} if base_tree else {"tree": tree}
    t = call("POST", f"/repos/{OWNER}/{repo}/git/trees", tdata)
    if t.get("_error"):
        die("buat tree", t)

    cm = call("POST", f"/repos/{OWNER}/{repo}/git/commits",
              {"message": message, "tree": t["sha"], "parents": [base],
               "author": AUTHOR, "committer": AUTHOR})
    if cm.get("_error"):
        die("buat commit", cm)

    u = call("PATCH", f"/repos/{OWNER}/{repo}/git/refs/heads/{branch}",
             {"sha": cm["sha"], "force": True})
    if u.get("_error"):
        die("update ref", u)
    print(f"OK {repo}@{branch}: {cm['sha'][:7]} — {message.splitlines()[0]}")


if __name__ == "__main__":
    main()
