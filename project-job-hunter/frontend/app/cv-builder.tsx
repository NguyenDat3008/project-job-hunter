// CV Builder Screen — Create and manage CV for candidates
import { Button, LoadingSpinner, TextField } from '@components/index';
import { COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useAuth } from '@hooks/index';
import { cvService } from '@services/cvService';
import { CV, CVSection, CVTemplate, SectionItem } from '@/types/cv.types';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

type Step = 'template' | 'personal' | 'sections' | 'preview';

const SECTION_TYPES = [
  { type: 'EXPERIENCE', label: 'Kinh nghiệm làm việc' },
  { type: 'EDUCATION', label: 'Học vấn' },
  { type: 'SKILL', label: 'Kỹ năng' },
  { type: 'CERTIFICATION', label: 'Chứng chỉ' },
  { type: 'PROJECT', label: 'Dự án' },
  { type: 'LANGUAGE', label: 'Ngoại ngữ' },
] as const;

export default function CVBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const user = state.user;

  const [step, setStep] = useState<Step>('template');
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingCVs, setExistingCVs] = useState<CV[]>([]);

  // CV Data
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1a56db');
  const [title, setTitle] = useState('CV của tôi');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [summary, setSummary] = useState('');
  const [avatar, setAvatar] = useState<string>(''); // Avatar URI
  const [sections, setSections] = useState<CVSection[]>([
    { id: 'sect-default-exp', type: 'EXPERIENCE', title: 'Kinh nghiệm làm việc', items: [], order: 0 },
    { id: 'sect-default-proj', type: 'PROJECT', title: 'Dự án', items: [], order: 1 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tpls, cvs] = await Promise.all([
        cvService.getTemplates() as Promise<CVTemplate[]>,
        cvService.getCVs() as Promise<{ result: CV[] }>,
      ]);
      setTemplates(tpls);
      setExistingCVs(cvs.result);
      if (tpls.length > 0) {
        setSelectedTemplate(tpls[0].id);
        setSelectedColor(tpls[0].colors[0]);
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = (type: string) => {
    const config = SECTION_TYPES.find(s => s.type === type);
    if (!config) return;
    const newSection: CVSection = {
      id: `sect-${Date.now()}`,
      type: type as CVSection['type'],
      title: config.label,
      items: [],
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const addItemToSection = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      const newItem: SectionItem = {
        id: `item-${Date.now()}`,
        title: '',
        subtitle: '',
        description: '',
        startDate: '',
        endDate: '',
        order: s.items.length,
      };
      return { ...s, items: [...s.items, newItem] };
    }));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: string, value: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
    }));
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleSave = async () => {
    if (!fullName || !email) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và email');
      return;
    }
    setSaving(true);
    try {
      // 1. Phân loại sections cho 2 cột
      const leftColTypes = ['SKILL', 'LANGUAGE', 'CERTIFICATION'];
      const leftSections = sections.filter(s => leftColTypes.includes(s.type));
      const rightSections = sections.filter(s => !leftColTypes.includes(s.type));

      const generateSectionHtml = (sec: CVSection, isLeft: boolean) => `
        <div style="margin-bottom: 20px;">
          <h3 style="color: ${isLeft ? '#ffffff' : selectedColor}; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; border-bottom: 2px solid ${isLeft ? 'rgba(255,255,255,0.3)' : selectedColor}; padding-bottom: 4px; margin-bottom: 10px;">${sec.title}</h3>
          ${sec.items.map(item => `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 700; font-size: 13px; color: ${isLeft ? '#ffffff' : '#333'};">${item.title || ''}</div>
              ${item.subtitle ? `<div style="font-style: italic; font-size: 12px; color: ${isLeft ? '#e0e0e0' : '#555'}; margin-top: 2px;">${item.subtitle}</div>` : ''}
              ${(item.startDate || item.endDate) ? `<div style="font-size: 11px; color: ${isLeft ? '#d0d0d0' : '#888'}; margin-top: 2px;">📅 ${item.startDate || ''} — ${item.endDate || 'Hiện tại'}</div>` : ''}
              ${item.description ? `<p style="margin-top: 4px; font-size: 11.5px; line-height: 1.5; color: ${isLeft ? '#f0f0f0' : '#444'};">${item.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap');
              @page { size: A4; margin: 0; }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              body { font-family: 'Merriweather', 'Times New Roman', serif; color: #333; }
              
              .cv-wrapper { display: flex; width: 100%; min-height: 297mm; /* Ensure it spans full A4 height */ }
              .sidebar { width: 35%; background-color: ${selectedColor}; color: #fff; padding: 40px 30px; display: flex; flex-direction: column; }
              .main { width: 65%; padding: 40px 40px; background-color: #fff; display: flex; flex-direction: column; }
              
              /* Avatar */
              .avatar-container { text-align: center; margin-bottom: 30px; }
              .avatar-img { width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.3); }
              .avatar-placeholder { width: 130px; height: 130px; border-radius: 50%; border: 2px dashed rgba(255,255,255,0.5); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: rgba(255,255,255,0.7); }
              
              /* Thông tin cá nhân (Sidebar) */
              .contact-box { margin-bottom: 30px; }
              .contact-item { margin-bottom: 10px; font-size: 12px; line-height: 1.5; display: flex; align-items: flex-start; }
              .contact-icon { margin-right: 8px; font-size: 13px; }
              
              /* Tên và Summary (Main) */
              .name { font-size: 26px; font-weight: 700; color: ${selectedColor}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
              .job-title { font-size: 14px; color: #666; margin-bottom: 24px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; }
              
              .summary { margin-bottom: 30px; font-size: 12px; line-height: 1.6; color: #444; }
              .summary-title { font-size: 13px; font-weight: 700; color: ${selectedColor}; text-transform: uppercase; border-bottom: 2px solid ${selectedColor}; padding-bottom: 4px; margin-bottom: 10px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="cv-wrapper">
              <div class="sidebar">
                <div class="avatar-container">
                  ${avatar ? `<img class="avatar-img" src="${avatar}" />` : `<div class="avatar-placeholder">Ảnh đại diện</div>`}
                </div>
                
                <div class="contact-box">
                  <h3 style="text-transform: uppercase; font-size: 13px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 4px; margin-bottom: 12px;">Thông tin liên hệ</h3>
                  ${phone ? `<div class="contact-item"><span class="contact-icon">📞</span><span>${phone}</span></div>` : ''}
                  ${email ? `<div class="contact-item"><span class="contact-icon">✉️</span><span>${email}</span></div>` : ''}
                  ${address ? `<div class="contact-item"><span class="contact-icon">📍</span><span>${address}</span></div>` : ''}
                </div>
                
                ${leftSections.map(sec => generateSectionHtml(sec, true)).join('')}
              </div>
              
              <div class="main">
                <div class="name">${fullName}</div>
                <div class="job-title">${title}</div>
                
                ${summary ? `
                  <div class="summary">
                    <div class="summary-title">Mục tiêu nghề nghiệp</div>
                    <p>${summary}</p>
                  </div>
                ` : ''}
                
                ${rightSections.map(sec => generateSectionHtml(sec, false)).join('')}
              </div>
            </div>
          </body>
        </html>
      `;

      // 2. Print HTML to PDF using expo-print
      if (Platform.OS === 'web') {
        // Trên web, printToFileAsync không hỗ trợ xuất HTML ngầm định, 
        // nó sẽ gọi window.print() và in toàn bộ màn hình App.
        // Thay vào đó, dùng printAsync để in đúng nội dung HTML của CV.
        await Print.printAsync({ html: htmlContent });
        Alert.alert('Thành công', 'Đã tạo CV thành công! (Trên nền tảng Web, chức năng tự động lưu lên server MinIO được bỏ qua, bạn có thể lưu file PDF về máy qua hộp thoại in của trình duyệt).', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // Trên Mobile (Android/iOS)
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // 3. Upload the generated PDF to backend MinIO
      const fileToUpload = {
        uri,
        name: `${fullName.replace(/\s+/g, '_')}_CV.pdf`,
        type: 'application/pdf',
      };
      const fileNameOnServer = await cvService.uploadCV(fileToUpload);

      // Optionally share the file locally so the user can see the actual A4 PDF
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

      Alert.alert('Thành công', 'Đã tạo và lưu trữ CV trên hệ thống (MinIO)!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('CV Generation Error:', error);
      Alert.alert('Lỗi', 'Không thể tạo và lưu CV. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const getStepIndex = () => ['template', 'personal', 'sections', 'preview'].indexOf(step);
  const canGoNext = () => {
    if (step === 'template') return !!selectedTemplate;
    if (step === 'personal') return !!fullName && !!email;
    return true;
  };

  const goNext = () => {
    const steps: Step[] = ['template', 'personal', 'sections', 'preview'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const goBack = () => {
    const steps: Step[] = ['template', 'personal', 'sections', 'preview'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  if (loading) return <LoadingSpinner fullScreen message="Đang tải..." />;

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {['Mẫu CV', 'Thông tin', 'Nội dung', 'Xem trước'].map((label, idx) => (
          <View key={idx} style={styles.progressStep}>
            <View style={[styles.progressDot, idx <= getStepIndex() && styles.progressDotActive]}>
              <Text style={[styles.progressDotText, idx <= getStepIndex() && styles.progressDotTextActive]}>
                {idx < getStepIndex() ? '✓' : idx + 1}
              </Text>
            </View>
            <Text style={[styles.progressLabel, idx <= getStepIndex() && styles.progressLabelActive]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Template Selection */}
        {step === 'template' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Chọn mẫu CV</Text>
            <Text style={styles.stepSubtitle}>Chọn một mẫu thiết kế phù hợp với bạn</Text>

            {/* Existing CVs */}
            {existingCVs.length > 0 && (
              <View style={styles.existingSection}>
                <Text style={styles.existingLabel}>CV đã tạo ({existingCVs.length})</Text>
                {existingCVs.map(cv => (
                  <View key={cv.id} style={styles.existingCard}>
                    <View style={[styles.existingColor, { backgroundColor: cv.color }]} />
                    <View style={styles.existingInfo}>
                      <Text style={styles.existingTitle}>{cv.title}</Text>
                      <Text style={styles.existingDate}>
                        Tạo ngày {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Templates Grid */}
            <View style={styles.templateGrid}>
              {templates.map(tpl => (
                <TouchableOpacity
                  key={tpl.id}
                  style={[styles.templateCard, selectedTemplate === tpl.id && styles.templateCardSelected]}
                  onPress={() => {
                    setSelectedTemplate(tpl.id);
                    setSelectedColor(tpl.colors[0]);
                    goNext(); // Auto-advance to the next step
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.templatePreview, { backgroundColor: tpl.colors[0] + '20' }]}>
                    <View style={[styles.templateLine, { backgroundColor: tpl.colors[0] }]} />
                    <View style={[styles.templateLine, styles.templateLineShort, { backgroundColor: tpl.colors[0] + '60' }]} />
                    <View style={[styles.templateLine, { backgroundColor: tpl.colors[0] + '40' }]} />
                    <View style={[styles.templateLine, styles.templateLineShort, { backgroundColor: tpl.colors[0] + '30' }]} />
                  </View>
                  <Text style={styles.templateName}>{tpl.name}</Text>
                  <Text style={styles.templateDesc}>{tpl.description}</Text>
                  {/* Color Options */}
                  <View style={styles.colorRow}>
                    {tpl.colors.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                        onPress={() => setSelectedColor(color)}
                      />
                    ))}
                  </View>
                  {selectedTemplate === tpl.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Personal Info */}
        {step === 'personal' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Thông tin cá nhân</Text>
            <Text style={styles.stepSubtitle}>Điền thông tin cơ bản của bạn</Text>

            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarPicker} onPress={async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    setAvatar(result.assets[0].uri);
                  }
                } catch (e) {
                  console.warn(e);
                }
              }}>
                {avatar ? (
                  <Text style={{ fontSize: 12, color: COLORS.primary }}>Đã chọn ảnh (Bấm để đổi)</Text>
                ) : (
                  <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>+ Chọn Ảnh đại diện</Text>
                )}
              </TouchableOpacity>
            </View>

            <TextField label="Tiêu đề CV" placeholder="Vd: CV Senior Developer" value={title} onChangeText={setTitle} />
            <TextField label="Họ và tên *" placeholder="Nhập họ tên đầy đủ" value={fullName} onChangeText={setFullName} />
            <TextField label="Email *" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextField label="Số điện thoại" placeholder="0xxx xxx xxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField label="Địa chỉ" placeholder="Thành phố, Quận/Huyện" value={address} onChangeText={setAddress} />
            <TextField label="Giới thiệu bản thân" placeholder="Mô tả ngắn gọn về bạn, mục tiêu nghề nghiệp..." value={summary} onChangeText={setSummary} multiline numberOfLines={4} />
          </View>
        )}

        {/* Step 3: CV Sections */}
        {step === 'sections' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Nội dung CV</Text>
            <Text style={styles.stepSubtitle}>Thêm các phần nội dung cho CV của bạn</Text>

            {/* Add Section Buttons */}
            <View style={styles.addSectionRow}>
              {SECTION_TYPES.map(st => {
                const alreadyAdded = sections.some(s => s.type === st.type);
                return (
                  <TouchableOpacity
                    key={st.type}
                    style={[styles.addSectionChip, alreadyAdded && styles.addSectionChipDisabled]}
                    onPress={() => !alreadyAdded && addSection(st.type)}
                    disabled={alreadyAdded}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addSectionText, alreadyAdded && styles.addSectionTextDisabled]}>
                      {alreadyAdded ? '✓ ' : '+ '}{st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section Editors */}
            {sections.map(section => (
              <View key={section.id} style={styles.sectionEditor}>
                <View style={styles.sectionEditorHeader}>
                  <Text style={styles.sectionEditorTitle}>{section.title}</Text>
                  <TouchableOpacity onPress={() => removeSection(section.id)}>
                    <Text style={styles.removeBtn}>Xóa</Text>
                  </TouchableOpacity>
                </View>

                {section.items.map((item, itemIdx) => (
                  <View key={item.id} style={styles.itemEditor}>
                    <Text style={styles.itemLabel}>Mục {itemIdx + 1}</Text>
                    <TextField
                      label={section.type === 'EDUCATION' ? 'Trường / Cơ sở đào tạo' : 'Công ty / Tổ chức'}
                      placeholder="Nhập tên..."
                      value={item.title}
                      onChangeText={(v) => updateSectionItem(section.id, item.id, 'title', v)}
                    />
                    <TextField
                      label={section.type === 'EDUCATION' ? 'Ngành học / Bằng cấp' : 'Vị trí / Chức vụ'}
                      placeholder="Nhập..."
                      value={item.subtitle || ''}
                      onChangeText={(v) => updateSectionItem(section.id, item.id, 'subtitle', v)}
                    />
                    <TextField
                      label="Mô tả chi tiết"
                      placeholder="Mô tả công việc, thành tích..."
                      value={item.description || ''}
                      onChangeText={(v) => updateSectionItem(section.id, item.id, 'description', v)}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.dateRow}>
                      <View style={{ flex: 1, marginRight: SPACING.sm }}>
                        <TextField label="Từ" placeholder="01/2023" value={item.startDate || ''} onChangeText={(v) => updateSectionItem(section.id, item.id, 'startDate', v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextField label="Đến" placeholder="Hiện tại" value={item.endDate || ''} onChangeText={(v) => updateSectionItem(section.id, item.id, 'endDate', v)} />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.addItemBtn} onPress={() => addItemToSection(section.id)}>
                  <Text style={styles.addItemText}>+ Thêm mục</Text>
                </TouchableOpacity>
              </View>
            ))}

            {sections.length === 0 && (
              <View style={styles.emptySections}>
                <Text style={styles.emptySectionsText}>
                  Chọn các phần ở trên để thêm vào CV
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Xem trước CV</Text>
            <Text style={styles.stepSubtitle}>Kiểm tra lại thông tin trước khi lưu</Text>

            <View style={styles.previewContainer}>
              <View style={[styles.previewSidebar, { backgroundColor: selectedColor }]}>
                {/* Avatar */}
                <View style={[styles.previewAvatarBox, { borderColor: avatar ? 'transparent' : 'rgba(255,255,255,0.3)' }]}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                      Ảnh trống
                    </Text>
                  )}
                </View>

                {/* Sidebar Info */}
                <Text style={styles.previewSectionTitleLight}>LIÊN HỆ</Text>
                <Text style={styles.previewContactLight}>📞 {phone}</Text>
                <Text style={styles.previewContactLight}>✉️ {email}</Text>
                {address ? <Text style={styles.previewContactLight}>📍 {address}</Text> : null}

                {/* Sidebar Sections */}
                {sections.filter(s => ['SKILL', 'LANGUAGE', 'CERTIFICATION'].includes(s.type)).map(section => (
                  <View key={section.id} style={styles.previewSection}>
                    <Text style={styles.previewSectionTitleLight}>{section.title}</Text>
                    {section.items.map(item => (
                      <View key={item.id} style={styles.previewItem}>
                        {item.title ? <Text style={styles.previewItemTitleLight}>{item.title}</Text> : null}
                        {item.description ? <Text style={styles.previewTextLight}>{item.description}</Text> : null}
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={styles.previewMain}>
                <Text style={[styles.previewName, { color: selectedColor }]}>{fullName}</Text>
                <Text style={styles.previewJobTitle}>{title}</Text>

                {summary ? (
                  <View style={styles.previewSection}>
                    <Text style={[styles.previewSectionTitle, { color: selectedColor }]}>MỤC TIÊU NGHỀ NGHIỆP</Text>
                    <Text style={styles.previewText}>{summary}</Text>
                  </View>
                ) : null}

                {sections.filter(s => !['SKILL', 'LANGUAGE', 'CERTIFICATION'].includes(s.type)).map(section => (
                  <View key={section.id} style={styles.previewSection}>
                    <Text style={[styles.previewSectionTitle, { color: selectedColor }]}>{section.title}</Text>
                    {section.items.map(item => (
                      <View key={item.id} style={styles.previewItem}>
                        {item.title ? <Text style={styles.previewItemTitle}>{item.title}</Text> : null}
                        {item.subtitle ? <Text style={styles.previewItemSubtitle}>{item.subtitle}</Text> : null}
                        {(item.startDate || item.endDate) ? (
                          <Text style={styles.previewItemDate}>{item.startDate} — {item.endDate || 'Hiện tại'}</Text>
                        ) : null}
                        {item.description ? <Text style={styles.previewText}>{item.description}</Text> : null}
                      </View>
                    ))}
                    {section.items.length === 0 && (
                      <Text style={styles.previewEmpty}>(Chưa có nội dung)</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {step !== 'template' && (
          <Button title="Quay lại" variant="outline" onPress={goBack} style={{ flex: 1, marginRight: SPACING.sm }} />
        )}
        {step === 'preview' ? (
          <Button title="Xuất PDF & Lưu" onPress={handleSave} isLoading={saving} style={{ flex: 2 }} />
        ) : (
          <Button title="Tiếp theo" onPress={goNext} disabled={!canGoNext()} style={{ flex: step === 'template' ? 1 : 2 }} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  progressBar: {
    flexDirection: 'row', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: { backgroundColor: COLORS.primary },
  progressDotText: { fontSize: 9, fontWeight: '800', color: COLORS.text.light },
  progressDotTextActive: { color: COLORS.white },
  progressLabel: { fontSize: 9, color: COLORS.text.light, fontWeight: '600' },
  progressLabelActive: { color: COLORS.primary, fontWeight: '800' },
  content: { flex: 1 },
  stepContent: { padding: 28 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  stepSubtitle: { fontSize: 11, color: COLORS.text.secondary, marginBottom: 20 },
  
  existingSection: { marginBottom: 20 },
  existingLabel: { fontSize: 10, fontWeight: '800', color: COLORS.text.primary, marginBottom: 10, textTransform: 'uppercase' },
  existingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: '#F0F0F0',
  },
  existingColor: { width: 32, height: 32, borderRadius: 6, marginRight: 12 },
  existingInfo: { flex: 1 },
  existingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },
  existingDate: { fontSize: 10, color: COLORS.text.light },
  
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 14,
    padding: 10, borderWidth: 1.5, borderColor: '#F3F4F6',
    position: 'relative',
  },
  templateCardSelected: { borderColor: COLORS.primary },
  templatePreview: {
    height: 70, borderRadius: 8, marginBottom: 8,
    padding: 8, justifyContent: 'space-around',
  },
  templateLine: { height: 3, borderRadius: 2, width: '100%' },
  templateLineShort: { width: '60%' },
  templateName: { fontSize: 12, fontWeight: '800', color: COLORS.text.primary, marginBottom: 2 },
  templateDesc: { fontSize: 10, color: COLORS.text.secondary, marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 4 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorDotSelected: { borderWidth: 2, borderColor: COLORS.white, elevation: 2 },
  selectedBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  selectedBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  
  addSectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  addSectionChip: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.primary + '30',
  },
  addSectionChipDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  addSectionText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  addSectionTextDisabled: { color: COLORS.text.light },
  
  sectionEditor: {
    backgroundColor: '#F9FAFB', borderRadius: 14,
    padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#F0F0F0',
  },
  sectionEditorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionEditorTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text.primary },
  removeBtn: { fontSize: 11, color: COLORS.error, fontWeight: '700' },
  itemEditor: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 0.5, borderColor: '#F5F5F5',
  },
  itemLabel: { fontSize: 9, fontWeight: '800', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase' },
  dateRow: { flexDirection: 'row' },
  addItemBtn: {
    borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 4,
  },
  addItemText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  emptySections: { alignItems: 'center', paddingVertical: 40 },
  emptySectionsText: { fontSize: 12, color: COLORS.text.light, fontWeight: '500' },
  
  previewContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
    ...SHADOW.md,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    minHeight: 400,
  },
  previewSidebar: {
    width: '35%',
    padding: 12,
  },
  previewMain: {
    width: '65%',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  previewName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  previewJobTitle: { fontSize: 11, color: COLORS.text.secondary, fontWeight: '600', marginBottom: 16, textTransform: 'uppercase' },
  
  previewAvatarBox: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 10 },
  previewSectionTitleLight: { fontSize: 9, fontWeight: '800', color: COLORS.white, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)', paddingBottom: 4, marginBottom: 8, marginTop: 12 },
  previewContactLight: { fontSize: 8, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  previewItemTitleLight: { fontSize: 9, fontWeight: '700', color: COLORS.white },
  previewTextLight: { fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: 2, lineHeight: 12 },
  
  previewSectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0', paddingBottom: 4, marginBottom: 8 },
  previewText: { fontSize: 9, color: COLORS.text.secondary, lineHeight: 13 },
  previewSection: { marginTop: 8 },
  previewItem: { marginBottom: 10 },
  previewItemTitle: { fontSize: 11, fontWeight: '700', color: COLORS.text.primary },
  previewItemSubtitle: { fontSize: 10, color: COLORS.text.secondary, fontStyle: 'italic', marginTop: 1 },
  previewItemDate: { fontSize: 8, color: COLORS.text.light, marginTop: 2 },
  previewEmpty: { fontSize: 9, color: COLORS.text.light, fontStyle: 'italic' },
  
  avatarSection: { marginBottom: 16 },
  avatarPicker: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7', borderStyle: 'dashed', alignItems: 'center' },
  
  bottomNav: {
    flexDirection: 'row', padding: 20, paddingHorizontal: 28,
    backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16, gap: 12,
  },
});
