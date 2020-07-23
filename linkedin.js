require("chromedriver");

console.log("Rohit Scritpt executed");
let swd = require("selenium-webdriver");
var nodemailer = require("nodemailer");
//let { username, password, gmailP } = require("./credentials.json");
let username = process.env.username;
let password = process.env.password;
let gmailP = process.env.gmailP;
const { Driver } = require("selenium-webdriver/chrome");
let browser = new swd.Builder();
let tab = browser.forBrowser("chrome").build();
let tabWillBeOpenedPromise = tab.get(
  "https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin"
);
const csv = require("csv-parser");
const fs = require("fs");
const request = require("request");

var transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: username,
    pass: gmailP,
  },
});
let recievers = [];
fs.readFile("mailingList.txt", "utf8", function (err, data) {
  if (err) throw err;
  recievers = data.split("\n");
});

let companyList = [];
let maxMails = 50,
  countMails = 0;
fs.createReadStream("Companies.csv")
  .pipe(csv())
  .on("data", (row) => {
    companyList.push(row.Company);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });

async function mail(jobObj) {
  recievers.forEach((reciever) => {
    var mailOptions = {
      from: username,
      to: reciever,
      subject: "Jobs for you",
      html: jobObj,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  });
}

tabWillBeOpenedPromise
  .then(function () {
    let findTimeOut = tab.manage().setTimeouts({
      implicit: 10000,
    });
    return findTimeOut;
  })
  .then(function () {
    return tab.manage().window().maximize();
  })
  .then(async function () {
    //await login();
    setInterval(checkForJobs, 30000);
  })
  .catch(function (err) {
    console.log(err);
  });
async function checkForJobs() {
  console.log("Checking jobs");
  let newJobs = [];
  let mailContent = "";

  for (let i = 0; i < 2; i++) {
    let jobUrl =
      "https://www.linkedin.com/jobs/search/?f_E=1%2C2&f_TPR=r86400&keywords=" +
      companyList[i] +
      "&sortBy=DD&redirect=false&position=1&pageNum=0";
    await (await tab).get(jobUrl);

    let jobsToBeNotified = await tab.findElements(
      swd.By.css(".job-result-card")
    );
    for (let j = 0; j < Math.min(10, jobsToBeNotified.length); j++) {
      //await tab;
      await jobsToBeNotified[j].click();
      await tab;

      let nameP = tab.findElement(swd.By.css(".topcard__title"));
      let subtitleP = tab.findElement(swd.By.css(".topcard__flavor-row"));
      let linkP = tab.findElement(
        swd.By.css(".apply-button.apply-button--link")
      );
      Promise.all([nameP, subtitleP, linkP])
        .then(async function (PArr) {
          let nametextP = PArr[0].getText();
          let subtitletextP = PArr[1].getText();
          let linkhrefP = PArr[2].getAttribute("href");
          return Promise.all([nametextP, subtitletextP, linkhrefP]);
        })
        .then((content) => {
          if (
            content[0] != "" &&
            content[1] != "" &&
            typeof content[0] == "string"
          ) {
            //console.log(mailContent);
            countMails++;
            if (countMails < maxMails)
              mailContent += `<a href="${content[2]}"><h2>${content[0]}</h2></a><h3>${content[1]}</h3><hr />`;
            //if (j == 4 && i == 2) mail(mailContent);
          }
        })
        .catch(function (err) {
          // console.log("link not found" + err);
        });
    }
  }

  console.log(mailContent);
  mail(mailContent);
}
