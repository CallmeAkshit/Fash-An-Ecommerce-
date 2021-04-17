const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const UserCredential = require('../models/user-credential');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

//Sign up POST request
router.post('/', (req, res) => {
    if (!req.body) {
        res.status(400).send({error: "Email and Password not present in request"});
        return;
    }

    const { email, password } = req.body;

    if (!email) {
        res.status(400).send({error: "Email not present in request"});
        return;
    }

    if (!password) {
        res.status(400).send({error: "Password not present in request"});
        return;
    }

    UserCredential.findOne({ email }).then(user => {
        if (user) {
            res.status(400).send({error: "User already signed up"});
            return;
        }

        const hash = bcrypt.hashSync(password);

        const userCredential = new UserCredential({ email, password: hash });

        userCredential.save().then(() => {
            const user = new User({ _id: userCredential.id, email });
            console.log('Before creating User');
            user.save().then(() => {
                req.session.userId = userCredential.id;
                res.status(201).send({ id: userCredential.id });
            });
            console.log('User created');
        });
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.get('/me', auth.authenticate, (req, res) => {
    User.findOne({ _id: req.session.userId }).then(user => {
        res.send(user);
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.get('/:userId', (req, res) => {
    User.findOne({ _id: req.params.userId }).then(user => {
        res.send(user);
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.post('/isLogged', (req, res) => {
    if (!req.session.userId) {
        res.status(401).send({error: "Not Logged In"});
        return;
    }

    if (req.session.userId) {
        res.status(201).send({msg: "Logged In"});
        return;
    }
});

router.put('/me', auth.authenticate, (req, res) => {
    if (!req.session.userId) {
        res.send(401).send({ error: "Not Logged In"});
    }

    const { firstName, lastName, address, email } = req.body;

    const updateQuery = {};
    (firstName !== undefined) && (updateQuery.firstName = firstName);
    (lastName !== undefined) && (updateQuery.lastName = lastName);
    (address !== undefined) && (updateQuery.address = address);
    (email !== undefined) && (updateQuery.email = email);

    User.updateOne({ _id: req.session.userId }, updateQuery).then(() => {
        res.status(201).send({msg:'Updated'});
    }).catch((e) => {
        res.status(500).send({ error: e });
    });
});

module.exports = router;
