"use strict";

var db = require('../lib/db')(); // module perso base de donne
var paypal = require('paypal-rest-sdk'); // sdk pour paypal
var uuid = require('node-uuid'); // fort cryptologie (aleatoire)
var config = {};

// Index

exports.index = function (req, res) {
	res.locals.session = req.session;
	var error = req.flash('error');
	var message = error.length > 0 ? error[0].message : error;
	res.render('index', {message: message});
};

// Authentification middleware

exports.auth = function (req, res, next) {
	if (req.session.authenticated) {
		next();
	} else {
		res.redirect('signin');
	}
};

// fonctiono se connecter

exports.signup = function (req, res) {
	res.locals.session = req.session;
	res.render('sign_up', {});
};

// fonction  remplissage de l'enregistrement

exports.completesignup = function (req, res) {
	res.locals.session = req.session;
	var user = req.body.user;
	var userCard = user.credit_card;

	if (user.password !== user.password_confirmation) {
		res.render('sign_up', {message: [{desc: "Les mots de passe ne correspondent pas", type: "error"}]});
	} else {

		//TODO: Ajouter carte validation

		var card = {type: userCard.type, number: userCard.number, cvv2: userCard.cvv2, expire_month: userCard.expire_month, expire_year: userCard.expire_year };

		paypal.credit_card.create(card, {}, function (err, card) {
			var cardId = (err) ? "" : card.id;
			db.createUser(user.email, user.password, cardId, function (dbErr, response) {
				if (dbErr) {
					res.render('sign_up', {message: [{desc: dbErr.message, type: "error"}]});
				} else {
					req.session.authenticated = true;
					req.session.email = user.email;
					if (err && (userCard.type !== '' || userCard.number !== '')) {
						console.log("Erreur de la création de la carte".error + JSON.stringify(err.error.details));
						req.flash('erreur', {message: [{desc: "Vous êtes inscrit mais il y a eu une erreur quant à la sauvegarde de votre carte", type: "error"}]});
					}else{
						req.flash('error', {message: [{desc: "Vous vous êtes inscrit avec succés", type:"info"}]});
					}
					res.redirect('');
				}
			});
		});
	}
};



exports.signin = function (req, res) {
	res.locals.session = req.session;
	var error = req.flash('error');
	var message = error.length > 0 ? error[0].message : error;
	res.render('sign_in', {message: message});
};

// fonction quand l'utilisateur appui sur le bouton Signin , s'il a pas d'erreur il est enregistrer

exports.dologin = function (req, res) {
	res.locals.session = req.session;

	var user = req.body.user;
	db.authenticateUser(user.email, user.password, function (err, response) {
		if (err) {
			req.flash('error', { message : [{desc: err.message, type: "error"}]});
			res.redirect('signin');
		} else {
			req.session.authenticated = true;
			req.session.email = user.email;
			res.render('index', {});
		}
	});
};

// fonction pour se deconnecter

exports.signout = function (req, res) {
	res.locals.session = req.session;
	req.session.authenticated = false; // destruction de la session
	req.session.email = ''; // variable email remit a zero
	req.flash('error', {message: [{desc: "Vous avez été déconnecté.", type:"info"}]});
	res.redirect('/');
};

/*
// Facebook routes

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback',
passport.authenticate('facebook', {succesRedirect: '/index',
			failureRedirect: '/'}));
*/

// retrouver le profile de l'utilisateur s'il est co

exports.profile = function (req, res) {
	res.locals.session = req.session;
	db.getUser(req.session.email, function (err, user) {
		if (err || !user) {
			console.log(err);
			res.render('profile', {message: [{desc:"Impossible de retrouver votre profile", typ: "error"}]});
		}else{
			if(!user.card){
				res.render('profile', {user: user});
			}else{
				paypal.credit_card.get(user.card, {}, function(err, card){
					if(err){
						console.log(err.error);
						res.render('profile', {user: user, message: [{desc: "Impossible de retrouver les informations de votre carte", type: "error"}]});
					}else{
						res.render('profile', {user: user, card: card});
					}
				});
			}
		}
	});
};


