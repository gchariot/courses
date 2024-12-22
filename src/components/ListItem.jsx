import PropTypes from 'prop-types';
import { Check, Trash2 } from 'lucide-react';

const ListItem = ({ item, onToggle, onDelete, darkMode }) => (
  <div 
    className={`group flex items-center justify-between p-4 rounded-xl shadow-sm ${
      darkMode 
        ? 'bg-gray-800 hover:bg-gray-750' 
        : 'bg-blue-50 hover:bg-blue-100'
    }`}
  >
    <div className="flex items-center gap-3">
      <button
        onClick={() => onToggle(item.id, item.complete)}
        className="p-2 rounded-lg bg-gray-100 hover:bg-green-500 hover:text-white transition-colors"
      >
        <Check size={16} />
      </button>
      <div>
        <span className="font-medium text-gray-800">
          {item.nom}
        </span>
        <div className="text-sm">
          Ajouté par <span className={item.ajoutePar === 'Greg' ? 'text-blue-500' : 'text-pink-500'}>
            {item.ajoutePar}
          </span>
        </div>
      </div>
    </div>
    <button
      onClick={() => onDelete(item.id)}
      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
    >
      <Trash2 size={18} />
    </button>
  </div>
);

ListItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
    complete: PropTypes.bool.isRequired,
    ajoutePar: PropTypes.string.isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired
};

export default ListItem; 