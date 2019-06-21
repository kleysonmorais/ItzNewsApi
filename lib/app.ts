import express = require('express');
import axios from 'axios';

const app: express.Application = express();

class DataPost {
  static getMediaImage = (uri: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      axios.get(uri)
        .then(response => {
          let mediaData = DataPost.parseJSON(response.data)
          let mediaImage = { title: mediaData['title']['rendered'], sizes: mediaData['media_details']['sizes'] }
          console.log(mediaImage['title'])

          resolve(mediaImage)
        })
        .catch(error => {
          console.log(error);
          reject({})
        });
    })
  }

  static parseJSON(text: string) {
    let aux = text.replace(/\ufeff/g, '');
    return JSON.parse(aux)
  }
}

app.get('/posts', function (req, res) {
  axios.get('https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts')
    .then(async (response) => {
      let posts: [] = DataPost.parseJSON(response.data)
      let postsNews = posts.map(async (post) => {
        let uriMediaImage = post['_links']['wp:featuredmedia'][0]['href']
        console.log(uriMediaImage)
        console.log(post['title']['rendered'])
        // let mediaImage = await DataPost.getMediaImage(uriMediaImage)
        return { title: post['title']['rendered'], content: post['content']['rendered'] }
      })
      // console.log(postsNews)
      res.json(postsNews)
    })
    .catch(error => {
      console.log(error);
    });
});

app.listen(3000, function () {
  console.log('Exemplo app listening on port 3000!');
});