// Mettre à jour le profile, mot de passe , email , carte (s'il y a )

exports.updateprofile = function (req, res) {
	res.locals.session = req.session;
	var userData = req.body.user,
	cardData = userData.credit_card,
	data = {},
	newPassword,
	newCard;

	db.authenticateUser(req.session.email, userData.current_password, function (authErr, authRes) {
		db.getUser(req.session.email, function (userErr, savedUser) {
			paypal.credit_card.get(savedUser.card, {}, function (cardErr, card) {

				data.user = (userErr) ? {} : savedUser;
				data.card = (cardErr) ? {} : card;
				if (authErr) {
					data.message = [{ desc: "Votre actuel mots de passe est incorrect".error, type: "error"}];
					res.render('profile', data);
				} else {
					if (userData.password !== '') {
						if (userData.password !== userData.password_confirmation) {
							data.message = [{ desc: "Vos mots de passe ne correspondent pas".error, type: "error"}];
							res.render('profile', data);
						} else {
							newPassword = userData.password;
						}
					}
					if (cardData.type !== '' || cardData.number !== '') {
						card = {type: cardData.type, number: cardData.number, cvv2: cardData.cvv2, expire_month: cardData.expire_month, expire_year: cardData.expire_year };
						paypal.credit_card.create(card, {}, function (err, card) {
							if (err) {
								console.log("Erreur de création de carte: " + JSON.stringify(err.error.details));
								data.message = [{ desc: " Erreur de sauvegarde des informations de votre carte : ".error + err.message, type: "error"}];
								if (newPassword !== null) {
									data.message.push({ desc: " Votre mot de passe n'a pas été mis à jour.", type: "block"});
								}
								res.render('profile', data);
								newCard = card.id;
								var messages;
								db.updateUser(userData.username, newPassword, newCard, function (err, user) {
									if (err) {
										messages = [{ desc: "Erreur de mise à jour de votre profile: ".error + err, type: "error"}];
									} else {
										data.card = card;
										data.user = user;
										messages = [{ desc: "Votre profile a été mis à jour".info, type: "info"}];
									}
									data.message = messages;
									res.render('profile', data);
								});
							}
						});
					} else {
						db.updateUser(userData.username, newPassword, newCard, function (err, user) {
							if (err) {
								data.message = [{ desc: "Erreur de mise à jour de votre profile: ".error + err, type: "error"}];
							} else {
								data.user = user;
								data.message = [{ desc: "Votre profile a été mis à jour.".info, type: "info"}];
							}
							res.render('profile', data);
						});
					}
				}
			});
});
});
};

//  Confirmation dse l'ordre de paiment

exports.orderconfirm = function (req, res) {
	res.locals.session = req.session;
	var amount = req.query.orderAmount,
	desc   = req.query.orderDescription;
	req.session.amount = amount;
	req.session.desc = desc;

	db.getUser(req.session.email, function (err, user) {
		var data = {'amount' : amount, 'desc' : desc};
		console.log(user.card);
		if (!err && (user.card !== undefined && user.card !== '')) {
			data.credit_card = 'true';
		}
		res.render('order_confirm', data);
	});
};

// creation de l'ordre  et configuration

