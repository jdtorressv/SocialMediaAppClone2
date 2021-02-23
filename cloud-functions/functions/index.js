const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello World!");
});

exports.getScreams = functions.https.onRequest((req, res) => {
    admin.firestore().collection("tweets").get()
        .then(data => {
            let tweets = [];
            data.forEach(doc => {
                tweets.push(doc.data());
            });
            return res.json(tweets);
        })
        .catch(err => console.error(err))
});

exports.createScream = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST') {
        return res.status(400).json({error: "Method not permitted"});
    }
    const newTweet = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };
    admin.firestore().collection("tweets").add(newTweet)
    .then(doc => {
        res.json({message: `document ${doc.id} created successfully!`});
    })
    .catch(err => {
        res.status(500).json({message: "Something went wrong with document creation"});
        console.error(err);
    })
});