import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors } from '../css/colors';

export const MoneygerIcon = props => <FontAwesome6 name="money-bill-transfer" size={24} color="black" {...props} />;

export const ClipboardIcon = props => <FontAwesome6 name="clipboard" size={24} color="black" {...props} />;

export const HomeIcon = props => <FontAwesome6 name="house-user" size={28} color="black" {...props} />;

export const CalendarIcon = props => <FontAwesome6 name="calendar-day" size={24} color="black" {...props} />;

export const TaskListIcon = props => <FontAwesome6 name="list-check" size={24} color="black" {...props} />;

export const RecommendationIcon = props => <FontAwesome6 name="ranking-star" size={24} color="black" {...props} />;

export const HeadIcon = props => <FontAwesome6 name="id-badge" size={24} color="white" {...props} />;

export const FaceIcon = ({ level = 3, size = 22, active = false, color }) => {
  const map = {
    1: 'face-frown',
    2: 'face-frown-open',
    3: 'face-meh',
    4: 'face-smile',
    5: 'face-grin',
  };
  const name = map[level] || map[3];
  const iconColor = color || (active ? colors.shadow || '#4a90e2' : '#666');
  return <FontAwesome6 name={name} size={size} color={iconColor} />;
};

