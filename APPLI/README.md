# Serveur - express - dust - paypal - Facebook

## Résumé

C'est un serveur affichant des pages html (templates dust), l'utilisateur peut en outre, s'y
	
   * connecter et s'enregistrer en local (base mongo[nosql]).
   * Faire un payment par carte bancaire et si l'utilisateur le veut, enregistrer sa carte.
   * Faire des payment par Paypal.
   * Se connecter par Facebook. 

## Prérequis

   * Node V0.8+
   * MongoDB serveur
   
## Mettre en place l'application

   * Lancer 'npm install'  à la racine du dossier pour installer les dependences.
   * Etre sur que mongod est lancé. La base de donnée(collection) s'installera automatiquement.
   * `node app.js` pour lancer l'application
   * http://localhost:3000/ sur le navigateur

## Configuration

   Changer config.json pour modifier les paramètre de Paypal et de la base de donnée (locale).
   

