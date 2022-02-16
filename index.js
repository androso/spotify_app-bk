require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 8888;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const stateKey = "spotify_auth_state";
const axios = require('axios');
const cors = require('cors');
const clientURL = "https://yourstats.androsoa3.repl.co";

app.use(cors());

app.get("/", (req, res) => {
  res.send("you shouldn't be here bestie");
});

const generateRandomString = length => {
  let text = "";
  const possibleCombinations =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possibleCombinations.charAt(Math.floor(Math.random() * possibleCombinations.length));
  }
  return text;
}

app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  const scope = [
    'user-read-private',
    'user-top-read',
    'user-read-email'
  ].join(' ');

  const queryParams = new URLSearchParams([
    ["client_id", CLIENT_ID],
    ["response_type", "code"],
    ["redirect_uri", REDIRECT_URI],
    ["state", state],
    ["scope", scope]
  ]);
  res.cookie(stateKey, state);
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
})
app.get("/callback", (req, res) => {
  const code = req.query.code || null;

  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: new URLSearchParams([
      ["grant_type", "authorization_code"],
      ["code", code],
      ["redirect_uri", REDIRECT_URI]
    ]),
    headers: {
      "content_type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
  }).then(response => {
    if (response.status === 200) {
      const { access_token, refresh_token, expires_in } = response.data;

      const queryParams = new URLSearchParams([
        ["access_token", access_token],
        ["refresh_token", refresh_token],
        ["expires_in", expires_in]
      ])

      // Redirect to react app
      res.redirect(`${clientURL}?${queryParams}`);
      // pass along tokens in query params
    } else {
      const errorParams = new URLSearchParams([
        ["error", "invalid_tooken"]
      ])
      res.redirect(`/?${errorParams}`);
    }
  }).catch(err => {
    res.send(err)
  })
})
app.get("/refresh_token", (req, res) => {
  const { refresh_token } = req.query;

  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: new URLSearchParams([
      ["grant_type", "refresh_token"],
      ["refresh_token", refresh_token]
    ]),
    headers: {
      "content_type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
  }).then(response => {
    res.send(response.data);
  }).catch(error => {
    res.send(error);
  })
})
app.listen(PORT, () => {
  console.log("all working just fine");
  console.log(`at port ${PORT}`);
});