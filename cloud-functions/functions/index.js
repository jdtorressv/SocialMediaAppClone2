const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');

const {getAllTweets, postOneTweet} = require('./handlers/tweets');
const {signup, login, uploadImage} = require('./handlers/users');

// Tweet routes  
app.get('/tweets', getAllTweets);
app.post('/tweet', FBAuth, postOneTweet);

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);