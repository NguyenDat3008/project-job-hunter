import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TaxCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [salary, setSalary] = useState('');
  const [insuranceType, setInsuranceType] = useState('full'); // 'full' or 'other'
  const [otherInsurance, setOtherInsurance] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(1); // 1, 2, 3, 4
  const [dependents, setDependents] = useState(0);
  const [result, setResult] = useState<any>(null);

  const regions = [
    { id: 1, label: 'Vùng I', value: '5,310,000 đ/Tháng' },
    { id: 2, label: 'Vùng II', value: '4,730,000 đ/Tháng' },
    { id: 3, label: 'Vùng III', value: '4,140,000 đ/Tháng' },
    { id: 4, label: 'Vùng IV', value: '3,700,000 đ/Tháng' },
  ];

  const formatInput = (text: string, setter: (val: string) => void) => {
    const clean = text.replace(/\D/g, '');
    const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setter(formatted);
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + 'đ';
  };

  const handleCalculate = () => {
    const gross = parseInt(salary.replace(/,/g, '')) || 0;
    if (gross === 0) return;

    const insSalary = insuranceType === 'full' ? gross : (parseInt(otherInsurance.replace(/,/g, '')) || 0);
    const region = regions.find(r => r.id === selectedRegion);
    const regionMinSalary = parseInt(region?.value.replace(/\D/g, '') || '0');

    // 1. Bảo hiểm (Tỷ lệ đóng: 8% BHXH, 1.5% BHYT, 1% BHTN)
    const baseSalary = 2340000;
    const maxInsSalary = baseSalary * 20; // 46.8M
    const maxBhtnSalary = regionMinSalary * 20;

    const actualBhSalary = Math.min(insSalary, maxInsSalary);
    const actualBhtnSalary = Math.min(insSalary, maxBhtnSalary);

    const bhxh = actualBhSalary * 0.08;
    const bhyt = actualBhSalary * 0.015;
    const bhtn = actualBhtnSalary * 0.01;
    const totalInsurance = bhxh + bhyt + bhtn;

    // 2. Giảm trừ (Theo ảnh mẫu: 15.5M bản thân, 6.2M người phụ thuộc)
    const personalDeduction = 15500000;
    const dependentDeductionTotal = dependents * 6200000;
    const totalDeduction = personalDeduction + dependentDeductionTotal;

    // 3. Thu nhập tính thuế
    const incomeBeforeTax = gross - totalInsurance;
    const taxableIncome = Math.max(0, incomeBeforeTax - totalDeduction);

    // 4. Thuế TNCN lũy tiến 7 bậc
    let tax = 0;
    if (taxableIncome > 80000000) tax = taxableIncome * 0.35 - 9850000;
    else if (taxableIncome > 52000000) tax = taxableIncome * 0.30 - 5850000;
    else if (taxableIncome > 32000000) tax = taxableIncome * 0.25 - 3250000;
    else if (taxableIncome > 18000000) tax = taxableIncome * 0.20 - 1650000;
    else if (taxableIncome > 10000000) tax = taxableIncome * 0.15 - 750000;
    else if (taxableIncome > 5000000) tax = taxableIncome * 0.10 - 250000;
    else if (taxableIncome > 0) tax = taxableIncome * 0.05;

    const net = gross - totalInsurance - tax;

    setResult({
      gross,
      net,
      tax,
      totalInsurance,
      bhxh,
      bhyt,
      bhtn,
      personalDeduction,
      dependentDeductionTotal,
      taxableIncome,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Công cụ tính thuế TNCN</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.content}>
          
          {/* Thu nhập */}
          <Text style={styles.sectionLabel}>Thu nhập</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="VD: 10,000,000"
              keyboardType="numeric"
              value={salary}
              onChangeText={(t) => formatInput(t, setSalary)}
            />
            <Text style={styles.unit}>VNĐ</Text>
          </View>

          {/* Mức lương đóng bảo hiểm */}
          <Text style={styles.sectionLabel}>Mức lương đóng bảo hiểm</Text>
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setInsuranceType('full')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, insuranceType === 'full' && styles.radioActive]}>
              {insuranceType === 'full' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Đóng bảo hiểm theo toàn bộ lương</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setInsuranceType('other')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, insuranceType === 'other' && styles.radioActive]}>
              {insuranceType === 'other' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Mức khác</Text>
          </TouchableOpacity>

          <View style={[styles.inputContainer, { opacity: insuranceType === 'other' ? 1 : 0.4, backgroundColor: insuranceType === 'other' ? '#F3F4F6' : '#F9FAFB' }]}>
            <TextInput
              style={styles.input}
              placeholder="VD: 10,000,000"
              keyboardType="numeric"
              editable={insuranceType === 'other'}
              value={otherInsurance}
              onChangeText={(t) => formatInput(t, setOtherInsurance)}
            />
            <Text style={styles.unit}>VNĐ</Text>
          </View>
          <Text style={styles.infoText}>• Mức tối đa đóng BHXH, BHYT = 20 lần lương cơ sở</Text>
          <Text style={styles.infoText}>• Mức tối đa đóng BHTN = 20 lần lương tối thiểu vùng</Text>

          {/* Vùng */}
          <Text style={styles.sectionLabel}>Vùng <Text style={{ color: '#10B981', fontWeight: '400' }}>(Giải thích)</Text></Text>
          <View style={styles.regionGrid}>
            {regions.map((r) => (
              <TouchableOpacity 
                key={r.id} 
                style={[styles.regionItem, selectedRegion === r.id && styles.regionItemActive]}
                onPress={() => setSelectedRegion(r.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, selectedRegion === r.id && styles.radioActive]}>
                  {selectedRegion === r.id && <View style={styles.radioInner} />}
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.regionLabel, selectedRegion === r.id && styles.regionLabelActive]}>{r.label}</Text>
                  <Text style={styles.regionValue}>{r.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Người phụ thuộc */}
          <Text style={styles.sectionLabel}>Người phụ thuộc</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDependents(Math.max(0, dependents - 1))}>
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <View style={styles.stepInput}>
               <Text style={styles.stepText}>{dependents}</Text>
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setDependents(dependents + 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Logic Result Display (Mới bổ sung) */}
          {result && (
            <View style={styles.resultArea}>
              <Text style={styles.resultTitle}>Kết quả tính toán</Text>
              
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resLabel}>Lương Gross</Text>
                  <Text style={styles.resValuePrimary}>{formatMoney(result.gross)}</Text>
                </View>
                <View style={styles.resDivider} />
                
                <View style={styles.resultRow}>
                  <Text style={styles.resLabel}>Bảo hiểm xã hội</Text>
                  <Text style={styles.resValueMinus}>- {formatMoney(result.bhxh)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resLabel}>Bảo hiểm y tế</Text>
                  <Text style={styles.resValueMinus}>- {formatMoney(result.bhyt)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resLabel}>Bảo hiểm thất nghiệp</Text>
                  <Text style={styles.resValueMinus}>- {formatMoney(result.bhtn)}</Text>
                </View>
                
                <View style={styles.resDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resLabel}>Thuế thu nhập cá nhân</Text>
                  <Text style={styles.resValueMinus}>- {formatMoney(result.tax)}</Text>
                </View>
                
                <View style={styles.resDivider} />
                <View style={styles.resultRowNet}>
                  <Text style={styles.resLabelNet}>LƯƠNG NET</Text>
                  <Text style={styles.resValueNet}>{formatMoney(result.net)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#10B981" />
              <Text style={styles.infoBoxText}>Lương cơ sở: Áp dụng mức mới nhất có hiệu lực từ 01/07/2024.</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#10B981" />
              <Text style={styles.infoBoxText}>Lương tối thiểu vùng: Áp dụng mức mới nhất có hiệu lực từ ngày 01/01/2026.</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#10B981" />
              <Text style={styles.infoBoxText}>Mức giảm trừ gia cảnh: Đã cập nhật lên 15,5 triệu đồng cho người nộp thuế và 6,2 triệu đồng cho mỗi người phụ thuộc.</Text>
            </View>
          </View>

          {/* Static Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lương cơ sở</Text>
              <Text style={styles.summaryValue}>2,340,000đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm trừ bản thân</Text>
              <Text style={styles.summaryValue}>15,500,000đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Người phụ thuộc</Text>
              <Text style={styles.summaryValue}>6,200,000đ</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Bottom Button Fixed */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.mainBtn} activeOpacity={0.8} onPress={handleCalculate}>
          <Text style={styles.mainBtnText}>Tính thuế TNCN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    paddingHorizontal: 16, 
    height: 54, 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  unit: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#10B981' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' },
  radioText: { marginLeft: 12, fontSize: 15, color: '#374151', fontWeight: '500' },
  infoText: { fontSize: 12, color: '#9CA3AF', marginTop: 8, marginLeft: 4, lineHeight: 18 },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 },
  regionItem: { 
    width: '48.5%', 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  regionItemActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  regionLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  regionLabelActive: { color: '#065F46' },
  regionValue: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 24, color: '#374151', fontWeight: '300' },
  stepInput: { width: 70, height: 48, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  
  // Styles mới cho phần kết quả
  resultArea: { marginTop: 30 },
  resultTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 15 },
  resultCard: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#10B981' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  resultRowNet: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  resLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  resValuePrimary: { fontSize: 15, color: '#111827', fontWeight: '700' },
  resValueMinus: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
  resDivider: { height: 1, backgroundColor: '#D1FAE5', marginVertical: 8 },
  resLabelNet: { fontSize: 16, color: '#065F46', fontWeight: '800' },
  resValueNet: { fontSize: 20, color: '#059669', fontWeight: '900' },

  infoBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginTop: 30 },
  infoRow: { flexDirection: 'row', marginBottom: 16 },
  infoBoxText: { flex: 1, fontSize: 14, color: '#4B5563', marginLeft: 12, lineHeight: 20 },
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 18, marginTop: 16, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  summaryLabel: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  summaryValue: { fontSize: 15, color: '#059669', fontWeight: '800' },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'white', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5
  },
  mainBtn: { backgroundColor: '#10B981', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
