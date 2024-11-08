var express = require("express");
var router = express.Router();
const kitController = require("../controllers/kitController");

router.route("/").get(kitController.getAllKits);

router
  .route("/getAllKitsFromSkuVault")
  .post(kitController.getAllKitsFromSkuVault);

module.exports = router;
