// Navigation types
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// App Stack (Authenticated)
export type AppStackParamList = {
  MainTabs: undefined;
  JobDetail: { jobId: string };
  CVBuilder: undefined;
  CVDetail: { cvId: string };
};

// Tab Stack
export type TabParamList = {
  HomeTab: undefined;
  SavedJobsTab: undefined;
  CVTab: undefined;
  ProfileTab: undefined;
};

// Root Stack
export type RootStackParamList = AppStackParamList & AuthStackParamList;

// Screen props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeTab'>,
  NativeStackScreenProps<AppStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ProfileTab'>,
  NativeStackScreenProps<AppStackParamList>
>;

export default {};