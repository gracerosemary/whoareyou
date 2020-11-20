'use strict';

//dependencies
const express = require ('express');
const superagent = require ('superagent');
const cors = require ('cors');
const pg = require ('pg');
const methodOverride = require ('method-override');
require ('dotenv').config();

//port setup
const port = process.env.PORT || 3000;
//turning things on
const app = express();
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.set('view engine', 'ejs');
//database set up
const client = new pg.Client(process.env.DATABASE_URL);

// ---------------------------------Routes
app.get('/', homePage);
app.get('/scores', savedScores);
app.post('/scores', addScores);
app.get('/saved', savedQuote);
app.post('/save', addQuote);
app.get('/about', about);
app.post('/quiz', startQuiz);

app.get('/sunny', sunnyQuotes);
app.get('/breakingbad', breakingBadAPI);
app.get('/office', officeAPI);
app.get('/swanson', swansonAPI);
app.get('/kanye', kanyeAPI);

//---------------------------------Home Page
function homePage(req, res){
  res.status(200).render('index');
}
//-------------------------------- About
function about(req, res){
  res.status(200).render('about');
}
// -------------------------------- Start Quiz
function startQuiz(req, res){
  // render object returned from quizBuilder
  const SQL = `INSERT INTO users (firstName) VALUES ($2) returning *`;
  const params = [req.body.player];
    client.query(SQL, params)
    .then(results => {
      res.status(200).render('quiz');
    })
    .catch(error => {
      console.log(error);
  });
}

//------------------------------ Always Sunny API
function sunnyQuotes (req, res){
  let API = 'http://sunnyquotes.net/q.php?random';
  superagent.get(API).then( data => {
    let newSunny = new Sunny(data.body);
    res.status(200).send(newSunny);
  })
    .catch(error => console.log(error));
}

//----------------------------- Breaking Bad API
function breakingBadAPI(req, res){
  const URL = `https://breaking-bad-quotes.herokuapp.com/v1/quotes`;
  superagent.get(URL)
    .then(data => {
      let quote = new BadQuote(data.body[0]);
      res.status(200).send(quote);
    })
    .catch(error => console.log(error));
}

//----------------------------- Office API
function officeAPI(req, res){
  const URL = `https://officeapi.dev/api/quotes/random`;
  superagent.get(URL)
    .then(data => {
      let quote = new Office((JSON.parse(data.text)).data);
      res.status(200).send(quote);
    })
    .catch(error => console.log(error));
}

//--------------------------- Ron Swanson API
function swansonAPI(req, res){
  const URL = `https://ron-swanson-quotes.herokuapp.com/v2/quotes`;
  superagent.get(URL)
    .then(data => {
      let quote = new Swanson(data.body[0]);
      res.status(200).send(quote);
    })
    .catch(error => console.log(error));
}

//------------------------------- Kanye API
function kanyeAPI(req, res){
  const URL = `https://api.kanye.rest`;
  superagent.get(URL)
    .then(data =>{
      let quote = new Kanye(data.body.quote);
      res.status(200).send(quote);
    })
    .catch(error => console.log(error));
}

//--------------------------------- Simpsons API
// function simpsonQuotes (req, res){
//   let API = 'https://thesimpsonsquoteapi.glitch.me/quotes';

//   superagent.get(API).then(data => {
//     console.log(data.body);
//     let newSimpson = new Simpson(data.body);
//     console.log(newSimpson);
//   });
// }

//------------------------------- Constructors
function Sunny(newSunnyQuote){
  this.quote = newSunnyQuote.sqQuote;
  this.quoter = newSunnyQuote.sqWho;
}
function BadQuote(quote){
  this.quote = quote.quote;
  this.quoter = quote.author;
}
function Office(obj){
  this.quote = obj.content;
  let name = `${obj.character.firstname} ${obj.character.lastname}`;
  this.quoter = name;
}
function Swanson(quote){
  this.quote = quote;
  this.quoter = 'Ron Swanson';
}
function Kanye(quote){
  this.quote = quote;
  this.quoter = 'Kanye West';
}

// DATABASE STUFF ----------------------------------------------------------

//--------------------------------- Add Quote
function addQuote(request, response) {
  const SQL = 'INSERT INTO quotes (quotes, note) VALUES ($1, $2) RETURNING id';
  const params = [request.body.quotes, request.body.note];
  client.query(SQL, params)
    .then(results => {
      response.status(200).redirect(`view/saved`); // need to add object.id
    })
    .catch(error => {
      console.log(error);
    });
}

//--------------------------------- Saved Quote
function savedQuote(request, response) {
  const SQL = 'SELECT * FROM quotes;';

  return client.query(SQL)
    .then(results => {
      response.status(200).render('saved', {}); // need to enter returning object { quotes: results.rows}
    })
    .catch(error => {
      console.log(error);
    });
}
//--------------------------------- Add Scores
function addScores(request, response) {
  const SQL = 'INSERT INTO users (firstName, score_number) VALUES ($1, $2) RETURNING id';
  const params = [request.body.firstName, request.body.score_number];
  client.query(SQL, params)
    .then(results => {
      response.status(200).redirect(`views/scores`); // need to add object
    })
    .catch(error => {
      console.log(error);
    });
}

//------------------------------ Save Scores
function savedScores(request, response) {
  const SQL = 'SELECT * FROM users;';

  return client.query(SQL)
    .then(results => {
      response.status(200).render('scores', {}); // need to enter returning object { scores: results.rows}
    })
    .catch(error => {
      console.log(error);
    });
}

//--------------------------------- Add Notes 
  // ---------- (need to keep quote input hidden so only note is visibly updated)
  app.put('/note/:id, addQuoteNote');
  function addQuoteNote(request, response) {
    const SQL = 'UPDATE quotes SET quotes = $1, note = $2 WHERE id = $3';
    const params = [request.body.quotes, request.body.note, request.params.id];
  
    client.query(SQL, params)
      .then(results => {
        response.status(200).redirect('view/saved');
      })
      .catch(error => {
        console.log(error);
      });
  }
  
  //--------------------------------- Delete Quote
  app.delete('/delete/:id', deleteQuote);
  function deleteQuote(request, response) {
    const SQL = 'DELETE from quotes WHERE id = $1';
    const params = [request.params.id];
  
    client.query(SQL, params)
      .then(results => {
        response.status(200).redirect('view/saved');
      })
      .catch(error => {
        console.log(error);
      });
  }

// turn the server on
client.connect()
  .then(()=> {
    app.listen(port, () => {
      console.log('its alive');
    });
  })
  .catch (error => {
    console.log(error);
  });




// FAKE DATA - FOR TESTING ONLY

app.get('/fake', (req, res) => {
  let fakeObj =
    [
      {
      "id": "1",
      "quote":"Wang is all over my ass because of rent.",
      "quoter":"Charlie Kelly",
      "optionA": "Mac",
      "optionB": "Dee",
      "optionC": "Frank",
      "optionD": "Charlie",
      "image": "image_path.com"
      },
    ];
  res.status(200).render('quiz', {fakeObj});
});

// {
//   id: question number,
//   quote: 'quote',
//   quoter: 'quoter',
//   optionA: name1,
//   optionB: name2,
//   optionC: name3,
//   optionD: name4,
//   image: image_path
//   }












