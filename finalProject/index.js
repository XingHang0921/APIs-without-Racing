const fs = require("fs");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

const credentials = require("./auth/credentials.json");
// joke_api_key = "789970a5ff1f4b0dbc775b89e6d90dde";
const port = 3000;
const all_sessions = []; //global array
const server = http.createServer();


server.on("listening", listen_handler);
server.listen(port);
function listen_handler() {
    console.log(`Now Listening on Port ${port}`);
}

server.on("request", request_handler);
function request_handler(req, res) {
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);
    if (req.url === "/") {
        const form = fs.createReadStream("html/index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        form.pipe(res);
    }
    else if (req.url.startsWith("/search")) {
        const user_input = new URL(req.url, `https://${req.headers.host}`).searchParams;
        const key_word = user_input.get("keyword"); // peremic
        // console.log(key_word)
        const state = crypto.randomBytes(20).toString("hex"); //generating 20 random character in hexadecimal
        //     //this is used to connect the user and the request while there is gap between request and actual response.
        all_sessions.push({ key_word, state });// put a object in the array that contains the informations
            res.writeHead(200, { "Content-Type": "text/html" });
            get_joke(key_word, state, res);
    }
    else {
        not_found(res);
    }
    function not_found(res) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end(`<h1>404 Not Found</h1>`);
    }
    function get_joke(keyword,state, res) {
        const joke_endpoint = `https://api.humorapi.com/jokes/search?keywords=${keyword}`;
        const joke_request = https.get(joke_endpoint, { method: 'GET', headers: credentials });
        joke_request.once("response", stream =>
            process_stream(stream,parse_joke, state, keyword, res));
    }
    function parse_joke(joke_data, state, keyword, res) {
        let joke_object = JSON.parse(joke_data);
        joke = joke_object.jokes[0].joke;
        if (joke === 0) {
            return `<h1> Humor Joke: No Results Found</h1>`;
        }
        else {
            received_joke(joke, state, keyword);
        }
    }
    function received_joke(joke, state, keyword) { //{key_word,state}
        // console.log("joke: " + joke)
        const session = all_sessions.find(session => session.state === state && session.key_word === keyword);
        // console.log("check: " + keyword,session.key_word, session.key_word === keyword)
        if(session) {
            res.write(`<h1> Humor Joke: </h1><ul>${joke}</ul>` , () => get_fact(state, keyword, res));
        }
        else{
            not_found(res);
        }
    }
    function get_fact(state, keyword, res) {
        const fact_endpoint = `https://meowfacts.herokuapp.com/`;
        const fact_request = https.get(fact_endpoint, { method: 'GET' });
        fact_request.once("response", stream => 
            process_stream(stream, parse_fact, state, keyword, res));
    }
    function parse_fact(data, state, keyword, res) {
        let fact_object = JSON.parse(data);
        fact = fact_object.data[0];
        if(fact === "")
        {
            return `<h1> Meowfacts: No Result Found</h1>`;
        }
        else{
            receive_fact(fact, state, keyword, res);
        }
    }

    function receive_fact(fact, state, keyword, res){
        // console.log("fact :" + fact);
        const session = all_sessions.find(session => session.state === state && session.key_word === keyword);
        // console.log("check: " + keyword,session.key_word, session.key_word === keyword)
        if(session) {
           res.end(`<h1>Meowfact: </h1><ul>${fact}</ul>`);
        }
        else{
            not_found(res);
        }
    }

    function process_stream(stream, callback, ...args) {
        let body = "";
        stream.on("data", chunk => body += chunk);
        stream.on("end", () => callback(body, ...args));
    }
}

