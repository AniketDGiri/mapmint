//jshint esversion:8




    var fs = require('fs');
    const AWS = require('aws-sdk');
    const request = require('request-promise');
    // Replace <your_access_token> below with a token from your ion account.
    // This example requires a token with assets:list, assets:read, and assets:write scopes.
    // Tokens page: https://cesium.com/ion/tokens
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ODBiYmEzMS03YzJhLTQxZWEtOTg3Ny1kZTAyNTA5ZjJmNjMiLCJpZCI6NTgyNzAsImlhdCI6MTYyMzQ3MDE4MX0.q-c5Kwp-5zlfxsV0yRcoDZETlpm0BWA76_aqK71RmoY';


this.main=function(newpath,name_of_file){
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
};
