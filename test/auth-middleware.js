const expect = require("chai").expect
const jwt = require('jsonwebtoken')
const sinon = require("sinon")

const authMiddleware = require('../middleware/is-auth')


describe('Auth Middleware', () => {
    it("should throw an error if no authorization header exists", () => {
        const req = {
            get: () => {
                return null
            }
        }
    
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw("Authentication Failed")
    })
    
    it("should throw an error if authorization header contain only one word in a string", () => {
        const req = {
            get: () => {
                return "null"
            }
        }
        // throw() => expects to throw some error. (instead of listening to some specific error)
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw()
    })

    it("should yield a userId after decoding the token", () => {
        const req = {
            get: () => {
                return "Bearer akfhasd9f9asdfsd98fasdfjksda"
            }
        }
        sinon.stub(jwt, "verify")
        jwt.verify.returns({
            userId: "abc"
        })

        authMiddleware(req, {}, ()=>{})
        expect(req).to.have.property("userId")

        jwt.verify.restore() // restoring the original verify function after testing
    }) 

    it("should throw an error if token is not valid or cannot be verified", () => {
        const req = {
            get: () => {
                return "Bearer abc"
            }
        }

        expect(authMiddleware.bind(this, req, {}, () => {} )).to.throw()
    })

})
