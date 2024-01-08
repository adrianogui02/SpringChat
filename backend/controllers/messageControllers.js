const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const forge = require("node-forge");

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

  // Encontre o remetente com base no e-mail do remetente
  const senderEmail = req.user.email;
  const sender = chatId.users.find((user) => user.email === senderEmail);
  console.log("Sender: " + sender.name);

  if (!sender) {
    console.log("Sender not found");
    return res.sendStatus(400);
  }

  // Encontre o destinatário (outro usuário no chat)
  const recipient = chatId.users.find((user) => user.email !== senderEmail);
  console.log("Recipient: " + recipient.name);
  console.log("Recipient RSA PUBLIC KEY: " + recipient.public_key);

  if (!recipient || !recipient.public_key) {
    console.log("Recipient not found or missing public key");
    return res.sendStatus(400);
  }

  // Obtenha a chave pública do destinatário
  const recipientPublicKey = recipient.public_key;

  console.log(content);

  const encryptedContent = await encryptMessage(content, recipientPublicKey);
  console.log(encryptedContent);

  const newMessage = {
    sender: sender._id, // Use o ID do remetente
    content: content,
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
  try {
    const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    const encryptedContent = publicKeyObj.encrypt(message, "RSA-OAEP");
    return forge.util.encode64(encryptedContent);
  } catch (error) {
    console.error("Erro na criptografia:", error);
    throw error;
  }
};

module.exports = { allMessages, sendMessage };
