import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from './src/api';
import { CompanyManager } from './screens/CompanyManager';
import { JobManager } from './screens/JobManager';

// --- INTERFACES ---
interface Company {
  id: number;
  name: string;
  address: string;
}

interface Job {
  id: number;
  name: string;
  salary: number;
  company?: Company;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'JOB'>('COMPANY');
  const [loading, setLoading] = useState(false);

  // COMPANY
  const [companies, setCompanies] = useState<Company[]>([]);
  const [compName, setCompName] = useState('');
  const [compAddress, setCompAddress] = useState('');

  // JOB
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobName, setJobName] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobCompanyId, setJobCompanyId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resC, resJ] = await Promise.all([
        api.get('/companies'),
        api.get('/jobs')
      ]);
      setCompanies(resC.data);
      setJobs(resJ.data);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối Backend!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => { /* code api.post... */ fetchData(); };
  const handleDeleteCompany = async (id: number) => { /* code api.delete... */ fetchData(); };
  const handleAddJob = async () => { /* code api.post... */ fetchData(); };
  const handleDeleteJob = async (id: number) => { /* code api.delete... */ fetchData(); };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Mini JobHunter</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'COMPANY' && styles.activeTab]}
              onPress={() => setActiveTab('COMPANY')}>
              <Text style={[styles.tabText, activeTab === 'COMPANY' && styles.activeTabText]}>🏢 Công Ty</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'JOB' && styles.activeTab]}
              onPress={() => setActiveTab('JOB')}>
              <Text style={[styles.tabText, activeTab === 'JOB' && styles.activeTabText]}>💼 Việc Làm</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {loading && <ActivityIndicator size="large" color="#4F46E5" style={{ margin: 10 }} />}

          {activeTab === 'COMPANY' ? (
            <CompanyManager 
              companies={companies}
              compName={compName} setCompName={setCompName}
              compAddress={compAddress} setCompAddress={setCompAddress}
              onAdd={handleAddCompany}
              onDelete={handleDeleteCompany}
            />
          ) : (
            <JobManager 
              jobs={jobs}
              jobName={jobName} setJobName={setJobName}
              jobSalary={jobSalary} setJobSalary={setJobSalary}
              jobCompanyId={jobCompanyId} setJobCompanyId={setJobCompanyId}
              onAdd={handleAddJob}
              onDelete={handleDeleteJob}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', paddingVertical: Platform.OS === 'web' ? 40 : 0 },
  container: { flex: 1,     backgroundColor: '#FFFFFF', 
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
});