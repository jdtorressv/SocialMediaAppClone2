const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();
const firebaseConfig = {
    apiKey: "AIzaSyBfDAX1WbvS5S4B9-8Dg7LkPu5DC7RuANk",
    authDomain: "socialmediaappclone2.firebaseapp.com",
    projectId: "socialmediaappclone2",
    storageBucket: "socialmediaappclone2.appspot.com",
    messagingSenderId: "517208163949",
    appId: "1:517208163949:web:00b99785f5d15d5cfde164",
    measurementId: "G-3NVHQCL37Z"
  };

const firebase = require('firebase');
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/tweets', (req, res) => {
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
})

app.post('/tweet', (req, res) => {
    const newTweet = {
        body: req.body.body,
        userHandle: req.body.userHandle,
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
});

//Signup Route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,        
    };
    //TODO:VALIDATE USER
    let token, userId;
    db.doc(`users/${newUser.handle}`).get()
    .then(doc => {
        if (doc.exists) {
            return res.status(400).json({handle: "Sorry! This handle is already taken."});
        }
        else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken; 
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({token});
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                return res.status(400).json({email: "This email address is already in use."})
            } 
            else {
                return res.status(500).json({error: err.code});
            }
        })
});

exports.api = functions.https.onRequest(app);