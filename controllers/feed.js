const { validationResult } = require('express-validator/check')
const Post = require('../models/post')
const User = require('../models/user')
const { customError } = require('../utils/generate-custom-erros')
const deleteImage = require('../utils/delete-image')
const { use } = require('../routes/auth')

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page
    const itemsPerPage = 2
    let totalPages;

    Post.find().countDocuments()
    .then( count => {
        totalPages = count
        return Post.find()
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage)
    })
    .then(posts => {
        res.status(200).json({
            message: "Fetched all posts",
            posts: posts,
            totalItems: totalPages
        })
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;

    const errors = validationResult(res)

    // console.log(errors)
    if (!errors.isEmpty()){
        // No need to put error inside next() since this block of code is synchronous. the express error handling middleware you contructed will then be called automatically.
        throw customError("Validation Failed. Entered incorrsct data", 422)
    }
    
    if (!req.file){
        throw customError("Image not present", 422)
    }

    // console.log(req.file)
    const imageUrl = "/" + req.file.path.replace(/\\/g, "/")
    let creator;

    const post = new Post({
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })

    post.save()
    .then(postData => {
        return User.findById(req.userId)
    })
    .then(user => {
        creator = user
        user.posts.push(post)
        return user.save()
    })
    .then(result => {
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: {_id: creator._id, name: creator.name}
        });
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId)
    .then(post => {
        if (!post){
            throw customError("Could not find post", 404)
        }

        res.status(200).json({
            message: "Post Fetched successfully",
            post: post
        })
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500
        }
        return next(err)
    })
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId

    const errors = validationResult(res)
    if (!errors.isEmpty()){
        throw customError("Validation Failed. Entered incorrsct data", 422)
    }

    const title = req.body.title
    const content = req.body.content

    // this imageUrl var will be set only if no file was choosen by user from frontend.  
    let imageUrl = req.body.image

    // If new file gets uploaded to replace the existing file
    console.log(imageUrl)
    if (req.file){
        imageUrl = "/" + req.file.path.replace(/\\/g, "/")
    }

    if (!imageUrl){
        throw customError("No file Picked", 422)
    }

    console.log(title, content, imageUrl)
    Post.findById(postId)
        .then(post => {
            if (!post){
                throw customError("Could not find post", 404)
            }

            if (post.creator.toString() !== req.userId){
                throw customError("Not Authorization", 403)
            }

            if (imageUrl !== post.imageUrl){
                deleteImage(post.imageUrl)
            }

            post.title = title,
            post.content = content,
            post.imageUrl = imageUrl

            return post.save()
        })
        .then(result => {
            res.status(200).json({
                message: "Post Updated Successfully",
                post: result
            })
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500
            }
            return next(err)
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId)
        .then(post => {
            if (!post){
                throw customError("Could not find post", 404)
            }

            if (post.creator.toString() !== req.userId){
                throw customError("Not Authorization", 403)
            }

            deleteImage(post.imageUrl)
            return Post.findByIdAndDelete(postId)
        })
        .then(result => {
            return User.findById(req.userId)
        })
        .then(user => {
            // mongoose provides pull method to remove element from an array
            user.posts.pull(postId)
            return user.save()
        })
        .then(result => {
            return res.status(200).json({
                message: "Post Deleted"
            })
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500
            }
            return next(err)
        })
}