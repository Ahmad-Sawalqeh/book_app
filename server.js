'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const methodOverride = require('method-override');

const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

client.connect();
// client.on('error', err => console.error(err));

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true, }));

app.set('view engine', 'ejs');

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.get('/', getFromDataBase);
app.get('/searches', getForm);
app.post('/searches/show', getApiBooks);
app.post('/select', getSelectForm);
app.post('/add', addToDataBase);
app.put('/books:id',updateDetails);
app.get('/details/:detail_id', viewDetails);



app.listen(PORT, () => console.log('Up on port', PORT));





/*************************** Functions ***************************/
function Books(data) {
  this.title = data.title || 'Sorry title not available';
  this.author = data.authors || 'Opss.. Author Unknown';
  this.description = data.description || 'Sorry no description available';
  this.image_url = data.imageLinks && data.imageLinks.thumbnail || 'Sorry no Image available';
  this.isbn = data.industryIdentifiers && data.industryIdentifiers[0].identifier || 'Sorry no ISBN available';
}

function errorHandler(err, res){
  console.log(err);
  if (res) res.status(500).render('pages/error');
}


function getSelectForm(req, res){
  let {title, author, description, image_url, isbn,} = req.body;
  res.render('pages/searches/new', {book:req.body,});
}

function addToDataBase(req, res){
  let {title, author, description, image_url, isbn} = req.body;

  let SQL = 'INSERT INTO books (title, author, description, image_url, isbn) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, author, description, image_url, isbn];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => errorHandler(err, res));
}

function getForm(req, res){
  res.render('pages/searches/form');
}

function getApiBooks(req, res){
  let url = searchUrl(req);
  superagent.get(url)
    .then(data => {
      return data.body.items.map(bookResult => new Books(bookResult.volumeInfo));
    })
    .then(results => {
      res.render('pages/searches/show', { booksArray: results, });
    })
    .catch(err => errorHandler(err, res));
}

function getFromDataBase(req, res){
  let sql = `SELECT * FROM books`;
  return client.query(sql)
    .then(data => {
      let counter = data.rows.length;
      res.render('pages/index', { booksArray: data.rows,});
    })
    .catch(err => errorHandler(err, res));
}

function searchUrl(req) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (req.body.search[1] === 'title') {
    url += `${req.body.search[0]}+intitle`;
  } else if (req.body.search[1] === 'author') {
    url += `${req.body.search[0]}+inauthor`;
  }
  return url;
}



function updateDetails(request, response){
  console.log(request.body);
  let { title, author, isbn, description, bookshelf, image } = request.body;
  const SQL = 'UPDATE books SET title=$1, author=$2, description=$3, image_url=$4, isbn=$5;';

  
  const values = [title, author, description, description, image_url, isbn];

  client.query(SQL, values)
    .then(book => response.render(`./pages/searches/show`, {books: book }))
    .catch(error => handleError(error, response));
}




function viewDetails(request, response) {
  let isbn = request.params.detail_id;
  let url = `https://www.googleapis.com/books/v1/volumes?q=+isbn${isbn}`;
  superagent.get(url).then(isbnResult => {
    let bookDetail = new Book(isbnResult.body.items[0].volumeInfo);
    response.render('pages/books/detail', { results: [bookDetail] });
  });
}

