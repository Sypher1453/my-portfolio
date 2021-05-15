const http = require("http");
const fs = require('fs');
const url = require("url");
const cors = require('cors')({origin: true});

const emojiRegex = require('./RGI_Emoji.js');

const RECIEVED_LIMIT = 5;
const TIME_LIMIT = 5;

var recived_IPs = new Map();

http.createServer(function(request, response) {
  cors(request, response, ()=>{
    let is_another_page = false;

    let recieved_IP = recived_IPs.get(request.socket.remoteAddress);
    recived_IPs.set(request.socket.remoteAddress, popQueue(recieved_IP? recieved_IP: [], Date.now(), RECIEVED_LIMIT));

    let target_queue = recived_IPs.get(request.socket.remoteAddress);
    console.log(target_queue);
    if(checkQueue(target_queue, RECIEVED_LIMIT) <= TIME_LIMIT*1000){
      is_another_page = true;
      recived_IPs.set(request.socket.remoteAddress, [])
    }

    let return_page_content = is_another_page ? './nindex.html' : './index.html';

    console.log(return_page_content);

    fs.readFile(return_page_content, 'UTF-8', (error, data)=>{
      response.writeHead(200, {"Content-Type": "text/html"});
      console.log(request.socket.remoteAddress);
      response.write(emoji2HTMLEntity(data));
      response.end();
    });
  });
}).listen(8888);


function emoji2HTMLEntity(text){

  const regex = emojiRegex();
  const convert = (emoji) => `&#x${emoji.codePointAt(0).toString(16)};`;
  let result = text;
  let match;

  while ( match = regex.exec(text) ) {
    const emoji = match[0];

    const htmlentity = convert(emoji);
    result = result.replace(emoji, htmlentity);
  }

  return result;
}

function popQueue(_que, _input, _limit){
  if(_que.length >= _limit){
    return _que.slice(1).concat([_input]);
  }
  else{
    return _que.concat([_input]);
  }
}

function checkQueue(_que, _limit){
  if(_que.length < _limit){return Number.MAX_VALUE;}

  return _que[_limit-1] - _que[0];

}