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
    disDir = "dist/";

  //init
  (function () {
    disDir = "dist/";
  })();

  var dateHash = (new Date()).getTime();

  grunt.initConfig({
    pkg: packageJson,
    concat: {
      js: {
        options: {
          banner: "/*!\n * " +
            packageJson.name +
            "\n * version: " +
            packageJson.version +
            "\n\n(function(){\n\n",
          footer: "\n\n})();\n",
          process: function (src, s) {
            var filename = s.substr(s.indexOf("/") + 1);
            return (
              "// " + filename + "\n" + src.replace("/_css/", "/css/") + "\n"
            );
          }
        },
        src: Util.fetchScripts("_examples/editor_api.js", Util.jsBasePath),
        dest: disDir + packageJson.name + ".all.js"
      },
      parse: {
        options: {
          banner: "/*!\n * " +
            packageJson.name +
            " parse\n * version: " +
            packageJson.version +
            "\n\n(function(){\n\n",
          footer: "\n\n})();\n"
        },
        src: Util.fetchScripts("ueditor.parse.js", Util.parseBasePath),
        dest: disDir + packageJson.name + ".parse.js"
      },
      css: {
        src: Util.fetchStyles(),
        dest: disDir + "themes/default/css/ueditor.css"
      }
    },
    // cssmin: {
    //   options: {
    //     banner: banner
    //   },
    //   files: {
    //     expand: true,
    //     cwd: disDir + "themes/default/css/",
    //     src: ["*.css", "!*.min.css"],
    //     dest: disDir + "themes/default/css/",
    //     ext: ".min.css"
    //   }
    // },
    // uglify: {
    //   dist: {
    //     options: {
    //       banner: "/*!\n * " +
    //         packageJson.name +
    //         "\n * version: " +
    //         packageJson.version +
    //         "\n * build: <%= new Date() %>\n */"
    //     },
    //     src: disDir + "<%= pkg.name %>.all.js",
    //     dest: disDir + "<%= pkg.name %>.all.min.js"
    //   },
    //   parse: {
    //     options: {
    //       banner: "/*!\n * " +
    //         packageJson.name +
    //         " parse\n * version: " +
    //         packageJson.version +
    //         "\n * build: <%= new Date() %>\n */"
    //     },
    //     src: disDir + "<%= pkg.name %>.parse.js",
    //     dest: disDir + "<%= pkg.name %>.parse.min.js"
    //   }
    // },
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
            dest: disDir
          }
        ]
      },
      demo: {
        files: [
          {
            src: "_examples/completeDemo.html",
            dest: disDir + "index.html"
          }
        ]
      },
    },
    transcoding: {
      options: {
        charset: 'utf-8'
      },
      src: [
        disDir + "**/*.html",
        disDir + "**/*.js",
        disDir + "**/*.css",
        disDir + "**/*.json",
      ]
    },
    replace: {
      demo: {
        src: disDir + "index.html",
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
          disDir + "jsp/src",
          disDir + "*/upload",
          disDir + ".DS_Store",
          disDir + "**/.DS_Store",
          disDir + ".git",
          disDir + "**/.git"
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
    if (grunt.file.write(disDir + filename, file)) {
      grunt.log.writeln("config file update success");
    } else {
      grunt.log.warn("config file update error");
    }
  }
};
