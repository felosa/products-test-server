var faker = require('faker');

const createFakerProduct = () => ({
  name: faker.commerce.productName(),
  type: faker.commerce.productMaterial(),
  price: faker.commerce.price(),
  expiryDate: faker.date.future(),
  description: faker.lorem.paragraph(),
  country: faker.address.country()
})

exports.seed = async function (knex, Promise) {

  const fakeProducts = [];
  const desiredFakeProducts = 500
  for (let i = 0; i < desiredFakeProducts; i++) {
    fakeProducts.push(createFakerProduct())
  }
  // Deletes ALL existing entries
  await knex("products")
    .del()
    .insert(fakeProducts)

};
