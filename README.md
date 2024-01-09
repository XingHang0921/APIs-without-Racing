# APIs-without-Racing
Interaction between user, server, and APIs to show the appropriate information to user

Sequence diagram

title Humor Joke and Meowfacts
participant humor joke api
participant user
participant server
participant meowfact api

note over user:Browser requests \n root of site
user->server:Get / \n Host:localhost:3000

server->user: 200 OK + index.html (form to fill out)

note over user:user fills out form (data:key_word)
user->server: GET /search?key_word=key (ex.cat) \n Host:localhost:3000
user->server:generate state using crypto.randomBytes(20).toString("hex")\n save state in to all_sessions {key_word, state}

server->humor joke api:  go to humor joke api at \n Host: https://api.humorapi.com/jokes/search \n with input ?keywords=${keyword} \n location: https://api.humorapi.com/jokes/search?keywords=${keyword}\nsend Get request with credentials { "Content-Type","x-api-key"}


humor joke api ->server: 200 OK,Send json property and data

note over server:get reponse piece by pice and conver to a whole named {body}\nparse_joke and filter out only joke then call \nreceive_joke:check if state === session.state

server ->user:if so write joke to webpage and evoke (callback)=>get_fact(state, res) \nto ensure two asynchrous function operates without racing\nelse res.end(404 NOT FOUND)



server->meowfact api: After res.write joke to the page move on to\nHost:https://meowfacts.herokuapp.com/\n using a Get method.

meowfact api ->server: 200 OK Send json response with property back to server.

note over server: get reponse piece by pice and convert to a whole named {body}\n upon all received\n parse_fact from json to reable object and filter out the fact and store it\n if (session)

server ->user:call res.end(display message) write to the page and close the connection \n else{ not_found(res)}

note over user,server: all finished
![HumorJoke MeowFact](https://github.com/XingHang0921/APIs-without-Racing/assets/110357111/3889712c-55be-44bb-98a4-832fb8f4a894)


