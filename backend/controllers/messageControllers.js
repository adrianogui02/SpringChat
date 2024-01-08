const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const NodeRSA = require('node-rsa');

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId || !req.user) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // Obtem a chave pública do destinatário (usuário no mesmo chat)
  const recipientPublicKey = req.user.public_key;

  // Criptografa a mensagem usando a chave pública do destinatário
  const encryptedContent = await encryptMessage(content, recipientPublicKey);

  const newMessage = {
    sender: req.user._id,
    content: encryptedContent,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const encryptMessage = async (message, publicKey) => {
  console.log("Encrypt");
  try {
    // Cria uma instância da chave pública
    const key = new NodeRSA(publicKey, 'pkcs8-public');

    // Criptografa a mensagem
    const encryptedContent = key.encrypt(message, 'base64');
    console.log(encryptedContent);
    return encryptedContent;
  } catch (error) {
    console.error("Erro na criptografia:", error);
    throw error;
  }
};





module.exports = { allMessages, sendMessage };
