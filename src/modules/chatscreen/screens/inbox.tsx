import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import firestore from '@react-native-firebase/firestore';
import {useSelector} from 'react-redux';
import {
  Bubble,
  GiftedChat,
  InputToolbar,
  Send,
  Composer,
  Actions,
} from 'react-native-gifted-chat';

import {
  normalize,
  screenHeight,
  screenWidth,
  vw,
} from '../../../utils/dimensions';
import ChatHeader from '../../../components/chatHeader';
import {colors} from '../../../utils/colors';
import localimages from '../../../utils/localimages';
import fonts from '../../../utils/fonts';
import {randomChatID} from '../../../utils/common';

export function Inbox({route}: any) {
  const {Name, UID, pic, status, bio} = route.params;

  const [messages, setMessages] = useState([]);
  const {Auth_Data} = useSelector((store: any) => store.authReducer);
  const {User_Data} = useSelector((store: any) => store.profileReducer);
  let UserId = Auth_Data?.uid;
  const [userStatus, setuserStatus] = useState(false);
  const [isTyping, setisTyping] = useState<boolean>(false);
  const [getTypingStatus, setgetTypingStatus] = useState(false);
  const docid = UID > UserId ? UserId + '-' + UID : UID + '-' + UserId;
  const timeText = {left: {fontSize: vw(9)}, right: {fontSize: vw(9)}};

  console.log('userData', User_Data);

  useEffect(() => {
    const subscribe = firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(documentSnapshot => {
        handleRead();
        const allmsg = documentSnapshot.docs.map(item => {
          return item.data();
        });
        allmsg.sort((a, b) => {
          return b.createdAt - a.createdAt;
        });
        //@ts-ignore
        setMessages(allmsg);
      });

    return subscribe;
  }, []);

  useEffect(() => {
    const subscribe = firestore()
      .collection('Users')
      .doc(UID)
      .onSnapshot((documentSnapshot: any) => {
        console.log(documentSnapshot.data().isActive);
        setuserStatus(documentSnapshot.data().isActive);
      });
    getAllmsg();
    return subscribe;
  }, []);

  const getAllmsg = async () => {
    const querySanp = await firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .get();
    const allmsg = querySanp.docs.map(docSanp => {
      return docSanp.data();
    });
    //@ts-ignore
    setMessages(allmsg);
  };

  const onSend = (messagesArray: any) => {
    console.log('messages', messagesArray);
    const msg = messagesArray[0];
    messagesArray[0].createdAt = new Date().getTime();
    const mymsg = {
      ...msg,
      fromUserID: UserId,
      received: false,
      sent: true,
      toUserID: UID,
      createdAt: new Date().getTime(),
      // image: "https://res.cloudinary.com/dezx0edl7/image/upload/w_150,h_150,c_fill/v1662527358/profiles/ylkajgp9btgcquxr5yb0.jpg",
    };
    setMessages(previousMessages => GiftedChat.append(previousMessages, mymsg));

    firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('messages')
      .doc(mymsg._id)
      .set(mymsg);

    console.log('other User', UID, 'current user', UserId);

    if (messages.length == 0) {
      firestore()
        .collection('Users')
        .doc(UserId)
        .collection('Inbox')
        .doc(UID)
        .set({
          Name: Name,
          display: pic,
          uid: UID,
          About: bio,
        })
        .then(res => {
          console.log('response', res);
        });

      firestore()
        .collection('Users')
        .doc(UID)
        .collection('Inbox')
        .doc(UserId)
        .set({
          Name: User_Data?.Name,
          display: User_Data?.display,
          uid: User_Data?.uid,
          About: User_Data?.About,
        });
    }
  };

  useEffect(() => {
    firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('TypingStatus')
      .doc(UserId)
      .set({
        isTyping: isTyping,
      });
    firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('TypingStatus')
      .doc(UID)
      .onSnapshot(onchange => {
        let typing = onchange.data();
        setgetTypingStatus(typing?.isTyping);
      });
  }, [isTyping]);

  const debounce = useCallback((func: any, timeout: any) => {
    let timer: any;
    return (args: any) => {
      //@ts-ignore
      clearTimeout(timer);
      timer = setTimeout(() => {
        func(false);
      }, timeout);
      setisTyping(true);
    };
  }, []);

  const startTyping = debounce(() => {
    setisTyping(false);
  }, 2000);

  const findtyping = (text: any) => {
    if (text.length > 0)
      //@ts-ignore
      startTyping();
  };

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        tickStyle={{color: colors.WHITE, marginRight: vw(-6)}}
        wrapperStyle={{
          left: {backgroundColor: colors.LEFT_BUBBLE},
          right: {backgroundColor: colors.RIGHT_BUBBLE},
        }}
        textStyle={{
          left: {
            fontFamily: fonts.REGULAR,
            fontSize: vw(13),
            color: colors.WHITE,
          },
          right: {
            fontFamily: fonts.REGULAR,
            fontSize: vw(13),
            color: colors.WHITE,
          },
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <Image source={localimages.SEND} style={styles.sendIcon} />
      </Send>
    );
  };

  const renderIcon = () => {
    return (
      <View
        style={styles.iconContainer}>
        <Image
          source={localimages.CAMERA}
          style={styles.cameraIcon}
        />
      </View>
    );
  };

  const renderAction = (props: any) => {
    return (
      <Actions
        {...props}
        // onPressActionButton
        icon={renderIcon}
      />
    );
  };

  const renderComposer = (props: any) => {
    return (
      <InputToolbar {...props} containerStyle={styles.inputContainer}>
        {/* <TouchableOpacity
          style={{height: vw(100), width: vw(100), backgroundColor: 'red',}}
          onPress={() => {
            onSend([
              {
                image:
                  'https://res.cloudinary.com/dezx0edl7/image/upload/w_150,h_150,c_fill/v1662527358/profiles/ylkajgp9btgcquxr5yb0.jpg',
                  _id:  randomChatID(),
                  createdAt: new Date().getTime(),
                  user: {
                    _id: UserId,
                  },
                  text: '',
              },
            ]);
          }} /> */}
        <Composer
          {...props}
          textInputStyle={styles.messageInput}
        />
      </InputToolbar>
    );
  };

  const handleRead = async () => {
    const validate = await firestore()
      .collection('chatrooms')
      .doc(docid)
      .collection('messages')
      .get();
    const batch = firestore()?.batch();
    validate.forEach((documentSnapshot: any) => {
      if (documentSnapshot?._data.toUserID === UserId) {
        batch.update(documentSnapshot.ref, {received: true});
      }
    });
    return batch.commit();
  };

  return (
    <View style={styles.mainContainer}>
      <ChatHeader status={userStatus} name={Name} pic={pic} route={route} />
      {/* <SafeAreaView>
        <Image source={localimages.LANDING_BG} style={styles.backGroundImage} />
      </SafeAreaView> */}
      <GiftedChat
        isKeyboardInternallyHandled={true}
        infiniteScroll={true}
        onInputTextChanged={findtyping}
        renderActions={renderAction}
        renderSend={renderSend}
        renderBubble={renderBubble}
        timeTextStyle={timeText}
        wrapInSafeArea={Platform.OS == 'android'}
        messages={messages}
        alwaysShowSend={true}
        user={{
          _id: UserId,
        }}
        placeholder={'Message'}
        onSend={onSend}
        renderInputToolbar={renderComposer}
        isTyping={getTypingStatus}
      />
      <SafeAreaView>
        <View style={styles.footerView} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.darkTheme.BACKGROUND,
  },
  backGroundImage: {
    height: vw(screenHeight - 65),
    width: vw(screenWidth),
    position: 'absolute',
    zIndex: -2,
  },
  footerView: {
    height: vw(1),
  },
  sendIcon: {
    height: vw(35),
    width: vw(35),
  },
  messageInput: {
    backgroundColor: colors.TRANSPARENT,
    borderWidth: 1,
    color: colors.WHITE,
  },
  inputContainer: {
    marginHorizontal: normalize(10),
    borderRadius: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.INPUT_BACKGROUND,
    bottom: 0,
    borderTopWidth: 0,
  },
  iconContainer: {
    borderRadius: vw(20),
    height: vw(33),
    width: vw(33),
    marginTop: vw(-3),
    marginLeft: vw(-4),
    backgroundColor: colors.CAMERA_ICON,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    height: vw(18),
    width: vw(22),
    resizeMode: 'contain',
    marginTop: vw(-3),
  },
});
