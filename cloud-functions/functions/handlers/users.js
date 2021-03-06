const {db, admin} = require("../util/admin");
const firebaseConfig = require("../util/firebaseConfig");
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);
const {validateSignupData, validateLoginData, reduceUserDetails} = require('../util/validators'); 
const { user } = require("firebase-functions/lib/providers/auth");


//Sign up user
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,        
    };

    const {valid, errors} = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    const noImg = 'no-img.png';

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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
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
                return res.status(500).json({error: "Something went wrong server side"});
            }
        })
}

//Log user in 
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const {valid, errors} = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);
    
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then((token) => {
        return res.json({token});
    })
    .catch(err => {
        console.error(err);
        return res.status(403).json({general: "Wrong credentials, please try again"});
    })
}

//Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
        return res.json({message: "User details added successfully!"});
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

// Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
        if (doc.exists){
            userData.user = doc.data();
            return db
            .collection('tweets')
            .where('userHandle', '==', req.params.handle)
            .orderBy('createdAt', 'desc')
            .get();
        } else {
            return res.status(404).json({error: 'User not found'});
        }
    })
    .then((data) => {
        userData.tweets = [];
        data.forEach((doc) => {
            userData.tweets.push({
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                tweetId: doc.id
            })
        });
        return res.json(userData);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

//Get Own (Authenticated User) Details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};

    db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
        if (doc.exists) {
            userData.credentials = doc.data();
            return db.collection('likes').where("userHandle", "==", req.user.handle).get()
            .then(data => {
                userData.likes = [];
                data.forEach(doc => {
                    userData.likes.push(doc.data())
                });
                return db.collection('notifications').where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc').limit(10).get();
            })
            .then((data) => {
                userData.notifications = [];
                data.forEach(doc => {
                    userData.notifications.push({
                        recipient: doc.data().recipient,
                        sender: doc.data().sender,
                        createdAt: doc.data().createdAt,
                        tweetId: doc.data().tweetId,
                        type: doc.data().type,
                        read: doc.data().read,
                        notificationId: doc.id

                    })
                });
                return res.json(userData);
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({error: "There was an error fetching the logged in user's details"});
            })
        }
    })

}

// Upload user image 
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    let imFileName;
    let imToBeUploaded = {};
    
    const busboy = new BusBoy({headers: req.headers});
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: "Wrong file type submitted"});
        }
        const imExArr = filename.split('.');
        const imEx = imExArr[imExArr.length-1];
        imFileName = `${Math.round(Math.random() * 100000000000)}.${imEx}`; 
        const filepath = path.join(os.tmpdir(), imFileName);
        imToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imFileName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({imageUrl: imageUrl});
        })
        .then(() => {
            return res.json({message: "Image uploaded successfully!"});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code});
        })
    })
    busboy.end(req.rawBody);
}

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {read: true});
    });
    batch.commit()
    .then(() => {
        return res.json({message: 'Notifications marked read'});
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}