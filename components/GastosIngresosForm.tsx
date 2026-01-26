import { useEffect, useState } from 'react';
import { MoneygerScreenStyles as moneygerStyles } from '../css/Screens/MogeygerScreen.styles';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { FaceIcon, PlusIcon } from './Icons';
import { colors } from '../css/colors';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoriesModal from './CategoriesModal';
import { ConfirmModal } from './ConfirmModal';

const FACES = [1, 2, 3, 4, 5];

interface TransactionData {
  amount: number;
  description: string;
  categoryId: string;
  type: 'expense' | 'income';
  empresa?: string;
  satisfaction?: number;
}

function GastosIngresosForm({ type = 'gasto' }) {
  const [amount, setAmount] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const insets = useSafeAreaInsets();

  const { loading: categoriesLoading, getCategoriesByType, loadCategories } = useCategories();
  const { createTransaction } = useTransactions();

  const categoriesList = getCategoriesByType(type === 'gasto' ? 'expense' : 'income');

  useEffect(() => {
    if (!showCategoriesModal) {
      loadCategories();
    }
  }, [showCategoriesModal, loadCategories]);

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      setFeedback({ visible: true, title: 'Datos incompletos', message: 'Por favor completa la cantidad y selecciona una categoría', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const transactionData: TransactionData = {
        amount: parseFloat(amount),
        description,
        categoryId: selectedCategory,
        type: type === 'gasto' ? 'expense' : 'income',
      };

      if (empresa) {
        transactionData.empresa = empresa;
      }

      if (type === 'gasto' && satisfaction > 0) {
        transactionData.satisfaction = satisfaction;
      } else if (type === 'ingreso') {
        transactionData.satisfaction = 5;
      }

      await createTransaction(transactionData);

      setAmount('');
      setEmpresa('');
      setSelectedCategory('');
      setDescription('');
      setSatisfaction(0);

      setFeedback({ visible: true, title: 'Registro Éxito', message: `${type === 'gasto' ? 'Gasto' : 'Ingreso'} registrado correctamente`, type: 'success' });
    } catch {
      setFeedback({ visible: true, title: 'Error', message: 'No se pudo registrar la transacción', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return (
      <View style={moneygerStyles.container}>
        <View style={moneygerStyles.card}>
          <Text style={moneygerStyles.titlePrimary}>Cargando categorías...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[moneygerStyles.container, { paddingBottom: insets.bottom }]}>
      <View style={moneygerStyles.card}>
        <Text style={moneygerStyles.titlePrimary}>{type === 'gasto' ? 'Registrar Gasto' : 'Registrar Ingreso'}</Text>

        <Text style={moneygerStyles.label}>Cantidad</Text>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={colors.text.disabled}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={amount ? moneygerStyles.inputFilled : moneygerStyles.input}
        />

        <Text style={moneygerStyles.label}>Empresa o negocio</Text>
        <TextInput
          placeholder={type === 'gasto' ? 'Carrefour' : 'myself app'}
          placeholderTextColor={colors.text.disabled}
          value={empresa}
          onChangeText={setEmpresa}
          style={empresa ? moneygerStyles.inputFilled : moneygerStyles.input}
        />

        <Text style={moneygerStyles.label}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={localStyles.horizontalScroll}
          contentContainerStyle={localStyles.horizontalScrollContent}
        >
          {categoriesList.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[moneygerStyles.catButton, selectedCategory === cat.id && moneygerStyles.catButtonActive]}
            >
              <Text style={[moneygerStyles.catText, selectedCategory === cat.id && moneygerStyles.catTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[moneygerStyles.catButton, moneygerStyles.addButton]}
            onPress={() => setShowCategoriesModal(true)}
          >
            <PlusIcon />
          </Pressable>
        </ScrollView>

        <Text style={moneygerStyles.label}>Notas adicionales</Text>
        <TextInput
          placeholder="Detalles sobre el gasto/ingreso (opcional)"
          placeholderTextColor={colors.text.disabled}
          multiline
          value={description}
          onChangeText={setDescription}
          style={[description ? moneygerStyles.inputFilled : moneygerStyles.input, { height: 90 }]}
        />

        {type === 'gasto' && (
          <>
            <Text style={moneygerStyles.label}>Satisfacción</Text>
            <View style={moneygerStyles.satContainer}>
              {FACES.map(n => (
                <Pressable
                  key={n}
                  onPress={() => setSatisfaction(n)}
                  style={[moneygerStyles.faceButton, satisfaction === n && moneygerStyles.faceButtonActive]}
                >
                  <FaceIcon
                    level={n}
                    size={28}
                    active={satisfaction === n}
                    color={satisfaction === n ? colors.button.primary : colors.text.disabled}
                  />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          style={[moneygerStyles.saveButton, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={moneygerStyles.saveButtonText}>
            {loading ? 'Guardando...' : 'Añadir'}
          </Text>
        </Pressable>
      </View>

      <CategoriesModal
        visible={showCategoriesModal}
        onClose={() => {
          setShowCategoriesModal(false)
        }}
        type={type === 'gasto' ? 'expense' : 'income'}
      />

      <ConfirmModal
        visible={!!feedback}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        type={feedback?.type as any}
        onConfirm={() => setFeedback(null)}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  horizontalScroll: {
    marginBottom: 20,
    marginHorizontal: -4,
  },
  horizontalScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  }
});

export function GastosForm() {
  return <GastosIngresosForm type="gasto" />;
}

export function IngresosForm() {
  return <GastosIngresosForm type="ingreso" />;
}
