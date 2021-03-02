const { onCall } = require('firebase-functions/lib/providers/https');
const {db} = require('../util/admin');

exports.getAllTweets = (req, res) => {
    db
    .collection('tweets')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => { 
        let tweets = [];
        data.forEach(doc => {
            tweets.push({
                tweetId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage: doc.data().userImage
            });
        });
        return res.json(tweets);
    })
    .catch(err => console.error(err))
}

exports.postOneTweet = (req, res) => {
    const newTweet = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    
    db.collection('tweets')
    .add(newTweet)
    .then((doc) => {
        const resTweet = newTweet;
        resTweet.tweetId = doc.id;
        res.json(resTweet);
    })
    .catch((err) => {
        res.status(500).json({error: "Something went wrong with document creation"});
        console.error(err);
    });
}

exports.getTweet = (req, res) => {
    let tweetData = {};
    db.doc(`/tweets/${req.params.tweetId}`)
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return res.status(404).json({error: "Tweet could not be found"});
        }
        tweetData = doc.data();
        tweetData.tweetId = doc.id;
        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('tweetId', '==', req.params.tweetId)
        .get();
    })
    .then((data) => {
        tweetData.comments = [];
        data.forEach((doc) => {
            console.log("Hi");
            tweetData.comments.push(doc.data());
        });
        return res.json(tweetData);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    });
}

// Comment on a tweet
exports.commentOnTweet = (req, res) => {
    if (req.body.body.trim() === '') return res.status(400).json({comment: "Comment cannot be empty"});
    const comment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        tweetId: req.params.tweetId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    }
    db.doc(`/tweets/${req.params.tweetId}`).get()
    .then((doc) => {
        if (!doc.exists) return res.status(404).json({error: "Tweet could not be found"});
        return doc.ref.update({commentCount: doc.data().commentCount + 1});
    })
    .then(() => {
        return db.collection('comments').add(comment);
    })
    .then(() => {
        res.json(comment);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: "Something went terribly wrong"});
    });
}

// Like a tweet
exports.likeTweet = (req, res) => {
    const likeDoc = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('tweetId', '==', req.params.tweetId)
    .limit(1);

    const tweetDoc = db.doc(`/tweets/${req.params.tweetId}`);

    let tweetData;

    tweetDoc.get()
    .then((doc) => {
        if (doc.exists) {
            tweetData = doc.data();
            tweetData.tweetId = doc.id; 
            return likeDoc.get()
        } else {
            return res.status(404).json({error: "Tweet could not be found"});
        }
    })
    .then((data) => {
        if (data.empty) {
            return db.collection('likes').add({
                tweetId: req.params.tweetId,
                userHandle: req.user.handle 
            })
            .then(() => {
                tweetData.likeCount++;
                return tweetDoc.update({likeCount: tweetData.likeCount});
            })
            .then(() => {
                return res.json(tweetData);
            })
        } else {
            return res.status(400).json({error: "Tweet already liked"});
        }
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

// Unlike a tweet 
exports.unlikeTweet = (req, res) => {
    const likeDoc = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('tweetId', '==', req.params.tweetId)
    .limit(1);

    const tweetDoc = db.doc(`/tweets/${req.params.tweetId}`);

    let tweetData;

    tweetDoc.get()
    .then((doc) => {
        if (doc.exists) {
            tweetData = doc.data();
            tweetData.tweetId = doc.id; 
            return likeDoc.get()
        } else {
            return res.status(404).json({error: "Tweet could not be found"});
        }
    })
    .then((data) => {
        if (data.empty) {
            return res.status(400).json({error: "Tweet not liked"});
        } else {
            return db.doc(`/likes/${data.docs[0].id}`).delete()
            .then(() => {
                tweetData.likeCount--;
                return tweetDoc.update({likeCount: tweetData.likeCount});
            })
            .then(() => {
                res.json(tweetData);
            })
        }
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

// Delete a tweet 
exports.deleteTweet = (req, res) => {
    const document = db.doc(`/tweets/${req.params.tweetId}`);
    document
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: 'Tweet could not be found' });
        }
        if (doc.data().userHandle !== req.user.handle) {
          return res.status(403).json({ error: 'Unauthorized' });
        } else {
          return document.delete();
        }
      })
      .then(() => {
        res.json({ message: 'Tweet deleted successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
};