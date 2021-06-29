//jshint esversion:8

const express = require("express");
const bodyParser=require("body-parser");
var fs = require('fs');
const AWS = require('aws-sdk');
const request = require('request-promise');
const upload = require("express-fileupload");

const app=express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(upload());

app.get("/", function(req,res){
res.render("front");
console.log("hlo");
});



async function for_main(){
  const ab=await main(newpath,filename);
  return ab;
}


app.post("/",function(req,res){
  var file_type=req.body.cars;
  var file_name=req.body.file_name;
  console.log("currently in post");
  if(req.files){
    //console.log(req.files);
    var file=req.files.file_name;
    filename=file.name;
  //  console.log(filename);

  file.mv('./Uploads/'+filename,function(err){
if(err){
  res.send(err);
}
else{
  res.send("File successfully uploaded");
}

  });

  ///code for uploading it ion
newpath='F:/IIT BOMBAY/GSoC/Learning/GSOC_PROJECT/Uploads/'+filename;
require("./ref_file")();
console.log("from another file");
//sum();

for_main().then(ab=>console.log("hi")).catch(function(){
  console.log("Hello brother");
});




  }
  //console.log("hello");
  //console.log(item);
  //console.log(item2);


});



app.listen(3000,function(){
  console.log("server has started:dsds");
});
