const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');

const {getAllTweets, postOneTweet, getTweet, commentOnTweet, likeTweet, unlikeTweet, deleteTweet} = require('./handlers/tweets');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');

// Tweet routes  
app.get('/tweets', getAllTweets);
app.post('/tweet', FBAuth, postOneTweet);
app.get('/tweet/:tweetId', getTweet);
app.post('/tweet/:tweetId/comment', FBAuth, commentOnTweet);
app.get('/tweet/:tweetId/like', FBAuth, likeTweet);
app.get('/tweet/:tweetId/unlike', FBAuth, unlikeTweet);
app.delete('/tweet/:tweetId', FBAuth, deleteTweet);

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);