# ECB（欧州中央銀行）の参照レートを取得して ecb.json を作る（GitHub Actions で平日に自動実行）
# 出典：European Central Bank, euro foreign exchange reference rates
import csv, io, json, sys, time, urllib.request, zipfile, datetime

SRC = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip"
OUT = "ecb.json"
CUR = ["USD", "JPY", "GBP", "AUD"]  # アプリで使う通貨（1ユーロあたり）

def fetch(src):
    if src.startswith("http"):
        for i in range(3):
            try:
                req = urllib.request.Request(src, headers={"User-Agent": "studio-akari-fx-hiashi"})
                return urllib.request.urlopen(req, timeout=60).read()
            except Exception as e:
                print("取得に失敗、再試行します:", e)
                time.sleep(20)
        sys.exit("ECBからデータを取得できませんでした")
    return open(src, "rb").read()

def main():
    raw = fetch(sys.argv[1] if len(sys.argv) > 1 else SRC)
    z = zipfile.ZipFile(io.BytesIO(raw))
    text = z.read(z.namelist()[0]).decode("utf-8")
    rows = {}
    for r in csv.DictReader(io.StringIO(text)):
        r = {k.strip(): (v or "").strip() for k, v in r.items() if k}
        try:
            rows[r["Date"]] = [float(r[c]) for c in CUR]
        except (KeyError, ValueError):
            continue
    dates = sorted(rows)
    # 安全確認：件数が少なすぎる・最新日が古すぎる場合は書き換えない
    if len(dates) < 7000:
        sys.exit(f"件数が少なすぎます（{len(dates)}件）")
    last = datetime.date.fromisoformat(dates[-1])
    if (datetime.date.today() - last).days > 10:
        sys.exit(f"最新日が古すぎます（{dates[-1]}）")
    try:
        old = json.load(open(OUT, encoding="utf-8"))
        if len(old["d"]) > len(dates):
            sys.exit("前回より件数が減っています。書き換えません")
    except FileNotFoundError:
        pass
    out = {"source": "European Central Bank (ECB) euro foreign exchange reference rates",
           "latest": dates[-1],
           "d": [d.replace("-", "") for d in dates]}
    for i, c in enumerate(CUR):
        out[c.lower()] = [rows[d][i] for d in dates]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"更新しました：{dates[0]} 〜 {dates[-1]}（{len(dates)}件）")

if __name__ == "__main__":
    main()
