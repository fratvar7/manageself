import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../hooks/useCategories';
import { colors } from '../css/colors';
import { CategoriesModalStyles } from '../css/Components/CategoriesModal.styles';
import { TrashIcon } from './Icons';
import { ConfirmModal } from './ConfirmModal';

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'expense' | 'income';
}

export default function CategoriesModal({ visible, onClose, type }: CategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const insets = useSafeAreaInsets();

  const {
    getCategoriesByType,
    createCategory,
    deleteCategory
  } = useCategories();

  const categoriesList = getCategoriesByType(type);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    setLoading(true);
    try {
      await createCategory({
        name: newCategoryName.trim(),
        type: type,
        isDefault: false,
      });

      setNewCategoryName('');
      Alert.alert('Éxito', 'Categoría creada correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      // Removed the 'Éxito' alert to stay consistent with modern UI (item just disappears)
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la categoría');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >

      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(0, insets.top - 20) }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>
            {type === 'expense' ? 'Categorías de Gastos' : 'Categorías de Ingresos'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.addSection}>
          <Text style={styles.addTitle}>Añadir Nueva Categoría</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la categoría"
            placeholderTextColor={colors.text.disabled}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <Pressable
            style={[styles.addButton, loading && { opacity: 0.6 }]}
            onPress={handleAddCategory}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? 'Añadiendo...' : '+ Añadir Categoría'}
            </Text>
          </Pressable>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {type === 'expense' ? 'Gastos' : 'Ingresos'}
            </Text>
            {categoriesList.map(category => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.isDefault && (
                    <Text style={styles.defaultBadge}>Por defecto</Text>
                  )}
                </View>
                {!category.isDefault && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteCategory(category.id, category.name)}
                  >
                    <TrashIcon color={colors.status.error} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <ConfirmModal
        visible={!!categoryToDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setCategoryToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </Modal>
  );
}


const styles = CategoriesModalStyles;