exports.order = function (req, res) {

	res.locals.session = req.session;
	var order_id = uuid.v4();

	if (req.query.order_payment_method === 'credit_card')
	{
		var payment = {
			"intent": "sale",
			"payer": {
				"payment_method": "credit_card",
				"funding_instruments": [{
					"credit_card_token": {}
				}]
			},
			"transactions": [{
				"amount": {
					"currency": "EUR"
				},
				"description": "C'est une description."
			}]
		};

		db.getUser(req.session.email, function (err, user) {
			if (err || !user) {
				console.log(err);
				res.render('order_detail', { message: [{desc: "Impossible de retrouver les information de l'utilisateur", type: "error"}]});
			} else {
				payment.payer.funding_instruments[0].credit_card_token.credit_card_id = user.card;
				payment.transactions[0].amount.total = req.query.order_amount;
				payment.transactions[0].description = req.session.desc;
				paypal.payment.create(payment, {}, function (err, resp) {
					if (err) {
						console.log(err);
						res.render('order_detail', { message: [{desc: "Payment API à échoué", type: "error"}]});
					}
					if (resp) {
						db.insertOrder(order_id, req.session.username, resp.id, resp.state, req.session.amount, req.session.desc, resp.create_time, function (err, order) {
							if (err || !order) {
								console.log(err);
								res.render('order_detail', { message: [{desc: "Impossible de suvegarder les détails", type: "error"}]});
							} else {
								db.getOrders(req.session.username, function (err, orderList) {
									console.log(orderList);
									res.render('order_detail', {orders : orderList, message: [{desc: "Ordre réussi.", type: "info"}]});
								});
							}
						});
					}
				});
			}
		});
} else if (req.query.order_payment_method === 'paypal') {
	var paypalPayment = {
		"intent": "sale",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {},
		"transactions": [{
			"amount": {
				"currency": "EUR"
			}
		}]
	};

	console.log(config);
	paypalPayment.transactions[0].amount.total = req.query.order_amount;
	paypalPayment.redirect_urls.return_url = "http://localhost:" + (config.port ? config.port : 3000) + "/orderExecute?order_id=" + order_id;
	paypalPayment.redirect_urls.cancel_url = "http://localhost:" + (config.port ? config.port : 3000) + "/?status=cancel&order_id=" + order_id;
	paypalPayment.transactions[0].description = req.session.desc;
	paypal.payment.create(paypalPayment, {}, function (err, resp) {
		if (err) {
			res.render('order_detail', { message: [{desc: "Payment API call failed", type: "error"}]});
		}

		if (resp) {
			var now = (new Date()).toISOString().replace(/\.[\d]{3}Z$/, 'Z ');
			db.insertOrder(order_id, req.session.email, resp.id, resp.state, req.session.amount, req.session.desc, now, function (err, order) {
				if (err || !order) {
					console.log(err);
					res.render('order_detail', { message: [{desc: "Impossible de suvegarder les détails", type: "error"}]});
				} else {
					var link = resp.links;
					for (var i = 0; i < link.length; i++) {
						if (link[i].rel === 'approval_url') {
							res.redirect(link[i].href);
						}
					}
				}
			});
		}
	});
}
};


// function d'excution de l'ordre creer

exports.orderExecute = function (req, res) {
	res.locals.session = req.session;
	db.getOrder(req.query.order_id, function (err, order) {
		var payer = { payer_id : req.query.PayerID };
		paypal.payment.execute(order.payment_id, payer, {}, function (err, resp) {
			if (err) {
				console.log(err);
				res.render('order_detail', {message: [{desc: "L'execution du paiment à échoué", type:"error"}]});
			}
			if(resp){
				db.updateOrder(req.query.order_id, resp.state, resp.create_time, function(err, updated){
					if(err){
						console.log(err);
						res.render('order_detail', {message: [{desc: "Impossible de mettre à jour l'ordre", type:"error"}]});
					}else{
						console.log(updated);
						db.getOrders(req.session.username, function (err, orderList){
							res.render('order_detail', {'orders' : orderList, message: [{desc:"Ordre réussi", type:"info"}]});
						});
					}
				});
			}
		});
	});
};

// Liste ou récapitulatif de se que le client veut payer

exports.orderList = function (req, res) {
	res.locals.session = req.session;
	db.getOrders(req.session.email, function (err, orderList) {
		if (err) {
			console.log(err);
			res.render('order_detail', {message: [{desc:"Impossible de retrouver les informations de l'ordre", type:"error"}]});
		}else {
			res.render('order_detail', {
				'orders' : orderList
			});
		}
	});
};

exports.init = function (c) {
	config = c;
	paypal.configure(c.api);
	db.configure(c.mongo);
};
