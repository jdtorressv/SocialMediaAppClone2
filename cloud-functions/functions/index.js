const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');
const FBAuth = require('./util/fbAuth');

const {getAllTweets, postOneTweet, getTweet, commentOnTweet, likeTweet, unlikeTweet, deleteTweet} = require('./handlers/tweets');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users');

// Tweet routes  
app.get('/tweets', getAllTweets);
app.post('/tweet', FBAuth, postOneTweet);
app.get('/tweet/:tweetId', getTweet);
app.delete('/tweet/:tweetId', FBAuth, deleteTweet);
app.get('/tweet/:tweetId/like', FBAuth, likeTweet);
app.get('/tweet/:tweetId/unlike', FBAuth, unlikeTweet);
app.post('/tweet/:tweetId/comment', FBAuth, commentOnTweet);

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/tweets/${snapshot.data().tweetId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists && doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            screamId: doc.id
          });
        }
      })
      // .then(() => {
      //   return;
      // })
      .catch((err) => {
        console.error(err);
        return;
      })
  });

exports.deleteNotificationOnUnLike = functions
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      // .then(() => {
      //   return;
      // })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/tweets/${snapshot.data().tweetId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            screamId: doc.id
          });
        }
      })
      // .then(() => {
      //   return;
      // })
      .catch((err) => {
        console.error(err);
        return;
      });
  });