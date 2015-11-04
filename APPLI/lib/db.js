"use strict";

var mongo = require('mongoskin'), // inclure mongoskin
    crypto = require('crypto'); // module de cryptage


module.exports = function (config) {

    var USERS_COLLECTION = 'users',
        ORDERS_COLLECTION = 'orders',
        salt = 'MyPrecious',
        db;

    // crypter le password
    // crypto.createHmac = appelle plusieurs fois avec nouvelle donnée
    // update(password).digest = encodage hexadécimale
    function encryptPassword(password) {
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    }

    return {
        configure: function (config) {
            // {w : 1} = fournir l'abilité d'écriture
            // Connection à la base de donnée game mm si elle n'est pas créér,
            // Elle se créer automatiquement
            db = mongo.db((config ? config : 'mongodb://localhost:27017/game'), {w : 1});
        },
        createUser: function (userId, password, cardId, callback) {
            // Enumére le nombre de documents dans la collection
            // Vérifie donc s'il y a doublon ou non
            // Doublon = vrai , alors erreur
            db.collection(USERS_COLLECTION).count({user : userId}, function (err, count) {
                if (err) {
                    console.log("Erreur création de l'utilisateur:".error + err);
                    callback(new Error(err));
                } else if (count !== 0) {
                    console.log(userId + " Existe déjà".warn);
                    callback(new Error(userId + " Existe déjà".warn));
                } else {
                    db.collection(USERS_COLLECTION).insert({user: userId, password: encryptPassword(password), card: cardId}, function (err, result) {
                        if (err) {
                            console.log("Erreur d'insertion de l'utilisateur: ".error + err);
                            callback(new Error(err));
                        } else {
                            callback(null, "Utilisateur créer".info);
                        }
                    });
                }
            });
        },
        authenticateUser: function (userId, password, callback) {
            // Enumére le nombre de documents dans la collection
            // Vérifie donc s'il y a doublon ou non
            // Doublon = vrai , alors erreur
            db.collection(USERS_COLLECTION).count({user : userId, password: encryptPassword(password)}, function (err, count) {
                if (err) {
                    console.log("Erreur authentification de l'utilisateur: ".error + err);
                    callback(new Error(err));
                } else if (count === 0) {
                    callback(new Error("userid/password ne correspondent pas".warn));
                } else {
                    callback(null);
                }
            });
        },
        getUser: function (userId, callback) {
            // Selection d'un objet de la collection
            db.collection(USERS_COLLECTION).findOne({user : userId}, function (err, user) {
                if (err) {
                    console.log("Utilisateur introuvable:".error + err);
                    callback(new Error(err));
                } else {
                    console.log(user);
                    callback(null, user);
                }
            });
        },
        // Mise à des objet d'un utilisateur
        updateUser: function (userId, password, cardId, callback) {
            var data = {};
            if (password !== undefined && password !== null) {
                data.password = encryptPassword(password);
            }
            if (cardId !== undefined && cardId !== null) {
                data.card = cardId;
            }
            // Mise à jour du document utilisateur (ID)
            db.collection(USERS_COLLECTION).update({user : userId}, {$set: data}, function (err, result) {
                if (err) {
                    console.log("Ordre d'update introuvable:".error + err);
                    callback(new Error(err));
                } else {
                    db.collection(USERS_COLLECTION).findOne({user: userId}, function (err, user) {
                        if (err) {
                            console.log("Utilisateur introuvable:".error + err);
                            callback(new Error(err));
                        } else {
                            console.log(user);
                            callback(null, user);
                        }
                    });
                }
            });
        },

        // Insertion des informations relatif à la commande
        // De l'utilisateur avec toutes les informations nécessaires à garder
        insertOrder: function (order_id, user_id, payment_id, state, amount, description, created_time, callback) {
            db.collection(ORDERS_COLLECTION).insert({order_id : order_id, user_id : user_id, payment_id : payment_id, state : state, amount : amount, description: description, created_time : created_time}, function (err, result) {
                if (err) {
                    console.log("Ordre d'insertion introuvable: ".error + err);
                    callback(new Error(err));
                } else {
                    callback(null, result);
                }
            });
        },
        // Mise à jour de la commande => update
        updateOrder: function (order_id, state, created_time, callback) {
            db.collection(ORDERS_COLLECTION).update({order_id : order_id}, {$set : {created_time : created_time, state : state}}, function (err, update) {
                if (err) {
                    console.log("Ordre d'insertion introuvable: ".error + err);
                    callback(new Error(err));
                }
                else {
                    console.log("Ordre d'insertion: ".info + update);
                    callback(null, update);
                }
            });
        },

        // Obtenir les commandes via un select *
        getOrders: function (userId, callback) {
            db.collection(ORDERS_COLLECTION).find({user_id : userId}, {limit : 10, sort : [['created_time', -1]]}, function (err, orders) {
                if (err) {
                    console.log("Ordre introuvable:".error + err);
                    callback(new Error(err));
                } else {
                    orders.toArray(function (err, orderItem) {
                        console.log(" ... " + orderItem);
                        callback(err, orderItem);
                    });
                }
            });
        },
       // Obtenir la commande via un select
        getOrder: function (order_id, callback) {
            db.collection(ORDERS_COLLECTION).findOne({order_id : order_id}, function (err, order) {
                if (err) {
                    console.log("Ordre introuvable:".error + err);
                    callback(new Error(err));
                } else {
                    console.log(order);
                    callback(null, order);
                }
            });
        }
    };
};