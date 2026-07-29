import https from "https";
import fs from "fs";
https.get("https://inkhmer.com/en/tools/finance/salary-tax-calculator?cur=usd", (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => fs.writeFileSync("inkhmer.html", body));
});
