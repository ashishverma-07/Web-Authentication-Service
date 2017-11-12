const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');


const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const MOVED_PERMANENTLY = 301;
const FOUND = 302;
const SEE_OTHER = 303;
const NOT_MODIFIED = 303;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;
const ERROR_UNAUTHORIZED = 401;

const secret = new Buffer("something", "base64").toString();

let authTime;

function generateToken(req) {
    var token = jwt.sign({
        auth: 'ashish',
        agent: req.headers['user-agent'],
        iat: (new Date().getTime() / 1000),
        exp: (new Date().getTime() / 1000) + authTime
    }, secret); 
    return token;
} // secret is defined in the JWT_SECRET environment variable

function serve(app, port, model, authT) {
   
    authTime = authT;
    app.locals.model = model;
    app.locals.port = port;
    setupRoutes(app);
    console.log(`listening on port ${port}`);
}

//setting up routes
function setupRoutes(app) {
    app.use('/users/:id', bodyParser.json());
    app.use('/users/:id', cacheUser(app));
    app.use(bearerToken());
    app.put('/users/:id', newUser(app));
    app.put('/users/:id/auth', authUser(app));
    app.get('/users/:id', getUser(app));
    app.delete('/users/:id', deleteUser(app));
    app.post('/users/:id', updateUser(app));
}

module.exports = {
    serve: serve
}
//getUser 
function getUser(app) {
    return function (request, response) {
             
        const id_R = request.params.id;
        const id = id_R;
       
        request.app.locals.model.users.getUser(id).
        then(function (id) {
           
            var encoded = request.token;
            jwt.verify(encoded, secret, function (err, decode) {
               
                if (err) {
                    console.log("Decode error");
                    console.log(err);
                    response.status(ERROR_UNAUTHORIZED).send('[{"status": "ERROR_UNAUTHORIZED","/users/":` "' + id + 'requires a bearer authorization header"}]');
                } else {
                    console.log("Decode success");
                    console.log(decode);
                    response.status(OK).send(request.user);
                }
                console.log("Decode end");
            });
        }).
        catch((err) => {
           
            console.error(err);
            response.status(NOT_FOUND).send('[{"status": "ERROR_NOT_FOUND","info":"user ' + id + ' not found"}]');
        });
    };
}

//authUser
function authUser(app) {
    return function (request, response) {
       
        const id = request.params.id;
        const pw = request.body.pw;

        console.log(pw);
        if (pw) {
            request.app.locals.model.users.authUser(id, pw).
            then(function (id) {
                
                if (id) {
                    var encoded = generateToken(request);
                    response.status(OK).send('[{"status": "OK","authToken":` "' + encoded + '"}]');
                } else {
                    response.status(NOT_FOUND).send('[{"status": "ERROR_UNAUTHORIZED","info":"/users/' + id + '/auth requires a valid pw password query parameter"}]');
                }
            }).
            catch((err) => {
               
                console.error(err);
                response.status(NOT_FOUND).send('[{"status": "ERROR_NOT_FOUND","info":"user ' + id + ' not found"}]');

            });
        } else {
            response.status(NOT_FOUND).send('[{"status": "ERROR_UNAUTHORIZED","info":"/users/' + id + '/auth requires a valid pw password query parameter"}]');
        }
    };
}
//delete user
function deleteUser(app) {
    return function (request, response) {
        if (!request.user) {
            response.sendStatus(NOT_FOUND);
        } else {
            request.app.locals.model.users.deleteUser(request.params.id).
            then(() => response.sendStatus(NO_CONTENT)).
            catch((err) => {
                console.error(err);
                response.sendStatus(SERVER_ERROR);
            });
        }
    };
}

//new user
function newUser(app) {
    return function (request, response) {
        const userInfo = request.body;
        const id = request.params.id;
        var fullUrl = request.protocol + '://' + request.get('host') + request.originalUrl;

        if (typeof userInfo === 'undefined') {
            console.error(`missing body`);
            response.sendStatus(BAD_REQUEST);
        } else if (request.user) {
            response.setHeader('Location', fullUrl);
            response.status(SEE_OTHER).send('[{"status": "EXISTS","info":"user ' + id + ' already exists"}]');
        } else {
            
            const pw = request.query.pw;
           
            request.app.locals.model.users.newUser(id, pw, userInfo).
            then(function (id) {
                var encoded = generateToken(request);
                response.setHeader('Location', fullUrl);
                response.status(CREATED).send('[{"status": "CREATED","authToken":` "' + encoded + '"}]');
            }).
            catch((err) => {
                console.error(err);
                response.sendStatus(SERVER_ERROR);
            });
        }
        
    };
}

function updateUser(app) {
    return function (request, response) {
        const id = request.params.id;
        const userInfo = request.body;
        if (!request.user) {
            console.error(`user ${request.params.id} not found`);
            response.sendStatus(NOT_FOUND);
        } else {
            request.app.locals.model.users.updateUser(id, userInfo).
            then(function (id) {
                response.redirect(SEE_OTHER, requestUrl(request));
            }).
            catch((err) => {
                console.error(err);
                response.sendStatus(SERVER_ERROR);
            });
        }
    };
}

function cacheUser(app) {
    return function (request, response, next) {
        const id = request.params.id;
        if (typeof id === 'undefined') {
            response.sendStatus(BAD_REQUEST);
        } else {
            request.app.locals.model.users.getUser(id, false).
            then(function (user) {
                request.user = user;
                next();
            }).
            catch((err) => {
                console.error(err);
                response.sendStatus(SERVER_ERROR);
            });
        }
    }
}


function requestUrl(req) {
    const port = req.app.locals.port;
    return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
