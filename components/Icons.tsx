import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors } from '../css/colors';

export const MoneygerIcon = props => <FontAwesome6 name="money-bill-transfer" size={24} color="black" {...props} />;

export const ClipboardIcon = props => <FontAwesome6 name="clipboard" size={24} color="black" {...props} />;

export const HomeIcon = props => <FontAwesome6 name="house-user" size={28} color="black" {...props} />;

export const CalendarIcon = props => <FontAwesome6 name="calendar-day" size={24} color="black" {...props} />;

export const TaskListIcon = props => <FontAwesome6 name="list-check" size={24} color="black" {...props} />;

export const RecommendationIcon = props => <FontAwesome6 name="ranking-star" size={24} color="black" {...props} />;

export const HeadIcon = props => <FontAwesome6 name="id-badge" size={24} color="white" {...props} />;

export const BackIcon = props => <FontAwesome6 name="arrow-left" size={24} color="white" {...props} />;

export const PersonIcon = props => <FontAwesome6 name="user" size={24} color="white" {...props} />;

export const LockIcon = props => <FontAwesome6 name="lock" size={24} color="white" {...props} />;

export const SettingsIcon = props => <FontAwesome6 name="gear" size={24} color="white" {...props} />;

export const HelpIcon = props => <FontAwesome6 name="circle-question" size={24} color="white" {...props} />;

export const LogoutIcon = props => <FontAwesome6 name="right-from-bracket" size={24} color="#ff4444" {...props} />;

export const AccountCircleIcon = props => <FontAwesome6 name="circle-user" size={80} color="white" {...props} />;

export const PlusIcon = props => <FontAwesome6 name="plus" size={14} color="white" {...props} />;

export const ChevronLeftIcon = props => <FontAwesome6 name="chevron-left" size={20} color="white" {...props} />;

export const ChevronRightIcon = props => <FontAwesome6 name="chevron-right" size={20} color="white" {...props} />;

export const TrashIcon = props => <FontAwesome6 name="trash" size={20} color="white" {...props} />;

export const XIcon = props => <FontAwesome6 name="x" size={20} color="white" {...props} />;

export const EditIcon = props => <FontAwesome6 name="pen" size={20} color="white" {...props} />;

export const RingIcon = props => <FontAwesome6 name="ring" size={20} color="#fabb0a" {...props} />;

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

export const EyeIcon = props => <FontAwesome6 name="eye" size={20} color="white" {...props} />;

export const EyeSlashIcon = props => <FontAwesome6 name="eye-slash" size={20} color="white" {...props} />;

export const CopyIcon = props => <FontAwesome6 name="copy" size={20} color="white" {...props} />;

export const SearchIcon = props => <FontAwesome6 name="magnifying-glass" size={20} color="white" {...props} />;

