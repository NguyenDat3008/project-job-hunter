import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform} from 'react-native';

export const JobManager = ({ 
  jobs, jobName, setJobName, jobSalary, setJobSalary, jobCompanyId, setJobCompanyId, onAdd, onDelete 
}: any) => (
  <View style={{ flex: 1 }}>
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Đăng Việc Làm Mới</Text>
      <TextInput style={styles.input} placeholder="Tên việc" value={jobName} onChangeText={setJobName} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Lương" keyboardType="numeric" value={jobSalary} onChangeText={setJobSalary} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="ID Công ty" keyboardType="numeric" value={jobCompanyId} onChangeText={setJobCompanyId} />
      </View>
      <TouchableOpacity style={styles.btnPrimary} onPress={onAdd}>
        <Text style={styles.btnPrimaryText}>ĐĂNG VIỆC LÀM</Text>
      </TouchableOpacity>
    </View>

    <FlatList
      data={jobs}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.dataCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardPrice}>{item.salary?.toLocaleString()} VNĐ</Text>
            <Text style={styles.cardSub}>🏢 {item.company?.name || 'Không rõ'}</Text>
          </View>
          <TouchableOpacity style={styles.btnDanger} onPress={() => onDelete(item.id)}>
            <Text style={styles.btnDangerText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', paddingVertical: Platform.OS === 'web' ? 40 : 0 },
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    maxWidth: Platform.OS === 'web' ? 480 : '100%', 
    maxHeight: Platform.OS === 'web' ? 900 : '100%',
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E5E7EB' 
  },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  appTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  tabText: { fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  
  formCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 15 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  
  btnPrimary: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  dataCard: { backgroundColor: '#FFFFFF', padding: 16, marginBottom: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardPrice: { fontSize: 15, fontWeight: '600', color: '#10B981', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#6B7280' },
  
  btnDanger: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnDangerText: { color: '#EF4444', fontWeight: 'bold' }
 });