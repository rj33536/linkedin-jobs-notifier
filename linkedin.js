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
/*
request(
  "https://drive.google.com/file/d/1KhN37Ah3bSVd3Z0t_s1cVUkoNmPVogkA/view?usp=sharing",
  function (error, response, body) {
    console.error("error:", error); // Print the error if one occurred
    console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
    console.log("body:", body); // Print the HTML for the Google homepage.
  }
);
*/
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: username,
    pass: gmailP,
  },
});
let companyList = ["MICROSOFT"];
let maxMails = 2,
  countMails = 0;
fs.createReadStream("Companies.csv")
  .pipe(csv())
  .on("data", (row) => {
    console.log(row);
    companyList.push(row.Company);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });

companyList = ["MICROSOFT"];

async function mail(jobObj) {
  if (maxMails < countMails) return;
  countMails++;
  let reciever = username;
  var mailOptions = {
    from: username,
    to: reciever,
    subject: jobObj.name,
    text: jobObj + "\n" + jobObj.Description,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

tabWillBeOpenedPromise
  .then(function () {
    let findTimeOut = tab.manage().setTimeouts({
      implicit: 10000,
    });
    return findTimeOut;
  })
  .then(async function () {
    //await login();
    setInterval(checkForJobs, 10000);
  })
  .catch(function (err) {
    console.log(err);
  });
async function checkForJobs() {
  let newJobs = [];
  for (let i = 0; i < companyList.length; i++) {
    let jobUrl =
      "https://www.linkedin.com/jobs/search/?f_TPR=r86400&keywords=" +
      companyList[i] +
      "&sortBy=DD";
    await (await tab).get(jobUrl);

    let jobsToBeNotified = await tab.findElements(swd.By.css(".job-card-list"));
    for (let j = 0; j < jobsToBeNotified.length; j++) {
      await jobsToBeNotified[j].click();
      await tab;
      //jobsToBeNotified[i].getText
      // Name //.jobs-details-top-card__company-info
      // Description // jobs-description-content__text
      // link // jobs-apply-button
      let name = await (
        await tab.findElement(
          swd.By.css(".jobs-details-top-card__content-container")
        )
      ).getText();
      let Description = await (
        await tab.findElement(swd.By.css(".jobs-description-content__text"))
      ).getText();
      let jobObj = {
        name,
        Description,
      };
      newJobs.push(jobObj);
      mail(jobObj);
    }
  }

  console.log(newJobs);
}
async function login() {
  return new Promise(async function (resolve, reject) {
    let inputUserBoxPromise = tab.findElement(swd.By.css("#username"));
    let inputPassBoxPromise = tab.findElement(swd.By.css("#password"));
    let pArr = await Promise.all([inputUserBoxPromise, inputPassBoxPromise]);

    let inputUserBox = pArr[0];
    let inputPassBox = pArr[1];
    let inputUserBoxWillBeFilledP = inputUserBox.sendKeys("rj33536@gmail.com");
    let inputPassBoxWillBeFilledP = inputPassBox.sendKeys(password);

    let willBeFilledArr = await Promise.all([
      inputUserBoxWillBeFilledP,
      inputPassBoxWillBeFilledP,
    ]);
    let loginButtonPromise = tab.findElement(
      swd.By.css("button[data-litms-control-urn='login-submit']")
    );

    let loginButton = await loginButtonPromise;
    let loginButtonClicked = await loginButton.click();
    resolve();
  });
}
