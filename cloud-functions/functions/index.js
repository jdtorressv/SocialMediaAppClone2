const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express');
const app = express(); 

app.get('/tweets', (req, res) => {
    admin.firestore().collection('tweets').get()
    .then(data => {
        let tweets = [];
        data.forEach(doc => {
            tweets.push(doc.data());
        });
        return res.json(tweets);
    })
    .catch(err => console.error(err))
})

app.post('/tweet', (req, res) => {
    const newTweet = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };
    
    admin.firestore().collection('tweets').add(newTweet)
    .then(doc => {
        res.json({message: `document ${doc.id} created successfully!`});
    })
    .catch(err => {
        res.status(500).json({message: "Something went wrong with document creation"});
        console.error(err);
    })
});

exports.api = functions.https.onRequest(app);