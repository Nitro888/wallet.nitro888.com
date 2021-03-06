'use strict';

const Web3        = require('web3');
const fs          = require('file-system');
const gzip        = require('gzip-js');
var FileAPI       = require('file-api'), File = FileAPI.File , FileReader = FileAPI.FileReader;

const provider    = 'https://ropsten.infura.io';
const web3        = new Web3(new Web3.providers.HttpProvider(provider));
const ABI         = [{"constant":false,"inputs":[{"name":"_category","type":"uint256"},{"name":"_image","type":"bytes"}],"name":"asset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];

// load options
let options     = {
  assetList   : [],   // a:
  privatekey  : '',   // p:
  store       : '',   // s:
  index       : 0     // i:
}

for (let i = 0; i < process.argv.length; i++) {
    let temp = process.argv[i].split(":");
    switch (temp[0]) {
      case "a":
        options.assetList   = temp[1];
        break;
      case "p":
        options.privatekey  = temp[1];
        break;
      case "s":
        options.store       = temp[1];
        break;
      case "i":
        options.index       = parseInt(temp[1]);
        break;
    }
}

console.log('Option----------------------------------------');
console.log(options);

let list    = fs.readFileSync(options.assetList, 'utf8');
let temp    = list.split("\n");
let assets  = [];

for(let i = 0 ; i < temp.length ; i++) {
  temp[i] = temp[i].replace('\r', "");
  temp[i] = temp[i].replace(/(\s*)/g, "");
  let asset  = temp[i].split(",");
  if(asset.length==2)
    assets.push({category:asset[0],asset:asset[1]});
}

// crete privatekey -> account
let account   = web3.eth.accounts.privateKeyToAccount('0x'+options.privatekey);
let contract  = new web3.eth.Contract(ABI,options.store);

console.log('Address---------------------------------------');
console.log(account.address);
console.log('TOTAL : ' + assets.length + ' assets');
console.log('START-----------------------------------------');

function upload() {
  if(options.index<assets.length) {
    console.log(options.index+' ) Loading ==>',assets[options.index].category,assets[options.index].asset);

    let fr = new FileReader();
     fr.onload = function(){
       let data  = contract.methods.asset(assets[options.index].category,web3.utils.bytesToHex(gzip.zip(fr.result,{level:9}))).encodeABI();
       let tx    = {'from':account.address,'to':options.store,'value':web3.utils.toHex(0),'data':data};
       web3.eth.getGasPrice((e,gasPrice)=>{
         console.log('price ===========>',gasPrice);
         if(e==null) {
           web3.eth.estimateGas(tx).then((gasLimit)=>{
             console.log('limit ===========>',gasLimit);
             tx['gasPrice']	= web3.utils.toHex(parseInt(gasPrice));
             tx['gasLimit']	= web3.utils.toHex(parseInt(gasLimit));
             account.signTransaction(tx).then((r)=>{
               if(r!=null&&r.rawTransaction!=null)
                  web3.eth.sendSignedTransaction(r.rawTransaction)
                    .on('transactionHash',(r0)=>{console.log('hash ============>',r0);})
                    .then((r1)=>{options.index++;upload();})
                    .catch((e)=>{if(error)console.log(e);});
               else
                  console.log(r);
             });
           });
         }
       });

     }
     fr.readAsDataURL(new File(assets[options.index].asset));
  } else {
    console.log('FINISH-----------------------------------------');
  }
}

upload();
