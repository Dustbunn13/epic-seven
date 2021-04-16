const express = require('express');
const formidable = require('formidable');
const fs = require('fs'); 
const vision = require('@google-cloud/vision');
const dotenv = require('dotenv').config();
const app = express();
const client = new vision.ImageAnnotatorClient({
        keyFilename: './APIkey.json'
    });

app.use('/VisionAPI/uploads', express.static('uploads'));

app.get('/VisionAPI', (req, res) => {
  res.send(`
    <h1> OI </h>
    <h2>Upload an Image</h2>
    <form action="/VisionAPI/upload" enctype="multipart/form-data" method="post">
      <div>File: <input type="file" name="imageFile" /></div>
      <input type="submit" value="Upload" />
    </form>
  `);
});

app.post('/VisionAPI/upload', (req, res, next) => {
  const form = formidable();
  form.parse(req, (err, fields, upload) => {
    if (err) {
      next(err);
      return;
    }
      let src = upload.imageFile.path;
      let dest = './uploads/'+upload.imageFile.name;
      res.write(`<html><body>`+
		`<style>body{font-family: sans-serif;}</style>`+
		`<h2>` + upload.imageFile.name + `</h2>` +
           	`<img style="height: 50vh" src="` + dest + `">`
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
  console.log("iamhere");
    
  text.forEach(results => res.write(`<p> locations:` + JSON.stringify(results.boundingPoly.vertices) + `</p>` +`<p> text: `+ results.description +`</p>`));
  res.write("---------------------------------");
  text.forEach(results => res.write(`<p> x0:` + results.boundingPoly.vertices[0].x + `</p>` + `<p> y0:` + results.boundingPoly.vertices[0].y + `</p>`));
               
  res.write('</body></html>');
  res.end();
}

app.listen(3001, () => {  console.log('Server listening on http://localhost:3001 ...');  });