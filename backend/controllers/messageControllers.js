const asyncHandler = require("express-async-handler");
const { Message, encryptedMessage } = require("../models/messageModel");
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
//@description     Get all Messages Crypted
//@route           GET /api/Message/cryp/:chatId
//@access          Protected
const allMessagesCypted = asyncHandler(async (req, res) => {
  try {
    const messagesEncryp = await encryptedMessage
      .find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messagesEncryp);
  } catch (error) {
    console.error("Error fetching encrypted messages:", error);
    res.status(500).send("Internal Server Error");
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId || !req.user) {
    console.log("\x1b[33mInvalid data passed into request\x1b[0m"); // Amarelo
    return res.sendStatus(400);
  }

  // Encontre o remetente com base no e-mail do remetente
  const senderEmail = req.user.email;
  const sender = chatId.users.find((user) => user.email === senderEmail);
  console.log("\n---------------\x1b[33mNEW MESSAGE\x1b[0m---------------"); // Amarelo
  console.log("\x1b[34mSender:\x1b[0m\n" + sender.name); // Amarelo
  console.log("\x1b[34mSender RSA PUBLIC KEY:\x1b[0m\n" + sender.public_key); // Amarelo

  if (!sender) {
    console.log("\x1b[33mSender not found\x1b[0m"); // Amarelo
    return res.sendStatus(400);
  }

  // Encontre o destinatário (outro usuário no chat)
  const recipients = chatId.users.filter((user) => user.email !== senderEmail);
  recipients.forEach((recipient) => {
    console.log("\x1b[33mRecipient:\x1b[0m\n" + recipient.name); // Amarelo
    console.log(
      "\x1b[33mRecipient RSA PUBLIC KEY:\x1b[0m\n" + recipient.public_key
    ); // Amarelo
  });

  if (recipients.length === 0) {
    console.log("\x1b[33mRecipient not found or missing public key\x1b[0m"); // Amarelo
    return res.sendStatus(400);
  }

  console.log("\x1b[35mMensagem:\x1b[0m\n" + content); // Amarelo

  // Criptografa a mensagem - Sender
  const senderPublicKey = sender.public_key;
  const encryptedContentSender = await encryptMessage(content, senderPublicKey);
  console.log(
    "\x1b[34mMensagem Criptografada Sender:\x1b[0m\n" + encryptedContentSender
  );

  // Criptografa a mensagem - Recipients
  const encryptedContents = [];
  // Itera sobre cada destinatário
  for (const recipient of recipients) {
    const recipientPublicKey = recipient.public_key;
    const encryptedContent = await encryptMessage(content, recipientPublicKey);
    encryptedContents.push({ recipient: recipient.name, encryptedContent });
  }
  // Log para cada destinatário no array
  encryptedContents.forEach(({ recipient, encryptedContent }) => {
    console.log("\x1b[33mRecipient:\x1b[0m\n" + recipient); // Amarelo
    console.log(
      "\x1b[33mMensagem Criptografada Recipient:\x1b[0m\n" + encryptedContent
    ); // Amarelo
  });
  console.log(
    "\x1b[33m-----------------------------------------------------------\x1b[0m\n"
  );

  // Salva a mensagem criptografada na coleção EncryptedMessage
  const mensagensCriptografadas = [];
  // Itera sobre cada destinatário e salva a mensagem criptografada para cada um
  for (const recipient of recipients) {
    const recipientId = recipient._id; // Supondo que o ID do destinatário seja acessado dessa forma
    const recipientPublicKey = recipient.public_key;
    const encryptedContent = await encryptMessage(content, recipientPublicKey);
    const dadosMensagemCriptografada = {
      sender: sender._id,
      recipient: recipientId,
      content: encryptedContent,
      chat: chatId,
    };
    const mensagemCriptografada = await encryptedMessage.create(
      dadosMensagemCriptografada
    );
    mensagensCriptografadas.push(mensagemCriptografada);
  }

  const dadosMensagemCriptografadaSender = {
    sender: sender._id,
    content: encryptedContentSender,
    chat: chatId,
  };
  let mensagemCriptografadaSender = await encryptedMessage.create(
    dadosMensagemCriptografadaSender
  );

  // Salva a mensagem não criptografada na coleção Message
  const dadosMensagemNaoCriptografadona = {
    sender: sender._id,
    content: content,
    chat: chatId,
  };
  // Salva a mensagem não criptografada
  let mensagemCriptografadona = await Message.create(
    dadosMensagemNaoCriptografadona
  );

  try {
    // Preenche os campos necessários
    mensagemCriptografadaSender = await mensagemCriptografadaSender
      .populate("sender", "name pic")
      .execPopulate();
    mensagemCriptografadaSender = await mensagemCriptografadaSender
      .populate("chat")
      .execPopulate();
    mensagemCriptografadaSender = await User.populate(
      mensagemCriptografadaSender,
      {
        path: "chat.users",
        select: "name pic email",
      }
    );
    mensagemCriptografadona = await mensagemCriptografadona
      .populate("sender", "name pic")
      .execPopulate();
    mensagemCriptografadona = await mensagemCriptografadona
      .populate("chat")
      .execPopulate();
    mensagemCriptografadona = await User.populate(mensagemCriptografadona, {
      path: "chat.users",
      select: "name pic email",
    });
    const mensagensCriptografadasPopuladas = await Promise.all(
      mensagensCriptografadas.map(async (mensagemCriptografada) => {
        mensagemCriptografada = await mensagemCriptografada
          .populate("sender", "name pic")
          .execPopulate();
        mensagemCriptografada = await mensagemCriptografada
          .populate("chat")
          .execPopulate();
        return await User.populate(mensagemCriptografada, {
          path: "chat.users",
          select: "name pic email",
        });
      })
    );
    // Atualiza a última mensagem no chat
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: mensagemCriptografadona,
    });
    res.json({ mensagemCriptografadona });
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

module.exports = { allMessages, sendMessage, allMessagesCypted };
