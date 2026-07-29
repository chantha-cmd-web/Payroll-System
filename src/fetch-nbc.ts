import https from "https";
https.get("https://nbc.gov.kh/english/economic_research/exchange_rate.php", (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => console.log(body.substring(0, 500)));
});
