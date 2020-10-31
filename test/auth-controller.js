const mongoose = require("mongoose")
const expect = require("chai").expect
const sinon = require("sinon")

const User = require("../models/user")
const authController = require('../controllers/auth')
require('dotenv').config()

describe('Auth Controller', () => {
    // Execute once berfore all test cases
    before((done) => {
        mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PWD}@primary.u62r1.mongodb.net/${process.env.DB_TEST}?retryWrites=true&w=majority`, { useUnifiedTopology: true, useNewUrlParser: true })
            .then(result => {
                const user = new User({
                    email: "test@test.com",
                    password: "tester",
                    name: "test",
                    post: [],
                    _id: "5c0f66b979af55031b34728a"
                })
                user.save()
                .then((result) => {
                    done()
                })
        })
    })

    // Using stub instead of making api call
    it("should throw an error with statusCode of 500 if accessing database fails", () => {
        sinon.stub(User, "findOne")
        User.findOne.throws()

        const req = {
            body: {
                email: "aman.gupta@tacto.in",
                password: "123456"
            }
        }

        authController.login(req, {}, () => { })
            .then(result => {
                expect(result).to.be.an("error")
                expect(result).to.have.property("statusCode", 500)
            })

        User.findOne.restore()
    })

    // using test database instead of stub
    it("should send a response with a valid user status for existing user", (done) => {

        const req = {
            userId: "5c0f66b979af55031b34728a"
        }

        const res = {
            statusCode: 500,
            userStatus: null,
            status: function (code) {
                this.statusCode = code
                return this
            },
            json: function (data) {
                this.userStatus = data.status
            }

        }

        authController.getUserStatus(req, res, () => { })
            .then(() => {
                expect(res.statusCode).to.be.equal(200)
                expect(res.userStatus).to.be.equal("New User")
                done()
            })
    })

    // Execute once after  all test cases
    after((done) => {
        User.deleteMany({})
        .then(() => {
            // Despite when the test finishes your terminal will still be in running state this is because mocha finds some running process in its even loop and that was mongo db open connection
            mongoose.disconnect()
            .then(() => {
                done()
            })
        })
    })
    
})
