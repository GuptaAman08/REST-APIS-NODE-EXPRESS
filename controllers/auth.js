const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator/check')

const { customError } = require('../utils/generate-custom-erros')
const User = require('../models/user')
const { use } = require('../routes/auth')

exports.signup = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()){
        const err = customError("Validation Failed.", 422)
        err.data = errors.array()
        throw err
    }

    const email = req.body.email
    const password = req.body.password
    const name = req.body.name

    bcrypt.hash(password, 12)
    .then(hashedPwd => {
        const user = new User({
            email: email,
            password: hashedPwd,
            name: name
        })

        return user.save()
    })
    .then(result => {
        res.status(201).json({
            message: "User Created",
            userId: result._id
        })
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
}

exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let loadedUser;

    User.findOne({email: email})
        .then(user => {
            // It could be undefined if not user was found
            if (!user){
                throw customError("User ALready Exists", 401)
            }

            loadedUser = user
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if ( !isEqual){
                throw customError("Authentication Failed", 401)
            }

            const token = jwt.sign({
                    email: email,
                    userId: loadedUser._id.toString()
                },
                process.env.JSON_WEB_TOKEN_SECRET_KEY,
                {expiresIn: "1h"}
            )
            res.status(200).json({token: token, userId: loadedUser._id.toString()})
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500
            }
            return next(err)
        })
}

exports.getUserStatus = (req, res, next) => {
    User.findById(req.userId)
    .then(user => {
        if (!user){
            throw customError("User Not Found", 404)
        }
        res.status(200).json({
            status: user.status
        })
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
}

exports.updateUserStatus = (req, res, next) => {
    const newStatus = req.body.status

    User.findById(req.userId)
    .then(user => {
        if (!user){
            throw customError("User Not Found", 404)
        }

        user.status = newStatus
        return user.save()
    })
    .then(result => {
        res.status(200).json({
            message: "User Status Updated"
        })
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
}