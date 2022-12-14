import {StyleSheet, Animated, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import firestore from '@react-native-firebase/firestore';
import localimages from '../../../utils/localimages';
import {colors} from '../../../utils/colors';
import {vw} from '../../../utils/dimensions';
import screenNames from '../../../utils/screenNames';
import {useDispatch, useSelector} from 'react-redux';

export function SplashScreen({navigation}: any) {
  const scale = useState(new Animated.Value(0))[0];
  const {Auth_Data} = useSelector((store: any) => store.authReducer);
  const dispatch = useDispatch()

  let style = {
    transform: [
      {
        scale: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
    opacity: scale.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    }),
  };

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if(Auth_Data?.uid){
    firestore()
      .collection('Users')
      .where('uid', '==', Auth_Data?.uid)
      .get()
      .then((res: any) => {
        let users = res?._docs?.map((item: any) => {
          return item._data;
        });
        console.log(users[0]);
        dispatch({type: 'Set_Data', payload: users[0]});
      }).catch(()=>{
        console.log('error')
      })}
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (Auth_Data?.uid) navigation.replace(screenNames.HOME_SCREEN);
      else navigation.replace(screenNames.LOGIN_SCREEN);
    }, 310);
  }, []);

  return (
    <View style={styles.maincontainer}>
      <Animated.Image
        source={localimages.LOGO}
        style={[styles.appLogo, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: colors.darkTheme.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogo: {
    height: vw(100),
    width: vw(100),
  },
  appname: {
    color: colors.WHITE,
    fontSize: vw(38),
    marginTop: vw(30),
  },
});
