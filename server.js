'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

client.connect();
client.on('error', err => console.error(err));

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true, }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/', getFromDataBase);
// app.get("/new", search);



app.post('/searches', (req, res) => {
  let url = searchUrl(req);
  superagent.get(url)
    .then(data => {
      return data.body.items.map(bookResult => {
        new Books(bookResult.volumeInfo);
      });
    })
    .then(results => {
      res.render('pages/searches/show', { booksArray: results, });
    })
    .catch(err => errorHandler(err, res));
});




// .then( insertIntoDB => {
//   console.log('insert-into-db : ', insertIntoDB);
// })


const errorHandler = (err, response) => {
  console.log(err);
  if (response) response.status(500).render('pages/error');
};

app.listen(PORT, () => console.log('Up on port', PORT));





// function search(req,res){
//   res.render('pages/new');
// }

function getFromDataBase(req, res){
  let sql = `SELECT * FROM newbooks `;
  // console.log('sql : ', sql);
  return client.query(sql)
    .then(data => {
      res.render('pages/searches/new', { booksArray: data.row,});
    })
    .catch(err => errorHandler(err, res));
}



function Books(data) {
  this.title = data.title || 'Sorry title not available';
  this.author = data.authors || 'Opss.. Author Unknown';
  this.description = data.description || 'Sorry not available Description';
  this.image_url = data.imageLinks.thumbnail || 'Soory unavailable Image';
  this.image_url = this.image_url;
  this.isbn = data.industryIdentifiers[0].identifier || 'ISBN unavailable';
}

function searchUrl(request) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (request.body.search[1] === 'title') {
    url += `${request.body.search[0]}+intitle`;
  } else if (request.body.search[1] === 'author') {
    url += `${request.body.search[0]}+inauthor`;
  }
  return url;
}
