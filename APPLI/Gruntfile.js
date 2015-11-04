module.exports = function (grunt) {

	"use strict";

	// configuration  de l'application
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		meta: {
			banner: "/*!\n * <%= pkg.name %>\n * <%= pkg.description %>\n * @version <%= pkg.version %> - <%= grunt.template.today(\'yyyy-mm-dd\') %>\n * @author <%= pkg.author.name %> <<%= pkg.author.url %>>\n */\n"
		},
		jshint: {
			all: {
				src: ["lib/*.js", "routes/*.js"],
				options: {
					jshintrc: ".jshintrc"
				}
			}
		}
	});

	// Charge les tache de grunt a partir du npm
	grunt.loadNpmTasks("grunt-contrib-jshint");
	

	// Tache par defaut
	grunt.registerTask("default", ["jshint"]);

};