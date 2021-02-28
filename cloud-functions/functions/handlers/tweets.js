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
                createdAt: doc.data().createdAt
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
        createdAt: new Date().toISOString()
    };
    
    db.collection('tweets').add(newTweet)
    .then(doc => {
        res.json({message: `document ${doc.id} created successfully!`});
    })
    .catch(err => {
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
    if (req.body.body.trim() === '') return res.status(400).json({error: "Comment cannot be empty"});
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