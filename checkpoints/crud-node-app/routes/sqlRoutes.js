const express = require('express');
const controller = require('../controllers/SQLcontroller');

const router = express.Router();

router.route('/products').post(controller.createProduct).get(controller.getProducts);
router
  .route('/products/:id')
  .get(controller.getProductById)
  .put(controller.updateProduct)
  .delete(controller.deleteProduct);

module.exports = router;
