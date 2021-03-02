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
            tweetId: doc.id
          });
        }
      })
      .catch((err) => {
        console.error(err);
      })
  });

exports.deleteNotificationOnUnLike = functions
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
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
            tweetId: doc.id
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

  exports.onUserImageChange = functions
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('tweets')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const tweet = db.doc(`/tweets/${doc.id}`);
            batch.update(tweet, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onTweetDelete = functions
  .firestore.document('/tweets/{tweetId}')
  .onDelete((snapshot, context) => {
    const tweetId = context.params.tweetId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('tweetId', '==', tweetId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('tweetId', '==', tweetId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('tweetId', '==', tweetId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });