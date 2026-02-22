import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  BackHandler
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const GREEN_DARK = '#071a12';
const GREEN_MAIN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

export default function WebViewScreen() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { url } = useLocalSearchParams();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleWebViewMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'payment_success') {
      Alert.alert(
        'Paiement réussi !',
        'Votre licence KABRAK Exchange est activée',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/license')
          }
        ]
      );
    } else if (data.type === 'payment_cancelled') {
      Alert.alert('Paiement annulé', 'Vous pouvez réessayer le paiement');
      router.back();
    }
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={GOLD} />
      <Text style={styles.loadingText}>Chargement du paiement...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement sécurisé</Text>
        <View style={{ width: 24 }} />
      </View>

      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={renderLoading}
        scalesPageToFit={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: GREEN_DARK,
    zIndex: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: WHITE },
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GREEN_DARK,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: WHITE,
    fontWeight: '500'
  }
});
