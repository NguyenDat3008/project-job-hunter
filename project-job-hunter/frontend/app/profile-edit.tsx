// Profile Edit Screen
import { Button, TextField } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useAuth } from '@hooks/index';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { state, updateUser } = useAuth();
  
  const [name, setName] = useState(state.user?.name || '');
  const [phone, setPhone] = useState(state.user?.phone || '');
  const [address, setAddress] = useState(state.user?.address || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (!name) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (state.user) {
        updateUser({
          ...state.user,
          name,
          phone,
          address,
        });
      }
      setIsLoading(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <TextField
            label="Họ và tên"
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ và tên"
          />
          <TextField
            label="Email"
            value={state.user?.email || ''}
            onChangeText={() => {}}
            editable={false} // Email typically not editable
            placeholder="Email"
          />
          <TextField
            label="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          <TextField
            label="Địa chỉ"
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ của bạn"
          />
        </View>
        
        <View style={styles.actions}>
          <Button 
            title="Lưu thay đổi" 
            onPress={handleSave} 
            isLoading={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  form: { flex: 1 },
  actions: { paddingVertical: SPACING.lg },
});
