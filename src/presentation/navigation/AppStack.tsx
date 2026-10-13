import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TaskFormScreen from '../screens/TaskFormScreen';
import TaskListScreen from '../screens/TaskListScreen';

export type AppStackParamList = {
  Tasks: undefined;
  TaskForm: { taskId?: string | null } | undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tasks" component={TaskListScreen} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
    </Stack.Navigator>
  );
}
