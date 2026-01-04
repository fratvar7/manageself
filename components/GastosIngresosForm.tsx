import { useState } from 'react';
import { MoneygerScreenStyles as moneygerStyles } from '../css/Screens/MogeygerScreen.styles';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { FaceIcon, PlusIcon } from './Icons';
import { colors } from '../css/colors';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import CategoriesModal from './CategoriesModal';

const FACES = [1, 2, 3, 4, 5];

function GastosIngresosForm({ type = 'gasto' }) {
  const [amount, setAmount] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  const { loading: categoriesLoading, getCategoriesByType } = useCategories();
  const { createTransaction } = useTransactions();

  const categoriesList = getCategoriesByType(type === 'gasto' ? 'expense' : 'income');

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Por favor completa la cantidad y selecciona una categoría');
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        amount: parseFloat(amount),
        description,
        categoryId: selectedCategory,
        type: type === 'gasto' ? 'expense' : 'income',
        satisfaction: type === 'gasto' ? satisfaction : undefined,
        empresa: empresa || undefined,
      });

      // Limpiar formulario
      setAmount('');
      setEmpresa('');
      setSelectedCategory('');
      setDescription('');
      setSatisfaction(0);

      Alert.alert('Éxito', `${type === 'gasto' ? 'Gasto' : 'Ingreso'} registrado correctamente`);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la transacción');
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
    <View style={moneygerStyles.container}>
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
        <View style={moneygerStyles.categoriesContainer}>
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
        </View>

        <Text style={moneygerStyles.label}>Descripción</Text>
        <TextInput
          placeholder="Añade una nota (opcional)"
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
                  <FaceIcon level={n} size={26} active={satisfaction === n} color={colors.text.primary} />
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
        onClose={() => setShowCategoriesModal(false)}
        type={type === 'gasto' ? 'expense' : 'income'}
      />
    </View>
  );
}

export function GastosForm() {
  return <GastosIngresosForm type="gasto" />;
}

export function IngresosForm() {
  return <GastosIngresosForm type="ingreso" />;
}
