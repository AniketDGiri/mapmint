//jshint esversion:8


module.exports = function() {
    //this.sum = function(a,b) { console.log("hi"); };
    //this.multiply = function(a,b) { return a*b; };
    //etc


    var fs = require('fs');
    const AWS = require('aws-sdk');
    const request = require('request-promise');
    // Replace <your_access_token> below with a token from your ion account.
    // This example requires a token with assets:list, assets:read, and assets:write scopes.
    // Tokens page: https://cesium.com/ion/tokens
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ODBiYmEzMS03YzJhLTQxZWEtOTg3Ny1kZTAyNTA5ZjJmNjMiLCJpZCI6NTgyNzAsImlhdCI6MTYyMzQ3MDE4MX0.q-c5Kwp-5zlfxsV0yRcoDZETlpm0BWA76_aqK71RmoY';


this.main=async function(newpath,name_of_file,res){
  const input=newpath;

  async function postfunc(){
     // Step 1 POST information about the data to /v1/assets
   console.log('Creating new asset:'+name_of_file);
   const response =  await request({
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


   return response;

  }

console.log("before calling:");
 let output_postdata=postfunc();
 console.log(output_postdata);


 output_postdata.then(function(response){
    //console.log(response);
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

    async function s3_upload() {
        const s3_uploading=await s3.upload({
       Body: fs.createReadStream(input),
       Bucket: uploadLocation.bucket,
       Key: `${uploadLocation.prefix}`+name_of_file
   }).on('httpUploadProgress', function (progress) {
       console.log(`Upload: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
   }).promise();

   // Step 3 Tell ion we are done uploading files.
    const onComplete = response.onComplete;
    await request({
        url: onComplete.url,
        method: onComplete.method,
        headers: { Authorization: `Bearer ${accessToken}` },
        json: true,
        body: onComplete.fields
    });

   return s3_uploading;
    }

    var s3_upload_outside=s3_upload();
    s3_upload_outside.then(function(s3_uploading){
        console.log("uploading in progress");
    }).catch(function(){
        console.log("error in s3 uploading");
    });





   // Step 4 Monitor the tiling process and report when it is finished.

    async function waitUntilReady() {
        assetId = response.assetMetadata.id;


        // Issue a GET request for the metadata
        const assetMetadata = await request({
            url: `https://api.cesium.com/v1/assets/${assetId}`,
            headers: { Authorization: `Bearer ${accessToken}` },
            json: true
        });

        const status = assetMetadata.status;
        if (status === 'COMPLETE') {
            console.log('Asset tiled successfully');

            console.log(`View in ion: https://cesium.com/ion/assets/${assetMetadata.id}`);
            console.log(assetMetadata.id);
            console.log("File saved successfully");
            //res.send("File sending completed");
            var id=assetMetadata.id;
            var idd=`${id}`;
            res.render("list",{day:idd});







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



resolve();

 }).catch(function(){
    console.log("In error main");
 });

};
};
