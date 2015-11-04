/*
Creation du serveur avec modules
stackage des variables
passport pour facebook
et
 */


var template_engine = 'dust',// Template html dust mais siponible sous format ejs, jade
 domain = 'localhost';

var express = require('express'), // facilte le codage
 routes = require('./routes'), // appelle du module personelle se trouvant dans le dossier routes
 http = require('http'),
 compression = require('compression'), // permet la compression gzip de la page pour un envoi plus rapide au navigateur
 cookieParser = require('cookie-parser'), // activer coockie avant d'activer les sessions
 session = require('express-session'), // activer les sessions
 bodyParser = require('body-parser'),
 passport = require('passport'), // partage de fichier pour autentification[stategie] (ici faceboobk)
 flash = require('connect-flash'),
 path = require('path'), // aide a creer et à manipuler des chemins plus facilement
 fs = require('fs'), // FileSystem utilisation des fichier systeme
 favicon = require ('serve-favicon'), // mettre un favicon personnelle comme le samourai
 util = require('util'); // hub d'utilitaire

var morgan = require('morgan'); // sauvegarde toutes les requete dans la console

var FacebookStrategy = require('passport-facebook').Strategy; // strtagie pour facebook

var FACEBOOK_APP_ID = "1172262526123601"; // id application de facebook à faire
var FACEBOOK_APP_SECRET = "337a5ea053d7ba22e603b63087da8e22"; // secret application de facebook à faire

var store = session.MemoryStore; // stocke les variables pour les reutiliser dans toutes
// l'application

var app = express();


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {

        process.nextTick(function () {

            return done(null, profile);
        });
    }
));


// Configuration couleurs ===============================================================
var colors = require('colors');

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

// Configuration ===============================================================

try {
	var configJSON = fs.readFileSync(__dirname + "/config.json");
	var config = JSON.parse(configJSON.toString());
} catch(e) {
	console.error("Fichier config.json non trouvée ou invalide: " + e.message);
	process.exit(1);
}
routes.init(config);

if ( template_engine == 'dust' ) { // verifie que les views sont bien au format DUST
	var dust = require('dustjs-linkedin'), // sert a lier les morceaux 
	cons = require('consolidate'); // rassemble les morceaux des differents fichier DUST
	app.engine('dust', cons.dust); // creer le moteur dust en rassemblant les morceaux 
} 
 // Express ===============================================================

app.set('template_engine', template_engine);
app.set('domain', domain);
app.set('port', config.port || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', template_engine);
	app.use(favicon(__dirname + '/public/images/favicon.ico')); // localisation fichier static 
	app.use(compression());
	app.use(morgan('dev')); // met TOUTES les requete dans la console
	app.use(cookieParser()); 
	app.use(bodyParser.json()); // analyse application/ json
	app.use(bodyParser.urlencoded({extended: false})); // analyse application/ x-www-form-urlencoded
	app.use(session({secret: 'My precious',
		saveUninitialized: true,
		resave: true}));

    app.use(passport.initialize());
    app.use(passport.session()); // persistant sessions login
	app.use(express.static('public'));
	app.use(flash());	

	var env = process.env.NODE_ENV || 'development'; // mettre 'production' pour lancer l'application en mode production
	if ('development' == env) {
		app.locals.inspect = require('util').inspect;
	
	}

// Routes ===============================================================

app.get('/', routes.index);

app.get('/signup', routes.signup);
app.post('/signup', routes.completesignup);

app.get('/signin', routes.signin);
app.post('/login', routes.dologin);
app.get('/signout', routes.signout);

app.get('/profile', routes.auth, routes.profile);
app.post('/profile', routes.auth, routes.updateprofile);

app.get('/order', routes.auth, routes.order);
app.get('/orderList', routes.auth, routes.orderList);
app.post('/orderConfirm', routes.auth, routes.orderconfirm);
app.get('/orderExecute', routes.auth, routes.orderExecute);


app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {succesRedirect: '/index',
        failureRedirect: '/'}));



http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port')); // illisible pour l'utilisateur
	// mais important pour les dev et la maintenance du serveur.
});
