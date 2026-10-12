import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  message?: string;
}

export default function LoadingView({ message = 'Loading your tasks…' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#F6F7FB' },
  message: { color: '#73788D' },
});
