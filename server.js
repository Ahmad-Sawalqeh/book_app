'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true,}));

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
  res.render('pages/index');
});

app.post('/searches', (req,res) => {
  let url = searchUrl(req);
  superagent.get(url)
    .then( data => {
      console.log('data : ', data);
      res.render('pages/searches/show');
      // , {searches:data.body.items,}
    });
});

app.listen(PORT, () => console.log('Up on port', PORT));












function searchUrl(request) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (request.body.search[1] === 'title') {
    url += `${request.body.search[0]}+intitle`;
  }else if (request.body.search[1] === 'author') {
    url += `${request.body.search[0]}+inauthor`;
  }
  return url;
}
