import axios from 'axios';

import client from '../src/config/database.js';
//import appLog from '../src/events/appLog.js';

import { BookT } from '../src/types/book.js';

async function bookshelf() {

  await client.$transaction([
    client.$executeRaw`TRUNCATE books RESTART IDENTITY CASCADE`,
  ])

  const arrayTest = ['Harry+Potter', 'Sapiens', 'Javascript', 'Typescript', 'Excel', 'John+Green', 'Colleen+Hoover', 'Java', 'CSharp', 'DotNet', 'Python', 'Holmes']

  for (let i = 0; i < arrayTest.length; i++) {
    const googleBooksAPI = `https://www.googleapis.com/books/v1/volumes?q=${arrayTest[i]}&key=${process.env.API_KEY}`
    axios.get(googleBooksAPI).then(async (res) => {
      let totalItems = res.data.totalItems;
      /*       
      if (totalItems >= 50) {
        totalItems = 50
      } */

      for (let j = 0; j < totalItems; j++) {

        if (!res.data.items[j] || !res.data.items[j].id || !res.data.items[j].volumeInfo) {
          break
        }

        const selectedItem = res.data.items[j]
        const volumeData = selectedItem.volumeInfo
        const saleData = selectedItem.saleInfo
        const searchData = selectedItem.searchInfo

        console.log(selectedItem.id)

        const auxObject: BookT = {
          goodle_id: '',
          title: '',
          publisher: null,
          published_date: null,
          description: null,
          page_count: null,
          image_link: null,
          language: null,
          preview_link: null,
          saleability: 'NOT_FOR_SALE',
          isEbook: false,
          amount: null,
          currency_code: null,
          text_snippet: null
        }

        auxObject.goodle_id = selectedItem.id
        auxObject.title = volumeData.title

        if (volumeData.publisher) {
          auxObject.publisher = volumeData.publisher
        }

        if (volumeData.publishedDate) {
          auxObject.published_date = volumeData.publishedDate
        }

        if (volumeData.description) {
          auxObject.description = volumeData.description
        }

        if (volumeData.pageCount) {
          auxObject.page_count = volumeData.pageCount
        }

        if (volumeData.imageLinks) {
          auxObject.image_link = volumeData.imageLinks.thumbnail
        }

        if (volumeData.language) {
          auxObject.language = volumeData.language
        }

        if (volumeData.previewLink) {
          auxObject.preview_link = volumeData.previewLink
        }

        if (saleData.saleability) {
          auxObject.saleability = saleData.saleability
        }

        if (saleData.isEbook) {
          auxObject.isEbook = saleData.isEbook
        }

        if (auxObject.saleability === 'FOR_SALE') {
          auxObject.amount = saleData.listPrice.amount
          auxObject.currency_code = saleData.listPrice.currencyCode
        }

        if (searchData && searchData.textSnippet) {
          auxObject.text_snippet = searchData.textSnippet
        }

        await client.book.create({
          data: auxObject
        })
      }
    })
  }
}

bookshelf()
  .then(async () => {
    await client.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await client.$disconnect()
    process.exit(1)
  })

