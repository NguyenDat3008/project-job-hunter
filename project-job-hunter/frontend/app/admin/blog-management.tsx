import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import blogService, { Blog } from '@services/blogService';

export default function BlogManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');

  const fetchBlogs = async () => {
    try {
      const response = await blogService.getBlogs(1, 100);
      setBlogs(response.result);
    } catch (error) {
      console.error('Fetch blogs error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleOpenModal = (blog?: Blog) => {
    if (blog) {
      setIsEditing(true);
      setCurrentId(blog.id);
      setTitle(blog.title);
      setSummary(blog.summary);
      setImageUrl(blog.imageUrl);
      setExternalLink(blog.externalLink);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setTitle('');
      setSummary('');
      setImageUrl('');
      setExternalLink('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title || !externalLink) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và link bài báo.');
      return;
    }

    const data = { title, summary, imageUrl, externalLink };

    try {
      if (isEditing && currentId) {
        await blogService.updateBlog({ id: currentId, ...data });
        Alert.alert('Thành công', 'Đã cập nhật bài viết.');
      } else {
        await blogService.createBlog(data);
        Alert.alert('Thành công', 'Đã thêm bài viết mới.');
      }
      setModalVisible(false);
      fetchBlogs();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu bài viết.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài viết này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await blogService.deleteBlog(id);
              fetchBlogs();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bài viết.');
            }
          }
        }
      ]
    );
  };

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <View style={styles.blogItem}>
      <View style={styles.blogInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemLink} numberOfLines={1}>{item.externalLink}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => handleOpenModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Blog</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={blogs}
          renderItem={renderBlogItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có bài viết nào.</Text>
          }
        />
      )}

      {/* Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Sửa bài viết' : 'Thêm bài viết mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <Text style={styles.label}>Tiêu đề bài báo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tiêu đề..."
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.label}>Mô tả ngắn gọn</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập mô tả..."
                  value={summary}
                  onChangeText={setSummary}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Link ảnh Banner (URL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />

                {imageUrl ? (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Xem trước hình ảnh:</Text>
                    <Image 
                      source={{ 
                        uri: imageUrl,
                        headers: {
                          Referer: 'https://vnexpress.net/',
                          'User-Agent': 'Mozilla/5.0'
                        }
                      }} 
                      style={styles.previewImage} 
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                <Text style={styles.label}>Link bài báo gốc *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://news.com/article"
                  value={externalLink}
                  onChangeText={setExternalLink}
                />

                <TouchableOpacity 
                  style={styles.saveBtn} 
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>LƯU BÀI VIẾT</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'white',
    ...SHADOW.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { padding: 4 },
  list: { padding: 16 },
  blogItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  blogInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemLink: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    height: '80%',
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151' },
  input: { 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 15 
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { 
    backgroundColor: COLORS.primary, 
    height: 54, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
