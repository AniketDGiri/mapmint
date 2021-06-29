//jshint esversion:8

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
const AWS = require('aws-sdk');
const request = require('request-promise');


// Replace <your_access_token> below with a token from your ion account.
// This example requires a token with assets:list, assets:read, and assets:write scopes.
// Tokens page: https://cesium.com/ion/tokens
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ODBiYmEzMS03YzJhLTQxZWEtOTg3Ny1kZTAyNTA5ZjJmNjMiLCJpZCI6NTgyNzAsImlhdCI6MTYyMzQ3MDE4MX0.q-c5Kwp-5zlfxsV0yRcoDZETlpm0BWA76_aqK71RmoY';

// Sample data is already included in this repository, but you can modify the below
// path to point to any CityGML data you would like to upload.

var assetId="";

http.createServer(function (req, res) {
  if (req.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      name_of_file=files.filetoupload.name;
      newpath = '/home/ankdgiri/GSOC_WORK/cesium-ion-rest-api-examples-master/tutorials/rest-api' + files.filetoupload.name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;



        var a=main();

        res.write('File uploaded and moved!');
        res.end();


      });


 });

  }

   else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');

    return res.end();
  }




//res.end();
   //bud(req,res);
}).listen(8001);



function main(){
  const input=newpath;
  // Step 1 POST information about the data to /v1/assets
   console.log('Creating new asset:'+name_of_file);
   const response = request({
       url: 'https://api.cesium.com/v1/assets',
       method: 'POST',
       headers: { Authorization: `Bearer ${accessToken}` },
       json: true,
       body: {
           name: name_of_file,
           description: 'See [Wikipedia](https://en.wikipedia.org/?curid=217577).',
           type: '3DTILES',
           options: {
               sourceType: 'POINT_CLOUD',

           }
       }
   });

   // Step 2 Use response.uploadLocation to upoad the file to ion
   console.log('Asset created. Uploading'+name_of_file);
   var temp1='Asset created. Uploading'+name_of_file;

   const uploadLocation = response.uploadLocation;
   const s3 = new AWS.S3({
       apiVersion: '2006-03-01',
       region: 'us-east-1',
       signatureVersion: 'v4',
       endpoint: uploadLocation.endpoint,
       credentials: new AWS.Credentials(
           uploadLocation.accessKey,
           uploadLocation.secretAccessKey,
           uploadLocation.sessionToken)
   });

   s3.upload({
       Body: fs.createReadStream(input),
       Bucket: uploadLocation.bucket,
       Key: `${uploadLocation.prefix}`+name_of_file
   }).on('httpUploadProgress', function (progress) {
       console.log(`Upload: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
   });

   // Step 3 Tell ion we are done uploading files.
   const onComplete = response.onComplete;
   request({
       url: onComplete.url,
       method: onComplete.method,
       headers: { Authorization: `Bearer ${accessToken}` },
       json: true,
       body: onComplete.fields
   });


   // Step 4 Monitor the tiling process and report when it is finished.

    function waitUntilReady() {
       assetId = response.assetMetadata.id;


       // Issue a GET request for the metadata
       const assetMetadata =  request({
           url: `https://api.cesium.com/v1/assets/${assetId}`,
           headers: { Authorization: `Bearer ${accessToken}` },
           json: true
       });

       const status = assetMetadata.status;
       if (status === 'COMPLETE') {
           console.log('Asset tiled successfully');

           console.log(`View in ion: https://cesium.com/ion/assets/${assetMetadata.id}`);
           console.log(assetMetadata.id);
           var id=assetMetadata.id;
           var idd=`${id}`+"\n";

           fs.writeFile("www/testa.txt", idd ,  { flag: 'a+' }, function(err) {
               if(err) {
                   return console.log(err);
               }
               console.log("The file was saved!");
           });

       } else if (status === 'DATA_ERROR') {
           console.log('ion detected a problem with the uploaded data.');
       } else if (status === 'ERROR') {
           console.log('An unknown tiling error occurred, please contact support@cesium.com.');
       } else {
           if (status === 'NOT_STARTED') {
               console.log('Tiling pipeline initializing.');
           } else { // IN_PROGRESS
               console.log(`Asset is ${assetMetadata.percentComplete}% complete.`);
           }

           // Not done yet, check again in 10 seconds
           setTimeout(waitUntilReady, 10000);
       }

   }

   waitUntilReady();
}

main().catch(e => {
    console.log(e.message);
});
