const express = require('express');
const formidable = require('formidable');
const fs = require('fs'); 
const vision = require('@google-cloud/vision');
const dotenv = require('dotenv').config();
const app = express();
const client = new vision.ImageAnnotatorClient({
        keyFilename: './APIkey.json'
    });

app.use('/Epic-7', express.static('public'));

app.post('/Epic-7/processform', (req, res, next) => {
  const form = formidable();
  form.parse(req, (err, fields, upload) => {
    if (err) {
      next(err);
      return;
    }
      let src = upload.imageFile.path;
      let dest = './public/uploads/'+upload.imageFile.name;
      let url = '/Epic-7/uploads/'+upload.imageFile.name;
      res.write(`<html><body>`+
		`<style>body{font-family: sans-serif;}</style>`+
		`<h2>` + upload.imageFile.name + `</h2>` +
           	`<img style="height: 50vh" src="` + url + `">`
		);
      fs.rename(src, dest, function (err) {
          if (err) throw err;
	  annotate(dest, res);
      });
  });
});

  async function annotate(filename, res) {
      const [result] = await client.textDetection(filename);
      const text = result.textAnnotations;
      
      function getValue(text,  word) {
          var ret = 0;
          text.forEach(leftWord => {
                if (leftWord.description == word) {
                    text.forEach(value => {
                       if ( ret == 0 &&
                            (value.boundingPoly.vertices[0].y - 8) <= leftWord.boundingPoly.vertices[0].y &&
                            (value.boundingPoly.vertices[0].y + 8) >= leftWord.boundingPoly.vertices[0].y &&
                            (value.boundingPoly.vertices[2].y - 8) <= leftWord.boundingPoly.vertices[2].y &&
                            (value.boundingPoly.vertices[2].y + 8) >= leftWord.boundingPoly.vertices[2].y &&
                            value.boundingPoly.vertices[2].x > leftWord.boundingPoly.vertices[2].x) {
                           ret = value.description;
                       }
//                        res.write(`<p> locations:` + JSON.stringify(value.boundingPoly.vertices) + ` text: `+                               value.description +` ret: ` + ret + `</p>`);
                    });
                }
          });
          return ret;
      }
      
      function getValuePct(text,  word) {
          var ret = 0;
          text.forEach(leftWord => {
            if (leftWord.description == word) {
                text.forEach(value => {
                   if ( ret == 0 &&
                        (value.boundingPoly.vertices[0].y - 8) <= leftWord.boundingPoly.vertices[0].y &&
                        (value.boundingPoly.vertices[0].y + 8) >= leftWord.boundingPoly.vertices[0].y &&
                        (value.boundingPoly.vertices[2].y - 8) <= leftWord.boundingPoly.vertices[2].y &&
                        (value.boundingPoly.vertices[2].y + 8) >= leftWord.boundingPoly.vertices[2].y &&
                        value.boundingPoly.vertices[2].x > leftWord.boundingPoly.vertices[2].x) {
                        if (value.description.includes("%")) {
                            ret = value.description;
                        }
                   }
                });
            }
      });
          return ret;
      }
      
      res.write(`<p>Attack: ` + getValue(text, "Attack") + `</p>`);
      res.write(`<p>Defense: ` + getValue(text, "Defense") + `</p>`);
      res.write(`<p>Health: ` + getValue(text, "Health") + `</p>`);
      res.write(`<p>Speed: ` + getValue(text, "Speed") + `</p>`);
      res.write(`<p>Critical Hit Chance: ` + getValuePct(text, "Chance") + `</p>`);
      res.write(`<p>Critical Hit Damage: ` + getValuePct(text, "Damage") + `</p>`);
      res.write(`<p>Effectiveness: ` + getValuePct(text, "Effectiveness") + `</p>`);
      res.write(`<p>Effect Resistance: ` + getValuePct(text, "Resistance") + `</p>`);
      
      res.write(`<p>Dual Attack Chance: ` + getValuePct(text, "Dual") + `</p>`);
      
//      text.forEach(results => res.write(`<p> locations:` + JSON.stringify(results.boundingPoly.vertices) + ` text: `+ results.description +`</p>`));
      
      res.write('</body></html>');
      res.end();
    }

app.listen(3001, () => {  console.log('Server listening on http://localhost:3001 ...'); });