module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    uglify: {
      options: {
        banner: '/*! chrome-style-inserter <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: [{
          expand: true,
          cwd: 'js',
          src: '*.js',
          dest: 'dist/js'
        }]
      }
    },
    copy: {
      build: {
        files: [
          {expand: true, src: ['js/lib/**'], dest: 'dist/'},
          {expand: true, src: ['css/lib/**'], dest: 'dist/'},
          {expand: true, src: ['css/fonts/**'], dest: 'dist/'},
          {expand: true, src: ['manifest.json', 'icon*'], dest: 'dist/'}
        ]
      }
    },
    less:{
      dev: {
        files: {
          "css/panel.css": "css/panel.less"
        }
      },
      build: {
        options:{
          compress: true
        },
        files: {
          "dist/css/panel.css": "css/panel.less"
        }
      }
    },
    jade: {
      dev: {
        options: {
          pretty: true,
          data: {
            debug: true
          }
        },
        files: {
          "panel.html": "panel.jade",
          "devtools.html": "devtools.jade"
        }
      },
      build: {
        options: {
          pretty: false,
          data: {
            debug: false
          }
        },
        files: {
          "dist/panel.html": "panel.jade",
          "dist/devtools.html": "devtools.jade"
        }
      }
    },
    compress: {
      build: {
        options: {
          archive: 'extension.zip'
        },
        files: [
          {expand: true, cwd: 'dist/', src: ['**'], dest: ''}
        ]
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'js/*.js']
    }
  });


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-jshint');


  grunt.registerTask('default', ['uglify']);

  grunt.registerTask('compile:build', ['uglify:build', 'less:build', 'jade:build', 'copy:build']);
  grunt.registerTask('compile:dev', ['less:dev', 'jade:dev']);

  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('release', ['test', 'compile:build', 'compress:build']);

};
