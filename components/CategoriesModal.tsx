import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Modal, ScrollView, StyleSheet } from 'react-native';
import { useCategories } from '../hooks/useCategories';
import { colors } from '../css/colors';

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'expense' | 'income';
}

export default function CategoriesModal({ visible, onClose, type }: CategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

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
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de que quieres eliminar "${categoryName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>
            {type === 'expense' ? 'Categorías de Gastos' : 'Categorías de Ingresos'}
          </Text>
          <View style={styles.placeholder} />
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
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </Pressable>
                )}
              </View>
            ))}
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
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  defaultBadge: {
    fontSize: 12,
    color: colors.accent.mint,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addSection: {
    backgroundColor: colors.background.card,
    padding: 20,
    borderRadius: 8,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    padding: 12,
    color: colors.text.primary,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: colors.button.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
