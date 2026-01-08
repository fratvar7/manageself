import { Pressable, ScrollView, Text, View } from 'react-native';
import { useState, useEffect } from 'react';
import { GastosForm, IngresosForm } from '../../components/GastosIngresosForm';
import { MoneygerScreenStyles as moneygerStyles } from '../../css/Screens/MogeygerScreen.styles';
import { RecentTransactions } from '../../components/RecentTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { TransactionsService } from '../../services/transactionsService';
import { CategoriesService } from '../../services/categoriesService';
import { Transaction } from '../../types';
import { useRouter } from 'expo-router';

export default function Moneyger() {
  const [selectedType, setSelectedType] = useState('gasto');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        // Cargar transacciones
        const transactions = await TransactionsService.getTransactions(user.uid);
        const sortedTransactions = transactions
          .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
          .slice(0, 10);
        setRecentTransactions(sortedTransactions);

        // Cargar categorías
        const categoriesData = await CategoriesService.getCategories(user.uid);
        setCategories(categoriesData);
      } catch (error) {
        // Error silencioso para no romper la UI
      }
    };

    loadData();
  }, [user]);

  const handleViewAllTransactions = () => {
    router.push('/tools/transactions');
  };

  return (
    <View style={moneygerStyles.container}>
      <ScrollView style={{ margin: 20 }} showsVerticalScrollIndicator={false}>
        <View style={moneygerStyles.buttonsView}>
          <Pressable
            style={selectedType === 'ingreso' ? moneygerStyles.buttonSelected : moneygerStyles.button}
            onPress={() => setSelectedType('ingreso')}
          >
            <Text style={moneygerStyles.textButton}>INGRESO</Text>
          </Pressable>
          <Pressable
            style={selectedType === 'gasto' ? moneygerStyles.buttonSelected : moneygerStyles.button}
            onPress={() => setSelectedType('gasto')}
          >
            <Text style={moneygerStyles.textButton}>GASTO</Text>
          </Pressable>
        </View>
        {selectedType === 'gasto' ? <GastosForm /> : <IngresosForm />}

        {/* Transacciones recientes */}
        <RecentTransactions
          transactions={recentTransactions}
          categories={categories}
          onViewAll={handleViewAllTransactions}
        />
      </ScrollView>
    </View>
  );
}
