import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassView } from '../../components/GlassView';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Analytics</Text>
      <GlassView style={styles.card} intensity={30}>
        <Text style={styles.text}>Completed Sessions: 0</Text>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
    backgroundColor: '#000',
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    padding: 24,
    borderRadius: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});
