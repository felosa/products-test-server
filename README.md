INSTALL API.

1. Clone the repository.
2. Install dependencies.
   $ npm install
3. Create new database called prodcuts-crud.
4. Change params in knexfile.js
5. Run migrations and seed.
   $ knex migrate:latest
   $ knex seed:run
6. Run the app with nodemon.
   & npm run dev

END POINTS

List all the products:

GET: http://localhost:8000/api/products

Create a new product:

POST: http://localhost:8000/api/products

    The body should contain the object with this properties:
    name
    type
    price
    expiryDate
    description
    country

Edit a product

POST: http://localhost:8000/api/products/:ID

    The body should contain the object with this properties:
    name
    type
    price
    expiryDate
    description
    country

Delete a product

DELETE: http://localhost:8000/api/products/:ID
