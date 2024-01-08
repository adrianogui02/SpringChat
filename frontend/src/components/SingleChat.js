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

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;
const forge = require('node-forge');

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
    
      if (!selectedChat) return;
    
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
    
        setLoading(true);
    
        const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
        console.log(data)
        
        const directkey ='-----BEGIN RSA PRIVATE KEY----- MIIEowIBAAKCAQEAuEyV2bGMYI7u/U/5ciM6M0QEnEfRxeJ4F1ffisE5bjziO4UZ TbFw2lT3Cq2ybFjUf0S+nyOXTIVEuaiTUd3oMc8e+bQ/lINScu6VX5rlrLy9uBds ksrYlgc6o+1B+CJ2ra0DSvxzfPhkb9bFkFLWru0LkkhKcttbLFeg1xyvzMKrLqS2 6PT+VmcjL1e2Nw45vnEpQHyHNVml2Mhrvp1z11g0ZA8257+84zyifi8+iYffgSlb 688vlkHcmopjrh7hElDaOS277KeLnhezEtL6alTXDUhlH7i0+BPR8DjR8MgPNQVD MnhqvbBV/q3Tg0kdN7FbRKJf95ypn3hdg7K8bwIDAQABAoIBAAWWGLK1DYa9vmPC QVLi23hDVwpvqN2hLDe066s2iSmcwdTBB4/R0ZRkn+pccnyTQrmq2UZUm1jv7zHb eL+yBMBBwXQbMRQs2Npv/eocdVrDi9KhLyLR8De392CRp/6/+K3yARgMR+nhU5YK QgnKYQSDXebstwj9OinBbDgo//EqZhnwBmCzEHgnZ4T+DS8+5ZNkp9OpmrGoqq/B LFnB+x548j4/y95QPrfLQNA8WaDwu8d8adw+qPV+9sFI1ZbjVm+/E0Z+5ppWN0JR yp6R07RLOp05bd3Cy6MnHlrhTWtcNvOXlxoDqj5s3b+Whw4MsNO6qW41+aQY0ATP P3NWkTkCgYEA/FvAAs8kFbNuuh2PuDd79JTq9xqs5ZgSLpYlm03d+FzxGUbcBrfd Py+5KAiZURBHKzpobfOKNFt2k8KDKaaAXe7+TVq5BHK9MjymmmI+9zMVmBxdhwnf u33nDOI7CClv3hGOGW6DUrRC2zn435/8Iigu4e5CMUEd0iSPujJQ27cCgYEAuvVq Cw8gl86b7IewIOI+NKEmas84KcvBNBCWjtrD4ToWmVEhIZxQabisDvu31n9T0CX+ 749uYwOl0MUCJw6m6VIqRo+xmFLTp9uambTWeV+4hjZO7F2K9Pk1JTEWjptA9Ie4 iiWKvjPwxoy95AbmzYPx7QO3xMXFxQk2DiPTFQkCgYB+t2N3BaRM8UiMVAOysMmh SpWhdteSggW/Ns2zaionaCP4WUhqZzDFZaVHoOm7dr0Fy9JcQ4oGOFcWYvmRlHWo tTUkioWU4jh2XVYa93I+lnwlYTjlcePSNaorIf4aXxQ5If+EbaWrhbB8fGOnhqII VL0V3ZmHOfdLaehxyooniQKBgG/d1JvVa10qZSX8cqjadvoqyr/ySdrIbkxm+I91 2urzRP5sCvT/gSYhN+KnP3L7MP1FHuvc2OIqFpd6qjUQkVLetSkPZeaM+NRhlHoQ OJzbZ5/28vZ/alv2mZQtcR/XSeCHLSaMHB5/GbzUDfNZJdUm9CUrqlP1OscRIeUI Do9xAoGBAMqvrhaOjB5gHdFSxD4v9XfA3JGdgA7DxELx1OgyuINxupI0j3Iv9GiY qudT18IelmeGqz7MfnB29+KV5G9LkgCcyhSY5Myp2/iPa5l/FizS3MPaw6VxQQd5 1cxrtF+VqL5ay7Qvjg2D3gH2LSces7o+rqtIi1s0g8+0tBThA8ld -----END RSA PRIVATE KEY-----'
        // Obter a chave privada dos cookies
        const privateKey = Cookies.get('private_key'); // Certifique-se de usar a chave correta
        console.log('privateKey: ' + privateKey);
        // Função para descriptografar uma mensagem
        const decryptMessage = (encryptedMessage, privateKey) => {
          try {
            const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
            const decodedContent = forge.util.decode64(encryptedMessage);
            const decryptedMessage = privateKeyObj.decrypt(decodedContent, 'RSA-OAEP');
            return decryptedMessage;
          } catch (error) {
            console.error('Error during decryption:', error.message);
            return null;
          }
        };
        
        // Descriptografar as mensagens antes de defini-las no estado
        const decryptedMessages = data.map((message) => {
          const decryptedContent = decryptMessage(message.content, privateKey);
          return { ...message, content: decryptedContent };
        });
    
        setMessages(data);
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
