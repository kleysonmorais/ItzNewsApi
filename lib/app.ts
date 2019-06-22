import express = require('express');
import axios from 'axios';

const app: express.Application = express();

class DataPost {

  static postFromMap(posts: []) {
    return posts.map(post => {
      return {
        id: post['id'],
        title: post['title']['rendered'],
        media_image: post['media_image'],
        date: post['date'],
        content: post['content']['rendered'],
        description: post['excerpt']['rendered'],
        category: 'Geral',
        link: post['guid']['rendered'],
        origin: 'Imperatriz Notícias'
      }
    })
  }

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

  static getPromiseArrayUriImg(posts: []) {
    return posts.map((post) => {
      let uriMediaImage = post['_links']['wp:featuredmedia'][0]['href']
      return axios.get(uriMediaImage)
    })
  }

  static executeAllRequests(requests: any, posts: any) {
    return new Promise<any>((resolve, reject) => {
      axios.all(requests).then(dataMedia => {
        console.log("Request All Complete")
        let postPopulate = dataMedia.map(media => DataPost.parseJSON((<any>media).data))
          .map((mediaDetails, index) => {
            let mediaDetail = { title: (<any>mediaDetails)['title']['rendered'], sizes: (<any>mediaDetails)['media_details']['sizes'] }
            posts[index]['media_image'] = mediaDetail
            return posts[index]
          });
        resolve(postPopulate)
      }).catch(error => {
        console.log(error)
        reject({})
      })
    })
  }
}

app.get('/posts', function (req, res) {
  axios.get('https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts')
    .then(async (response) => {
      let posts: [] = DataPost.parseJSON(response.data)
      let promiseArray = DataPost.getPromiseArrayUriImg(posts)
      let postsConstruct = await DataPost.executeAllRequests(promiseArray, posts)
      res.json(DataPost.postFromMap(postsConstruct))
    })
    .catch(error => {
      console.log(error);
    });
});

app.listen(3000, function () {
  console.log('Exemplo app listening on port 3000!');
});



