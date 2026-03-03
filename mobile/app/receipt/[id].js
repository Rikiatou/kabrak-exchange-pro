import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import api from '../../src/services/api';
import useSettingStore from '../../src/store/settingStore';
import { generateReceiptHTML } from '../../src/services/receiptService';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transaction and settings in parallel
      const [txRes] = await Promise.all([
        api.get(`/transactions/${id}`),
        fetchSettings(),
      ]);
      setTransaction(txRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading receipt:', err);
      setError(err.response?.data?.message || 'Impossible de charger le reçu');
      setLoading(false);
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de charger le reçu');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chargement...' }} />
        <ActivityIndicator size="large" color="#0B6E4F" />
        <Text style={styles.loadingText}>Chargement du reçu...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Erreur' }} />
        <Text style={styles.errorText}>{error || 'Reçu introuvable'}</Text>
      </View>
    );
  }

  const html = generateReceiptHTML(transaction, settings, 'fr');

  return (
    <View style={styles.fullContainer}>
      <Stack.Screen 
        options={{ 
          title: `Reçu ${transaction.reference}`,
          headerBackTitle: 'Retour'
        }} 
      />
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
