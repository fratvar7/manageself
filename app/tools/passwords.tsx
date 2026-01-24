import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';

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

export default function PasswordsScreen() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    Alert.alert(
      'Eliminar',
      '¿Estás seguro de que quieres eliminar esta contraseña?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await PasswordsService.deletePassword(id);
              reloadPasswords();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
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
        <View style={styles.cardHeader}>
          <View style={styles.companyTag}>
            <View style={styles.companyIconSmall}>
              <Text style={styles.companyIconTextSmall}>{item.company.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.companyTagText}>{item.company}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => toggleVisibility(item.id)}>
              {isVisible ? <EyeSlashIcon color={colors.text.primary} size={18} /> : <EyeIcon color={colors.text.primary} size={18} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
              <EditIcon color={colors.text.primary} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
              <TrashIcon color={colors.status.error} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.usernameRow}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Usuario</Text>
            <Text style={styles.fieldValue}>{item.username}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyUsername(item.username)}
          >
            <CopyIcon color={colors.text.secondary} size={16} />
          </TouchableOpacity>
        </View>

        {isVisible && (
          <View style={styles.passwordRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <Text style={styles.passwordText}>{displayPassword}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(item.encryptedPassword)}
            >
              <CopyIcon color={colors.text.secondary} size={16} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: PasswordEntry }) => {
    return <PasswordItem item={item} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon color={colors.text.secondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por empresa o usuario..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XIcon color={colors.text.secondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPasswords}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <LockIcon color={colors.text.secondary} size={48} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron contraseñas' : 'No hay contraseñas guardadas'}
              </Text>
            </View>
          ) : null
        }
      />

      {loading && <ActivityIndicator style={styles.loader} color={colors.button.primary} />}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <PlusIcon size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Contraseña' : 'Nueva Contraseña'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <XIcon color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Empresa / Servicio</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Gmail, Netflix..."
                placeholderTextColor={colors.text.secondary}
                value={company}
                onChangeText={setCompany}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario / Email</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@ejemplo.com"
                placeholderTextColor={colors.text.secondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.label}>Contraseña</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                  onPress={generateSecurePassword}
                >
                  <Text style={{ color: colors.button.primary, fontSize: 14, fontWeight: '600' }}>🎲 Generar</Text>
                </TouchableOpacity>
              </View>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="********"
                  placeholderTextColor={colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPasswordInput}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 12, top: 12 }}
                  onPress={() => setShowPasswordInput(!showPasswordInput)}
                >
                  {showPasswordInput ?
                    <EyeSlashIcon color={colors.text.secondary} size={20} /> :
                    <EyeIcon color={colors.text.secondary} size={20} />
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
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: colors.text.secondary,
    marginTop: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  companyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 6,
  },
  companyIconSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.button.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyIconTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  companyTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  userNamePrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  usernameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  copyButton: {
    padding: 6,
    marginLeft: 8,
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  passwordText: {
    fontFamily: 'monospace',
    color: colors.text.primary,
    fontSize: 13,
  },
  actionButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.button.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  saveButton: {
    backgroundColor: colors.button.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
