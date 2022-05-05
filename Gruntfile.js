"use strict";

module.exports = function (grunt) {
  var fs = require("fs"),
    Util = {
      jsBasePath: "_src/",
      parseBasePath: "_parse/",
      cssBasePath: "themes/default/_css/",

      fetchScripts: function (readFile, basePath) {
        var sources = fs.readFileSync(readFile);
        sources = /\[([^\]]+\.js'[^\]]+)\]/.exec(sources);
        sources = sources[1]
          .replace(/\/\/.*\n/g, "\n")
          .replace(/'|"|\n|\t|\s/g, "");
        sources = sources.split(",").filter(o => o);
        sources.forEach(function (filepath, index) {
          sources[index] = basePath + filepath;
        });
        return sources;
      },

      fetchStyles: function () {
        var sources = fs.readFileSync(this.cssBasePath + "ueditor.css"),
          filepath = null,
          pattern = /@import\s+([^;]+)*;/g,
          src = [];

        while ((filepath = pattern.exec(sources))) {
          src.push(this.cssBasePath + filepath[1].replace(/'|"/g, ""));
        }

        return src;
      }
    },
    packageJson = grunt.file.readJSON("package.json"),
    distDir = "dist/",
    distMinDir = "dist-min/",
    banner = "/*! " + packageJson.title + " v" + packageJson.version + "*/\n";

  //init
  (function () {
    distDir = "dist/";
  })();

  var dateHash = (new Date()).getTime();

  grunt.initConfig({
    pkg: packageJson,
    concat: {
      js: {
        options: {
          banner: "/*!\n * " +
            packageJson.title +
            "\n * version: " +
            packageJson.version +
            "\n*/\n(function(){\n\n",
          footer: "\n\n})();\n",
          process: function (src, s) {
            var filename = s.substr(s.indexOf("/") + 1);
            return (
              "// " + filename + "\n" + src.replace("/_css/", "/css/") + "\n"
            );
          }
        },
        src: Util.fetchScripts("_examples/editor_api.js", Util.jsBasePath),
        dest: distDir + packageJson.name + ".all.js"
      },
      parse: {
        options: {
          banner: "/*!\n * " +
            packageJson.title +
            " parse\n * version: " +
            packageJson.version +
            "\n*/\n(function(){\n\n",
          footer: "\n\n})();\n"
        },
        src: Util.fetchScripts("ueditor.parse.js", Util.parseBasePath),
        dest: distDir + packageJson.name + ".parse.js"
      },
      css: {
        src: Util.fetchStyles(),
        dest: distDir + "themes/default/css/ueditor.css"
      }
    },
    cssmin: {
      options: {
        banner: banner
      },
      files: {
        cwd: distDir,
        src: [
          '**/*.css',
        ],
        dest: distMinDir,
        expand: true
      }
    },
    uglify: {
      options: {
        banner: banner
      },
      files: {
        cwd: distDir,
        src: [
          '**/*.js',
          '!third-party/zeroclipboard/ZeroClipboard.js',
        ],
        dest: distMinDir,
        expand: true
      },
    },
    copy: {
      base: {
        files: [
          {
            src: [
              "*.html",
              "themes/iframe.css",
              "themes/default/dialogbase.css",
              "themes/default/images/**",
              "themes/default/font/**",
              "dialogs/**",
              "lang/**",
              "third-party/**",
              "plugins/**",
            ],
            dest: distDir
          }
        ]
      },
      dist: {
        files: [
          {
            cwd: distDir,
            src: '**/*',
            dest: distMinDir,
            expand: true
          }
        ]
      },
      demo: {
        files: [
          {
            src: "_examples/completeDemo.html",
            dest: distDir + "index.html"
          }
        ]
      },
    },
    transcoding: {
      options: {
        charset: 'utf-8'
      },
      src: [
        distDir + "**/*.html",
        distDir + "**/*.js",
        distDir + "**/*.css",
        distDir + "**/*.json",
      ]
    },
    replace: {
      demo: {
        src: distDir + "index.html",
        overwrite: true,
        replacements: [
          {
            from: /\.\.\//gi,
            to: ""
          },
          {
            from: "editor_api.js",
            to: packageJson.name + ".all.js"
          }
        ]
      },
    },
    clean: {
      build: {
        src: [
          distDir + ".DS_Store",
          distDir + "**/.DS_Store",
          distDir + ".git",
          distDir + "**/.git"
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-text-replace");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-transcoding");
  grunt.loadNpmTasks("grunt-contrib-clean");

  grunt.registerTask("default", "UEditor build", function () {
    var tasks = [
      "concat",
      "copy:base",
      "copy:demo",
      "replace:demo",
      "copy:dist",
      "uglify:files",
      "cssmin:files",
      "clean"
    ];

    tasks.push("transcoding");

    //config修改
    updateConfigFile();

    grunt.task.run(tasks);
  });

  function updateConfigFile() {
    var filename = "ueditor.config.js",
      file = grunt.file.read(filename);
    //写入到dist
    if (grunt.file.write(distDir + filename, file)) {
      grunt.log.writeln("config file update success");
    } else {
      grunt.log.warn("config file update error");
    }
  }
};
