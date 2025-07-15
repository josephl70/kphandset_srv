var net = require('net');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_', // you have assign this so use this to access the attribute
};

const parser = new XMLParser(options);

function padMissionPass(num) {
    var s = "000000000000" + num;
    return s.substr(s.length-12);
}
let missionPass = 1;

let missionPasses = {
  "000000159001": {
    "fieldStation": "Norway",
    "timestamp": 1252854000, //Sunday, September 13, 2009 11:00:00 AM GMT-04:00 DST
    "party": 2
  }
};

/* Packet Documentation
- state @ Keeps the device up to date on what mission they are playing
  - episode @ The pavilion
  - mission @ The mission to load on the device
  - value @ Goto Command (:start) to jump to a specific point in the mission | If it equals "doreset" restart the phone

- update @ Updates the device
  - url @ The url to update the device from

- broadcast @ Sends a message to the device
  - text @ The text that displays on the device
  - halt @ [Unknown if used]

- assign @ Assigns a new handset id to the device
  - handset @ new handset Id

- reconnect @ Reconnects the device
  - language @ Changes the language (ex: EN | ES)
  - ip @ Changes the IP the device connects to

- lost @ Timesout the Device
*/

let version = 1001;

var TCPServer = net.createServer(function(socket) {
  console.log('Client connected');

  socket.on('data', (data) => {
    const textData = data.toString('utf-8');
    //const messageLength = data[0];
    const messageBuffer = textData.slice(1);
    //console.log('Received message raw:', data);
    console.log('Received message:', messageBuffer);
    let xmlData = parser.parse(messageBuffer);
    //console.log(xmlData);
    let sendMessage = "";
    if(xmlData.message == undefined)
    {
      let wroteMessage = 0;
      if(xmlData.admin["@_episode"] != undefined && !wroteMessage)
      {
        sendMessage = "<state episode='mx' mission='mx_briefing' value='start'/>";
      }
      if(xmlData.admin["@_gag"] != undefined && !wroteMessage)
      {

      }
      if(xmlData.admin["@_mode"] != undefined && !wroteMessage)
      {

      }
      if(xmlData.admin["@_value"] != undefined && !wroteMessage)
      {
        switch(xmlData.admin["@_value"])
        {
          case "connect":
            sendMessage = "<state episode='mx' mission='mx_briefing' value='start'/>";
            console.log("[ADMIN] Connected!");
          break;
          case "disconnect":
            console.log("[ADMIN] Disconnected!");
          break;
        }
      }
    }
    else
    {
      switch(xmlData.message["@_value"])
      {
        case "connect":
          if(xmlData.message["@_version"] != version)
          {
            sendMessage = "<update url='http://192.168.0.111/updates/kp_test.kpp' />";
            break;
          }

          //sendMessage = "<reconnect language='en' ip='192.168.0.111'/>";
          sendMessage = "<state language='en' episode='mx' mission='mx_briefing' value='start'/>";
          //sendMessage += "<broadcast text='mx_0010' halt='true' />";
        break;
        case "missionComplete":
          console.log("MISSION COMPELTE");
          sendMessage = "<state episode='mx' mission='mx_guitars' value='start'/>";
        break;

        case "disconnect":

        break;

        case "trigger":

        break;
        case "ping":
          sendMessage = "<state language='en' episode='mx' mission='mx_briefing' value='start'/>";
        break;
        case "resendUrl":
          console.log("Resend URL for webstill");
        break;
      }
    }
    if(sendMessage.length > 0)
    {
      let lengthBuffer = Buffer.alloc(2);
      lengthBuffer.writeUint16BE(sendMessage.length);
      const buffer = Buffer.from(sendMessage, 'utf-8');
      socket.write(Buffer.concat([lengthBuffer, buffer]));
    }
  });
  
  socket.on('end', () => {
    console.log('Client disconnected');
  });

  socket.on('close', () => {
    console.log('Socket fully closed');
  });
  
  socket.on('error', (err) => {
    if(err != "Error: read ECONNRESET") //This type of error can happen if the app crashes so we don't wanna print it
      console.error('Socket error:', err);
  });

});

TCPServer.listen(1234);


//Terminal
const http = require('http');

const server = http.createServer((req, res) => {
  switch(req.url)
  {
    case "/updates/kp_test.kpp":
      fs.readFile('updates/kp_test.kpp', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading index.html');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
          res.end(data);
        }
      });
    break;
    case "/terminal":
      fs.readFile('terminal/index.html', (err, data) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    break;
    case "/terminal/missionPass":
      missionPass++;
      console.log(padMissionPass(missionPass));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end("");
    break;
    default:
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end('- Demo web page for testing BREW on IPv4 only -');
      console.log(req.url);
    break;
  }
});

const hostname = '0.0.0.0';
const port = 80;

server.listen(port, hostname, () => {
  console.log(`Server running at http://localhost:${port}/`);
});