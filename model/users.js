const assert = require('assert');
var bcrypt = require('bcrypt');

const USERS = 'users';
const DEFAULT_USERS = './users_data';
const DATA = '_data';

function Users(db) {
    this.db = db;
    this.users = db.collection(USERS);
}

Users.prototype.getUser = function (id, mustFind = true) {
   
    const searchSpec = {
        _id: id
    };
    return this.users.find(searchSpec).toArray().
    then(function (users) {
        return new Promise(function (resolve, reject) {
            if (users.length === 1) {
                resolve(users[0].DATA);
            } else if (users.length == 0 && !mustFind) {
                resolve(null);
            } else {
                reject(new Error(`cannot find user ${id}`));
            }
        });
    });
}

Users.prototype.authUser = function (id, pw, mustFind = true) {
    
    const searchSpec = {
        _id: id
    };
    console.log(searchSpec);
    return this.users.find(searchSpec).toArray().
    then(function (users) {
        return new Promise(function (resolve, reject) {
           
            if (users.length === 1) {
                let passMatch = bcrypt.compareSync(pw, users[0].pw);
                if (passMatch) {
                    resolve(users[0].DATA);
                } else {
                    resolve(null);
                }

            } else if (users.length == 0 && !mustFind) {
                resolve(null);
            } else {
                reject(new Error(`cannot find user ${id}`));
            }
        });
    });
}

Users.prototype.newUser = function (id, pw, user) {
    var hash = bcrypt.hashSync(pw, 10);
    const d = {
        _id: id,
        pw: hash,
        DATA: user
    };
    
    return this.users.insertOne(d).
    then(function (results) {
        return new Promise((resolve) => resolve(results.insertedId));
    });
}

Users.prototype.deleteUser = function (id) {
    return this.users.deleteOne({
        _id: id
    }).
    then(function (results) {
        return new Promise(function (resolve, reject) {
            if (results.deletedCount === 1) {
                resolve();
            } else {
                reject(new Error(`cannot delete user ${id}`));
            }
        });
    });
}

Users.prototype.updateUser = function (id, pw, user) {
    const d = {
        _id: id,
        pw: pw,
        DATA: user
    };
    return this.users.replaceOne({
        _id: id
    }, d).
    then(function (result) {
        return new Promise(function (resolve, reject) {
            if (result.modifiedCount != 1) {
                reject(new Error(`updated ${result.modifiedCount} users`));
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    Users: Users
};
