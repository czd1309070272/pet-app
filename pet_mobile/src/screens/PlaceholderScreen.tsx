import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ViewHeader } from '../components/shared/CommonUI';

export default function PlaceholderScreen({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.container}>
      <ViewHeader title={title} onBack={onBack} />
      <View style={styles.body}>
        <Text style={styles.text}>{title}（階段一占位）</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#666' },
});
