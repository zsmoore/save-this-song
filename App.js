import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Button, View } from 'react-native';
import { Audio } from 'expo-av';
import * as AuthSession from 'expo-auth-session';
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import FormData from 'form-data'

WebBrowser.maybeCompleteAuthSession();

const clientId = process.env.EXPO_PUBLIC_CLIENT_ID;
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function App() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      responseType: AuthSession.ResponseType.Token,
      clientId: `${clientId}`,
      scopes: ['user-library-modify'],
      usePKCE: false,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.zachary-moore.save-this-song'
      }),
    },
    discovery
  );

  const [accessToken, setAccessToken] = React.useState("");
  const [recording, setRecording] = React.useState();
  const [sound, setSound] = React.useState();

  async function startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(recording);
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = recording.getURI();
    console.log(uri);
    const { sound } = await Audio.Sound.createAsync({uri: uri});
    sound.loadAsync
    console.log(sound.uri);

    const uriParts = uri.split('.');

    const file = {
      uri,
      type: `audio/mp3`,
      name: 'any.mp3'
    }
    console.log(file);

    const formData = new FormData();
    formData.append('api_token', '315a2cd51078ac58b2f746a9d50eedf3');
    formData.append('file', file);
    formData.append('return', 'spotify');
    console.log(formData);

    const options = {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    };

    const resp = await fetch('https://api.audd.io/', options);
    const res = await resp.json()
    console.log(res);
    setSound(sound);
    // await sound.playAsync();
  }

  React.useEffect(() => {
    if (response?.type === 'success') {
      setAccessToken(response.params['access_token'])
    }
  }, [response]);

  React.useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);



  return (
    <View style={styles.container}>
      <Button title="Login to spotify" disabled={accessToken !== ""} onPress={promptAsync}/>
      <Button title={recording ? 'Stop Recording' : 'Start Recording'} disabled={accessToken === ""} onPress={recording ? stopRecording : startRecording} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
