import cron from 'cron';
import https from 'https'

export const keepOpen = new cron.CronJob("*/5 * * * *", () => {
  https
    .get(process.env.API_URL!, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully!");
      else console.log("GET request failed: ", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request: ", e));
});