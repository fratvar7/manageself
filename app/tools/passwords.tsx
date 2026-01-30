import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordsService } from '../../services/passwordsService';
import { PasswordEntry } from '../../types';
import { encryptPassword, decryptPassword } from '../../utils/encryption';
import { colors } from '../../css/colors';
import {
  PlusIcon, TrashIcon, EditIcon, CopyIcon, EyeIcon, EyeSlashIcon, XIcon, LockIcon, SearchIcon
} from '../../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function PasswordsScreen() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordToDelete, setPasswordToDelete] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Visibility State (map of id -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<{[key: string]: boolean}>({});
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    const loadPasswords = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await PasswordsService.getPasswords(user.uid);
        setPasswords(data);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar las contraseñas');
      } finally {
        setLoading(false);
      }
    };
    loadPasswords();
  }, [user]);

  const reloadPasswords = async () => {
     if (!user) return;
     try {
       const data = await PasswordsService.getPasswords(user.uid);
       setPasswords(data);
     } catch {
       // Silent error or toast
     }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!company.trim() || !username.trim() || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const encrypted = await encryptPassword(password, user.uid);

      if (editingId) {
        await PasswordsService.updatePassword(editingId, {
          company: company.trim(),
          username: username.trim(),
          encryptedPassword: encrypted,
        });
        Alert.alert('Éxito', 'Contraseña actualizada');
      } else {
        await PasswordsService.addPassword(user.uid, {
          company: company.trim(),
          username: username.trim(),
          encryptedPassword: encrypted,
        });
        Alert.alert('Éxito', 'Contraseña guardada');
      }

      setModalVisible(false);
      resetForm();
      reloadPasswords();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar la contraseña';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setPasswordToDelete(id);
  };

  const confirmDeletePassword = async () => {
    if (!passwordToDelete) return;
    try {
      await PasswordsService.deletePassword(passwordToDelete);
      setPasswordToDelete(null);
      reloadPasswords();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar');
    }
  };

  const handleEdit = async (item: PasswordEntry) => {
    if (!user) return;
    setEditingId(item.id);
    setCompany(item.company);
    setUsername(item.username);
    // Decrypt password for editing
    const decrypted = await decryptPassword(item.encryptedPassword, user.uid);
    setPassword(decrypted);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCompany('');
    setUsername('');
    setPassword('');
    setShowPasswordInput(false);
  };

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = async (encryptedPassword: string) => {
    if (!user) return;
    const decrypted = await decryptPassword(encryptedPassword, user.uid);
    await Clipboard.setStringAsync(decrypted);
    Alert.alert('Copiado', 'Contraseña copiada al portapapeles');
  };

  const copyUsername = async (username: string) => {
    await Clipboard.setStringAsync(username);
    Alert.alert('Copiado', 'Usuario copiado al portapapeles');
  };

  const generateSecurePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';

    // Asegurar al menos un carácter de cada tipo
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    newPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    newPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    newPassword += numbers[Math.floor(Math.random() * numbers.length)];
    newPassword += symbols[Math.floor(Math.random() * symbols.length)];

    // Rellenar el resto
    for (let i = newPassword.length; i < length; i++) {
      newPassword += charset[Math.floor(Math.random() * charset.length)];
    }

    // Mezclar los caracteres
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');

    setPassword(newPassword);
    setShowPasswordInput(true); // Mostrar la contraseña generada
  };

  const filteredPasswords = passwords.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.company.toLowerCase().includes(query) ||
      item.username.toLowerCase().includes(query)
    );
  });

  const PasswordItem = ({ item }: { item: PasswordEntry }) => {
    const isVisible = visiblePasswords[item.id];
    const [displayPassword, setDisplayPassword] = useState('••••••••••••');

    useEffect(() => {
      const loadPassword = async () => {
        if (isVisible && user) {
          const decrypted = await decryptPassword(item.encryptedPassword, user.uid);
          setDisplayPassword(decrypted);
        } else {
          setDisplayPassword('••••••••••••');
        }
      };
      loadPassword();
    }, [isVisible, item.encryptedPassword]);

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.brandContainer}>
              <View style={styles.companyIconLarge}>
                <Text style={styles.companyIconTextLarge}>{item.company.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.companyNameText}>{item.company}</Text>
                <Text style={styles.usernameSubtext}>{item.username}</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButtonCircle} onPress={() => toggleVisibility(item.id)}>
                {isVisible ? <EyeSlashIcon color={colors.accent.primary} size={20} /> : <EyeIcon color={colors.text.secondary} size={20} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonCircle} onPress={() => handleEdit(item)}>
                <EditIcon color={colors.text.secondary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonCircle} onPress={() => handleDelete(item.id)}>
                <TrashIcon color={colors.status.error} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dataSection}>
            <View style={styles.dynamicField}>
              <View style={styles.fieldContent}>
                <LockIcon color={colors.text.tertiary} size={14} />
                <Text style={[styles.passwordDisplay, isVisible && styles.passwordVisible]}>
                  {displayPassword}
                </Text>
              </View>
              <View style={styles.interactionButtons}>
                <TouchableOpacity
                  style={styles.miniCopyButton}
                  onPress={() => copyUsername(item.username)}
                >
                  <Text style={styles.miniCopyLabel}>USUARIO</Text>
                  <CopyIcon color={colors.accent.primary} size={14} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniCopyButton, { borderLeftWidth: 1, borderLeftColor: colors.border.light }]}
                  onPress={() => copyToClipboard(item.encryptedPassword)}
                >
                  <Text style={styles.miniCopyLabel}>PASSWORD</Text>
                  <CopyIcon color={colors.accent.primary} size={14} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: PasswordEntry }) => {
    return <PasswordItem item={item} />;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Contraseñas guardadas</Text>
        <Text style={styles.headerSubtitle}>Gestión segura y encriptada</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon color={colors.text.tertiary} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por servicio..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XIcon color={colors.text.tertiary} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPasswords}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LockIcon color={colors.border.default} size={64} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'Bóveda vacía'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Prueba con otros términos de búsqueda' : 'Comienza añadiendo tu primera contraseña segura'}
              </Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.button.primary} />
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <PlusIcon size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editingId ? 'Editar registro' : 'Nuevo registro'}</Text>
              <Text style={styles.modalSubtitle}>Los datos se encriptan localmente</Text>
            </View>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <XIcon color={colors.text.primary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Servicio / Empresa</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Instagram, Amazon..."
                  placeholderTextColor={colors.text.tertiary}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario o Correo</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="nombre@ejemplo.com"
                  placeholderTextColor={colors.text.tertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateSecurePassword}
                >
                  <Text style={styles.generateButtonText}>RANDOM 🎲</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Tu contraseña secreta"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPasswordInput}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPasswordInput(!showPasswordInput)}
                >
                  {showPasswordInput ?
                    <EyeSlashIcon color={colors.accent.primary} size={22} /> :
                    <EyeIcon color={colors.text.tertiary} size={22} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>{editingId ? 'Actualizar Bóveda' : 'Guardar en Bóveda'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!passwordToDelete}
        title="¿Eliminar contraseña?"
        message="Esta acción no se puede deshacer. Los datos encriptados se borrarán permanentemente."
        onConfirm={confirmDeletePassword}
        onCancel={() => setPasswordToDelete(null)}
        confirmText="Confirmar eliminación"
        isDestructive={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  companyIconLarge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
  },
  companyIconTextLarge: {
    color: colors.accent.primary,
    fontWeight: '800',
    fontSize: 20,
  },
  brandTextContainer: {
    flex: 1,
  },
  companyNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  usernameSubtext: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dataSection: {
    marginTop: 4,
  },
  dynamicField: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: colors.background.secondary + '50',
  },
  passwordDisplay: {
    fontSize: 15,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  passwordVisible: {
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0,
  },
  interactionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  miniCopyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  miniCopyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent.primary,
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.button.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  closeModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  passwordInputWrapper: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  generateButton: {
    backgroundColor: colors.accent.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.primary + '30',
  },
  generateButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent.primary,
  },
  saveButton: {
    backgroundColor: colors.button.primary,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
