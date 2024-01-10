const express = require("express");
const {
  allMessages,
  sendMessage,
  allMessagesCypted,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/crypted/:chatId").get(protect, allMessagesCypted);
router.route("/").post(protect, sendMessage);

module.exports = router;
