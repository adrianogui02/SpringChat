import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import Cookies from 'js-cookie';
//import Cookies from 'universal-cookie';
import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;


const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

    const fetchMessages = async () => {
      const NodeRSA = require('node-rsa');
    
      if (!selectedChat) return;
    
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
    
        setLoading(true);
    
        const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
        
        const directkey ='-----BEGIN%20RSA%20PRIVATE%20KEY-----%0AMIIEpAIBAAKCAQEAipKu0REDpjfB8HSGz99ig0pG34lFfZi24V6L29X%2BYgwl%2BlTa%0A%2BBsE4nJFrErZvet8rH7lTY39CbSy41Jut5%2ByjIpGAY6yTyXSNgAaKN8LJbr6gq54%0Agd6sPP6MkUkFxBAGfQaBpXWVzAQjfQkyUzm39Uh%2FdalveEjNpDrSo0hoZrUizQZ8%0AGJUhwoEqbIsmyRpUQ8Z291KYf2Ow3pV9R1xNrVdIey%2Fd8eXRSinmBETr3kT7cq1l%0AYOR1d0HRhzpLF9C2rF4MaAvxkMI1%2BjXWz1Ye7vQTsstaN46eox7v9XhfPhmyC5lY%0Aen7XzyduWJjYh5dYidHBft3rKwb7JlL31HcxfwIDAQABAoIBAFkwQa40GjowZvXh%0Auicu6tP%2FyY%2F0ZTKKSSLS3IeYuwrWMNdnKCxKD6HD1M4ouu5%2FE5Zeci2xdqx5ji27%0Aj6FF%2BwBzus0jz%2BYbPKoe9Ldbn2wgZT4ZF1zXOdpkJ4sXCcwAWHy95FHfVZOjEkhW%0A0%2Fo3CwynJcpQTHuJuDm81nfbkb6QYd9%2B0%2BWWduNAZoOAgd6mKKQ9f0iM4qKgGotc%0AvuP4M%2FJYwVPWW4nzp47e1CzFat47BizrRssc6Oq9KPwJul%2BwwgEYEMBm%2BZH4RL2i%0Aos%2BPd2r6DNptC2HRD3odg05di2AAwuu%2B6hrs8Q17NKsMCi60hQBIpDp1oo%2Baldbe%0AUn5890kCgYEAzDpkNWQQVVaTFWePmBoTVm9kGDmNJBSZWxUtofwfgS5Ac6SS3zAT%0ArUt28sDSCl21ibp14LmtIiztf5B6gH7d6aJnevdJ6GJnrfEsme67S%2FPGdXO7v06%2F%0ACqW6W4PkbL8KpOavyG0ZCjsXSrnysiSZQ2zIA4CVYwZs962Hxf36ilUCgYEArbOH%0Atys3Nuxw67tpwF7OVbnJ58ySoZFqZN2W9ptDjFMe2DWKrSZ80X6jltDILxwUzDdO%0Aijpyo2kTK5TvfeyXfMOZCEhMCnlf4tXfFdb%2B6NbdMRKhO%2BL5zIWy0FikFiYcBwqr%0AruiVE0Rf2X2LQBjMvhu2ClLTlJhkjF6ReCxwyIMCgYEAgtG0du7N95wpQ0C%2FHnM1%0Ah9x6hXn4CvCW%2B10pieVyWNFDv8%2FftM%2BbCxqX6w%2FQe4tjSgICmBzX5lhZGal2jvC1%0APX8mQgI9eXnvZ%2BBg7YmauCBDM%2BEaloTeovdd1Fk77NzC%2BLY8S2p267LGTLun1qzS%0A7%2FmydWvcRT5MdqrVmeICprECgYA2gOLQ4sqMfVxhW4kvR5BO7eEgztwjvlE4HR%2FF%0AeaqUWXCQPxyogC8iPS5voEtwHMuZ2LDYRsa557qQLkeHp7lQ%2BL8IDkdt8e%2FYaWt6%0Amt%2BZh%2FIX99SHygy%2F1CPrpCS4nnSk8QA1%2FdzpEsdQo0gScLWt4VwZmSuysK68LOBQ%0AaQFqqQKBgQCPWgjef4bqQHF0A4%2Fb6nkKIj%2F%2FID6wEXIbviTAB7AZoQHQ%2FJ3h9WFU%0AwyOCmL1SaGG2I5NBpWprerwipu7xJRht8R6w9ynekDOuINudOy%2Fh8dJD3TQYnA%2BK%0AjFf8V7aZQGQlp0HTuTVISSE6eDTRZsbMCrqRmoNsi7xJJfN86STKDA%3D%3D%0A-----END%20RSA%20PRIVATE%20KEY-----'
        // Obter a chave privada dos cookies
        const privateKey = await Cookies.get('private_key'); // Certifique-se de usar a chave correta
        console.log('privateKey: ' + privateKey);
        // Função para descriptografar uma mensagem
        const decryptMessage = (encryptedMessage, privateKey) => {
          try {
            const key = new NodeRSA(privateKey, 'pkcs1-private');
            const decryptedMessage = key.decrypt(encryptedMessage, 'utf8');
            return decryptedMessage;
          } catch (error) {
            console.error('Error during decryption:', error.message);
            return null;
          }
        };
        
  
    
        // Descriptografar as mensagens antes de defini-las no estado
        const decryptedMessages = data.map((message) => {
          const decryptedContent = decryptMessage(message.content, directkey);
          return { ...message, content: decryptedContent };
        });
    
        setMessages(decryptedMessages);
        setLoading(false);
    
        socket.emit('join chat', selectedChat._id);
      } catch (error) {
        toast({
          title: 'Error Occurred!',
          description: 'Failed to Load the Messages',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
        });
      }
    };
    

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
