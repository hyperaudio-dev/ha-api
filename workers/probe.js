var sync = require('synchronize');

var fs = require('fs');
var path = require('path');

var probe = require('node-ffprobe');
var ffmpeg = require('fluent-ffmpeg');

var mongoose = require('mongoose');
var Metadata = require('../models/metadata');

var mime = require('mime');
var mmm = require('mmmagic');
var Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var container = {probe: probe};
sync(magic, 'detectFile');
sync(container, 'probe');

mongoose.connect("mongodb://localhost/hyperaudio01"); //FIXME conf

module.exports = function() {
  function ProbeHandler() {
    this.type = 'media';
  }

  ProbeHandler.prototype.work = function(payload, callback) {
    console.log(path.join(__dirname, '../media/' + payload.media._id + '/'));

    if (payload.meta.download) {
      var folder = path.join(__dirname, '../media/' + payload.media._id + '/');

      sync.fiber(function(){

      //TODO sync this and put into the file list
      var screenshot = function(folder, file) {
        try {
          var proc = new ffmpeg({
            source: folder + file
          }).withSize('150x100').takeScreenshots({
            count: 2,
            timemarks: ['50%', '75%'],
            filename: '%b_screenshot_%w_%i'
          }, folder, function(err, filenames) {
            console.log(filenames);
          });
        } catch (ignored) {}
      }

		  var files = fs.readdirSync(folder);
		  console.log(files);
		  var map = {};

		  var fileMetadata = function (file) {
		    var fmeta = {};
		    fmeta.type = magic.detectFile(folder + file);
		    var ext = mime.extension(fmeta.type);

		    if (file.indexOf('unknown_video') > 0) {
		      fs.renameSync(path.join(folder, file), path.join(folder, file.replace('unknown_video', ext)));
		    }


		    fmeta.file = file;
		    if (fmeta.type.indexOf('audio') == 0 || fmeta.type.indexOf('video') == 0 || fmeta.type.indexOf('application/octet-stream') == 0) {
		      try {
		        var fp = container.probe(folder + file);
		        fmeta.meta = fp;
            screenshot(folder, file);
		      } catch (ignored) {}
		    }
		    return fmeta;
		  };

		  for (f in files) {
		    var file = files[f];
		    if (file.indexOf('00') != 0) continue;

		    var key = file.split('.')[0];

		    if (!map[key]){
		      map[key] = {
		        files: []
		      };
		    }

		    if (file.indexOf('info.json') > 0) {
		      map[key]['info'] = require(folder + file);
		    } else {
		      map[key]['files'].push(fileMetadata(file));
		    }
		  }

		  // console.log(JSON.stringify(map));

		  // console.log('META');
		  Metadata.findById(payload.meta._id).exec(function(err, metadata) {
	          if (!err) {
	            metadata.probe = map;
	            metadata.save(function(err) {
	              if (!err) {
	                callback('success');
	              } else {
	                console.log(err);
	                callback('bury');
	              }
	            });
	          } else {
	            console.log(err);
	            callback('bury');
	          }
	      });

		});

		// callback('success');

      // probe(folder + payload.meta.download.filename, function(err, data) {
      // 	console.log(data);
      //   Metadata.findById(payload.meta._id).exec(function(err, metadata) {
      //     if (!err) {
      //       metadata.probe = data;
      //       metadata.save(function(err) {
      //         if (!err) {
      //           callback('success');
      //         } else {
      //           console.log(err);
      //           callback('bury');
      //         }
      //       });
      //     } else {
      //       console.log(err);
      //       callback('bury');
      //     }
      //   });
      // });

    } else {
      callback('bury');
    }

  };

  var handler = new ProbeHandler();
  return handler;
};