import { StyleSheet, View } from 'react-native';
import { palette } from '../../core/theme/theme';
import Skeleton from './Skeleton';

interface Props {
  message?: string;
}

export default function LoadingView({ message: _message = 'Loading your tasks…' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Skeleton width="42%" height={14} radius={7} />
        <Skeleton width="28%" height={10} radius={5} />
      </View>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.taskCard}>
          <Skeleton width={25} height={25} radius={13} />
          <View style={styles.taskDetails}>
            <Skeleton width="78%" height={15} radius={7} />
            <Skeleton width="56%" height={11} radius={6} style={styles.description} />
            <Skeleton width="36%" height={10} radius={5} style={styles.date} />
          </View>
          <Skeleton width={58} height={24} radius={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 16, paddingTop: 10, gap: 10, backgroundColor: palette.mist },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 },
  taskCard: { flexDirection: 'row', alignItems: 'center', minHeight: 76, padding: 14, borderRadius: 16, backgroundColor: palette.white },
  taskDetails: { flex: 1, gap: 6, marginHorizontal: 12 },
  description: { marginTop: 1 },
  date: { marginTop: 2 },
});
