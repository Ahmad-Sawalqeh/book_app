'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

const client = new pg.Client(process.env.DATABASE_URL);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true, }));
app.set('view engine', 'ejs');
app.use(methodOverride(putDeleteMethods));

app.get('/', getFromDataBase);
app.get('/search', getSearchForm);
app.post('/search/result', getApiBooks);
app.post('/select', getSelectForm);
app.post('/add', addToDataBase);
app.post('/detail/:book_id', showDetails);
app.delete('/detail/:book_id', deletBook);
app.post('/update/:book_id', getUpdateForm);
app.put('/update/:book_id', updateDetails);

/*************************** Functions ***************************/
function updateDetails(request, response){
  let { id, title, author, description, image_url, isbn } = request.body;
  const SQL = 'UPDATE books SET title=$1, author=$2, description=$3, image_url=$4, isbn=$5 WHERE id=$6;';
  const values = [title, author, description, image_url, isbn, request.params.book_id];
  client.query(SQL, values)
    .then(() => response.redirect(`/`))
    .catch(error => errorHandler(error, response));
}
function getUpdateForm(req, res){
  let { id, title, author, description, image_url, isbn } = req.body;
  res.render('pages/books/update', {book:req.body,});
}
function deletBook(req, res){
  let sql = 'DELETE FROM books WHERE id=$1;';
  let values = [req.params.book_id];
  return client.query(sql, values)
    .then(res.redirect('/'))
    .catch(error => errorHandler(error, res));
}
function showDetails(req, res){
  let {title, author, description, image_url, isbn,} = req.body;
  res.render('pages/books/detail', {book:req.body,});
}
function addToDataBase(req, res){
  let {title, author, description, image_url, isbn} = req.body;
  let SQL = 'INSERT INTO books (title, author, description, image_url, isbn) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, author, description, image_url, isbn];
  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => errorHandler(err, res));
}
function getSelectForm(req, res){
  let {title, author, description, image_url, isbn,} = req.body;
  res.render('pages/searches/new', {book:req.body,});
}
function getApiBooks(req, res){
  let url = searchUrl(req);
  superagent.get(url)
    .then(data => {
      return data.body.items.map(bookResult => new Books(bookResult.volumeInfo));
    })
    .then(results => {
      res.render('pages/searches/result', { booksArray: results, });
    })
    .catch(err => errorHandler(err, res));
}
function getSearchForm(req, res){
  res.render('pages/searches/form');
}
function getFromDataBase(req, res){
  let sql = `SELECT * FROM books`;
  return client.query(sql)
    .then(data => {
      res.render('pages/index', { booksArray: data.rows,});
    })
    .catch(err => errorHandler(err, res));
}
/*************************** Api search ***************************/
function searchUrl(req) {
  // let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  let searchParam = req.body.search[1] === 'title' ? `${req.body.search[0]}+intitle` : `${req.body.search[0]}+inauthor`;
  return `https://www.googleapis.com/books/v1/volumes?q=${searchParam}`;
}
function Books(data) {
  this.title = data.title || 'Sorry title not available';
  this.author = data.authors || 'Opss.. Author Unknown';
  this.description = data.description || 'Sorry no description available';
  this.image_url = data.imageLinks && data.imageLinks.thumbnail || 'Sorry no Image available';
  this.isbn = data.industryIdentifiers && data.industryIdentifiers[0].identifier || 'Sorry no ISBN available';
}
/*************************** useful Functions ***************************/
function putDeleteMethods(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}
function errorHandler(err, res){
  console.log(err);
  if (res) res.status(500).render('pages/error');
}
client.connect(console.log('connected to database'))
  .then(() => {
    app.listen(PORT, () => console.log(`listening on port ${PORT}`));
  })
  .catch(err => {
    throw `pg startup error: ${err.message}`;
  });
// client.on('error', err => console.error(err));
