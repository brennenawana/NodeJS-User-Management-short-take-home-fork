/*
We need to
  1.  Create CRUD endpoints for a users database.
      a.  The records can just be saved in a noSQL database (or database of your choosing)
  2.  Each user should have the following data entries: 
          id, name, zip code, latitude, longitude, timezone
  3.  When creating a user, take input for name and zip code.  
  4.  Fetch the latitude, longitude, and timezone - Documentation: https://openweathermap.org/current
      (You will need to generate an API Key to use this API)
  5.  When updating a user, Re-fetch the latitude, longitude, and timezone if zip code changes
  6.  Connect to a simple ReactJS front-end
  * Feel free to add add something creative if you'd like, but don't spend a lot of time on this
*/

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log('triggering  "/" endpoint...');

  // define company name
  let companyName = "SMART";
  console.log("companyName = ", companyName);

  // send response
  res.send(`Welcome to the ${companyName} interview!`);
});

app.listen(8080);
