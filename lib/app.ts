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
        origin: 'Imperatriz Notícias',
        autor: 'Indefinido'
      }
    })
  }

  static getMediaImage = (uri: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      axios.get(uri)
        .then(response => {
          let mediaData = DataPost.parseJSON(response.data)
          let mediaImage = { title: mediaData['title']['rendered'], sizes: mediaData['media_details']['sizes'] }
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
    let postsFilter = posts.filter(post => {
      if (post && post['_links'] && post['_links']['wp:featuredmedia']
        && post['_links']['wp:featuredmedia'][0]
        && post['_links']['wp:featuredmedia'][0]['href']) {
        return post
      }
    })
    let postsAxios = postsFilter.map((post) => {
      let uriMediaImage = post['_links']['wp:featuredmedia'][0]['href']
      return axios.get(uriMediaImage)
    })
    return { postsFilter, postsAxios }
  }

  static executeAllRequests(requests: any, posts: any) {
    return new Promise<any>((resolve, reject) => {
      axios.all(requests).then(dataMedia => {
        let postPopulate = dataMedia.map(media => DataPost.parseJSON((<any>media).data))
          .map((mediaDetails, index) => {
            let mediaDetail = {
              title: (<any>mediaDetails)['title']['rendered'],
              sizes: (<any>mediaDetails)['media_details']['sizes']
            }
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

app.get('/', (req, res) => {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.json({
    self: fullUrl,
    posts: {
      posts: {
        url: `${fullUrl}posts`,
        description: "Retorna as 10 últimas notícias."
      },
      posts_params: [
        {
          url: `${fullUrl}posts?search=futebol`,
          description: "Retorna até as 10 últimas notícias com o termo pesquisado."
        },
        {
          url: `${fullUrl}posts?per_page=5`,
          description: "Retorna as 5 (quantidade informada) últimas notícias. O padrão é 10."
        },
        {
          url: `${fullUrl}posts?page=5`,
          description: "Retorna a paginação de notícias informada."
        },
        {
          url: `${fullUrl}posts?categories=40`,
          description: "Retorna até as 10 últimas notícias da categoria informada."
        }
      ],
    },
    posts_recents: {
      url: `${fullUrl}posts/recents`,
      description: "Retorna as 5 últimas notícias."
    },
  })
})

const resultSucess: any = async (response: any, result: any) => {
  let posts: [] = DataPost.parseJSON(result.data)
  let promiseArray = DataPost.getPromiseArrayUriImg(posts)
  let postsConstruct = await DataPost.executeAllRequests(promiseArray.postsAxios, promiseArray.postsFilter)
  response.json(DataPost.postFromMap(postsConstruct))
}

const resultError: any = (response: any, error: any) => {
  console.log(error)
  response.send(500)
}

app.get('/posts', (req, res) => {
  let uri = []
  if (req.query.categories) uri.push(`categories=${req.query.categories}`)
  if (req.query.search) uri.push(`search=${req.query.search}`)
  if (req.query.per_page) uri.push(`per_page=${req.query.per_page}`)
  if (req.query.page) uri.push(`page=${req.query.page}`)
  let params = uri.join('&')
  axios.get(`https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts?${params}`)
    .then(async (result) => resultSucess(res, result))
    .catch(error => resultError(res, error));
});

app.get('/posts/recents', (req, res) => {
  axios.get('https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts?per_page=5')
    .then(async (result) => resultSucess(res, result))
    .catch(error => resultError(res, error));
})

var port = process.env.PORT || 3000

app.listen(port, function () {
  console.log('Server running at http://127.0.0.1:' + port + '/');
});